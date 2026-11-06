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
                "Engenheiro de software e formando em Engenharia de Computação na UFPA com foco em desenvolvimento "
                "backend, microsserviços, automação MCP, nuvem (AWS) e IoT. Coautor de propriedade intelectual de "
                "software registrada no INPI (BR512025004902-1). Experiência prática na manutenção e otimização de "
                "APIs em Python (FastAPI) e sistemas em Rust, saneamento de vazamentos de memória em aplicações "
                "multiplataforma (Flutter/Dart), dashboards em Dash e interfaces a 120 FPS em Canvas."
            )
        elif lang == "en":
            summary_text = (
                "Software engineer and Computer Engineering senior at UFPA specializing in backend development, "
                "microservices, MCP automation, AWS cloud, and IoT. Co-author of registered software intellectual "
                "property at INPI (#BR512025004902-1). Hands-on experience optimizing Python APIs (FastAPI) and "
                "Rust systems, resolving mobile memory leaks (Flutter/Dart), building Dash dashboards, and crafting "
                "120 FPS Canvas graphics."
            )
        else:
            summary_text = (
                "Ingeniero de software y estudiante de último año de Ingeniería de Computación en la UFPA con enfoque "
                "en desarrollo backend, microservicios, automatización MCP, nube (AWS) e IoT. Coautor de propiedad "
                "intelectual de software registrada en el INPI (BR512025004902-1). Experiencia práctica en "
                "mantenimiento y optimización de APIs en Python (FastAPI) y sistemas en Rust, saneamiento de memory "
                "leaks en Flutter/Dart y paneles a 120 FPS."
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
                "• Coautoria de Propriedade Intelectual registrada no INPI (Processo nº BR512025004902-1 · "
                "DMóvel · Parceria UFOPA / UFPA / UEMA · Proteção de 50 anos pela Lei 9.609/1998).",
                "CVBullet",
            )
            p(
                "• Manutenção e refatoração do backend em Python com FastAPI, integrado a bancos de dados e "
                "serviços na Amazon Web Services (AWS).",
                "CVBullet",
            )
            p(
                "• Desenvolvimento e manutenção de interface assistiva multiplataforma em Flutter/Dart e "
                "dashboards analíticos com Dash (Python), HTML, CSS e JavaScript.",
                "CVBullet",
            )
            p(
                "• Diagnóstico e saneamento de vazamentos de memória (memory leaks) e gargalos de runtime em produção "
                "no aplicativo móvel.",
                "CVBullet",
            )
            p(
                "• Desempenho técnico avaliado com nota máxima 10,0 (Conceito Excelente) pelo orientador permanente.",
                "CVBullet",
            )
        elif lang == "en":
            p("Software Engineering Intern · LaPS / UFPA (DMóvel Assistive Technology)", "CVJobTitle")
            p("March 2026 — September 2026 | Belém, Brazil | 360 Hours", "CVJobMeta")
            p(
                "• Registered Software Intellectual Property co-author at INPI (Process #BR512025004902-1 · "
                "DMóvel · UFOPA / UFPA / UEMA · 50-year protection under Law 9.609/1998).",
                "CVBullet",
            )
            p(
                "• Maintained and refactored Python/FastAPI backend integrated with databases and cloud services on "
                "Amazon Web Services (AWS).",
                "CVBullet",
            )
            p(
                "• Developed and maintained cross-platform assistive UI in Flutter/Dart and interactive dashboards "
                "using Dash (Python), HTML, CSS, and JavaScript.",
                "CVBullet",
            )
            p(
                "• Diagnosed and resolved mobile memory leaks and runtime bottlenecks in production.",
                "CVBullet",
            )
            p("• Graded 10.0/10 (Concept Excellent) by the permanent lab advisor.", "CVBullet")
        else:
            p("Pasante en Ingeniería de Software · LaPS / UFPA (Proyecto DMóvel)", "CVJobTitle")
            p("Marzo de 2026 — Septiembre de 2026 | Belém, Brasil | 360 Horas", "CVJobMeta")
            p(
                "• Coautoría de Propiedad Intelectual registrada en el INPI (Proceso nº BR512025004902-1 · "
                "DMóvel · Alianza interinstitucional UFOPA / UFPA / UEMA · Protección de 50 años por Ley 9.609/1998).",
                "CVBullet",
            )
            p(
                "• Mantenimiento y refactorización del backend en Python con FastAPI, integrado a bases de datos y "
                "servicios en Amazon Web Services (AWS).",
                "CVBullet",
            )
            p(
                "• Desarrollo de interfaz asistiva en Flutter/Dart y paneles analíticos con Dash (Python), "
                "HTML, CSS y JavaScript.",
                "CVBullet",
            )
            p(
                "• Diagnóstico y saneamiento de fugas de memoria (memory leaks) y cuellos de botella en la app móvil.",
                "CVBullet",
            )
            p("• Evaluado con calificación máxima 10,0 (Concepto Excelente) por el orientador permanente.", "CVBullet")

        # Selected Projects
        proj_titles = {
            "pt": "Projetos Relevantes",
            "en": "Selected Projects",
            "es": "Proyectos Seleccionados",
        }
        section(proj_titles[lang])

        for project in projects[:4]:
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
            p("<b>Linguagens:</b> Python, Rust, JavaScript, TypeScript, Dart, C, SQL, HTML5, CSS3")
            p("<b>Backend & Nuvem:</b> FastAPI, AWS, Docker, REST APIs, MCP (Model Context Protocol), Dash")
            p("<b>Sistemas & Ferramentas:</b> Git, GitHub Actions, Linux, ESP32, Canvas 2D, Three.js, WebSockets")
        elif lang == "en":
            p("<b>Languages:</b> Python, Rust, JavaScript, TypeScript, Dart, C, SQL, HTML5, CSS3")
            p("<b>Backend & Cloud:</b> FastAPI, AWS, Docker, REST APIs, MCP (Model Context Protocol), Dash")
            p("<b>Systems & Tools:</b> Git, GitHub Actions, Linux, ESP32, Canvas 2D, Three.js, WebSockets")
        else:
            p("<b>Lenguajes:</b> Python, Rust, JavaScript, TypeScript, Dart, C, SQL, HTML5, CSS3")
            p("<b>Backend & Nube:</b> FastAPI, AWS, Docker, REST APIs, MCP (Model Context Protocol), Dash")
            p("<b>Sistemas & Herramientas:</b> Git, GitHub Actions, Linux, ESP32, Canvas 2D, Three.js, WebSockets")

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
