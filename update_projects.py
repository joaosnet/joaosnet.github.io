import requests
import os
from datetime import datetime

def fetch_projects():
    url = "https://api.github.com/users/joaosnet/repos"
    response = requests.get(url)
    if response.status_code != 200:
        print(f"Error fetching repos: {response.status_code}")
        return []
    return response.json()

def generate_project_html(project):
    name = project['name']
    description = project['description']
    html_url = project['html_url']
    
    # Custom styling for specific projects if needed, or generic style
    html = f"""
                    <div class="specs-item">
                        <h3>{name}</h3>
                        <p>{description}</p>
                        <a href="{html_url}" target="_blank" class="btn btn-primary"
                            style="font-size: 0.9rem; padding: 5px 15px; margin-top: 10px;">Ver no GitHub</a>
                    </div>"""
    return html

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
    
    new_content = content[:start_index + len(start_marker)] + '\n' + projects_html + '\n                    ' + content[end_index:]
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("index.html updated successfully.")

def main():
    repos = fetch_projects()
    
    # Filter and sort
    # Exclude forks and repos without description
    my_repos = [repo for repo in repos if not repo['fork'] and repo['description']]
    
    # Sort by updated_at descending
    my_repos.sort(key=lambda x: x['updated_at'], reverse=True)
    
    # Take top 4
    top_projects = my_repos[:4]
    
    projects_html = ""
    for project in top_projects:
        projects_html += generate_project_html(project)
    
    update_index_html(projects_html)

if __name__ == "__main__":
    main()
