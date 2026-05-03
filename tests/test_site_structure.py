"""
Testes para validar a estrutura do site (index.html)
Verifica:
- Presença de marcadores de projetos
- Estrutura de scripts
- Elementos necessários
"""

import pytest
import os
from pathlib import Path
from html.parser import HTMLParser


class SimpleHTMLParser(HTMLParser):
    """Parser HTML simples para extrair informações"""

    def __init__(self):
        super().__init__()
        self.scripts = []
        self.links = []
        self.meta_tags = []
        self.title = ""
        self.has_projects_start = False
        self.has_projects_end = False

    def handle_starttag(self, tag, attrs):
        if tag == "script":
            self.scripts.append(dict(attrs))
        elif tag == "link":
            self.links.append(dict(attrs))
        elif tag == "meta":
            self.meta_tags.append(dict(attrs))
        elif tag == "title":
            self.title = ""

    def handle_data(self, data):
        if self.get_starttag_text() and "<title" in self.get_starttag_text():
            self.title += data.strip()

    def handle_comment(self, data):
        if "PROJECTS_START" in data:
            self.has_projects_start = True
        if "PROJECTS_END" in data:
            self.has_projects_end = True


class TestIndexHTMLStructure:
    """Testes para validar estrutura do index.html"""

    @pytest.fixture
    def html_content(self):
        """Carregar conteúdo do index.html"""
        html_path = Path(__file__).parent.parent / "index.html"
        with open(html_path, "r", encoding="utf-8") as f:
            return f.read()

    @pytest.fixture
    def parser(self, html_content):
        """Parser do HTML"""
        parser = SimpleHTMLParser()
        parser.feed(html_content)
        return parser

    def test_file_exists(self):
        """Deve existir o arquivo index.html"""
        html_path = Path(__file__).parent.parent / "index.html"
        assert html_path.exists(), "index.html não existe"

    def test_has_projects_markers(self, parser):
        """Deve ter marcadores de projetos"""
        assert parser.has_projects_start, "Falta <!-- PROJECTS_START -->"
        assert parser.has_projects_end, "Falta <!-- PROJECTS_END -->"

    def test_has_required_scripts(self, parser):
        """Deve ter todos os scripts necessários"""
        script_files = [script.get("src", "") for script in parser.scripts if script.get("src")]

        required_scripts = [
            "particles.min.js",
            "utils.js",
            "geo-counter.js",
            "theme-manager.js",
            "mobile-menu.js",
            "animations.js",
            "contact-form.js",
        ]

        for required_script in required_scripts:
            assert any(
                required_script in src for src in script_files
            ), f"Script obrigatório ausente: {required_script}"

    def test_has_css_stylesheet(self, parser):
        """Deve ter folha de estilos"""
        css_files = [link.get("href", "") for link in parser.links if link.get("href")]
        assert any(
            "styles.css" in css for css in css_files
        ), "Folha de estilos styles.css não encontrada"

    def test_has_meta_viewport(self, parser):
        """Deve ter meta viewport para responsividade"""
        has_viewport = any(
            meta.get("name") == "viewport" for meta in parser.meta_tags
        )
        assert has_viewport, "Meta viewport ausente"

    def test_has_meta_charset(self, parser):
        """Deve ter meta charset"""
        has_charset = any(
            meta.get("charset") == "UTF-8" for meta in parser.meta_tags
        )
        assert has_charset, "Meta charset UTF-8 ausente"

    def test_has_contact_form(self, html_content):
        """Deve ter formulário de contato"""
        assert 'id="contact-form"' in html_content, "Formulário de contato não encontrado"
        assert "formspree.io" in html_content, "Action do Formspree não encontrado"

    def test_has_theme_toggle(self, html_content):
        """Deve ter botão de troca de tema"""
        assert 'id="theme-toggle"' in html_content, "Botão de tema não encontrado"

    def test_has_fab_contact(self, html_content):
        """Deve ter botão flutuante de contato"""
        assert 'id="fab-contact"' in html_content, "Botão flutuante de contato não encontrado"

    def test_has_footer_views_counter(self, html_content):
        """Deve ter contador de visitantes no footer"""
        assert 'id="unique-views"' in html_content, "Contador de visitantes não encontrado"

    def test_has_cv_download_link(self, html_content):
        """Deve ter link para download do currículo"""
        assert 'href="docs/crv.pdf"' in html_content, "Link para currículo não encontrado"
        assert "download" in html_content, "Download do currículo não configurado"

    def test_has_telegram_contact_link(self, html_content):
        """Deve ter botão para contato no Telegram"""
        assert 'https://t.me/joaosilvaneto' in html_content, "Link do Telegram não encontrado"
        assert 'Conversar no Telegram' in html_content, "Texto do botão do Telegram não encontrado"

    def test_has_lattes_link(self, html_content):
        """Deve ter link para o Lattes"""
        assert 'https://lattes.cnpq.br/1140714924160415' in html_content, "Link do Lattes não encontrado"
        assert 'Lattes' in html_content, "Texto do Lattes não encontrado"

    def test_has_particles_container(self, html_content):
        """Deve ter container de partículas"""
        assert 'id="particles-js"' in html_content, "Container de partículas não encontrado"


class TestJavaScriptFiles:
    """Testes para validar arquivos JavaScript"""

    @pytest.fixture
    def js_dir(self):
        """Diretório JS"""
        return Path(__file__).parent.parent / "assets" / "js"

    def test_all_js_files_exist(self, js_dir):
        """Todos os arquivos JS obrigatórios devem existir"""
        required_files = [
            "utils.js",
            "geo-counter.js",
            "theme-manager.js",
            "mobile-menu.js",
            "animations.js",
            "contact-form.js",
        ]

        for js_file in required_files:
            file_path = js_dir / js_file
            assert file_path.exists(), f"Arquivo JS ausente: {js_file}"

    def test_no_syntax_errors_in_utils(self, js_dir):
        """utils.js não deve ter erros de sintaxe (verificação básica)"""
        utils_path = js_dir / "utils.js"
        content = utils_path.read_text(encoding="utf-8")

        # Verificação básica: deve ter balanceamento de chaves
        open_braces = content.count("{")
        close_braces = content.count("}")
        assert open_braces == close_braces, f"Chaves desbalanceadas em utils.js: {open_braces} {{ vs {close_braces} }}"

    def test_no_syntax_errors_in_geo_counter(self, js_dir):
        """geo-counter.js não deve ter erros de sintaxe (verificação básica)"""
        geo_path = js_dir / "geo-counter.js"
        content = geo_path.read_text(encoding="utf-8")

        open_braces = content.count("{")
        close_braces = content.count("}")
        assert open_braces == close_braces, f"Chaves desbalanceadas em geo-counter.js: {open_braces} {{ vs {close_braces} }}"

    def test_geo_counter_does_not_call_public_ip_apis(self, js_dir):
        """geo-counter.js não deve chamar APIs públicas de IP/geo no navegador"""
        geo_path = js_dir / "geo-counter.js"
        content = geo_path.read_text(encoding="utf-8")

        blocked_urls = [
            "ipapi.co",
            "api.country.is",
            "ip-api.com",
            "api.ipify.org",
        ]

        for url in blocked_urls:
            assert url not in content, f"API pública de IP/geo ainda presente: {url}"

    def test_no_syntax_errors_in_contact_form(self, js_dir):
        """contact-form.js não deve ter erros de sintaxe (verificação básica)"""
        form_path = js_dir / "contact-form.js"
        content = form_path.read_text(encoding="utf-8")

        open_braces = content.count("{")
        close_braces = content.count("}")
        assert open_braces == close_braces, f"Chaves desbalanceadas em contact-form.js: {open_braces} {{ vs {close_braces} }}"


class TestCSSFiles:
    """Testes para validar arquivos CSS"""

    @pytest.fixture
    def css_dir(self):
        """Diretório CSS"""
        return Path(__file__).parent.parent / "assets" / "css"

    def test_styles_css_exists(self, css_dir):
        """styles.css deve existir"""
        styles_path = css_dir / "styles.css"
        assert styles_path.exists(), "styles.css não existe"

    def test_styles_has_theme_variables(self, css_dir):
        """styles.css deve ter variáveis de tema"""
        styles_path = css_dir / "styles.css"
        content = styles_path.read_text(encoding="utf-8")

        required_vars = [
            "--primary",
            "--secondary",
            "--accent",
            "--bg-card",
        ]

        for var in required_vars:
            assert var in content, f"Variável CSS ausente: {var}"

    def test_styles_has_light_theme_override(self, css_dir):
        """styles.css deve ter override para tema claro"""
        styles_path = css_dir / "styles.css"
        content = styles_path.read_text(encoding="utf-8")
        assert 'html[data-theme="light"]' in content, "Override de tema claro não encontrado"


class TestAssetDirectories:
    """Testes para validar diretórios de assets"""

    def test_project_images_dir_exists(self):
        """Diretório de imagens de projetos deve existir"""
        img_dir = Path(__file__).parent.parent / "assets" / "project-images"
        assert img_dir.exists(), "Diretório project-images não existe"

    def test_webfonts_dir_exists(self):
        """Diretório de webfonts deve existir"""
        font_dir = Path(__file__).parent.parent / "assets" / "webfonts"
        assert font_dir.exists(), "Diretório webfonts não existe"

    def test_images_dir_exists(self):
        """Diretório de imagens gerais deve existir"""
        img_dir = Path(__file__).parent.parent / "assets" / "images"
        assert img_dir.exists(), "Diretório images não existe"

    def test_cv_pdf_exists(self):
        """Arquivo de currículo deve existir"""
        cv_path = Path(__file__).parent.parent / "docs" / "crv.pdf"
        assert cv_path.exists(), "Arquivo docs/crv.pdf não existe"
