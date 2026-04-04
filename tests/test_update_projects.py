"""
Testes para o script update_projects.py
Testa funcionalidades críticas como:
- Detecção de idioma
- Tradução
- Geração de HTML
- Manipulação de descrições None/ vazias
- Validação de estrutura de projetos
"""

import pytest
import sys
import os
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime

# Adicionar o diretório raiz ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from update_projects import (
    detect_language,
    translate_to_portuguese,
    generate_project_html,
    mask_repo_name,
)


class TestDetectLanguage:
    """Testes para detecção de idioma"""

    def test_detect_portuguese(self):
        """Deve detectar texto em português"""
        text = "Este é um projeto de aplicação web para gerenciamento de dados"
        assert detect_language(text) == "pt"

    def test_detect_portuguese_with_common_words(self):
        """Deve detectar português por palavras comuns"""
        text = "Sistema para cadastro de usuários com configuração automática"
        assert detect_language(text) == "pt"

    def test_detect_english(self):
        """Deve detectar texto em inglês"""
        text = "This is a web application for data management and user authentication"
        assert detect_language(text) == "en"

    def test_detect_english_common_words(self):
        """Deve detectar inglês por palavras comuns"""
        text = "The system provides user management and configuration tools"
        assert detect_language(text) == "en"

    def test_detect_empty_text(self):
        """Deve retornar 'unknown' para texto vazio"""
        assert detect_language("") == "unknown"
        assert detect_language(None) == "unknown"

    def test_detect_short_text(self):
        """Deve lidar com textos curtos"""
        text = "API"
        result = detect_language(text)
        assert result in ["unknown", "en", "other"]


class TestTranslateToPortuguese:
    """Testes para tradução"""

    @patch("update_projects._HAS_REQUESTS", False)
    def test_skip_translation_if_portuguese(self):
        """Não deve traduzir se texto já está em português"""
        text = "Este é um projeto em português"
        result = translate_to_portuguese(text)
        # Deve retornar o original se detectar como pt
        assert result == text

    def test_handle_empty_text(self):
        """Deve lidar com textos vazios"""
        assert translate_to_portuguese("") == ""
        assert translate_to_portuguese(None) is None

    def test_handle_short_text(self):
        """Deve lidar com textos curtos (< 3 chars)"""
        assert translate_to_portuguese("OK") == "OK"


class TestGenerateProjectHTML:
    """Testes para geração de HTML de projetos"""

    def test_generate_html_public_project(self):
        """Deve gerar HTML correto para projeto público"""
        project = {
            "name": "test-project",
            "description": "Um projeto de teste",
            "html_url": "https://github.com/joaosnet/test-project",
            "preview_image": "https://example.com/image.png",
            "updated_at": "2026-04-03T04:43:00Z",
            "private": False,
        }

        html = generate_project_html(project, is_last=False, position="left")

        assert "test-project" in html
        assert "Um projeto de teste" in html
        assert "https://github.com/joaosnet/test-project" in html
        assert "https://example.com/image.png" in html
        assert "timeline-item-left" in html
        assert "Ver no GitHub" in html

    def test_generate_html_private_project(self):
        """Deve gerar HTML correto para projeto privado"""
        project = {
            "name": "private-project",
            "description": "Projeto privado de teste",
            "html_url": "https://github.com/joaosnet/private-project",
            "preview_image": None,
            "updated_at": "2026-04-02T22:18:41Z",
            "private": True,
        }

        html = generate_project_html(project, is_last=True, position="right")

        assert "private-project" in html
        assert "Projeto privado de teste" in html
        assert "timeline-item-right" in html
        assert "Privado" in html
        assert "fa-lock" in html
        assert "Ver no GitHub" not in html

    def test_generate_html_none_description(self):
        """Deve lidar com descrição None"""
        project = {
            "name": "no-desc-project",
            "description": None,
            "html_url": "https://github.com/joaosnet/no-desc-project",
            "preview_image": None,
            "updated_at": "2026-04-01T21:09:16Z",
            "private": False,
        }

        # Não deve falhar mesmo com description = None
        html = generate_project_html(project, is_last=False, position="left")
        assert "no-desc-project" in html

    def test_generate_html_empty_description(self):
        """Deve lidar com descrição vazia"""
        project = {
            "name": "empty-desc-project",
            "description": "",
            "html_url": "https://github.com/joaosnet/empty-desc-project",
            "preview_image": None,
            "updated_at": "2026-04-01T21:09:16Z",
            "private": False,
        }

        html = generate_project_html(project, is_last=False, position="left")
        assert "empty-desc-project" in html

    def test_generate_html_with_translated_description(self):
        """Deve usar descrição traduzida se disponível"""
        project = {
            "name": "translated-project",
            "description": "Original description in English",
            "description_translated": "Descrição traduzida para português",
            "html_url": "https://github.com/joaosnet/translated-project",
            "preview_image": None,
            "updated_at": "2026-04-01T21:09:16Z",
            "private": False,
        }

        html = generate_project_html(project, is_last=False, position="left")
        assert "Descrição traduzida para português" in html
        assert "Original description in English" not in html

    def test_generate_html_right_position(self):
        """Deve gerar HTML com posição à direita"""
        project = {
            "name": "right-project",
            "description": "Projeto à direita",
            "html_url": "https://github.com/joaosnet/right-project",
            "preview_image": None,
            "updated_at": "2026-04-01T21:09:16Z",
            "private": False,
        }

        html = generate_project_html(project, is_last=False, position="right")
        assert "timeline-item-right" in html
        assert "timeline-card--right" in html


class TestMaskRepoName:
    """Testes para mascaramento de nomes de repositórios"""

    def test_mask_private_repo(self):
        """Deve mascarar nome de repo privado"""
        repo = {"private": True}
        assert mask_repo_name(repo) == "private repo"

    def test_mask_public_repo(self):
        """Deve mostrar nome de repo público"""
        repo = {
            "private": False,
            "owner": {"login": "joaosnet"},
            "name": "public-repo",
        }
        assert mask_repo_name(repo) == "joaosnet/public-repo"


class TestProjectValidation:
    """Testes de validação de estrutura de projetos"""

    def test_project_with_all_fields(self):
        """Deve lidar com projeto com todos os campos"""
        project = {
            "name": "complete-project",
            "description": "Projeto completo",
            "description_translated": "Projeto completo traduzido",
            "html_url": "https://github.com/joaosnet/complete-project",
            "preview_image": "https://example.com/img.png",
            "updated_at": "2026-04-03T04:43:00Z",
            "private": False,
            "fork": False,
        }

        html = generate_project_html(project, is_last=True, position="left")
        assert "complete-project" in html
        assert "Projeto completo traduzido" in html

    def test_project_with_minimal_fields(self):
        """Deve lidar com projeto com campos mínimos"""
        project = {
            "name": "minimal-project",
            "description": None,
            "html_url": "https://github.com/joaosnet/minimal-project",
            "updated_at": "2026-04-03T04:43:00Z",
            "private": False,
        }

        # Não deve falhar
        html = generate_project_html(project, is_last=False, position="left")
        assert "minimal-project" in html

    def test_project_date_format(self):
        """Deve formatar data corretamente"""
        project = {
            "name": "date-project",
            "description": "Projeto com data",
            "html_url": "https://github.com/joaosnet/date-project",
            "preview_image": None,
            "updated_at": "2026-04-03T04:43:00+00:00",
            "private": False,
        }

        html = generate_project_html(project, is_last=False, position="left")
        assert "03/04/2026" in html
        assert "2026-04-03T04:43:00+00:00" in html  # datetime ISO


class TestEdgeCases:
    """Testes para casos extremas"""

    def test_special_characters_in_description(self):
        """Deve lidar com caracteres especiais na descrição"""
        project = {
            "name": "special-chars-project",
            "description": "Projeto com <html> & \"aspas\" 'simples'",
            "html_url": "https://github.com/joaosnet/special-chars-project",
            "preview_image": None,
            "updated_at": "2026-04-03T04:43:00Z",
            "private": False,
        }

        # Não deve falhar
        html = generate_project_html(project, is_last=False, position="left")
        assert "special-chars-project" in html

    def test_very_long_description(self):
        """Deve lidar com descrições muito longas"""
        project = {
            "name": "long-desc-project",
            "description": "A" * 1000,
            "html_url": "https://github.com/joaosnet/long-desc-project",
            "preview_image": None,
            "updated_at": "2026-04-03T04:43:00Z",
            "private": False,
        }

        # Não deve falhar
        html = generate_project_html(project, is_last=False, position="left")
        assert "long-desc-project" in html

    def test_project_with_none_image(self):
        """Deve lidar com imagem None"""
        project = {
            "name": "no-image-project",
            "description": "Projeto sem imagem",
            "html_url": "https://github.com/joaosnet/no-image-project",
            "preview_image": None,
            "updated_at": "2026-04-03T04:43:00Z",
            "private": False,
        }

        html = generate_project_html(project, is_last=False, position="left")
        assert "no-image-project" in html
        # Não deve ter tag img se preview_image é None
        assert '<img src=""' not in html
