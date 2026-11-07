"""Configuration tests use synthetic environments; never open a developer's .env."""

import ast
from pathlib import Path

import pytest

import update_projects as updater

ROOT = Path(__file__).resolve().parent.parent


@pytest.mark.parametrize("script_name", ["update_projects.py", "build_site.py"])
def test_import_does_not_load_dotenv(script_name):
    script_path = ROOT / script_name
    assert script_path.exists(), f"{script_name} must exist at repository root"
    tree = ast.parse(script_path.read_text(encoding="utf-8"))
    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom):
            assert node.module != "dotenv" and not (node.module and node.module.startswith("dotenv.")), (
                f"{script_name} must not import from dotenv"
            )
        elif isinstance(node, ast.Import):
            for alias in node.names:
                assert alias.name != "dotenv" and not alias.name.startswith("dotenv."), (
                    f"{script_name} must not import dotenv"
                )


def test_private_import_without_token_does_not_access_network(tmp_path, monkeypatch):
    monkeypatch.delenv("PRIVATE_REPOS_TOKEN", raising=False)
    (tmp_path / "allowlist.json").write_text('["owner/private"]')
    with pytest.raises(ValueError, match="process environment"):
        updater.private_preview("owner/private", tmp_path)


def test_private_review_and_env_are_ignored():
    lines = (ROOT / ".gitignore").read_text(encoding="utf-8").splitlines()
    assert ".env" in lines and ".private-preview/" in lines
    assert "uv.lock" not in lines
