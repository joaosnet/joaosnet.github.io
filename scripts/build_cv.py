"""Generate professional, ATS-friendly trilingual PDFs using verified facts."""

from __future__ import annotations

import shutil
from html import escape
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate


def generate_cvs(output, site, projects):
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)

    family = "Helvetica"
    bold = "Helvetica-Bold"

    primary_color = colors.HexColor("#0284c7")
    text_color = colors.HexColor("#1e293b")
    muted_color = colors.HexColor("#64748b")
    line_color = colors.HexColor("#cbd5e1")

    targets = [
        ("pt", "cv-joao-natividade-pt.pdf"),
        ("en", "cv-joao-natividade-en.pdf"),
        ("es", "cv-joao-natividade-es.pdf"),
    ]

    for lang, main_name in targets:
        profile = site["profile"][lang]
        styles = getSampleStyleSheet()

        styles.add(
            ParagraphStyle(
                name="CVName",
                fontName=bold,
                fontSize=18,
                leading=21,
                alignment=1,
                textColor=colors.HexColor("#0f172a"),
            )
        )
        styles.add(
            ParagraphStyle(
                name="CVTitle",
                fontName=bold,
                fontSize=9.5,
                leading=13,
                alignment=1,
                textColor=primary_color,
            )
        )
        styles.add(
            ParagraphStyle(
                name="CVCivilName",
                fontName=family,
                fontSize=8,
                leading=10,
                alignment=1,
                textColor=muted_color,
                spaceAfter=3,
            )
        )
        styles.add(
            ParagraphStyle(
                name="CVContactBar",
                fontName=family,
                fontSize=8,
                leading=11,
                alignment=1,
                textColor=text_color,
                spaceAfter=6,
            )
        )
        styles.add(
            ParagraphStyle(
                name="CVSectionHeader",
                fontName=bold,
                fontSize=9.5,
                leading=12,
                spaceBefore=5,
                spaceAfter=2,
                textColor=primary_color,
            )
        )
        styles.add(
            ParagraphStyle(
                name="CVBody",
                fontName=family,
                fontSize=8,
                leading=11,
                spaceAfter=3,
                textColor=text_color,
            )
        )
        styles.add(
            ParagraphStyle(
                name="CVJobTitle",
                fontName=bold,
                fontSize=8.5,
                leading=11,
                textColor=colors.HexColor("#0f172a"),
            )
        )
        styles.add(
            ParagraphStyle(
                name="CVJobMeta",
                fontName=family,
                fontSize=7.5,
                leading=10,
                textColor=muted_color,
                spaceAfter=2,
            )
        )
        styles.add(
            ParagraphStyle(
                name="CVBullet",
                fontName=family,
                fontSize=7.8,
                leading=10.5,
                leftIndent=12,
                firstLineIndent=-8,
                spaceAfter=1.5,
                textColor=text_color,
            )
        )

        story = []

        def p(text, style="CVBody"):
            story.append(Paragraph(text, styles[style]))

        def section(title):
            story.append(Paragraph(title.upper(), styles["CVSectionHeader"]))
            story.append(HRFlowable(width="100%", thickness=0.6, color=line_color, spaceBefore=1, spaceAfter=3))

        # Header
        p(escape(site["name"]), "CVName")
        p(escape(profile["title"]), "CVTitle")
        p("João da Cruz de Natividade e Silva Neto (João Silva Neto) · " + escape(profile["location"]), "CVCivilName")

        site_lang_path = "" if lang == "pt" else f"/{lang}"
        contact_line = (
            f'<link href="mailto:{site["email"]}">{site["email"]}</link> | '
            f'<link href="{site["linkedin"]}">LinkedIn</link> | '
            f'<link href="{site["github"]}">GitHub</link> | '
            f'<link href="{site["url"]}{site_lang_path}">joaosnet.github.io{site_lang_path}</link>'
        )
        p(contact_line, "CVContactBar")

        # Professional Summary
        summary_titles = {
            "pt": "Resumo Profissional",
            "en": "Professional Summary",
            "es": "Resumen Profesional",
        }
        section(summary_titles[lang])

        if lang == "pt":
            summary_text = (
                "Engenheiro de soluções de IA e formando em Engenharia de Computação na UFPA. Levo sistemas do "
                "problema do usuário à produção: entendo a necessidade com quem usa, construo com a tecnologia que "
                "o problema pede (Python, PHP, Rust, Dart) e implanto na AWS. Conecto assistentes de IA a sistemas "
                "reais com servidores MCP. Base em engenharia de software, com coautoria de programa "
                "registrado no INPI (BR512025004902-1)."
            )
        elif lang == "en":
            summary_text = (
                "AI solutions engineer and Computer Engineering senior at UFPA (Brazil). I take systems from the "
                "user's problem to production: I work out the need with the people who use the system, build with "
                "the technology the problem calls for (Python, PHP, Rust, Dart), and deploy on AWS. I connect AI "
                "assistants to real systems with MCP servers. Software engineering background, co-author of "
                "a program registered at INPI (#BR512025004902-1)."
            )
        else:
            summary_text = (
                "Ingeniero de soluciones de IA y estudiante de último año de Ingeniería de Computación en la UFPA. "
                "Llevo sistemas del problema del usuario a producción: entiendo la necesidad con quienes lo usan, "
                "construyo con la tecnología que el problema pide (Python, PHP, Rust, Dart) y despliego en AWS. "
                "Conecto asistentes de IA con sistemas reales "
                "mediante servidores MCP. Base en ingeniería de software, coautor de un programa registrado en el "
                "INPI (BR512025004902-1)."
            )
        p(summary_text)

        # Experience
        exp_titles = {
            "pt": "Experiência Profissional",
            "en": "Professional Experience",
            "es": "Experiencia Profesional",
        }
        section(exp_titles[lang])

        if lang == "pt":
            p("Estagiário em Engenharia de Software · LaPS / UFPA (Projeto DMóvel)", "CVJobTitle")
            p("Março de 2026 — Setembro de 2026 | Belém, PA | Carga Horária: 360 horas", "CVJobMeta")
            p(
                "• Implantei e operei na AWS os serviços conteinerizados do DMóvel, aplicativo assistivo para "
                "pessoas com deficiência (UFOPA, UFPA e UEMA): gerenciador de contêineres, IAM (usuários, grupos "
                "e permissões) e controle de custos e faturas.",
                "CVBullet",
            )
            p(
                "• Mantive a API do sistema, primeiro em PHP/Laravel e depois em Python/FastAPI, e os dashboards "
                "de análise de dados e de gerenciamento.",
                "CVBullet",
            )
            p(
                "• Acompanhei os erros dos usuários com GlitchTip, usei ferramentas de segurança e de automação "
                "para verificar o funcionamento dos aplicativos e eliminei vazamentos de memória no app "
                "Flutter/Dart.",
                "CVBullet",
            )
            p(
                "• Conversei com usuários e parceiros (LED, LAMIC e estudantes da Alemanha) e apresentei o "
                "sistema a alunos de computação da UFPA em dois dias de demonstração.",
                "CVBullet",
            )
            p(
                "• Coautor do programa registrado no INPI (BR512025004902-1); desempenho avaliado com nota 10,0 "
                "(Excelente) pelo orientador.",
                "CVBullet",
            )
        elif lang == "en":
            p("Software Engineering Intern · LaPS / UFPA (DMóvel Assistive Technology)", "CVJobTitle")
            p("March 2026 — September 2026 | Belém, Brazil | 360 Hours", "CVJobMeta")
            p(
                "• Deployed and operated on AWS the containerized services of DMóvel, an assistive app for people"
                " with disabilities (UFOPA, UFPA, and UEMA): container manager, IAM (users, groups, and "
                "permissions), and cost and billing control.",
                "CVBullet",
            )
            p(
                "• Maintained the system API, first in PHP/Laravel and then in Python/FastAPI, along with the "
                "data analysis and management dashboards.",
                "CVBullet",
            )
            p(
                "• Tracked user errors with GlitchTip, used security and automation tools to verify the apps were"
                " working, and removed memory leaks in the Flutter/Dart app.",
                "CVBullet",
            )
            p(
                "• Talked with users and partners (LED, LAMIC, and students from Germany) and demoed the system "
                "to computing students at UFPA over two days.",
                "CVBullet",
            )
            p(
                "• Co-author of the program registered at INPI (#BR512025004902-1); performance graded 10.0/10 "
                "(Excellent) by the lab advisor.",
                "CVBullet",
            )
        else:
            p("Pasante en Ingeniería de Software · LaPS / UFPA (Proyecto DMóvel)", "CVJobTitle")
            p("Marzo de 2026 — Septiembre de 2026 | Belém, Brasil | 360 Horas", "CVJobMeta")
            p(
                "• Desplegué y operé en AWS los servicios en contenedores de DMóvel, aplicación asistiva para "
                "personas con discapacidad (UFOPA, UFPA y UEMA): gestor de contenedores, IAM (usuarios, grupos y "
                "permisos) y control de costes y facturas.",
                "CVBullet",
            )
            p(
                "• Mantuve la API del sistema, primero en PHP/Laravel y luego en Python/FastAPI, y los paneles de"
                " análisis de datos y de gestión.",
                "CVBullet",
            )
            p(
                "• Seguí los errores de los usuarios con GlitchTip, usé herramientas de seguridad y de "
                "automatización para verificar el funcionamiento de las aplicaciones y eliminé fugas de memoria "
                "en la app Flutter/Dart.",
                "CVBullet",
            )
            p(
                "• Conversé con usuarios y socios (LED, LAMIC y estudiantes de Alemania) y presenté el sistema a "
                "alumnos de computación de la UFPA en dos días de demostración.",
                "CVBullet",
            )
            p(
                "• Coautor del programa registrado en el INPI (BR512025004902-1); desempeño evaluado con nota "
                "10,0 (Excelente) por el orientador.",
                "CVBullet",
            )

        if lang == "pt":
            p("Desenvolvedor Freelance · Loja de varejo (venda online e física)", "CVJobTitle")
            p("Agosto de 2025", "CVJobMeta")
            p(
                "• Entreguei direto ao cliente um site em Django com catálogo e busca por categoria, carrinho e "
                "checkout, e painel de gerenciamento de produtos.",
                "CVBullet",
            )
        elif lang == "en":
            p("Freelance Developer · Retail store (online and in-person sales)", "CVJobTitle")
            p("August 2025", "CVJobMeta")
            p(
                "• Delivered directly to the client a Django website with catalog and category search, cart and "
                "checkout, and a product management panel.",
                "CVBullet",
            )
        else:
            p("Desarrollador Freelance · Tienda minorista (venta en línea y física)", "CVJobTitle")
            p("Agosto de 2025", "CVJobMeta")
            p(
                "• Entregué directamente al cliente un sitio en Django con catálogo y búsqueda por categoría, "
                "carrito y checkout, y panel de gestión de productos.",
                "CVBullet",
            )

        # Selected Projects
        proj_titles = {
            "pt": "Projetos Relevantes",
            "en": "Selected Projects",
            "es": "Proyectos Seleccionados",
        }
        section(proj_titles[lang])

        by_id = {project["id"]: project for project in projects}
        for project in (by_id[i] for i in ("dmovel", "varedura", "aethersense") if i in by_id):
            d = project[lang]
            tags_str = ", ".join(project.get("tags", [])[:5])
            p(f"<b>{escape(project['name'])}</b> ({tags_str})", "CVJobTitle")
            p(escape(d["summary"]), "CVBody")

            demo_base = site["url"] + ("/" if lang == "pt" else f"/{lang}/") + "projects/" + project["id"] + "/"
            demo_url = project.get("demo") or demo_base
            code_base = site["github"] + "/" + project.get("repo", "").split("/")[-1]
            code_url = project.get("github") or code_base
            demo_display = demo_url.removeprefix("https://")
            code_display = code_url.removeprefix("https://")

            link_lbl = "Link" if lang != "es" else "Enlace"
            code_lbl = "Código"
            p(
                f'• {link_lbl}: <link href="{demo_url}">{demo_display}</link> | '
                f'{code_lbl}: <link href="{code_url}">{code_display}</link>',
                "CVBullet",
            )

        # Technical Skills
        skills_titles = {
            "pt": "Competências Técnicas",
            "en": "Technical Skills",
            "es": "Competencias Técnicas",
        }
        section(skills_titles[lang])

        if lang == "pt":
            p("<b>Implantação & Nuvem:</b> AWS (IAM, custos), Docker, GitHub Actions, Linux, GlitchTip")
            p("<b>Integrações & IA:</b> MCP (Model Context Protocol), FastAPI, Django, Laravel, Dash, ONNX")
            p("<b>Linguagens:</b> Python, PHP, Rust, TypeScript, JavaScript, Dart, SQL, C")
        elif lang == "en":
            p("<b>Deployment & Cloud:</b> AWS (IAM, billing), Docker, GitHub Actions, Linux, GlitchTip")
            p("<b>Integrations & AI:</b> MCP (Model Context Protocol), FastAPI, Django, Laravel, Dash, ONNX")
            p("<b>Languages:</b> Python, PHP, Rust, TypeScript, JavaScript, Dart, SQL, C")
        else:
            p("<b>Implementación & Nube:</b> AWS (IAM, custos), Docker, GitHub Actions, Linux, GlitchTip")
            p("<b>Integraciones & IA:</b> MCP (Model Context Protocol), FastAPI, Django, Laravel, Dash, ONNX")
            p("<b>Lenguajes:</b> Python, PHP, Rust, TypeScript, JavaScript, Dart, SQL, C")

        # Education
        edu_titles = {
            "pt": "Formação Acadêmica",
            "en": "Education",
            "es": "Educación y Formación",
        }
        section(edu_titles[lang])

        if lang == "pt":
            p("<b>Bacharelado em Engenharia de Computação</b> — Universidade Federal do Pará (UFPA)", "CVJobTitle")
            p("Bacharelado em andamento · Previsão de conclusão: 2026 | Belém, PA", "CVJobMeta")
            p(
                "• Destaque Acadêmico: Nota máxima (100) em Projetos de Hardware, Engenharia de Software, "
                "Banco de Dados e Computação em Nuvem.",
                "CVBullet",
            )
            p("• Idiomas: Português (Nativo) | Inglês (Avançado) | Espanhol (Profissional)", "CVBullet")
        elif lang == "en":
            p("<b>Bachelor of Science in Computer Engineering</b> — Universidade Federal do Pará (UFPA)", "CVJobTitle")
            p("Bachelor's degree in progress · Expected graduation: 2026 | Belém, Brazil", "CVJobMeta")
            p(
                "• Academic Honors: Maximum grade (100/100) in Hardware Design, Software Engineering, "
                "Databases, and Cloud Computing.",
                "CVBullet",
            )
            p("• Languages: Portuguese (Native) | English (Advanced) | Spanish (Professional)", "CVBullet")
        else:
            p("<b>Grado en Ingeniería de Computación</b> — Universidade Federal do Pará (UFPA)", "CVJobTitle")
            p("Grado en curso · Graduación prevista: 2026 | Belém, Brasil", "CVJobMeta")
            p(
                "• Distinción Académica: Calificación máxima (100/100) en Proyectos de Hardware, "
                "Ingeniería de Software, Bases de Datos y Computación en la Nube.",
                "CVBullet",
            )
            p("• Idiomas: Portugués (Nativo) | Inglés (Avanzado) | Español (Profesional)", "CVBullet")

        target_file = output / main_name
        doc = SimpleDocTemplate(
            str(target_file),
            pagesize=A4,
            rightMargin=34,
            leftMargin=34,
            topMargin=22,
            bottomMargin=22,
            title=f"{site['name']} | {'Currículo' if lang != 'en' else 'Resume'}",
            author=site["name"],
        )
        doc.build(story)

        # Compatibility copies
        if lang == "pt":
            shutil.copyfile(target_file, output / "crv.pdf")
        elif lang == "en":
            shutil.copyfile(target_file, output / "cv-joao-silva-neto-en.pdf")

    # Also keep ROOT / docs in sync
    root_docs = Path(__file__).resolve().parent.parent / "docs"
    if root_docs.exists() and output != root_docs:
        for f in output.glob("*.pdf"):
            shutil.copyfile(f, root_docs / f.name)
