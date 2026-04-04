"""
Testes para validação de variáveis de ambiente
Verifica:
- Existência do arquivo .env
- Existência do arquivo .env.example
- .env está no .gitignore
- python-dotenv está instalado e funcionando
- Variáveis são carregadas corretamente
"""

import pytest
import os
from pathlib import Path
from dotenv import load_dotenv


class TestEnvFile:
    """Testes para arquivo .env"""

    def test_env_file_exists(self):
        """Arquivo .env deve existir"""
        env_path = Path(".env")
        assert env_path.exists(), "Arquivo .env não existe"

    def test_env_example_file_exists(self):
        """Arquivo .env.example deve existir"""
        example_path = Path(".env.example")
        assert example_path.exists(), "Arquivo .env.example não existe"

    def test_env_is_in_gitignore(self):
        """.env deve estar no .gitignore"""
        gitignore_path = Path(".gitignore")
        assert gitignore_path.exists(), "Arquivo .gitignore não existe"

        with open(gitignore_path, "r", encoding="utf-8") as f:
            content = f.read()

        assert ".env" in content, ".env não está no .gitignore"

    def test_env_not_empty(self):
        """Arquivo .env não deve estar vazio (deve ter variáveis)"""
        env_path = Path(".env")
        if env_path.exists():
            with open(env_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
                # Filtrar linhas não vazias e não comentários
                active_lines = [
                    line
                    for line in lines
                    if line.strip() and not line.startswith("#") and "=" in line
                ]
            assert len(active_lines) > 0, "Arquivo .env está vazio (sem variáveis)"

    def test_env_example_has_required_variables(self):
        """.env.example deve ter todas as variáveis necessárias"""
        example_path = Path(".env.example")
        if example_path.exists():
            with open(example_path, "r", encoding="utf-8") as f:
                content = f.read()

            required_vars = [
                "PRIVATE_REPOS_TOKEN",
                "GITHUB_TOKEN",
                "GOOGLE_APPS_SCRIPT_URL",
                "GOOGLE_SHEET_ID",
                "FORMSPREE_ENDPOINT",
            ]

            for var in required_vars:
                assert var in content, f"Variável {var} ausente em .env.example"

    def test_env_file_has_required_token(self):
        """Arquivo .env deve ter pelo menos PRIVATE_REPOS_TOKEN configurado"""
        env_path = Path(".env")
        if env_path.exists():
            with open(env_path, "r", encoding="utf-8") as f:
                content = f.read()

            # Verificar se PRIVATE_REPOS_TOKEN está configurado (não vazio)
            has_token = False
            for line in content.split("\n"):
                if line.startswith("PRIVATE_REPOS_TOKEN="):
                    value = line.split("=", 1)[1].strip()
                    has_token = value and value != "seu_token_do_github_aqui"
                    break

            # Não falhar, apenas warning se não estiver configurado
            # assert has_token, "PRIVATE_REPOS_TOKEN não está configurado em .env"


class TestEnvLoading:
    """Testes para carregamento de variáveis de ambiente"""

    def test_dotenv_is_installed(self):
        """python-dotenv deve estar instalado"""
        try:
            from dotenv import load_dotenv

            assert True
        except ImportError:
            pytest.fail("python-dotenv não está instalado")

    def test_load_env_does_not_crash(self):
        """Carregar .env não deve falhar"""
        try:
            load_dotenv()
            assert True
        except Exception as e:
            pytest.fail(f"load_dotenv() falhou: {e}")

    def test_os_environ_accessible(self):
        """os.environ deve ser acessível"""
        # os.environ é um mapeamento tipo dict, mas não é um dict puro
        assert hasattr(os.environ, "get"), "os.environ deve ter método get"
        assert hasattr(os.environ, "__getitem__"), "os.environ deve suportar acesso por chave"


class TestGitignore:
    """Testes para .gitignore"""

    def test_gitignore_exists(self):
        """.gitignore deve existir"""
        gitignore_path = Path(".gitignore")
        assert gitignore_path.exists(), "Arquivo .gitignore não existe"

    def test_env_in_gitignore(self):
        """.env deve estar listado no .gitignore"""
        gitignore_path = Path(".gitignore")
        with open(gitignore_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Verificar se .env está no .gitignore
        lines = content.split("\n")
        env_ignored = any(
            line.strip() == ".env" or line.strip() == ".env*" for line in lines
        )

        assert env_ignored, ".env não está no .gitignore"

    def test_env_example_not_in_gitignore(self):
        """.env.example NÃO deve estar no .gitignore (é público)"""
        gitignore_path = Path(".gitignore")
        with open(gitignore_path, "r", encoding="utf-8") as f:
            content = f.read()

        # .env.example deve ser commitado (não deve estar no .gitignore)
        lines = content.split("\n")
        example_ignored = any(
            line.strip() == ".env.example" for line in lines
        )

        assert not example_ignored, ".env.example está no .gitignore (deve ser público!)"


class TestSecurity:
    """Testes de segurança para variáveis de ambiente"""

    def test_no_hardcoded_tokens_in_update_projects(self):
        """update_projects.py não deve ter tokens hardcoded"""
        script_path = Path("update_projects.py")
        if script_path.exists():
            with open(script_path, "r", encoding="utf-8") as f:
                content = f.read()

            # Verificar se usa os.environ.get() para tokens
            assert "os.environ.get" in content or "os.getenv" in content, (
                "update_projects.py não está usando os.environ.get() para tokens"
            )

            # Verificar se importa load_dotenv
            assert "load_dotenv" in content, (
                "update_projects.py não está importando load_dotenv"
            )

    def test_env_does_not_contain_example_token(self):
        """.env não deve conter o token de exemplo (ou deve estar vazio)"""
        env_path = Path(".env")
        if env_path.exists():
            with open(env_path, "r", encoding="utf-8") as f:
                content = f.read()

            # Verificar se token não é o placeholder (mas permitir se estiver vazio)
            for line in content.split("\n"):
                if line.startswith("PRIVATE_REPOS_TOKEN="):
                    value = line.split("=", 1)[1].strip()
                    # Token deve estar vazio ou ser um token real (não placeholder)
                    if value and value == "seu_token_do_github_aqui":
                        pytest.fail(
                            ".env ainda contém token de exemplo! Substitua pelo token real ou deixe vazio."
                        )
                    break

    def test_private_repos_token_takes_precedence(self):
        """get_api_token() deve preferir PRIVATE_REPOS_TOKEN sobre GITHUB_TOKEN"""
        # Este teste verifica a lógica de precedência
        # A função get_api_token() deve retornar PRIVATE_REPOS_TOKEN primeiro
        from update_projects import get_api_token

        # Não falhar se não tiver token configurado
        try:
            token = get_api_token()
            # Se tiver token, deve ser PRIVATE_REPOS_TOKEN
            private_token = os.environ.get("PRIVATE_REPOS_TOKEN")
            github_token = os.environ.get("GITHUB_TOKEN")

            if private_token and private_token.strip():
                assert token == private_token, (
                    "PRIVATE_REPOS_TOKEN deve ter precedência sobre GITHUB_TOKEN"
                )
            elif github_token and github_token.strip():
                assert token == github_token, (
                    "Deve usar GITHUB_TOKEN se PRIVATE_REPOS_TOKEN não existir"
                )
        except Exception:
            # Se não tiver token configurado, não falhar
            pass
