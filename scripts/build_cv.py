"""Generate concise, selectable bilingual PDFs using only documented profile facts."""

from html import escape
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate


def generate_cvs(output, site, projects):
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    family = "Helvetica"
    # ReportLab uses the variable font's default thin master; standard PDF fonts
    # keep small résumé text crisp and accessible in viewers and print.
    for lang, name in (("pt", "crv.pdf"), ("en", "cv-joao-silva-neto-en.pdf")):
        profile = site["profile"][lang]
        styles = getSampleStyleSheet()
        styles.add(
            ParagraphStyle(
                name="Text",
                fontName=family,
                fontSize=10,
                leading=14,
                spaceAfter=7,
                textColor=colors.HexColor("#263447"),
            )
        )
        styles.add(
            ParagraphStyle(
                name="Section",
                fontName="Helvetica-Bold",
                fontSize=11,
                leading=15,
                spaceBefore=12,
                spaceAfter=7,
                textColor=colors.HexColor("#075985"),
            )
        )
        styles.add(ParagraphStyle(name="Name", fontName="Helvetica-Bold", fontSize=25, leading=30, spaceAfter=8))
        story = []

        def paragraph(text, style="Text"):
            story.append(Paragraph(text, styles[style]))

        paragraph(escape(site["name"]), "Name")
        paragraph(escape(profile["title"]))
        paragraph(escape(profile["availability"]) + " | " + escape(profile["location"]))
        paragraph(escape(site["email"]))
        paragraph(
            f'<link href="{site["url"]}">joaosnet.github.io</link> | '
            f'<link href="{site["github"]}">GitHub</link> | '
            f'<link href="{site["linkedin"]}">LinkedIn</link> | '
            f'<link href="{site["lattes"]}">Lattes</link>'
        )
        paragraph("Perfil" if lang == "pt" else "Profile", "Section")
        paragraph(escape(profile["about"]))
        paragraph("Formação" if lang == "pt" else "Education", "Section")
        education = (
            profile["education_detail"].replace(", conforme currículo", "").replace(", as stated in my résumé", "")
        )
        paragraph(escape(profile["education"]) + "<br/>" + escape(education))
        paragraph("Competências" if lang == "pt" else "Skills", "Section")
        paragraph("Python, FastAPI, REST APIs, JavaScript/TypeScript, Flutter, Docker, Git, ESP32, Rust.")
        paragraph("Projetos selecionados" if lang == "pt" else "Selected projects", "Section")
        for project in projects[:3]:
            data = project[lang]
            paragraph("<b>" + escape(project["name"]) + "</b> - " + escape(data["status"]))
            paragraph(escape(data["summary"]))
            url = site["url"] + ("/" if lang == "pt" else "/en/") + "projects/" + project["id"] + "/"
            paragraph(f'<link href="{url}">{escape(url.removeprefix("https://"))}</link>')
        paragraph("Experiência" if lang == "pt" else "Experience", "Section")
        paragraph(
            "Projetos acadêmicos e pessoais desde 2022; IoT desde 2023; integração de APIs e automação desde 2024."
            if lang == "pt"
            else (
                "Academic and personal projects since 2022; IoT since 2023; API integrations and automation since 2024."
            )
        )
        document = SimpleDocTemplate(
            str(output / name),
            pagesize=A4,
            rightMargin=42,
            leftMargin=42,
            topMargin=35,
            bottomMargin=35,
            title=site["name"] + " | " + profile["title"],
            author=site["name"],
        )
        document.build(story)
