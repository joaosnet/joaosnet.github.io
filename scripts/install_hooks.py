#!/usr/bin/env python3
"""Install repository git hooks (pre-push, etc.) into .git/hooks/"""
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HOOKS_DIR = ROOT / ".git" / "hooks"
SOURCE_HOOKS = ROOT / ".githooks"


def install():
    if not HOOKS_DIR.exists():
        print(f"Error: {HOOKS_DIR} does not exist.")
        return 1

    SOURCE_HOOKS.mkdir(exist_ok=True)
    pre_push_src = SOURCE_HOOKS / "pre-push"
    if not pre_push_src.exists():
        pre_push_content = (
            "#!/bin/sh\n"
            "set -e\n\n"
            'echo "[pre-push hook] Executando verificações de qualidade antes do push..."\n\n'
            "# 1. Linting e conformidade Python (Ruff)\n"
            'echo "  → Verificando Ruff em Python..."\n'
            "uv run ruff check build_site.py update_projects.py scripts/build_cv.py "
            "scripts/preview.py scripts/fetch_assets.py tests\n\n"
            "# 2. Sintaxe de todos os arquivos JavaScript\n"
            'echo "  → Verificando sintaxe JavaScript..."\n'
            "npm run test:syntax\n\n"
            "# 3. Testes unitários do coletor e telemetria\n"
            'echo "  → Executando testes unitários do coletor..."\n'
            "npm test\n\n"
            'echo "[pre-push hook] ✓ Todas as verificações passaram com sucesso!"\n'
        )
        pre_push_src.write_text(pre_push_content, encoding="utf-8")

    pre_push_dest = HOOKS_DIR / "pre-push"
    shutil.copy2(pre_push_src, pre_push_dest)
    print(f"[OK] Installed hook: {pre_push_dest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(install())
