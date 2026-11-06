"""Generate professional, ATS-friendly bilingual PDFs using verified facts."""

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
    ]

    for lang, main_name in targets:
        profile = site["profile"][lang]
        styles = getSampleStyleSheet()

        styles.add(
            ParagraphStyle(
                name="CVName",
                fontName=bold,
                fontSize=20,
                leading=24,
                alignment=1,
                textColor=colors.HexColor("#0f172a"),
            )
        )
        styles.add(
            ParagraphStyle(
                name="CVCivilName",
                fontName=family,
                fontSize=8.5,
                leading=11,
                alignment=1,
                textColor=muted_color,
                spaceAfter=4,
            )
        )
        styles.add(
            ParagraphStyle(
                name="CVContactBar",
                fontName=family,
                fontSize=8.5,
                leading=12,
                alignment=1,
                textColor=text_color,
                spaceAfter=10,
            )
        )
        styles.add(
            ParagraphStyle(
                name="CVSectionHeader",
                fontName=bold,
                fontSize=11,
                leading=14,
                spaceBefore=8,
                spaceAfter=3,
                textColor=primary_color,
            )
        )
        styles.add(
            ParagraphStyle(
                name="CVBody",
                fontName=family,
                fontSize=9,
                leading=13,
                spaceAfter=4,
                textColor=text_color,
            )
        )
        styles.add(
            ParagraphStyle(
                name="CVJobTitle",
                fontName=bold,
                fontSize=9.5,
                leading=13,
                textColor=colors.HexColor("#0f172a"),
            )
        )
        styles.add(
            ParagraphStyle(
                name="CVJobMeta",
                fontName=family,
                fontSize=8.5,
                leading=12,
                textColor=muted_color,
                spaceAfter=3,
            )
        )
        styles.add(
            ParagraphStyle(
                name="CVBullet",
                fontName=family,
                fontSize=8.5,
                leading=12,
                leftIndent=14,
                firstLineIndent=-10,
                spaceAfter=2,
                textColor=text_color,
            )
        )

        story = []

        def p(text, style="CVBody"):
            story.append(Paragraph(text, styles[style]))

        def section(title):
            story.append(Paragraph(title.upper(), styles["CVSectionHeader"]))
            story.append(HRFlowable(width="100%", thickness=0.75, color=line_color, spaceBefore=1, spaceAfter=5))

        # Header
        p(escape(site["name"]), "CVName")
        p("João da Cruz de Natividade e Silva Neto (João Silva Neto) · " + escape(profile["location"]), "CVCivilName")
        contact_line = (
            f'<link href="mailto:{site["email"]}">{site["email"]}</link> | '
            f'<link href="{site["linkedin"]}">LinkedIn</link> | '
            f'<link href="{site["github"]}">GitHub</link> | '
            f'<link href="{site["url"]}">joaosnet.github.io</link>'
        )
        p(contact_line, "CVContactBar")

        # Summary
        section("Resumo Profissional" if lang == "pt" else "Professional Summary")
        if lang == "pt":
            summary_text = (
                "Engenheiro de software e formando em Engenharia de Computação na UFPA com sólida atuação em "
                "desenvolvimento backend, microsserviços, automação MCP e computação em nuvem (AWS). "
                "Experiência prática na manutenção e otimização de APIs em Python (FastAPI) e sistemas em Rust, "
                "depuração de vazamentos de memória em aplicações multiplataforma (Flutter/Dart), "
                "criação de dashboards analíticos com Dash e ferramentas visuais de alta performance (120 FPS em Canvas)."
            )
        else:
            summary_text = (
                "Software engineer and Computer Engineering senior at UFPA with strong hands-on experience in "
                "backend development, microservices, MCP automation, and cloud computing (AWS). "
                "Practical expertise maintaining and optimizing Python APIs (FastAPI) and Rust systems, "
                "resolving memory leaks in cross-platform apps (Flutter/Dart), building interactive dashboards "
                "with Dash, and developing high-performance browser graphics (120 FPS Canvas)."
            )
        p(summary_text)

        # Experience
        section("Experiência Profissional" if lang == "pt" else "Professional Experience")
        if lang == "pt":
            p("Estagiário em Engenharia de Software · LaPS / UFPA (Projeto DMóvel)", "CVJobTitle")
            p("Março de 2026 — Setembro de 2026 | Belém, PA | Carga Horária: 360 horas", "CVJobMeta")
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
                "• Gestão de branches de código via Git e preparação de material técnico demonstrativo para o evento "
                "SITEC 2026.",
                "CVBullet",
            )
            p(
                "• Desempenho técnico avaliado com nota máxima 10,0 (Conceito Excelente) pelo orientador permanente.",
                "CVBullet",
            )
        else:
            p("Software Engineering Intern · LaPS / UFPA (DMóvel Assistive Technology)", "CVJobTitle")
            p("March 2026 — September 2026 | Belém, Brazil | 360 Hours", "CVJobMeta")
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
                "• Diagnosed and resolved memory leaks and runtime performance bottlenecks in the production mobile "
                "app.",
                "CVBullet",
            )
            p(
                "• Managed Git branch workflows and produced technical demonstration materials for the SITEC 2026 "
                "conference.",
                "CVBullet",
            )
            p("• Graded 10.0/10 (Concept Excellent) by the permanent lab advisor.", "CVBullet")

        # Projects
        section("Projetos Relevantes" if lang == "pt" else "Selected Projects")
        for project in projects[:4]:
            d = project[lang]
            tags_str = ", ".join(project.get("tags", [])[:5])
            p(f'<b>{escape(project["name"])}</b> ({tags_str})', "CVJobTitle")
            p(escape(d["summary"]), "CVBody")
            demo_base = site["url"] + ("/" if lang == "pt" else "/en/") + "projects/" + project["id"] + "/"
            demo_url = project.get("demo") or demo_base
            code_base = site["github"] + "/" + project.get("repo", "").split("/")[-1]
            code_url = project.get("github") or code_base
            demo_display = demo_url.removeprefix("https://")
            code_display = code_url.removeprefix("https://")
            p(
                f'• Link: <link href="{demo_url}">{demo_display}</link> | '
                f'Código: <link href="{code_url}">{code_display}</link>',
                "CVBullet",
            )

        # Technical Skills
        section("Competências Técnicas" if lang == "pt" else "Technical Skills")
        if lang == "pt":
            p("<b>Linguagens:</b> Python, Rust, JavaScript, TypeScript, Dart, C, SQL, HTML5, CSS3")
            p("<b>Backend & Nuvem:</b> FastAPI, AWS, Docker, REST APIs, MCP (Model Context Protocol), Dash")
            p("<b>Sistemas & Ferramentas:</b> Git, GitHub Actions, Linux, ESP32, Canvas 2D, Three.js, WebSockets")
        else:
            p("<b>Languages:</b> Python, Rust, JavaScript, TypeScript, Dart, C, SQL, HTML5, CSS3")
            p("<b>Backend & Cloud:</b> FastAPI, AWS, Docker, REST APIs, MCP (Model Context Protocol), Dash")
            p("<b>Systems & Tools:</b> Git, GitHub Actions, Linux, ESP32, Canvas 2D, Three.js, WebSockets")

        # Education
        section("Formação Acadêmica" if lang == "pt" else "Education")
        if lang == "pt":
            p("<b>Bacharelado em Engenharia de Computação</b> — Universidade Federal do Pará (UFPA)", "CVJobTitle")
            p("Bacharelado em andamento · Previsão de conclusão: 2026 | Belém, PA", "CVJobMeta")
            p(
                "• Destaque Acadêmico: Nota máxima (100) em Projetos de Hardware, Engenharia de Software, "
                "Banco de Dados e Computação em Nuvem.",
                "CVBullet",
            )
            p("• Idiomas: Português (Nativo) | Inglês (Avançado)", "CVBullet")
        else:
            p("<b>Bachelor of Science in Computer Engineering</b> — Universidade Federal do Pará (UFPA)", "CVJobTitle")
            p("Bachelor's degree in progress · Expected graduation: 2026 | Belém, Brazil", "CVJobMeta")
            p(
                "• Academic Honors: Maximum grade (100/100) in Hardware Design, Software Engineering, "
                "Databases, and Cloud Computing.",
                "CVBullet",
            )
            p("• Languages: Portuguese (Native) | English (Advanced)", "CVBullet")

        target_file = output / main_name
        doc = SimpleDocTemplate(
            str(target_file),
            pagesize=A4,
            rightMargin=36,
            leftMargin=36,
            topMargin=28,
            bottomMargin=28,
            title=f'{site["name"]} | {"Currículo" if lang == "pt" else "Resume"}',
            author=site["name"],
        )
        doc.build(story)

        # Compatibility copies
        if lang == "pt":
            shutil.copyfile(target_file, output / "crv.pdf")
        else:
            shutil.copyfile(target_file, output / "cv-joao-silva-neto-en.pdf")

    # Also keep ROOT / docs in sync
    root_docs = Path(__file__).resolve().parent.parent / "docs"
    if root_docs.exists() and output != root_docs:
        for f in output.glob("*.pdf"):
            shutil.copyfile(f, root_docs / f.name)
