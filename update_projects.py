"""Explicit project imports. Public refreshes never receive private credentials.

Private imports only write ignored local review material. Nothing is committed or pushed.
"""

import argparse
import hashlib
import json
import os
from pathlib import Path

import requests

from build_site import REPO, ROOT, read_json


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
    private = commands.add_parser("private-preview")
    private.add_argument("repo")
    approve = commands.add_parser("approve")
    approve.add_argument("file")
    approve.add_argument("--digest", required=True)
    args = parser.parse_args()
    try:
        if args.command == "public":
            data = public_snapshot(read_json(ROOT / "content/projects.json"))
            (ROOT / "content/public-metadata.json").write_text(json.dumps(data, indent=2), encoding="utf-8")
            print(f"Refreshed {len(data)} explicitly selected public projects")
        elif args.command == "private-preview":
            digest = private_preview(args.repo)
            print(f"Local review saved. SHA-256: {digest}. Nothing published.")
        else:
            approve_export(args.file, args.digest)
            print("Reviewed editorial export prepared. Build and inspect before publishing.")
    except ValueError, RuntimeError, requests.RequestException, OSError:
        # Do not print requests exceptions: they may include private URLs or headers.
        parser.exit(1, "Import stopped safely. Check local configuration, review schema and network access.\n")


if __name__ == "__main__":
    main()
