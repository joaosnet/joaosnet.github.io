import hashlib
from unittest.mock import Mock

import pytest

import update_projects as updater
from build_site import safe_url


def client(repo="owner/public", private=False, status=200, **values):
    session = Mock()
    session.get.return_value.status_code = status
    session.get.return_value.json.return_value = {
        "full_name": repo,
        "private": private,
        "stargazers_count": 3,
        "pushed_at": "2026-09-07T12:00:00Z",
        **values,
    }
    return session


def test_public_import_never_uses_environment_tokens(monkeypatch):
    monkeypatch.setenv("PRIVATE_REPOS_TOKEN", "fake-private-token")
    monkeypatch.setenv("GITHUB_TOKEN", "fake-github-token")
    session = client()
    result = updater.public_snapshot(
        [
            {"id": "public", "repo": "owner/public", "visibility": "public"},
            {"id": "secret", "repo": "owner/private", "visibility": "private"},
        ],
        session,
    )
    assert list(result) == ["public"]
    assert session.get.call_count == 1
    assert session.trust_env is False
    kwargs = session.get.call_args.kwargs
    assert "Authorization" not in kwargs["headers"]
    assert kwargs["allow_redirects"] is False
    assert kwargs["timeout"] == 15


@pytest.mark.parametrize("status", [301, 302, 403, 404, 429, 500])
def test_api_failure_does_not_accept_redirect_or_data(status):
    with pytest.raises(RuntimeError):
        updater.fetch_repository("owner/public", session=client(status=status))


def test_public_to_private_change_is_rejected():
    with pytest.raises(ValueError):
        updater.public_snapshot(
            [{"id": "public", "repo": "owner/public", "visibility": "public"}], client(private=True)
        )


@pytest.mark.parametrize(
    "repo", ["../private", "owner/repo/../../secrets", "https://evil.test", "a/b?token=x", "a/b\n"]
)
def test_repository_identifier_injection_is_rejected(repo):
    session = client()
    with pytest.raises(ValueError):
        updater.fetch_repository(repo, session=session)
    session.get.assert_not_called()


@pytest.mark.parametrize(
    "url",
    [
        "javascript:alert(1)",
        "http://github.com",
        "https://user:password@github.com/x",
        "https://github.com:8000/x",
        "https://github.com/x\n",
    ],
)
def test_unsafe_links_are_rejected(url):
    with pytest.raises(ValueError):
        safe_url(url)


def test_private_preview_needs_explicit_local_allowlist(tmp_path, monkeypatch):
    (tmp_path / "allowlist.json").write_text("[]")
    monkeypatch.setenv("PRIVATE_REPOS_TOKEN", "fake")
    session = client()
    with pytest.raises(ValueError):
        updater.private_preview("owner/private", tmp_path, session)
    session.get.assert_not_called()


def test_private_preview_is_local_and_contains_no_token(tmp_path, monkeypatch):
    (tmp_path / "allowlist.json").write_text('["owner/private"]')
    monkeypatch.setenv("PRIVATE_REPOS_TOKEN", "fake-private-value")
    session = client("owner/private", private=True, name="private", description="Private source")
    digest = updater.private_preview("owner/private", tmp_path, session)
    raw = (tmp_path / (digest + ".json")).read_bytes()
    assert hashlib.sha256(raw).hexdigest() == digest
    assert b"fake-private-value" not in raw
    assert session.get.call_count == 1
    assert session.get.call_args.kwargs["headers"]["Authorization"] == "Bearer fake-private-value"


def test_raw_private_payload_cannot_be_promoted(tmp_path, monkeypatch):
    monkeypatch.setattr(updater, "ROOT", tmp_path)
    folder = tmp_path / ".private-preview"
    folder.mkdir()
    source = folder / "review.json"
    source.write_text('{"source":"private-name","description":"raw"}')
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    with pytest.raises(ValueError):
        updater.approve_export(source, digest)
    assert not (tmp_path / "content/private-approved.json").exists()


def test_changed_review_digest_is_rejected(tmp_path, monkeypatch):
    monkeypatch.setattr(updater, "ROOT", tmp_path)
    folder = tmp_path / ".private-preview"
    folder.mkdir()
    source = folder / "review.json"
    source.write_text("[]")
    with pytest.raises(ValueError):
        updater.approve_export(source, "0" * 64)


def test_wrong_repository_response_is_rejected():
    with pytest.raises(ValueError):
        updater.fetch_repository("owner/public", session=client("other/repo"))


def test_score_image_prioritizes_gifs():
    assert updater.score_image("screenshots/demo.gif") > updater.score_image("assets/banner.png")
    assert updater.score_image("docs/images/showcase.gif") > updater.score_image("docs/images/dashboard.png")
    assert updater.score_image("assets/banner.png") > updater.score_image("assets/logo.png")


def test_score_image_rejects_unwanted_paths_and_extensions():
    assert updater.score_image("tests/fixture.gif") == -1
    assert updater.score_image("favicon.png") == -1
    assert updater.score_image("node_modules/pkg/img.png") == -1
    assert updater.score_image("docs/manual.pdf") == -1
    assert updater.score_image(".github/preview.png") == -1


def test_sanitize_image_filename():
    clean = updater.sanitize_image_filename("owner/my-repo", "assets/images/Dashboard+Totalmente+Interativo.PNG")
    assert clean == "owner_my-repo_Dashboard_Totalmente_Interativo.png"
    with pytest.raises(ValueError):
        updater.sanitize_image_filename("invalid_repo", "banner.png")
    with pytest.raises(ValueError):
        updater.sanitize_image_filename("owner/repo", "script.exe")


def test_download_project_image_verifies_magic_bytes_and_path(tmp_path):
    dest_dir = tmp_path / "images"
    dest_dir.mkdir()

    session = Mock()
    session.get.return_value.status_code = 200
    session.get.return_value.iter_content.return_value = [b"GIF89a", b"\x00" * 20]
    rel = updater.download_project_image("owner/repo", "main", "demo.gif", dest_dir=dest_dir, session=session)
    assert rel == "/assets/project-images/owner_repo_demo.gif"
    assert (dest_dir / "owner_repo_demo.gif").exists()

    session.get.return_value.iter_content.return_value = [b"<html>not an image</html>"]
    with pytest.raises(ValueError, match="magic bytes"):
        updater.download_project_image("owner/repo", "main", "fake.png", dest_dir=dest_dir, session=session)

    large_chunk = b"A" * (101 * 1024 * 1024)
    session.get.return_value.iter_content.return_value = [large_chunk]
    with pytest.raises(ValueError, match="exceeds maximum size"):
        updater.download_project_image("owner/repo", "main", "huge.png", dest_dir=dest_dir, session=session)


def test_fetch_project_images_prioritizes_gif_and_maps_local(tmp_path):
    img_dir = tmp_path / "assets/project-images"
    img_dir.mkdir(parents=True)
    (img_dir / "existing_logo.webp").write_bytes(b"RIFF\x00\x00\x00\x00WEBP")
    (img_dir / "joaosnet_T1_performance_tournament.gif").write_bytes(b"GIF89a\x00\x00")

    projects = [
        {"id": "aethersense", "repo": "owner/repo1", "image": "/assets/project-images/existing_logo.webp"},
        {"id": "evolutionary-lab", "repo": "owner/repo2", "image": ""},
    ]
    cards = []

    session = Mock()
    mock_repo1 = {"default_branch": "main", "full_name": "owner/repo1"}
    mock_tree1 = {
        "tree": [
            {"type": "blob", "path": "docs/showcase.gif", "sha": "12345678abcdef"},
            {"type": "blob", "path": "banner.png", "sha": "banner0000000"},
        ]
    }

    def mock_get(url, **kwargs):
        resp = Mock()
        resp.status_code = 200
        if "repos/owner/repo1/git/trees" in url:
            resp.json.return_value = mock_tree1
        elif "repos/owner/repo1" in url:
            resp.json.return_value = mock_repo1
        elif "raw.githubusercontent.com/owner/repo1" in url:
            resp.iter_content.return_value = [b"GIF89a", b"\x00" * 10]
        elif "repos/owner/repo2" in url:
            resp.json.return_value = {"default_branch": "main", "full_name": "owner/repo2"}
            resp.status_code = 404
        else:
            resp.status_code = 404
        return resp

    session.get.side_effect = mock_get

    meta = {}
    changed = updater.fetch_project_images(projects, cards, dest_dir=img_dir, session=session, metadata=meta)
    assert changed is True
    assert projects[0]["image"] == "/assets/project-images/owner_repo1_showcase.gif?v=12345678"
    assert projects[1]["image"] == "/assets/project-images/joaosnet_T1_performance_tournament.gif"
    assert meta["aethersense"]["image_sha"] == "12345678abcdef"


def test_fetch_project_images_updates_when_remote_sha_changes(tmp_path):
    img_dir = tmp_path / "assets/project-images"
    img_dir.mkdir(parents=True)
    (img_dir / "owner_repo1_demo.gif").write_bytes(b"GIF89a_old_content")

    projects = [
        {"id": "varedura", "repo": "owner/repo1", "image": "/assets/project-images/owner_repo1_demo.gif?v=oldsha01"},
    ]
    cards = []
    meta = {
        "varedura": {"image_sha": "oldsha012345", "image_remote": "demo.gif"}
    }

    session = Mock()
    mock_repo1 = {"default_branch": "main", "full_name": "owner/repo1"}
    mock_tree1 = {
        "tree": [
            {"type": "blob", "path": "demo.gif", "sha": "newsha99887766"},
        ]
    }

    def mock_get(url, **kwargs):
        resp = Mock()
        resp.status_code = 200
        if "repos/owner/repo1/git/trees" in url:
            resp.json.return_value = mock_tree1
        elif "repos/owner/repo1" in url:
            resp.json.return_value = mock_repo1
        elif "raw.githubusercontent.com/owner/repo1" in url:
            resp.iter_content.return_value = [b"GIF89a_new_content"]
        else:
            resp.status_code = 404
        return resp

    session.get.side_effect = mock_get

    changed = updater.fetch_project_images(projects, cards, dest_dir=img_dir, session=session, metadata=meta)
    assert changed is True
    assert projects[0]["image"] == "/assets/project-images/owner_repo1_demo.gif?v=newsha99"
    assert meta["varedura"]["image_sha"] == "newsha99887766"


def test_fetch_project_images_skips_download_when_sha_identical(tmp_path):
    img_dir = tmp_path / "assets/project-images"
    img_dir.mkdir(parents=True)
    (img_dir / "owner_repo1_demo.gif").write_bytes(b"GIF89a_stable_content")

    projects = [
        {"id": "varedura", "repo": "owner/repo1", "image": "/assets/project-images/owner_repo1_demo.gif?v=samesha1"},
    ]
    cards = []
    meta = {
        "varedura": {"image_sha": "samesha12345", "image_remote": "demo.gif"}
    }

    session = Mock()
    mock_repo1 = {"default_branch": "main", "full_name": "owner/repo1"}
    mock_tree1 = {
        "tree": [
            {"type": "blob", "path": "demo.gif", "sha": "samesha12345"},
        ]
    }

    raw_download_called = False

    def mock_get(url, **kwargs):
        nonlocal raw_download_called
        resp = Mock()
        resp.status_code = 200
        if "repos/owner/repo1/git/trees" in url:
            resp.json.return_value = mock_tree1
        elif "repos/owner/repo1" in url:
            resp.json.return_value = mock_repo1
        elif "raw.githubusercontent.com" in url:
            raw_download_called = True
            resp.iter_content.return_value = [b"GIF89a"]
        else:
            resp.status_code = 404
        return resp

    session.get.side_effect = mock_get

    changed = updater.fetch_project_images(projects, cards, dest_dir=img_dir, session=session, metadata=meta)
    assert changed is False
    assert raw_download_called is False
    assert projects[0]["image"] == "/assets/project-images/owner_repo1_demo.gif?v=samesha1"


def test_download_project_image_optimizes_heavy_gif(tmp_path, monkeypatch):
    dest_dir = tmp_path / "images"
    dest_dir.mkdir()

    session = Mock()
    session.get.return_value.status_code = 200
    dummy_gif = b"GIF89a" + b"\x00" * (16 * 1024 * 1024)
    session.get.return_value.iter_content.return_value = [dummy_gif]

    monkeypatch.setattr(updater, "optimize_heavy_gif", lambda b: b"RIFFfakeWEBP")

    rel = updater.download_project_image("owner/repo", "main", "heavy.gif", dest_dir=dest_dir, session=session)
    assert rel == "/assets/project-images/owner_repo_heavy.webp"
    assert (dest_dir / "owner_repo_heavy.webp").exists()
    assert (dest_dir / "owner_repo_heavy.webp").read_bytes() == b"RIFFfakeWEBP"
