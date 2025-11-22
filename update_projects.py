"""
update_projects.py
Automação para gerar as entradas de projetos no index.html
- Inclui imagem de pré-visualização se existir no repositório (busca por arquivos comuns)
- Inclui a data de atualização do repositório em cada card
- Atualiza o ano do copyright e insere/atualiza a tag "Última atualização" no rodapé

Recomendações:
- Defina a variável de ambiente `GITHUB_TOKEN` para evitar limites de rate limit do GitHub API.
    Exemplo no Windows PowerShell: `$env:GITHUB_TOKEN = 'seu_token_aqui'`
    Ou no Linux/macOS: `export GITHUB_TOKEN='seu_token_aqui'`

Uso: `python update_projects.py`
"""

try:
    import requests

    _HAS_REQUESTS = True
except Exception:
    import urllib.request
    import urllib.error

    _HAS_REQUESTS = False
import os
from datetime import datetime
from urllib.parse import unquote
import re
import json
import subprocess

# Global set to track downloaded images that need to be committed
downloaded_images = set()


def get_api_token():
    """Return the best available token, preferring PRIVATE_REPOS_TOKEN."""
    return os.environ.get("PRIVATE_REPOS_TOKEN") or os.environ.get("GITHUB_TOKEN")


def fetch_projects():
    """Fetch repositories from GitHub API.
    Tries authenticated endpoint first (public + private + collaborator + org), then falls back to public only.
    Also explicitly fetches repos from configured featured organizations.
    Returns a combined list of all accessible repositories.
    """
    token = get_api_token()
    repos = []

    # Try authenticated endpoint first if token is available
    if token:
        headers_auth = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json",
        }
        # Include owner, collaborator, and organization_member affiliations to get all repos
        url_auth = "https://api.github.com/user/repos?visibility=all&sort=updated&per_page=100&affiliation=owner,collaborator,organization_member"
        try:
            if _HAS_REQUESTS:
                response = requests.get(url_auth, headers=headers_auth, timeout=10)
                if response.status_code == 200:
                    repos = response.json()
                    print(
                        f"Successfully fetched {len(repos)} repos (owner + collaborator + org) via authenticated endpoint"
                    )

                    # Debug: breakdown by type
                    owner_repos = [
                        r
                        for r in repos
                        if r.get("owner", {}).get("login") == "joaosnet"
                    ]
                    org_repos = [
                        r
                        for r in repos
                        if r.get("owner", {}).get("login") != "joaosnet"
                    ]
                    print(f"  - Owner repos: {len(owner_repos)}")
                    print(f"  - Organization repos: {len(org_repos)}")
                    if org_repos:
                        org_names = set(
                            r.get("owner", {}).get("login") for r in org_repos
                        )
                        print(f"    Organizations: {', '.join(org_names)}")
                else:
                    print(
                        f"Authenticated endpoint returned {response.status_code}; falling back to public repos..."
                    )
            else:
                req = urllib.request.Request(url_auth, headers=headers_auth)
                with urllib.request.urlopen(req, timeout=10) as r:
                    repos = json.loads(r.read().decode("utf-8"))
                    print(
                        f"Successfully fetched {len(repos)} repos (owner + collaborator + org) via authenticated endpoint"
                    )

                    owner_repos = [
                        r
                        for r in repos
                        if r.get("owner", {}).get("login") == "joaosnet"
                    ]
                    org_repos = [
                        r
                        for r in repos
                        if r.get("owner", {}).get("login") != "joaosnet"
                    ]
                    print(f"  - Owner repos: {len(owner_repos)}")
                    print(f"  - Organization repos: {len(org_repos)}")
                    if org_repos:
                        org_names = set(
                            r.get("owner", {}).get("login") for r in org_repos
                        )
                        print(f"    Organizations: {', '.join(org_names)}")
        except urllib.error.HTTPError as e:
            print(
                f"Authenticated endpoint error ({e.code}); falling back to public repos..."
            )
        except Exception as e:
            print(
                f"Error fetching from authenticated endpoint: {e}; falling back to public repos..."
            )

    # Fallback to public endpoint if authenticated endpoint failed
    if not repos:
        headers_public = {"Accept": "application/vnd.github.v3+json"}
        url_public = (
            "https://api.github.com/users/joaosnet/repos?sort=updated&per_page=100"
        )
        try:
            if _HAS_REQUESTS:
                response = requests.get(url_public, headers=headers_public, timeout=10)
                if response.status_code == 200:
                    repos = response.json()
                    print(
                        f"Successfully fetched {len(repos)} public repos via public endpoint"
                    )
                else:
                    print(f"Error fetching public repos: {response.status_code}")
            else:
                req = urllib.request.Request(url_public, headers=headers_public)
                with urllib.request.urlopen(req, timeout=10) as r:
                    repos = json.loads(r.read().decode("utf-8"))
                    print(
                        f"Successfully fetched {len(repos)} public repos via public endpoint"
                    )
        except Exception as e:
            print(f"Error fetching public repos: {e}")

    if not repos:
        print("Could not fetch repos from any endpoint")

    return repos


def generate_project_html(project, is_last=False, position="left"):
    name = project["name"]
    description = project["description"]
    html_url = project["html_url"]
    image = project.get("preview_image")
    updated_at = project.get("updated_at")
    is_private = project.get("private", False)

    # format updated_at if present
    updated_str = ""
    updated_iso = ""
    if updated_at:
        try:
            dt = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
            updated_str = dt.strftime("%d/%m/%Y")
            updated_iso = dt.isoformat()
        except Exception:
            updated_str = updated_at

    # Timeline style HTML with image
    img_html = ""
    if image:
        img_html = f'<img src="{image}" alt="{name} preview" style="width:100%; aspect-ratio:1.91/1; object-fit:cover; border-radius:8px; margin-bottom:16px;"/>'

    # Private vs Public display logic
    if is_private:
        title_html = f"""<span style="color:var(--primary); border-bottom:2px solid var(--primary); cursor:default;">
                                    {name} <i class="fas fa-lock" style="font-size:0.7em; vertical-align: middle; margin-left:4px;" title="Projeto Privado"></i>
                                </span>"""
        button_html = """<span style="display:inline-block; padding:8px 16px; background:var(--glass-bg); color:var(--text-gray); border-radius:6px; font-size:0.9rem; font-weight:600; border:1px solid var(--border-light); cursor:default;">
                                Privado
                            </span>"""
    else:
        title_html = f'''<a href="{html_url}" target="_blank" style="color:var(--primary); text-decoration:none; border-bottom:2px solid var(--primary);">
                                    {name}
                                </a>'''
        button_html = f'''<a href="{html_url}" target="_blank" style="display:inline-block; padding:8px 16px; background:var(--primary); color:#fff; text-decoration:none; border-radius:6px; font-size:0.9rem; font-weight:600; transition:background 0.2s; border:1px solid var(--primary);">
                                Ver no GitHub →
                            </a>'''

    # Content card styles
    card_style = "background:var(--bg-card); border:1px solid var(--border-light); border-radius:8px; padding:20px;"

    if position == "left":
        # Content on LEFT side, dot on CENTER
        html = f"""
                    <div class="timeline-item-left" style="display:grid; grid-template-columns:1fr 60px 1fr; gap:24px; padding-bottom:40px; position:relative; align-items:flex-start;">
                        <!-- Content Left -->
                        <div style="{card_style} text-align:right;">
                            <!-- Date badge -->
                            <div style="display:inline-block; background:var(--dark); padding:4px 12px; border-radius:16px; margin-bottom:8px; border:1px solid var(--border-light);">
                                <time datetime="{updated_iso}" style="font-size:0.85rem; color:var(--text-gray); font-weight:600;">{updated_str}</time>
                            </div>
                            
                            <!-- Image -->
                            <div style="margin-bottom:12px;">
                                {img_html}
                            </div>
                            
                            <!-- Project info -->
                            <h3 style="margin:0 0 8px 0; font-size:1.2rem; color:var(--primary); word-break:break-word;">
                                {title_html}
                            </h3>
                            <p style="margin:0 0 12px 0; color:var(--text-gray); font-size:0.95rem; line-height:1.5;">{description}</p>
                            
                            <!-- Button -->
                            {button_html}
                        </div>
                        
                        <!-- Timeline Dot (CENTER) -->
                        <div style="display:flex; flex-direction:column; align-items:center; min-width:60px;">
                            <div style="width:16px; height:16px; background:var(--primary); border:4px solid var(--dark); border-radius:50%; position:relative; z-index:2;"></div>
                        </div>
                        
                        <!-- Empty space on RIGHT -->
                        <div></div>
                    </div>"""
    else:
        # Content on RIGHT side, dot on CENTER
        html = f"""
                    <div class="timeline-item-right" style="display:grid; grid-template-columns:1fr 60px 1fr; gap:24px; padding-bottom:40px; position:relative; align-items:flex-start;">
                        <!-- Empty space on LEFT -->
                        <div></div>
                        
                        <!-- Timeline Dot (CENTER) -->
                        <div style="display:flex; flex-direction:column; align-items:center; min-width:60px;">
                            <div style="width:16px; height:16px; background:var(--primary); border:4px solid var(--dark); border-radius:50%; position:relative; z-index:2;"></div>
                        </div>
                        
                        <!-- Content Right -->
                        <div style="{card_style} text-align:left;">
                            <!-- Date badge -->
                            <div style="display:inline-block; background:var(--dark); padding:4px 12px; border-radius:16px; margin-bottom:8px; border:1px solid var(--border-light);">
                                <time datetime="{updated_iso}" style="font-size:0.85rem; color:var(--text-gray); font-weight:600;">{updated_str}</time>
                            </div>
                            
                            <!-- Image -->
                            <div style="margin-bottom:12px;">
                                {img_html}
                            </div>
                            
                            <!-- Project info -->
                            <h3 style="margin:0 0 8px 0; font-size:1.2rem; color:var(--primary); word-break:break-word;">
                                {title_html}
                            </h3>
                            <p style="margin:0 0 12px 0; color:var(--text-gray); font-size:0.95rem; line-height:1.5;">{description}</p>
                            
                            <!-- Button -->
                            {button_html}
                        </div>
                    </div>"""

    return html


def download_image_for_private_repo(owner, repo_name, img_path, token):
    """
    For private repos, download the image and save it locally in the portfolio.
    Returns the relative path for the downloaded image.

    Note: Downloaded images are tracked in a set to be committed to git later.
    """
    global downloaded_images  # Track which images were downloaded

    try:
        if not token:
            return None

        # Get default branch
        default_branch = get_repo_default_branch(owner, repo_name, token)

        # Download the image from raw.githubusercontent.com
        download_url = f"https://raw.githubusercontent.com/{owner}/{repo_name}/{default_branch}/{img_path}"

        # Create local directory for downloaded images
        local_dir = "assets/project-images"
        if not os.path.exists(local_dir):
            os.makedirs(local_dir)

        # Generate safe filename from repo and image
        safe_repo_name = f"{owner}_{repo_name}".replace("/", "_")
        # Remove URL encoding AND spaces, convert to lowercase
        safe_img_name = (
            os.path.basename(img_path).replace("%20", "_").replace(" ", "_").lower()
        )
        local_filename = f"{safe_repo_name}_{safe_img_name}"
        local_path = os.path.join(local_dir, local_filename)

        # Download if not already exists
        if not os.path.exists(local_path):
            try:
                if _HAS_REQUESTS:
                    response = requests.get(
                        download_url,
                        headers={"Authorization": f"token {token}"},
                        timeout=10,
                    )
                    if response.status_code == 200:
                        with open(local_path, "wb") as f:
                            f.write(response.content)
                        print(f"      ✓ Imagem baixada localmente: {local_filename}")
                        # Track this file for git commit
                        downloaded_images.add(local_path)
                        return f"/{local_dir}/{local_filename}"
                    else:
                        print(
                            f"      ⚠ Falha ao baixar imagem: status {response.status_code}"
                        )
                        return None
                else:
                    req = urllib.request.Request(
                        download_url, headers={"Authorization": f"token {token}"}
                    )
                    with urllib.request.urlopen(req, timeout=10) as r:
                        with open(local_path, "wb") as f:
                            f.write(r.read())
                        print(f"      ✓ Imagem baixada localmente: {local_filename}")
                        # Track this file for git commit
                        downloaded_images.add(local_path)
                        return f"/{local_dir}/{local_filename}"
            except Exception as e:
                print(f"      ⚠ Erro ao baixar imagem: {str(e)[:50]}")
                return None
        else:
            # Already exists locally - still track it for consistency
            downloaded_images.add(local_path)
            return f"/{local_dir}/{local_filename}"
    except Exception as e:
        print(f"      ⚠ Erro processando imagem privada: {str(e)[:50]}")
        return None


def get_repo_default_branch(owner, repo_name, token):
    """Get the default branch of a repository using GitHub API."""
    try:
        headers = {"Accept": "application/vnd.github.v3+json"}
        if token:
            headers["Authorization"] = f"token {token}"

        url = f"https://api.github.com/repos/{owner}/{repo_name}"

        if _HAS_REQUESTS:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                return data.get("default_branch", "main")
        else:
            try:
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=10) as r:
                    data = json.loads(r.read().decode("utf-8"))
                    return data.get("default_branch", "main")
            except Exception:
                pass
    except Exception:
        pass

    return "main"  # Default fallback


def find_image_in_readme(owner, repo_name, token, is_private=False):
    """Extract image URL from README file.
    Looks for markdown images: ![alt](url) or ![alt][ref] or HTML <img> tags.
    Prioritizes images that are not badges/shields.
    Returns the first suitable image URL found, or None.
    """
    try:
        if not token:
            print("    ⚠ Token não disponível para ler README privado")
            return None

        # Try to fetch README content - first try raw format
        headers = {
            "Accept": "application/vnd.github.v3.raw",
            "Authorization": f"token {token}",
        }
        url = f"https://api.github.com/repos/{owner}/{repo_name}/readme"

        readme_content = None
        try:
            if _HAS_REQUESTS:
                response = requests.get(url, headers=headers, timeout=10)
                if response.status_code == 200:
                    readme_content = response.text
                    print(
                        f"    ℹ README carregado com sucesso ({len(readme_content)} chars)"
                    )
                elif response.status_code == 404:
                    print("    ℹ README não encontrado")
                    return None
                else:
                    print(f"    ⚠ README fetch retornou {response.status_code}")
                    return None
            else:
                try:
                    req = urllib.request.Request(url, headers=headers)
                    with urllib.request.urlopen(req, timeout=10) as r:
                        readme_content = r.read().decode("utf-8")
                        print(
                            f"    ℹ README carregado com sucesso ({len(readme_content)} chars)"
                        )
                except urllib.error.HTTPError as e:
                    if e.code == 404:
                        print("    ℹ README não encontrado")
                    else:
                        print(f"    ⚠ README HTTP error: {e.code}")
                    return None
        except Exception as e:
            print(f"    ⚠ README fetch error: {str(e)[:70]}")
            return None

        if not readme_content:
            print("    ℹ README vazio")
            return None

        # Extract images using regex
        # Pattern 1: ![alt](url) - Markdown images
        markdown_pattern = r"!\[([^\]]*)\]\(([^)]+)\)"
        matches = re.findall(markdown_pattern, readme_content)

        # Pattern 2: <img src="url" ...> - HTML images
        html_pattern = r'<img\s+[^>]*src=["\']([^"\']+)["\'][^>]*(?:alt=["\']([^"\']*)["\'])?[^>]*>'
        html_matches = re.findall(html_pattern, readme_content)
        # Convert HTML matches to same format as markdown (alt, url)
        # For HTML, url comes first, alt comes second or might be empty
        html_matches_converted = [
            (html_match[1] if len(html_match) > 1 else "", html_match[0])
            for html_match in html_matches
        ]

        # Combine both patterns
        matches = matches + html_matches_converted

        if not matches:
            print("    ℹ Nenhuma imagem encontrada no README")
            return None

        print(f"    ℹ Encontradas {len(matches)} imagens no README, filtrando...")

        for idx, (alt_text, img_url) in enumerate(matches):
            # Debug: mostrar padrão da URL
            print(f"      [img {idx + 1}] alt='{alt_text}' url='{img_url}'")

            # Skip known badge/status badges
            if any(
                skip in img_url.lower()
                for skip in [
                    "shields.io",
                    "badge",
                    "codecov",
                    "travis",
                    "circleci",
                    "github.com/.*/workflows",
                    ".github/workflows",
                ]
            ):
                print("        → badge detectado, pulando")
                continue

            # IMPORTANT: Skip avatars.githubusercontent.com - these are user/org avatars, not content images
            if "avatars.githubusercontent.com" in img_url:
                print("        → avatar do GitHub, pulando")
                continue

            # Very small common badges (by checking alt text)
            if alt_text.lower() in [
                "build",
                "status",
                "coverage",
                "license",
                "version",
                "downloads",
            ]:
                print("        → alt text é um badge, pulando")
                continue

            # Skip single-line badges at the start (usually status badges)
            if len(alt_text) < 20 and alt_text.isupper():
                print("        → alt text muito curto e maiúsculo, pulando")
                continue

            # Ensure URL is absolute or can be converted to absolute
            if img_url.startswith("http"):
                print("        ✓ URL absoluta, aceitando!")
                print(f"  ✓ Imagem encontrada no README: {img_url[:60]}...")
                return img_url
            elif img_url.startswith("/"):
                # Absolute path from repo root
                if is_private:
                    # Download locally for private repos
                    img_path = img_url[1:]  # Remove leading /
                    local_img_url = download_image_for_private_repo(
                        owner, repo_name, img_path, token
                    )
                    if local_img_url:
                        # Successfully downloaded and saved locally
                        print("        ✓ Caminho absoluto baixado localmente!")
                        print(
                            f"  ✓ Imagem encontrada no README (salva localmente): {local_img_url[:60]}..."
                        )
                        return local_img_url
                    else:
                        # Fallback to raw.githubusercontent.com if download fails
                        default_branch = get_repo_default_branch(owner, repo_name, token)
                        img_url_full = f"https://raw.githubusercontent.com/{owner}/{repo_name}/{default_branch}{img_url}"
                        print("        ✓ Caminho absoluto, fallback para raw!")
                        print(
                            f"  ✓ Imagem encontrada no README (caminho absoluto): {img_url_full[:60]}..."
                        )
                        return img_url_full
                else:
                    # Public repo, use raw.githubusercontent.com
                    default_branch = get_repo_default_branch(owner, repo_name, token)
                    img_url_full = f"https://raw.githubusercontent.com/{owner}/{repo_name}/{default_branch}{img_url}"
                    print("        ✓ Caminho absoluto, aceitando!")
                    print(
                        f"  ✓ Imagem encontrada no README (caminho absoluto): {img_url_full[:60]}..."
                    )
                    return img_url_full
            elif not img_url.startswith("."):
                # Relative path (without leading ./ or ../)
                # For private repos, download the image locally
                img_url_decoded = unquote(img_url)
                local_img_url = download_image_for_private_repo(
                    owner, repo_name, img_url_decoded, token
                )

                if local_img_url:
                    # Successfully downloaded and saved locally
                    print("        ✓ Caminho relativo baixado localmente!")
                    print(
                        f"  ✓ Imagem encontrada no README (salva localmente): {local_img_url[:60]}..."
                    )
                    return local_img_url
                else:
                    # Fallback to raw.githubusercontent.com if download fails
                    default_branch = get_repo_default_branch(owner, repo_name, token)
                    img_url_full = f"https://raw.githubusercontent.com/{owner}/{repo_name}/{default_branch}/{img_url_decoded}"
                    print("        ✓ Caminho relativo simples, aceitando!")
                    print(
                        f"  ✓ Imagem encontrada no README (caminho relativo): {img_url_full[:60]}..."
                    )
                    return img_url_full
            else:
                print("        → URL relativa complexa (../ ou ./), pulando")

        print("    ℹ Nenhuma imagem válida encontrada após filtrar")
        return None

    except Exception as e:
        print(f"  ⚠ Erro buscando imagens no README: {str(e)[:70]}")
        return None


def find_repo_preview_image(repo):
    """Find the best preview image for a repository.

    Strategy (in order):
    1. Try to find image in README (real content image)
    2. Use custom social preview if available (opengraph or repository-images)
    3. Use organization avatar as last resort

    Returns tuple: (image_url, source_name) or (None, None) if not found.
    """
    try:
        owner = repo.get("owner", {}).get("login")
        name = repo.get("name")

        if not owner or not name:
            print("  ⚠ Não conseguiu determinar owner/name")
            return None, None

        token = get_api_token()
        if not token:
            print("  ⚠ Sem token disponível")
            return None, None

        print(f"  ℹ Buscando imagem para {owner}/{name}...")

        # STEP 1: Try README first - prioritize real content images
        readme_image = find_image_in_readme(owner, name, token, repo.get("private", False))
        if readme_image:
            print("  ✓ Usando imagem do README")
            return readme_image, "readme_image"

        # STEP 2: Try GraphQL for custom social preview
        print("    Buscando social preview...")
        graphql_query = """
        query($owner: String!, $name: String!) {
          repository(owner: $owner, name: $name) {
            openGraphImageUrl
          }
        }
        """

        url = "https://api.github.com/graphql"
        headers = {
            "Authorization": f"token {token}",
            "Content-Type": "application/json",
        }

        payload = {"query": graphql_query, "variables": {"owner": owner, "name": name}}

        org_avatar = repo.get("owner", {}).get("avatar_url")

        if _HAS_REQUESTS:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "data" in data and data["data"] and "repository" in data["data"]:
                    repo_data = data["data"]["repository"]
                    if repo_data:
                        og_url = repo_data.get("openGraphImageUrl")
                        if og_url:
                            # Check if it's a custom social preview (not just avatar)
                            is_custom_preview = (
                                "opengraph.githubassets.com" in og_url
                                or "repository-images.githubusercontent.com" in og_url
                            )

                            if is_custom_preview:
                                print("  ✓ Usando custom social preview")
                                return og_url, "openGraphImageUrl"
                            elif org_avatar:
                                print("  ✓ Usando avatar da organização")
                                return org_avatar, "org_avatar"
        else:
            req = urllib.request.Request(
                url, headers=headers, data=json.dumps(payload).encode("utf-8")
            )
            try:
                with urllib.request.urlopen(req, timeout=10) as r:
                    data = json.loads(r.read().decode("utf-8"))
                    if "data" in data and data["data"] and "repository" in data["data"]:
                        repo_data = data["data"]["repository"]
                        if repo_data:
                            og_url = repo_data.get("openGraphImageUrl")
                            if og_url:
                                is_custom_preview = (
                                    "opengraph.githubassets.com" in og_url
                                    or "repository-images.githubusercontent.com"
                                    in og_url
                                )

                                if is_custom_preview:
                                    print("  ✓ Usando custom social preview")
                                    return og_url, "openGraphImageUrl"
                                elif org_avatar:
                                    print("  ✓ Usando avatar da organização")
                                    return org_avatar, "org_avatar"
            except urllib.error.HTTPError:
                pass

        # STEP 3: Fallback to org avatar if no preview found
        if org_avatar:
            print("  ✓ Usando avatar da organização (fallback)")
            return org_avatar, "org_avatar"

        print("  ⚠ Nenhuma imagem encontrada")
        return None, None

    except Exception as e:
        print(f"  ⚠ Erro ao buscar imagem: {str(e)[:70]}")
        return None, None


def update_index_html(projects_html):
    file_path = "index.html"
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    start_marker = "<!-- PROJECTS_START -->"
    end_marker = "<!-- PROJECTS_END -->"

    start_index = content.find(start_marker)
    end_index = content.find(end_marker)

    if start_index == -1 or end_index == -1:
        print("Markers not found in index.html")
        return

    if projects_html.strip():
        content = (
            content[: start_index + len(start_marker)]
            + "\n"
            + projects_html
            + "\n                    "
            + content[end_index:]
        )
    else:
        print(
            "No projects HTML to insert; skipping replacing the projects block but will update date elements."
        )

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("index.html updated successfully.")

    # update copyright year if present
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        now = datetime.now()
        content = re.sub(r"©\s*\d{4}", f"© {now.year}", content)
        content = re.sub(r"&copy;\s*\d{4}", f"&copy; {now.year}", content)
        # Update or insert a visible 'Última atualização' element in the footer
        last_updated_str = now.strftime("%d/%m/%Y")
        # Normalize any existing escaped attributes and collapse duplicates
        content = content.replace(
            'id=\\"page-last-updated\\"', 'id="page-last-updated"'
        )
        content = re.sub(
            r'(<span id="page-last-updated">.*?<\/span>)(\s*<span id="page-last-updated">.*?<\/span>)+',
            r"\1",
            content,
            flags=re.S,
        )
        if 'id="page-last-updated"' in content:
            content = re.sub(
                r'<span id="page-last-updated">.*?<\/span>',
                f'<span id="page-last-updated">Última atualização: {last_updated_str}</span>',
                content,
                flags=re.S,
            )
        else:
            # Try to find the copyright paragraph and insert after it
            content = re.sub(
                r"(<p>&copy;\s*\d{4}.*?<\/p>)",
                r'\1 <span id="page-last-updated">Última atualização: '
                + last_updated_str
                + "</span>",
                content,
                flags=re.S,
            )
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print("Copyright year updated.")
    except Exception as e:
        print(f"Error updating copyright year: {e}")


def sanitize_existing_project_images(
    file_path="index.html", placeholder="./assets/css/images/icon.png"
):
    """Replace owner avatar image URLs with a local placeholder inside the projects block.
    Returns count of replacements.
    """
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        start_marker = "<!-- PROJECTS_START -->"
        end_marker = "<!-- PROJECTS_END -->"
        start_index = content.find(start_marker)
        end_index = content.find(end_marker)
        if start_index == -1 or end_index == -1:
            print("Markers not found in index.html during sanitize")
            return 0

        block = content[start_index:end_index]

        # Replace any image in the projects block that is NOT a social preview URL
        # We treat social preview host (opengraph.githubassets.com) and direct repo-hosted images as allowed,
        # otherwise replace with placeholder.
        def repl(match):
            src = match.group(2)
            # If it's opengraph or a repo-hosted preview (assets), keep it; else replace
            if (
                "opengraph.githubassets.com" in src
                or "raw.githubusercontent.com" in src
            ):
                return match.group(0)
            return match.group(1) + placeholder + match.group(3)

        replaced_block, n = re.subn(
            r'(<img[^>]+src=["\'])([^"\']+)(["\'])', repl, block, flags=re.I
        )
        if n > 0:
            content = content[:start_index] + replaced_block + content[end_index:]
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Sanitized {n} avatar image(s) in index.html projects block.")
        else:
            print("No avatar images found to sanitize in projects block.")
        return n
    except Exception as e:
        print(f"Error sanitizing project images: {e}")
        return 0


def commit_downloaded_images():
    """Commit downloaded images to git."""
    if not downloaded_images:
        return

    try:
        # Create or ensure .gitignore exists for the project-images folder
        gitignore_path = "assets/project-images/.gitignore"
        os.makedirs(os.path.dirname(gitignore_path), exist_ok=True)

        # Add downloaded images to git
        for img_path in downloaded_images:
            try:
                subprocess.run(
                    ["git", "add", img_path], check=True, capture_output=True
                )
                print(f"✓ Git tracked: {img_path}")
            except Exception as e:
                print(f"⚠ Could not git add {img_path}: {e}")

        # Commit if there are changes
        try:
            result = subprocess.run(
                ["git", "status", "--porcelain"], capture_output=True, text=True
            )
            if result.stdout.strip():
                subprocess.run(
                    [
                        "git",
                        "commit",
                        "-m",
                        "Add: Downloaded images from private repos",
                    ],
                    capture_output=True,
                    check=False,
                )
                print("✓ Downloaded images committed")
        except Exception as e:
            print(f"⚠ Could not commit images: {e}")
    except Exception as e:
        print(f"⚠ Error in commit_downloaded_images: {e}")


def main():
    repos = fetch_projects()
    if not repos:
        print(
            "No repositories fetched. Will still update date elements but won't modify projects."
        )
        projects_html = ""
        update_index_html(projects_html)
        sanitize_existing_project_images()
        return

    # Debug: show all repos before filtering
    print(f"\nAll repos fetched: {len(repos)}")
    for repo in repos[:10]:  # Show first 10
        has_desc = "✓ desc" if repo.get("description") else "✗ no desc"
        is_fork = "fork" if repo.get("fork") else "own"
        print(
            f"  - {repo.get('owner', {}).get('login')}/{repo['name']} ({is_fork}, {has_desc})"
        )
    if len(repos) > 10:
        print(f"  ... and {len(repos) - 10} more")

    # Filter and sort
    # Exclude forks. Include own repos even without desc, org only with desc
    my_repos = [repo for repo in repos if not repo["fork"] and (repo["description"] or repo.get('owner', {}).get('login') == 'joaosnet')]

    # Exclude the portfolio repository itself
    my_repos = [repo for repo in my_repos if repo["name"] != "joaosnet.github.io"]

    print(f"\nAfter filtering (no forks, with description): {len(my_repos)}")

    # Sort ALL repos by pushed_at descending (better for recent commits), fallback to updated_at
    my_repos.sort(key=lambda x: x.get('pushed_at') or x["updated_at"], reverse=True)

    # Debug: show top 10 with dates
    print("\nTop 10 most recent repos (pushed_at):")
    for i, proj in enumerate(my_repos[:10]):
        owner = proj.get('owner', {}).get('login', 'unknown')
        pushed = proj.get('pushed_at', 'N/A')[:10]
        updated = proj['updated_at'][:10]
        print(f"  {i+1}. {proj['name']} ({owner}) - pushed:{pushed} updated:{updated}")

    # Select absolute top 4 most recent projects
    top_projects = my_repos[:4]

    print("\nProcessing top 4 projects...")
    for i, proj in enumerate(top_projects):
        owner = proj.get("owner", {}).get("login", "unknown")
        print(f"  [{i + 1}] {proj['name']} (owner: {owner})")
    projects_html = ""
    for i, project in enumerate(top_projects):
        project.get("owner", {}).get("login", "unknown")

        # find preview image (social preview or org avatar as fallback)
        img, source = find_repo_preview_image(project)

        if img:
            print(f"      ✓ Using image: {img[:70]}...")
        else:
            # fallback to local placeholder
            img = "./assets/css/images/icon.png"
            print("      └─ Using placeholder")

        # attach to project for template
        project["preview_image"] = img

        # Alternate between left and right (0:left, 1:right, 2:left, 3:right)
        position = "left" if i % 2 == 0 else "right"
        is_last = i == len(top_projects) - 1
        projects_html += generate_project_html(project, is_last, position)

    # Wrap projects in timeline container + "Ver mais" button
    button_html = '''
                    <div style="text-align:center; margin:60px 0 40px 0;">
                        <a href="https://github.com/joaosnet?tab=repositories" target="_blank" 
                           style="display:inline-block; padding:14px 40px; background:var(--secondary); color:#fff; text-decoration:none; border-radius:12px; font-size:1.15rem; font-weight:600; font-family:\'Space Grotesk\', sans-serif; transition:all 0.3s ease; border:2px solid var(--secondary); box-shadow:0 4px 20px rgba(139,92,246,0.3);">
                            Ver mais projetos <i class="fas fa-arrow-right" style="margin-left:8px;"></i>
                        </a>
                    </div>'''
    timeline_html = f"""
                <!-- Timeline Container - Alternating Vertical Layout with Central Line -->
                <div style="position:relative; padding:20px 0;">
                    <!-- Central vertical line -->
                    <div style="position:absolute; left:50%; top:0; bottom:0; width:2px; background:linear-gradient(to bottom, var(--primary) 0%, var(--border-light) 50%, transparent 100%); transform:translateX(-50%); z-index:1;"></div>
                    
                    <!-- Timeline items container -->
                    <div style="position:relative; z-index:2;">
                        {projects_html}
                    </div>
                </div>
                {button_html}"""

    update_index_html(timeline_html)
    print(
        f"\n✓ Successfully processed {len(top_projects)} projects and updated index.html."
    )

    # Commit downloaded images if any
    if downloaded_images:
        commit_downloaded_images()


if __name__ == "__main__":
    main()
