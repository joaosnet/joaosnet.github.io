"""Configuration tests use synthetic environments; never open a developer's .env."""

import ast
from pathlib import Path

import pytest

import update_projects as updater


def test_import_does_not_load_dotenv():
    tree = ast.parse(Path("update_projects.py").read_text(encoding="utf-8"))
    assert not any(isinstance(n, ast.ImportFrom) and n.module == "dotenv" for n in ast.walk(tree))


def test_private_import_without_token_does_not_access_network(tmp_path, monkeypatch):
    monkeypatch.delenv("PRIVATE_REPOS_TOKEN", raising=False)
    (tmp_path / "allowlist.json").write_text('["owner/private"]')
    with pytest.raises(ValueError, match="process environment"):
        updater.private_preview("owner/private", tmp_path)


def test_private_review_and_env_are_ignored():
    lines = Path(".gitignore").read_text(encoding="utf-8").splitlines()
    assert ".env" in lines and ".private-preview/" in lines
    assert "uv.lock" not in lines
