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
import re
import json


def get_api_token():
    """Return the best available token, preferring PRIVATE_REPOS_TOKEN."""
    return os.environ.get('PRIVATE_REPOS_TOKEN') or os.environ.get('GITHUB_TOKEN')

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
        headers_auth = {'Authorization': f'token {token}', 'Accept': 'application/vnd.github.v3+json'}
        # Include owner, collaborator, and organization_member affiliations to get all repos
        url_auth = "https://api.github.com/user/repos?visibility=all&sort=updated&per_page=100&affiliation=owner,collaborator,organization_member"
        try:
            if _HAS_REQUESTS:
                response = requests.get(url_auth, headers=headers_auth, timeout=10)
                if response.status_code == 200:
                    repos = response.json()
                    print(f"Successfully fetched {len(repos)} repos (owner + collaborator + org) via authenticated endpoint")
                    
                    # Debug: breakdown by type
                    owner_repos = [r for r in repos if r.get('owner', {}).get('login') == 'joaosnet']
                    org_repos = [r for r in repos if r.get('owner', {}).get('login') != 'joaosnet']
                    print(f"  - Owner repos: {len(owner_repos)}")
                    print(f"  - Organization repos: {len(org_repos)}")
                    if org_repos:
                        org_names = set(r.get('owner', {}).get('login') for r in org_repos)
                        print(f"    Organizations: {', '.join(org_names)}")
                else:
                    print(f"Authenticated endpoint returned {response.status_code}; falling back to public repos...")
            else:
                req = urllib.request.Request(url_auth, headers=headers_auth)
                with urllib.request.urlopen(req, timeout=10) as r:
                    repos = json.loads(r.read().decode('utf-8'))
                    print(f"Successfully fetched {len(repos)} repos (owner + collaborator + org) via authenticated endpoint")
                    
                    owner_repos = [r for r in repos if r.get('owner', {}).get('login') == 'joaosnet']
                    org_repos = [r for r in repos if r.get('owner', {}).get('login') != 'joaosnet']
                    print(f"  - Owner repos: {len(owner_repos)}")
                    print(f"  - Organization repos: {len(org_repos)}")
                    if org_repos:
                        org_names = set(r.get('owner', {}).get('login') for r in org_repos)
                        print(f"    Organizations: {', '.join(org_names)}")
        except urllib.error.HTTPError as e:
            print(f"Authenticated endpoint error ({e.code}); falling back to public repos...")
        except Exception as e:
            print(f"Error fetching from authenticated endpoint: {e}; falling back to public repos...")
    
    # Fallback to public endpoint if authenticated endpoint failed
    if not repos:
        headers_public = {'Accept': 'application/vnd.github.v3+json'}
        url_public = "https://api.github.com/users/joaosnet/repos?sort=updated&per_page=100"
        try:
            if _HAS_REQUESTS:
                response = requests.get(url_public, headers=headers_public, timeout=10)
                if response.status_code == 200:
                    repos = response.json()
                    print(f"Successfully fetched {len(repos)} public repos via public endpoint")
                else:
                    print(f"Error fetching public repos: {response.status_code}")
            else:
                req = urllib.request.Request(url_public, headers=headers_public)
                with urllib.request.urlopen(req, timeout=10) as r:
                    repos = json.loads(r.read().decode('utf-8'))
                    print(f"Successfully fetched {len(repos)} public repos via public endpoint")
        except Exception as e:
            print(f"Error fetching public repos: {e}")
    
    if not repos:
        print("Could not fetch repos from any endpoint")
    
    return repos

def generate_project_html(project, is_last=False, position='left'):
    name = project['name']
    description = project['description']
    html_url = project['html_url']
    image = project.get('preview_image')
    updated_at = project.get('updated_at')
    is_private = project.get('private', False)

    # format updated_at if present
    updated_str = ''
    updated_iso = ''
    if updated_at:
        try:
            dt = datetime.fromisoformat(updated_at.replace('Z', '+00:00'))
            updated_str = dt.strftime('%d/%m/%Y')
            updated_iso = dt.isoformat()
        except Exception:
            updated_str = updated_at
    
    # Timeline style HTML with image
    img_html = ''
    if image:
        img_html = f'<img src="{image}" alt="{name} preview" style="width:100%; aspect-ratio:1.91/1; object-fit:cover; border-radius:8px; margin-bottom:16px;"/>'
    
    # Private vs Public display logic
    if is_private:
        title_html = f'''<span style="color:#0969da; border-bottom:2px solid #0969da; cursor:default;">
                                    {name} <i class="fas fa-lock" style="font-size:0.7em; vertical-align: middle; margin-left:4px;" title="Projeto Privado"></i>
                                </span>'''
        button_html = f'''<span style="display:inline-block; padding:8px 16px; background:#f6f8fa; color:#57606a; border-radius:6px; font-size:0.9rem; font-weight:600; border:1px solid #d0d7de; cursor:default;">
                                Privado
                            </span>'''
    else:
        title_html = f'''<a href="{html_url}" target="_blank" style="color:#0969da; text-decoration:none; border-bottom:2px solid #0969da;">
                                    {name}
                                </a>'''
        button_html = f'''<a href="{html_url}" target="_blank" style="display:inline-block; padding:8px 16px; background:#0969da; color:#fff; text-decoration:none; border-radius:6px; font-size:0.9rem; font-weight:600; transition:background 0.2s; border:1px solid #0969da;">
                                Ver no GitHub →
                            </a>'''

    # Content card styles
    card_style = "background:#f6f8fa; border:1px solid #d0d7de; border-radius:8px; padding:20px;"
    
    if position == 'left':
        # Content on LEFT side, dot on CENTER
        html = f"""
                    <div class="timeline-item-left" style="display:grid; grid-template-columns:1fr 60px 1fr; gap:24px; padding-bottom:40px; position:relative; align-items:flex-start;">
                        <!-- Content Left -->
                        <div style="{card_style} text-align:right;">
                            <!-- Date badge -->
                            <div style="display:inline-block; background:#fff; padding:4px 12px; border-radius:16px; margin-bottom:8px; border:1px solid #d0d7de;">
                                <time datetime="{updated_iso}" style="font-size:0.85rem; color:#57606a; font-weight:600;">{updated_str}</time>
                            </div>
                            
                            <!-- Image -->
                            <div style="margin-bottom:12px;">
                                {img_html}
                            </div>
                            
                            <!-- Project info -->
                            <h3 style="margin:0 0 8px 0; font-size:1.2rem; color:#0969da; word-break:break-word;">
                                {title_html}
                            </h3>
                            <p style="margin:0 0 12px 0; color:#57606a; font-size:0.95rem; line-height:1.5;">{description}</p>
                            
                            <!-- Button -->
                            {button_html}
                        </div>
                        
                        <!-- Timeline Dot (CENTER) -->
                        <div style="display:flex; flex-direction:column; align-items:center; min-width:60px;">
                            <div style="width:16px; height:16px; background:#0969da; border:4px solid #fff; border-radius:50%; position:relative; z-index:2;"></div>
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
                            <div style="width:16px; height:16px; background:#0969da; border:4px solid #fff; border-radius:50%; position:relative; z-index:2;"></div>
                        </div>
                        
                        <!-- Content Right -->
                        <div style="{card_style} text-align:left;">
                            <!-- Date badge -->
                            <div style="display:inline-block; background:#fff; padding:4px 12px; border-radius:16px; margin-bottom:8px; border:1px solid #d0d7de;">
                                <time datetime="{updated_iso}" style="font-size:0.85rem; color:#57606a; font-weight:600;">{updated_str}</time>
                            </div>
                            
                            <!-- Image -->
                            <div style="margin-bottom:12px;">
                                {img_html}
                            </div>
                            
                            <!-- Project info -->
                            <h3 style="margin:0 0 8px 0; font-size:1.2rem; color:#0969da; word-break:break-word;">
                                {title_html}
                            </h3>
                            <p style="margin:0 0 12px 0; color:#57606a; font-size:0.95rem; line-height:1.5;">{description}</p>
                            
                            <!-- Button -->
                            {button_html}
                        </div>
                    </div>"""
    
    return html


def get_repo_default_branch(owner, repo_name, token):
    """Get the default branch of a repository using GitHub API."""
    try:
        headers = {'Accept': 'application/vnd.github.v3+json'}
        if token:
            headers['Authorization'] = f'token {token}'
        
        url = f"https://api.github.com/repos/{owner}/{repo_name}"
        
        if _HAS_REQUESTS:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                return data.get('default_branch', 'main')
        else:
            try:
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=10) as r:
                    data = json.loads(r.read().decode('utf-8'))
                    return data.get('default_branch', 'main')
            except Exception:
                pass
    except Exception:
        pass
    
    return 'main'  # Default fallback


def find_image_in_readme(owner, repo_name, token):
    """Extract image URL from README file.
    Looks for markdown images: ![alt](url) or ![alt][ref] or HTML <img> tags.
    Prioritizes images that are not badges/shields.
    Returns the first suitable image URL found, or None.
    """
    try:
        if not token:
            print(f"    ⚠ Token não disponível para ler README privado")
            return None
        
        # Try to fetch README content - first try raw format
        headers = {'Accept': 'application/vnd.github.v3.raw', 'Authorization': f'token {token}'}
        url = f"https://api.github.com/repos/{owner}/{repo_name}/readme"
        
        readme_content = None
        try:
            if _HAS_REQUESTS:
                response = requests.get(url, headers=headers, timeout=10)
                if response.status_code == 200:
                    readme_content = response.text
                    print(f"    ℹ README carregado com sucesso ({len(readme_content)} chars)")
                elif response.status_code == 404:
                    print(f"    ℹ README não encontrado")
                    return None
                else:
                    print(f"    ⚠ README fetch retornou {response.status_code}")
                    return None
            else:
                try:
                    req = urllib.request.Request(url, headers=headers)
                    with urllib.request.urlopen(req, timeout=10) as r:
                        readme_content = r.read().decode('utf-8')
                        print(f"    ℹ README carregado com sucesso ({len(readme_content)} chars)")
                except urllib.error.HTTPError as e:
                    if e.code == 404:
                        print(f"    ℹ README não encontrado")
                    else:
                        print(f"    ⚠ README HTTP error: {e.code}")
                    return None
        except Exception as e:
            print(f"    ⚠ README fetch error: {str(e)[:70]}")
            return None
        
        if not readme_content:
            print(f"    ℹ README vazio")
            return None
        
        # Extract images using regex
        # Pattern 1: ![alt](url)
        markdown_pattern = r'!\[([^\]]*)\]\(([^)]+)\)'
        matches = re.findall(markdown_pattern, readme_content)
        
        if not matches:
            print(f"    ℹ Nenhuma imagem encontrada no README")
            return None
        
        print(f"    ℹ Encontradas {len(matches)} imagens no README, filtrando...")
        
        for idx, (alt_text, img_url) in enumerate(matches):
            # Skip known badge/status badges
            if any(skip in img_url.lower() for skip in ['shields.io', 'badge', 'codecov', 'travis', 'circleci', 'github.com/.*/workflows', '.github/workflows']):
                print(f"      - Imagem {idx+1}: badge detectado, pulando")
                continue
            
            # IMPORTANT: Skip avatars.githubusercontent.com - these are user/org avatars, not content images
            if 'avatars.githubusercontent.com' in img_url:
                print(f"      - Imagem {idx+1}: avatar do GitHub, pulando")
                continue
            
            # Very small common badges (by checking alt text)
            if alt_text.lower() in ['build', 'status', 'coverage', 'license', 'version', 'downloads']:
                print(f"      - Imagem {idx+1}: alt text '{alt_text}' é um badge, pulando")
                continue
            
            # Skip single-line badges at the start (usually status badges)
            if len(alt_text) < 20 and alt_text.isupper():
                print(f"      - Imagem {idx+1}: alt text muito curto e maiúsculo, pulando")
                continue
            
            # Ensure URL is absolute or can be converted to absolute
            if img_url.startswith('http'):
                print(f"  ✓ Imagem encontrada no README: {img_url[:60]}...")
                return img_url
            elif img_url.startswith('/'):
                # Relative path from repo root - use default branch
                default_branch = get_repo_default_branch(owner, repo_name, token)
                img_url_full = f"https://raw.githubusercontent.com/{owner}/{repo_name}/{default_branch}{img_url}"
                print(f"  ✓ Imagem encontrada no README (relativa): {img_url_full[:60]}...")
                return img_url_full
            elif any(img_url.startswith(prefix) for prefix in ['assets/', 'images/', 'docs/', 'screenshots/', 'public/', 'src/']):
                # Common relative paths
                default_branch = get_repo_default_branch(owner, repo_name, token)
                img_url_full = f"https://raw.githubusercontent.com/{owner}/{repo_name}/{default_branch}/{img_url}"
                print(f"  ✓ Imagem encontrada no README (relativa): {img_url_full[:60]}...")
                return img_url_full
            else:
                print(f"      - Imagem {idx+1}: URL relativa desconhecida: {img_url[:40]}...")
        
        print(f"    ℹ Nenhuma imagem válida encontrada após filtrar")
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
        owner = repo.get('owner', {}).get('login')
        name = repo.get('name')
        
        if not owner or not name:
            print(f"  ⚠ Não conseguiu determinar owner/name")
            return None, None
        
        token = get_api_token()
        if not token:
            print(f"  ⚠ Sem token disponível")
            return None, None
        
        print(f"  ℹ Buscando imagem para {owner}/{name}...")
        
        # STEP 1: Try README first - prioritize real content images
        readme_image = find_image_in_readme(owner, name, token)
        if readme_image:
            print(f"  ✓ Usando imagem do README")
            return readme_image, 'readme_image'
        
        # STEP 2: Try GraphQL for custom social preview
        print(f"    Buscando social preview...")
        graphql_query = """
        query($owner: String!, $name: String!) {
          repository(owner: $owner, name: $name) {
            openGraphImageUrl
          }
        }
        """
        
        url = "https://api.github.com/graphql"
        headers = {
            'Authorization': f'token {token}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'query': graphql_query,
            'variables': {
                'owner': owner,
                'name': name
            }
        }
        
        social_preview = None
        org_avatar = repo.get('owner', {}).get('avatar_url')
        
        if _HAS_REQUESTS:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if 'data' in data and data['data'] and 'repository' in data['data']:
                    repo_data = data['data']['repository']
                    if repo_data:
                        og_url = repo_data.get('openGraphImageUrl')
                        if og_url:
                            # Check if it's a custom social preview (not just avatar)
                            is_custom_preview = ('opengraph.githubassets.com' in og_url or 
                                               'repository-images.githubusercontent.com' in og_url)
                            
                            if is_custom_preview:
                                print(f"  ✓ Usando custom social preview")
                                return og_url, 'openGraphImageUrl'
                            elif org_avatar:
                                print(f"  ✓ Usando avatar da organização")
                                return org_avatar, 'org_avatar'
        else:
            req = urllib.request.Request(url, headers=headers, data=json.dumps(payload).encode('utf-8'))
            try:
                with urllib.request.urlopen(req, timeout=10) as r:
                    data = json.loads(r.read().decode('utf-8'))
                    if 'data' in data and data['data'] and 'repository' in data['data']:
                        repo_data = data['data']['repository']
                        if repo_data:
                            og_url = repo_data.get('openGraphImageUrl')
                            if og_url:
                                is_custom_preview = ('opengraph.githubassets.com' in og_url or 
                                                   'repository-images.githubusercontent.com' in og_url)
                                
                                if is_custom_preview:
                                    print(f"  ✓ Usando custom social preview")
                                    return og_url, 'openGraphImageUrl'
                                elif org_avatar:
                                    print(f"  ✓ Usando avatar da organização")
                                    return org_avatar, 'org_avatar'
            except urllib.error.HTTPError as e:
                pass
        
        # STEP 3: Fallback to org avatar if no preview found
        if org_avatar:
            print(f"  ✓ Usando avatar da organização (fallback)")
            return org_avatar, 'org_avatar'
        
        print(f"  ⚠ Nenhuma imagem encontrada")
        return None, None
        
    except Exception as e:
        print(f"  ⚠ Erro ao buscar imagem: {str(e)[:70]}")
        return None, None


def update_index_html(projects_html):
    file_path = 'index.html'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    start_marker = '<!-- PROJECTS_START -->'
    end_marker = '<!-- PROJECTS_END -->'

    start_index = content.find(start_marker)
    end_index = content.find(end_marker)

    if start_index == -1 or end_index == -1:
        print("Markers not found in index.html")
        return

    if projects_html.strip():
        content = content[:start_index + len(start_marker)] + '\n' + projects_html + '\n                    ' + content[end_index:]
    else:
        print('No projects HTML to insert; skipping replacing the projects block but will update date elements.')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("index.html updated successfully.")

    # update copyright year if present
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        now = datetime.now()
        content = re.sub(r'©\s*\d{4}', f'© {now.year}', content)
        content = re.sub(r'&copy;\s*\d{4}', f'&copy; {now.year}', content)
        # Update or insert a visible 'Última atualização' element in the footer
        last_updated_str = now.strftime('%d/%m/%Y')
        # Normalize any existing escaped attributes and collapse duplicates
        content = content.replace('id=\\"page-last-updated\\"', 'id="page-last-updated"')
        content = re.sub(r'(<span id="page-last-updated">.*?<\/span>)(\s*<span id="page-last-updated">.*?<\/span>)+', r'\1', content, flags=re.S)
        if 'id="page-last-updated"' in content:
            content = re.sub(r'<span id="page-last-updated">.*?<\/span>', f'<span id="page-last-updated">Última atualização: {last_updated_str}</span>', content, flags=re.S)
        else:
            # Try to find the copyright paragraph and insert after it
            content = re.sub(r'(<p>&copy;\s*\d{4}.*?<\/p>)', r'\1 <span id="page-last-updated">Última atualização: ' + last_updated_str + '</span>', content, flags=re.S)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Copyright year updated.")
    except Exception as e:
        print(f"Error updating copyright year: {e}")


def sanitize_existing_project_images(file_path='index.html', placeholder='./assets/css/images/icon.png'):
    """Replace owner avatar image URLs with a local placeholder inside the projects block.
    Returns count of replacements.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        start_marker = '<!-- PROJECTS_START -->'
        end_marker = '<!-- PROJECTS_END -->'
        start_index = content.find(start_marker)
        end_index = content.find(end_marker)
        if start_index == -1 or end_index == -1:
            print('Markers not found in index.html during sanitize')
            return 0

        block = content[start_index:end_index]
        # Replace any image in the projects block that is NOT a social preview URL
        # We treat social preview host (opengraph.githubassets.com) and direct repo-hosted images as allowed,
        # otherwise replace with placeholder.
        def repl(match):
            src = match.group(2)
            # If it's opengraph or a repo-hosted preview (assets), keep it; else replace
            if 'opengraph.githubassets.com' in src or 'raw.githubusercontent.com' in src:
                return match.group(0)
            return match.group(1) + placeholder + match.group(3)

        replaced_block, n = re.subn(r'(<img[^>]+src=["\'])([^"\']+)(["\'])', repl, block, flags=re.I)
        if n > 0:
            content = content[:start_index] + replaced_block + content[end_index:]
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Sanitized {n} avatar image(s) in index.html projects block.")
        else:
            print('No avatar images found to sanitize in projects block.')
        return n
    except Exception as e:
        print(f"Error sanitizing project images: {e}")
        return 0

def main():
    repos = fetch_projects()
    if not repos:
        print("No repositories fetched. Will still update date elements but won't modify projects.")
        projects_html = ''
        update_index_html(projects_html)
        sanitize_existing_project_images()
        return
    
    # Debug: show all repos before filtering
    print(f"\nAll repos fetched: {len(repos)}")
    for repo in repos[:10]:  # Show first 10
        has_desc = "✓ desc" if repo.get('description') else "✗ no desc"
        is_fork = "fork" if repo.get('fork') else "own"
        print(f"  - {repo.get('owner', {}).get('login')}/{repo['name']} ({is_fork}, {has_desc})")
    if len(repos) > 10:
        print(f"  ... and {len(repos) - 10} more")
    
    # Filter and sort
    # Exclude forks and repos without description
    my_repos = [repo for repo in repos if not repo['fork'] and repo['description']]
    
    print(f"\nAfter filtering (no forks, with description): {len(my_repos)}")
    
    # Sort by updated_at descending
    my_repos.sort(key=lambda x: x['updated_at'], reverse=True)
    
    # Separate by owner type to balance representation
    owner_repos = [r for r in my_repos if r.get('owner', {}).get('login') == 'joaosnet']
    org_repos = [r for r in my_repos if r.get('owner', {}).get('login') != 'joaosnet']
    
    print(f"\n  Owner repos (filtered): {len(owner_repos)}")
    print(f"  Organization repos (filtered): {len(org_repos)}")
    if org_repos:
        org_names = set(r.get('owner', {}).get('login') for r in org_repos)
        print(f"    Organizations: {', '.join(org_names)}")
    
    # Select top 4: prioritize ANY organization repos first, then owner repos
    # This way, any new organization you join will automatically appear at the top
    top_projects = []
    
    # Add organization repos first (up to 2)
    if org_repos:
        top_projects.extend(org_repos[:min(2, len(org_repos))])
    
    # Then add owner repos to fill up to 4
    if len(top_projects) < 4:
        top_projects.extend(owner_repos[:max(0, 4 - len(top_projects))])
    
    top_projects = top_projects[:4]
    
    print(f"\nProcessing {len(top_projects)} top projects...")
    projects_html = ""
    for i, project in enumerate(top_projects):
        repo_owner = project.get('owner', {}).get('login', 'unknown')
        print(f"  [{i+1}] {project['name']} (owner: {repo_owner})")
        
        # find preview image (social preview or org avatar as fallback)
        img, source = find_repo_preview_image(project)
        
        if img:
            print(f"      ✓ Using image: {img[:70]}...")
        else:
            # fallback to local placeholder
            img = './assets/css/images/icon.png'
            print(f"      └─ Using placeholder")
        
        # attach to project for template
        project['preview_image'] = img
        
        # Alternate between left and right (0:left, 1:right, 2:left, 3:right)
        position = 'left' if i % 2 == 0 else 'right'
        is_last = (i == len(top_projects) - 1)
        projects_html += generate_project_html(project, is_last, position)
    
    # Wrap projects in timeline container
    timeline_html = f"""
                <!-- Timeline Container - Alternating Vertical Layout with Central Line -->
                <div style="position:relative; padding:20px 0;">
                    <!-- Central vertical line -->
                    <div style="position:absolute; left:50%; top:0; bottom:0; width:2px; background:linear-gradient(to bottom, #0969da 0%, #d0d7de 50%, transparent 100%); transform:translateX(-50%); z-index:1;"></div>
                    
                    <!-- Timeline items container -->
                    <div style="position:relative; z-index:2;">
                        {projects_html}
                    </div>
                </div>"""
    
    update_index_html(timeline_html)
    print(f"\n✓ Successfully processed {len(top_projects)} projects and updated index.html.")

if __name__ == "__main__":
    main()
