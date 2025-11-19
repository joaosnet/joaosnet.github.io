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
import json

def fetch_projects():
    # If we have a token, use the authenticated user endpoint to get private repos too
    token = os.environ.get('GITHUB_TOKEN')
    if token:
        url = "https://api.github.com/user/repos?visibility=all&affiliation=owner,collaborator&sort=updated"
        headers = {'Authorization': f'token {token}', 'Accept': 'application/vnd.github.v3+json'}
    else:
        # Fallback to public only if no token
        url = "https://api.github.com/users/joaosnet/repos"
        headers = {'Accept': 'application/vnd.github.v3+json'}

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

def generate_project_html(project, is_last=False):
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
    
    # Line style
    line_bg = "background:#d0d7de;"
    if is_last:
        line_bg = "background:linear-gradient(to bottom, #d0d7de 0%, transparent 100%);"

    # Private vs Public display logic
    if is_private:
        # No link for private repos, and a lock icon
        title_html = f'''
                                <span style="color:#0969da; border-bottom:2px solid #0969da; cursor:default;">
                                    {name} <i class="fas fa-lock" style="font-size:0.7em; vertical-align: middle; margin-left:4px;" title="Projeto Privado"></i>
                                </span>'''
        button_html = f'''
                            <span style="display:inline-block; padding:8px 16px; background:#f6f8fa; color:#57606a; border-radius:6px; font-size:0.9rem; font-weight:600; border:1px solid #d0d7de; cursor:default;">
                                Privado
                            </span>'''
    else:
        title_html = f'''
                                <a href="{html_url}" target="_blank" style="color:#0969da; text-decoration:none; border-bottom:2px solid #0969da;">
                                    {name}
                                </a>'''
        button_html = f'''
                            <a href="{html_url}" target="_blank" style="display:inline-block; padding:8px 16px; background:#0969da; color:#fff; text-decoration:none; border-radius:6px; font-size:0.9rem; font-weight:600; transition:background 0.2s; border:1px solid #0969da;">
                                Ver no GitHub →
                            </a>'''

    html = f"""
                    <div class="timeline-item" style="display:flex; gap:24px; padding-bottom:40px; position:relative;">
                        <!-- Timeline dot -->
                        <div style="display:flex; flex-direction:column; align-items:center; min-width:40px;">
                            <div style="width:16px; height:16px; background:#0969da; border:4px solid #fff; border-radius:50%; position:relative; z-index:2;"></div>
                            <div style="width:2px; flex:1; {line_bg} margin-top:8px;"></div>
                        </div>
                        
                        <!-- Content -->
                        <div style="flex:1; padding-top:4px;">
                            <!-- Date badge -->
                            <div style="display:inline-block; background:#f6f8fa; padding:4px 12px; border-radius:16px; margin-bottom:8px;">
                                <time datetime="{updated_iso}" style="font-size:0.85rem; color:#57606a; font-weight:600;">{updated_str}</time>
                            </div>
                            
                            <!-- Image -->
                            {img_html}
                            
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


def find_repo_preview_image(repo):
    """Fetch social preview image URL using GitHub GraphQL API.
    The openGraphImageUrl field is only available via GraphQL API v4.
    Returns the social preview image URL or None.
    """
    owner = repo['owner']['login']
    name = repo['name']
    token = os.environ.get('GITHUB_TOKEN')
    
    if not token:
        print(f"Warning: GITHUB_TOKEN not set; cannot fetch social preview for {name}")
        return None, None
    
    # Use GraphQL API to get openGraphImageUrl
    graphql_query = """
    query($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        openGraphImageUrl
      }
    }
    """
    
    url = "https://api.github.com/graphql"
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'query': graphql_query,
        'variables': {
            'owner': owner,
            'name': name
        }
    }
    
    try:
        if _HAS_REQUESTS:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if 'data' in data and data['data'] and 'repository' in data['data']:
                    og_url = data['data']['repository'].get('openGraphImageUrl')
                    if og_url:
                        print(f"Using openGraphImageUrl for {name}: {og_url}")
                        return og_url, 'openGraphImageUrl (graphql)'
                elif 'errors' in data:
                    print(f"GraphQL error for {owner}/{name}: {data['errors']}")
        else:
            req = urllib.request.Request(url, headers=headers, data=json.dumps(payload).encode('utf-8'))
            with urllib.request.urlopen(req) as r:
                data = json.loads(r.read().decode('utf-8'))
                if 'data' in data and data['data'] and 'repository' in data['data']:
                    og_url = data['data']['repository'].get('openGraphImageUrl')
                    if og_url:
                        print(f"Using openGraphImageUrl for {name}: {og_url}")
                        return og_url, 'openGraphImageUrl (graphql)'
    except Exception as e:
        print(f"Error querying GraphQL for {owner}/{name}: {e}")

    # If nothing found, return None to force placeholder
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
    for i, project in enumerate(top_projects):
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
        
        is_last = (i == len(top_projects) - 1)
        projects_html += generate_project_html(project, is_last)
    
    # Wrap projects in timeline container
    timeline_html = f"""
                <!-- Timeline Container -->
                <div style="position:relative; padding:20px 0;">
                    {projects_html}
                </div>"""
    
    update_index_html(timeline_html)
    print(f"Processed {len(top_projects)} projects and updated index.html.")

if __name__ == "__main__":
    main()
