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
try:
    from github import Github as PyGithub
    from github import Auth as PyGithubAuth
    _HAS_PYGITHUB = True
except Exception:
    _HAS_PYGITHUB = False
import os
from datetime import datetime
import re

def fetch_projects():
    url = "https://api.github.com/users/joaosnet/repos"
    headers = {'Accept': 'application/vnd.github.v3+json'}
    token = os.environ.get('GITHUB_TOKEN')
    if token:
        headers['Authorization'] = f'token {token}'
    try:
        if _HAS_REQUESTS:
            response = requests.get(url, headers=headers)
            if response.status_code != 200:
                print(f"Error fetching repos: {response.status_code}")
                return []
            return response.json()
        else:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req) as r:
                data = r.read()
                import json
                return json.loads(data.decode('utf-8'))
    except Exception as e:
        print(f"Error fetching repos: {e}")
        return []

def generate_project_html(project):
    name = project['name']
    description = project['description']
    html_url = project['html_url']
    image = project.get('preview_image')
    updated_at = project.get('updated_at')
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
    
    # Custom styling for specific projects if needed, or generic style
    img_html = ''
    if image:
        img_html = f'<div style="margin-bottom:12px;"><img src="{image}" alt="{name} preview" style="width:100%; border-radius:12px; display:block; object-fit:cover;"/></div>'
    date_html = f'<div style="margin-top:8px; color:#94a3b8; font-size:0.9rem; font-weight:600;"><time datetime="{updated_iso}">Atualizado: {updated_str}</time></div>' if updated_str else ''
    html = f"""
                    <div class="specs-item">
                        {img_html}
                        <h3>{name}</h3>
                        <p>{description}</p>
                        <a href="{html_url}" target="_blank" class="btn btn-primary"
                            style="font-size: 0.9rem; padding: 5px 15px; margin-top: 10px;">Ver no GitHub</a>
                        {date_html}
                    </div>"""
    return html


def find_repo_preview_image(repo):
    """Try to find a preview image in the repository contents.
    Returns a download_url or None.
    """
    owner = repo['owner']['login']
    name = repo['name']
    branch = repo.get('default_branch', 'main')
    possible_paths = [
        'preview.png', 'preview.jpg', 'preview.jpeg', 'screenshot.png', 'screenshot.jpg',
        'screenshot.jpeg', 'screenshot-1.png', 'screenshot-1.jpg', 'cover.png', 'cover.jpg',
        'og.png', 'og.jpg', 'assets/preview.png', 'assets/screenshot.png', 'docs/preview.png',
        'docs/screenshot.png', 'images/preview.png', 'images/screenshot.png'
    ]
    token = os.environ.get('GITHUB_TOKEN')
    headers = {'Accept': 'application/vnd.github.v3+json'}
    if token:
        headers['Authorization'] = f'token {token}'
    else:
        print('Warning: GITHUB_TOKEN not set; you may hit GitHub API rate limits. Consider setting it in GitHub Actions as env var GITHUB_TOKEN.')

    # Only use social preview (open_graph_image_url). Do NOT use content files, owner avatar,
    # or constructed opengraph URLs. This ensures the preview is intentionally set by repo owner.
    # Try PyGithub first to access the repo's detailed metadata
    token = os.environ.get('GITHUB_TOKEN')
    if _HAS_PYGITHUB and token:
        try:
            try:
                gh = PyGithub(auth=PyGithubAuth.Token(token))
            except Exception:
                # fall back for older versions of PyGithub
                gh = PyGithub(token)
            gh_repo = gh.get_repo(f"{owner}/{name}")
            # Access the raw attributes dict to get open_graph_image_url
            if hasattr(gh_repo, '_rawData') and gh_repo._rawData:
                og_url = gh_repo._rawData.get('open_graph_image_url')
                if og_url:
                    print(f"Using open_graph_image_url for {name}: {og_url}")
                    return og_url, 'open_graph_image_url (pygithub)'
        except Exception as e:
            print(f"PyGithub lookup failed for {owner}/{name}: {e}")

    # If the repo JSON from REST API already contains an open_graph_image_url, use it
    og_json = repo.get('open_graph_image_url')
    if og_json:
        print(f"Using open_graph_image_url from REST API for {name}: {og_json}")
        return og_json, 'open_graph_image_url (rest_api)'

    # We intentionally don't check for content file previews or construct OpenGraph URL.
    # If nothing is set, return None to force placeholder in the UI.
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
        now = datetime.utcnow()
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
    
    # Filter and sort
    # Exclude forks and repos without description
    my_repos = [repo for repo in repos if not repo['fork'] and repo['description']]
    
    # Sort by updated_at descending
    my_repos.sort(key=lambda x: x['updated_at'], reverse=True)
    
    # Take top 4
    top_projects = my_repos[:4]
    
    projects_html = ""
    for project in top_projects:
        # find preview image (social preview only)
        img, source = find_repo_preview_image(project)
        if img:
            print(f"Project {project['name']} social preview chosen: {img} (source={source})")
        else:
            # fallback to local placeholder; do NOT default to owner's avatar
            fallback_img = './assets/css/images/icon.png'
            print(f"No social preview set for {project['name']}; using placeholder: {fallback_img}")
            img = fallback_img
        # attach to project for template
        project['preview_image'] = img
        projects_html += generate_project_html(project)
    
    update_index_html(projects_html)
    print(f"Processed {len(top_projects)} projects and updated index.html.")

if __name__ == "__main__":
    main()
