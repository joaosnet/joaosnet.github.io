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
