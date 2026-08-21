"""
Script para gerar imagem Open Graph (og-cover.jpg) de 1200x630 px em alta resolução
para compartilhamento em redes sociais e apps de mensagens (WhatsApp, LinkedIn, Twitter, Telegram).
"""

import base64
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

REPO_DIR = Path(__file__).resolve().parent
AVATAR_PATH = REPO_DIR / "assets" / "images" / "hero-avatar.jpg"
OUTPUT_PATH = REPO_DIR / "assets" / "images" / "og-cover.jpg"

def generate_og_image():
    if not AVATAR_PATH.exists():
        raise FileNotFoundError(f"Foto não encontrada em {AVATAR_PATH}")

    avatar_b64 = base64.b64encode(AVATAR_PATH.read_bytes()).decode("utf-8")
    avatar_src = f"data:image/jpeg;base64,{avatar_b64}"

    html_content = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            width: 1200px;
            height: 630px;
            overflow: hidden;
            background-color: #030712;
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            color: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }}

        /* Background grid e gradientes dinâmicos */
        .bg-canvas {{
            position: absolute;
            inset: 0;
            background: 
                radial-gradient(circle at 15% 25%, rgba(59, 130, 246, 0.25) 0%, transparent 45%),
                radial-gradient(circle at 85% 75%, rgba(6, 182, 212, 0.20) 0%, transparent 45%),
                radial-gradient(circle at 50% 100%, rgba(139, 92, 246, 0.18) 0%, transparent 50%),
                linear-gradient(135deg, #030712 0%, #0b1329 50%, #030712 100%);
        }}

        .grid-pattern {{
            position: absolute;
            inset: 0;
            background-image: 
                linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
            background-size: 40px 40px;
            mask-image: radial-gradient(circle at center, black 65%, transparent 95%);
            -webkit-mask-image: radial-gradient(circle at center, black 65%, transparent 95%);
        }}

        /* Glow superior */
        .top-glow-bar {{
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #3b82f6, #06b6d4, #8b5cf6, #3b82f6);
            box-shadow: 0 0 20px rgba(6, 182, 212, 0.8);
        }}

        /* Card Container Principal */
        .card-container {{
            position: relative;
            z-index: 10;
            width: 1080px;
            height: 510px;
            background: rgba(15, 23, 42, 0.78);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 28px;
            box-shadow: 
                0 25px 60px -15px rgba(0, 0, 0, 0.85),
                0 0 40px rgba(59, 130, 246, 0.18),
                inset 0 1px 1px rgba(255, 255, 255, 0.15);
            display: flex;
            align-items: center;
            padding: 50px 60px;
            gap: 55px;
        }}

        /* Coluna da Foto / Avatar */
        .avatar-section {{
            position: relative;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
        }}

        .avatar-glow {{
            position: absolute;
            inset: -8px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3b82f6, #06b6d4, #8b5cf6);
            filter: blur(14px);
            opacity: 0.8;
        }}

        .avatar-ring {{
            position: relative;
            width: 250px;
            height: 250px;
            border-radius: 50%;
            padding: 5px;
            background: linear-gradient(135deg, #38bdf8 0%, #3b82f6 50%, #818cf8 100%);
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6);
        }}

        .avatar-img {{
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
            object-position: center top;
            background: #1e293b;
            display: block;
        }}

        /* Badge de status sobre o avatar */
        .online-badge {{
            position: absolute;
            bottom: 8px;
            right: 20px;
            background: #0f172a;
            border: 2px solid #10b981;
            border-radius: 20px;
            padding: 4px 12px;
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            font-weight: 700;
            color: #34d399;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        }}

        .online-dot {{
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #10b981;
            box-shadow: 0 0 8px #10b981;
        }}

        /* Coluna de Conteúdo / Informações */
        .info-section {{
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }}

        .category-badge {{
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(59, 130, 246, 0.16);
            border: 1px solid rgba(59, 130, 246, 0.4);
            padding: 6px 14px;
            border-radius: 100px;
            font-size: 14px;
            font-weight: 700;
            color: #60a5fa;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            width: fit-content;
            margin-bottom: 12px;
        }}

        .name-title {{
            font-size: 48px;
            font-weight: 800;
            color: #ffffff;
            line-height: 1.1;
            margin-bottom: 6px;
            letter-spacing: -0.8px;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
        }}

        .role-title {{
            font-size: 24px;
            font-weight: 600;
            color: #38bdf8;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 10px;
        }}

        .role-title span.sep {{
            color: #64748b;
            font-size: 18px;
        }}

        .role-title span.inst {{
            color: #94a3b8;
            font-size: 20px;
            font-weight: 500;
        }}

        .bio-text {{
            font-size: 17px;
            color: #cbd5e1;
            line-height: 1.5;
            margin-bottom: 22px;
            font-weight: 400;
        }}

        /* Tags Tecnológicas */
        .tags-container {{
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 22px;
        }}

        .tech-pill {{
            background: rgba(30, 41, 59, 0.85);
            border: 1px solid rgba(255, 255, 255, 0.12);
            color: #e2e8f0;
            font-family: 'JetBrains Mono', monospace;
            font-size: 13px;
            font-weight: 600;
            padding: 5px 12px;
            border-radius: 8px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        }}

        .tech-pill.highlight {{
            background: rgba(6, 182, 212, 0.20);
            border-color: rgba(6, 182, 212, 0.5);
            color: #22d3ee;
        }}

        /* Rodapé / Link */
        .card-footer {{
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-top: 16px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
        }}

        .url-badge {{
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 15px;
            font-weight: 600;
            color: #38bdf8;
        }}

        .location-badge {{
            font-size: 14px;
            color: #94a3b8;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 6px;
        }}
    </style>
</head>
<body>
    <div class="bg-canvas"></div>
    <div class="grid-pattern"></div>
    <div class="top-glow-bar"></div>

    <div class="card-container">
        <!-- Avatar Foto Real -->
        <div class="avatar-section">
            <div class="avatar-glow"></div>
            <div class="avatar-ring">
                <img src="{avatar_src}" alt="João Silva Neto" class="avatar-img">
            </div>
            <div class="online-badge">
                <div class="online-dot"></div>
                DISPONÍVEL
            </div>
        </div>

        <!-- Informações e Destaques -->
        <div class="info-section">
            <div class="category-badge">
                <span>🎓 UFPA • Engenharia de Computação</span>
            </div>

            <h1 class="name-title">João Silva Neto</h1>
            
            <div class="role-title">
                <span>Engenheiro da Computação</span>
                <span class="sep">•</span>
                <span class="inst">Software & Infra</span>
            </div>

            <p class="bio-text">
                Desenvolvimento de software de alta performance, APIs modernas, dados, automação e infraestrutura DevOps.
            </p>

            <div class="tags-container">
                <span class="tech-pill highlight">Python</span>
                <span class="tech-pill highlight">FastAPI / Flask</span>
                <span class="tech-pill">Docker & K8s</span>
                <span class="tech-pill">DevOps & CI/CD</span>
                <span class="tech-pill">PostgreSQL</span>
                <span class="tech-pill">IA & LLMs</span>
            </div>

            <div class="card-footer">
                <div class="url-badge">
                    <span>🌐 joaosnet.github.io</span>
                </div>
                <div class="location-badge">
                    <span>📍 Belém, Pará — Brasil</span>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
"""

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(
            viewport={"width": 1200, "height": 630},
            device_scale_factor=1.0,
        )
        page.set_content(html_content, wait_until="networkidle")
        page.wait_for_timeout(1000)  # Aguarda carregamento completo das fontes Google
        
        OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(OUTPUT_PATH), type="jpeg", quality=92)
        browser.close()

    file_size_kb = OUTPUT_PATH.stat().st_size / 1024
    print(f"[OK] Nova imagem og-cover.jpg gerada com sucesso em: {OUTPUT_PATH}")
    print(f"Dimensoes: 1200x630 px | Tamanho: {file_size_kb:.1f} KB")

if __name__ == "__main__":
    generate_og_image()
