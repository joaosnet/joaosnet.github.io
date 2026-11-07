"""Explicit project imports. Public refreshes never receive private credentials.

Private imports only write ignored local review material. Nothing is committed or pushed.
"""

import argparse
import hashlib
import io
import json
import os
import re
from pathlib import Path
from urllib.parse import quote

import requests

from build_site import REPO, ROOT, read_json

KNOWN_LOCAL_ASSETS = {
    "evolutionary-lab": "/assets/project-images/joaosnet_T1_performance_tournament.gif",
}

EXCLUDED_IMAGE_PATHS = (
    "/tests/",
    "tests/",
    "mascot/",
    "node_modules/",
    "vendor/",
    ".github/",
    "favicon",
    "maskable",
    "apple-touch",
    "icon-",
)

ALLOWED_IMAGE_EXTS = {".gif", ".png", ".webp", ".jpg", ".jpeg", ".svg"}


def score_image(path: str) -> int:
    """Calculates relevance score for a candidate project image path.

    Prioritizes animated GIFs (demo/showcase/preview) first, then high-resolution
    banners, screenshots, and dashboards. Rejects test fixtures, favicons, and vendor assets.
    """
    p = path.lower()
    if any(term in p for term in EXCLUDED_IMAGE_PATHS):
        return -1
    ext = Path(p).suffix
    if ext not in ALLOWED_IMAGE_EXTS:
        return -1

    score = 0
    if ext == ".gif":
        score += 1000
        if any(k in p for k in ("demo", "showcase", "preview", "tournament", "anim", "screen", "recording")):
            score += 200
    else:
        score += 100
        if any(k in p for k in ("banner", "social_preview", "og-banner", "og-preview", "card_hardware", "preview")):
            score += 150
        elif any(k in p for k in ("dashboard", "interativo", "screenshot", "screen", "showcase")):
            score += 120
        elif any(k in p for k in ("logo", "icon", "icone")):
            score += 40
        if "docs/" in p or "assets/" in p:
            score += 20
    return score


def sanitize_image_filename(repo: str, remote_path: str) -> str:
    """Derives a secure, sanitized local filename for a remote project image."""
    if not REPO.fullmatch(repo):
        raise ValueError("Invalid repository identifier")
    owner, name = repo.split("/")
    raw_stem = Path(remote_path).stem
    ext = Path(remote_path).suffix.lower()
    if ext not in ALLOWED_IMAGE_EXTS:
        raise ValueError("Unsupported image extension")
    clean_stem = re.sub(r"[^\w\-]", "_", raw_stem).strip("_")
    clean_name = f"{owner}_{name}_{clean_stem}{ext}"
    clean_name = re.sub(r"_+", "_", clean_name)
    return clean_name


def optimize_heavy_gif(raw_bytes: bytes, target_width: int = 800, max_frames: int = 300) -> bytes:
    """Optimizes heavy GIFs (> 15MB) into lightweight animated WebP (< 5MB).

    Preserves fluid playback while downscaling resolution to card viewport size.
    """
    from PIL import Image, ImageSequence

    orig = Image.open(io.BytesIO(raw_bytes))
    w, h = orig.size
    new_w = min(w, target_width)
    new_h = int(h * (new_w / w))
    duration = orig.info.get("duration", 50)
    total_frames = getattr(orig, "n_frames", 1)
    step = max(1, total_frames // max_frames)

    frames = []
    for i, frame in enumerate(ImageSequence.Iterator(orig)):
        if i % step == 0:
            f = frame.copy().convert("RGBA").resize((new_w, new_h), Image.Resampling.BILINEAR)
            frames.append(f)

    if not frames:
        return raw_bytes

    out_buf = io.BytesIO()
    frames[0].save(
        out_buf,
        format="WEBP",
        save_all=True,
        append_images=frames[1:],
        duration=int(duration * step),
        loop=0,
        quality=80,
        method=4,
    )
    return out_buf.getvalue()


def download_project_image(
    repo: str,
    branch: str,
    remote_path: str,
    dest_dir: Path | None = None,
    session=None,
    max_download_bytes: int = 100 * 1024 * 1024,
) -> str:
    """Downloads a remote project image anonymously with size, magic byte verification, and GIF optimization."""
    if not REPO.fullmatch(repo):
        raise ValueError("Invalid repository identifier")
    folder = (dest_dir or (ROOT / "assets/project-images")).resolve()
    clean_filename = sanitize_image_filename(repo, remote_path)

    client = session or requests.Session()
    client.trust_env = False
    quoted_path = quote(remote_path)
    url = f"https://raw.githubusercontent.com/{repo}/{branch}/{quoted_path}"
    response = client.get(url, timeout=30, stream=True, allow_redirects=False)
    if response.status_code != 200:
        raise RuntimeError(f"Failed to download image {remote_path} from {repo}: status {response.status_code}")

    downloaded = bytearray()
    for chunk in response.iter_content(chunk_size=65536):
        downloaded.extend(chunk)
        if len(downloaded) > max_download_bytes:
            raise ValueError(f"Image {remote_path} exceeds maximum size of 100MB")

    raw_bytes = bytes(downloaded)
    is_valid_magic = (
        raw_bytes.startswith((b"GIF87a", b"GIF89a", b"\x89PNG", b"\xff\xd8\xff"))
        or (raw_bytes[:4] == b"RIFF" and raw_bytes[8:12] == b"WEBP")
        or b"<svg" in raw_bytes[:1024].lower()
    )
    if not is_valid_magic:
        raise ValueError(f"File {remote_path} does not match expected image magic bytes")

    # If GIF exceeds 15 MB, optimize to lightweight animated WebP (< 5MB)
    if len(raw_bytes) > 15 * 1024 * 1024 and raw_bytes.startswith((b"GIF87a", b"GIF89a")):
        optimized_bytes = optimize_heavy_gif(raw_bytes)
        owner, name = repo.split("/")
        raw_stem = Path(remote_path).stem
        clean_stem = re.sub(r"[^\w\-]", "_", raw_stem).strip("_")
        clean_filename = f"{owner}_{name}_{clean_stem}.webp"
        clean_filename = re.sub(r"_+", "_", clean_filename)
        raw_bytes = optimized_bytes

    dest_path = (folder / clean_filename).resolve()
    if not dest_path.is_relative_to(folder) or dest_path.is_symlink():
        raise ValueError("Invalid image destination path")

    dest_path.write_bytes(raw_bytes)
    return f"/assets/project-images/{clean_filename}"


def fetch_project_images(
    projects, cards, dest_dir: Path | None = None, session=None, metadata: dict | None = None
) -> bool:
    """Discovers and downloads remote project images, giving top priority to animated GIFs.

    Tracks Git blob SHAs to automatically detect when remote images are updated,
    and attaches `?v=<sha[:8]>` cache-busting query strings so browsers always
    receive the latest version immediately without CDN or browser stale cache delays.
    """
    folder = (dest_dir or (ROOT / "assets/project-images")).resolve()
    folder.mkdir(parents=True, exist_ok=True)
    client = session or requests.Session()
    client.trust_env = False
    changed = False

    meta_path = ROOT / "content/public-metadata.json"
    meta = metadata
    if meta is None:
        meta = read_json(meta_path) if meta_path.exists() else {}

    for item in projects + cards:
        repo = item.get("repo", "")
        if not repo or not REPO.fullmatch(repo):
            continue

        item_id = item.get("id") or ""
        saved_info = meta.get(item_id, {})
        saved_sha = saved_info.get("image_sha", "")

        curr_img = item.get("image") or ""
        clean_curr_img = curr_img.split("?")[0] if curr_img else ""
        curr_file_exists = (folder / Path(clean_curr_img).name).exists() if clean_curr_img else False
        curr_is_gif = clean_curr_img.lower().endswith(".gif")

        best_candidate = None
        default_branch = "main"

        try:
            repo_data = fetch_repository(repo, session=client)
            default_branch = repo_data.get("default_branch") or "main"
            tree_url = f"https://api.github.com/repos/{repo}/git/trees/{default_branch}?recursive=1"
            headers = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
            resp = client.get(tree_url, headers=headers, timeout=15, allow_redirects=False)
            if resp.status_code == 200:
                candidates = []
                for entry in resp.json().get("tree", []):
                    if entry.get("type") == "blob":
                        sc = score_image(entry.get("path", ""))
                        if sc > 0:
                            candidates.append((sc, entry["path"], entry.get("sha") or ""))
                if candidates:
                    candidates.sort(key=lambda x: x[0], reverse=True)
                    best_candidate = candidates[0]
        except Exception:
            best_candidate = None

        if best_candidate:
            cand_score, cand_path, cand_sha = best_candidate
            cand_is_gif = cand_path.lower().endswith(".gif")

            clean_candidate_file = sanitize_image_filename(repo, cand_path)
            candidate_webp_file = f"{Path(clean_candidate_file).stem}.webp"
            cand_file_exists = (folder / clean_candidate_file).exists() or (folder / candidate_webp_file).exists()

            should_download = False
            if not clean_curr_img or not cand_file_exists or not curr_file_exists:
                should_download = True
            elif cand_is_gif and not curr_is_gif:
                should_download = True
            elif cand_sha and saved_sha and cand_sha != saved_sha:
                should_download = True

            if should_download:
                try:
                    saved_rel_path = download_project_image(
                        repo, default_branch, cand_path, dest_dir=folder, session=client
                    )
                    clean_filename = Path(saved_rel_path).name
                    version_suffix = f"?v={cand_sha[:8]}" if cand_sha else ""
                    expected_img = f"/assets/project-images/{clean_filename}{version_suffix}"
                    if expected_img != curr_img:
                        item["image"] = expected_img
                        changed = True
                    if item_id:
                        if item_id not in meta:
                            meta[item_id] = {}
                        meta[item_id]["image_sha"] = cand_sha
                        meta[item_id]["image_remote"] = cand_path
                except Exception:
                    pass
            else:
                expected_stem = Path(clean_candidate_file).stem
                curr_stem = Path(clean_curr_img).stem
                if expected_stem == curr_stem:
                    clean_filename = Path(clean_curr_img).name
                    version_suffix = f"?v={cand_sha[:8]}" if cand_sha else ""
                    expected_img = f"/assets/project-images/{clean_filename}{version_suffix}"
                    if curr_img != expected_img and (folder / clean_filename).exists():
                        item["image"] = expected_img
                        changed = True
                    if item_id and cand_sha and meta.get(item_id, {}).get("image_sha") != cand_sha:
                        if item_id not in meta:
                            meta[item_id] = {}
                        meta[item_id]["image_sha"] = cand_sha
                        meta[item_id]["image_remote"] = cand_path
        else:
            proj_id = item.get("id")
            if (
                not clean_curr_img
                and proj_id in KNOWN_LOCAL_ASSETS
                and (folder / Path(KNOWN_LOCAL_ASSETS[proj_id]).name).exists()
            ):
                item["image"] = KNOWN_LOCAL_ASSETS[proj_id]
                changed = True

    if dest_dir is None and meta_path.exists():
        current_meta = read_json(meta_path)
        if meta != current_meta:
            meta_path.write_text(json.dumps(meta, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    return changed


def fetch_repository(repo, token="", session=None):
    if not REPO.fullmatch(repo):
        raise ValueError("Invalid repository identifier")
    client = session or requests.Session()
    client.trust_env = False  # Never pick up ambient .netrc credentials or proxy authentication.
    headers = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
    if token:
        headers["Authorization"] = "Bearer " + token
    response = client.get("https://api.github.com/repos/" + repo, headers=headers, timeout=15, allow_redirects=False)
    if response.status_code != 200:
        raise RuntimeError("Repository request failed; previous approved content is preserved")
    data = response.json()
    if data.get("full_name", "").lower() != repo.lower():
        raise ValueError("Unexpected repository response")
    return data


def public_snapshot(projects, session=None):
    result = {}
    for project in projects:
        if project.get("visibility") != "public":
            continue
        # Deliberately anonymous: even GITHUB_TOKEN could carry unintended scopes.
        data = fetch_repository(project["repo"], session=session)
        if data.get("private") is not False:
            raise ValueError("A selected public repository is no longer public")
        result[project["id"]] = {
            "updated_at": data.get("pushed_at"),
            "stars": max(0, int(data.get("stargazers_count", 0))),
        }
    return result


def discover_public_repos(username="joaosnet", session=None):
    client = session or requests.Session()
    client.trust_env = False
    headers = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
    response = client.get(f"https://api.github.com/users/{username}/repos?per_page=100", headers=headers, timeout=15)
    if response.status_code != 200:
        raise RuntimeError("GitHub user repos request failed")
    repos = response.json()
    projects = read_json(ROOT / "content/projects.json")
    cards = read_json(ROOT / "content/project-cards.json")
    known_repos = {p.get("repo", "").lower() for p in projects + cards if p.get("repo")}
    new_repos = []
    for r in repos:
        if r.get("fork") or r.get("private"):
            continue
        full_name = r.get("full_name", "")
        if full_name.lower() in known_repos:
            continue
        new_repos.append(
            {
                "repo": full_name,
                "name": r.get("name"),
                "description": r.get("description") or "",
                "has_pages": bool(r.get("has_pages")),
                "homepage": r.get("homepage") or "",
                "stars": int(r.get("stargazers_count", 0)),
                "pushed_at": r.get("pushed_at"),
            }
        )
    return new_repos


def private_preview(repo, directory=None, session=None):
    folder = Path(directory or ROOT / ".private-preview")
    allowlist = read_json(folder / "allowlist.json")
    if repo not in allowlist:
        raise ValueError("Private source must first be explicitly allowlisted locally")
    token = os.environ.get("PRIVATE_REPOS_TOKEN", "")
    if not token:
        raise ValueError("Provide PRIVATE_REPOS_TOKEN in this process environment")
    data = fetch_repository(repo, token, session)
    # No README downloads, arbitrary asset requests, translation services or public artifacts.
    selected = {
        "source": repo,
        "private": bool(data.get("private")),
        "name": data.get("name"),
        "description": data.get("description"),
        "updated_at": data.get("pushed_at"),
    }
    raw = json.dumps(selected, ensure_ascii=False, indent=2).encode("utf-8")
    digest = hashlib.sha256(raw).hexdigest()
    target = folder / (digest + ".json")
    target.write_bytes(raw)
    return digest


def approve_export(path, digest):
    path = Path(path).resolve()
    local = (ROOT / ".private-preview").resolve()
    if not path.is_relative_to(local) or path.is_symlink():
        raise ValueError("Review input must be a local private preview")
    raw = path.read_bytes()
    if hashlib.sha256(raw).hexdigest() != digest:
        raise ValueError("Review digest does not match; review the changed content again")
    reviewed = json.loads(raw)
    allowed = {
        "id",
        "name",
        "visibility",
        "reviewed",
        "category",
        "number",
        "tags",
        "skills",
        "demo",
        "visual",
        "pt",
        "en",
        "es",
    }
    if not isinstance(reviewed, list) or any(
        set(p) - allowed or p.get("visibility") != "private" or p.get("reviewed") is not True for p in reviewed
    ):
        raise ValueError("Use the documented editorial schema; raw private API data cannot be approved")
    # The explicit approval command promotes only an edited public-facing document, never its source.
    from build_site import load_projects

    target = ROOT / "content/private-approved.json"
    previous = target.read_bytes() if target.exists() else None
    try:
        target.write_bytes(raw)
        load_projects()
    except Exception:
        if previous is None:
            target.unlink(missing_ok=True)
        else:
            target.write_bytes(previous)
        raise


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("public")
    commands.add_parser("images")
    commands.add_parser("discover")
    private = commands.add_parser("private-preview")
    private.add_argument("repo")
    approve = commands.add_parser("approve")
    approve.add_argument("file")
    approve.add_argument("--digest", required=True)
    args = parser.parse_args()
    try:
        if args.command in ("public", "images"):
            projects = read_json(ROOT / "content/projects.json")
            cards = read_json(ROOT / "content/project-cards.json")
            meta_path = ROOT / "content/public-metadata.json"
            metadata = read_json(meta_path) if meta_path.exists() else {}

            if args.command == "public":
                snapshot = public_snapshot(projects)
                for pid, pdata in snapshot.items():
                    if pid not in metadata:
                        metadata[pid] = {}
                    metadata[pid].update(pdata)
                meta_path.write_text(json.dumps(metadata, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
                print(f"Refreshed {len(snapshot)} explicitly selected public projects")

            changed = fetch_project_images(projects, cards, metadata=metadata)
            meta_path.write_text(json.dumps(metadata, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

            if changed:
                (ROOT / "content/projects.json").write_text(
                    json.dumps(projects, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
                )
                (ROOT / "content/project-cards.json").write_text(
                    json.dumps(cards, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
                )
                print("Updated project images and cache versions in content catalog")
            else:
                print("Project images and cache versions are up to date")
        elif args.command == "discover":
            discovered = discover_public_repos()
            if not discovered:
                print("No new public repositories found. Everything is up to date.")
            else:
                print(f"Discovered {len(discovered)} new public repository(ies):")
                for item in discovered:
                    pages_info = " [Pages active]" if item["has_pages"] else ""
                    print(f"- {item['repo']}{pages_info}: {item['description']}")
        elif args.command == "private-preview":
            digest = private_preview(args.repo)
            print(f"Local review saved. SHA-256: {digest}. Nothing published.")
        else:
            approve_export(args.file, args.digest)
            print("Reviewed editorial export prepared. Build and inspect before publishing.")
    except (ValueError, RuntimeError, requests.RequestException, OSError):
        # Do not print requests exceptions: they may include private URLs or headers.
        parser.exit(1, "Import stopped safely. Check local configuration, review schema and network access.\n")


if __name__ == "__main__":
    main()
