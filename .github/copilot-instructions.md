# GitHub Copilot Instructions for joaosnet.github.io

## Project Overview
This is a personal portfolio website hosted on GitHub Pages. It uses a static HTML/CSS/JS architecture with a Python automation script to dynamically update project listings from GitHub.

## Architecture & Key Components
- **Frontend**: Vanilla HTML5, CSS3 (SCSS), and JavaScript. No framework (React/Vue/etc.) is used for the runtime site.
- **Automation**: `update_projects.py` is the core automation engine. It fetches repository data from the GitHub API and injects HTML into `index.html`. Supports both public and private repositories (with authentication).
- **Styling**: Uses CSS variables for theming (Light/Dark mode). Critical styles are inline in `index.html`. SCSS files are in `assets/sass/` for maintainability.
- **Assets**: Located in `assets/`:
  - `assets/js/theme.js` - Theme toggling (light/dark), contact form submission with Formspree fallback, view counter, and FAB behavior
  - `assets/css/main.css` - Compiled CSS
  - `assets/sass/` - SCSS source files (main.scss, variables, mixins, breakpoints)
  - `assets/project-images/` - Downloaded images from private repositories
  - `assets/webfonts/` - FontAwesome webfonts

## Critical Workflows
- **Updating Projects**:
  - Run `python update_projects.py` to fetch repositories (both public and private) and update `index.html`.
  - **Requirements**: Set either `PRIVATE_REPOS_TOKEN` (preferred) or `GITHUB_TOKEN` environment variable to avoid API rate limits and access private repositories.
  - **Mechanism**: 
    - The script looks for `<!-- PROJECTS_START -->` and `<!-- PROJECTS_END -->` markers in `index.html`. **Do not remove these markers.**
    - Fetches up to 100 repositories with affiliation filter (owner, collaborator, organization_member)
    - Selects top 4 projects (prioritizing organization repos up to 2, then owner repos)
    - Extracts preview images from README files or uses social preview/avatar as fallback
    - For private repos with relative image paths, downloads images locally to `assets/project-images/`
    - Generates alternating left/right timeline layout with metadata (updated date, description)
  - **Output**: Timeline-style HTML with alternating left/right card layout and a central vertical line

- **Theme Management**:
  - Themes are controlled via the `data-theme` attribute on the `<html>` tag (`light` or `dark`).
  - CSS variables (e.g., `--primary`, `--secondary`, `--bg-card`) are defined in the `<style>` block in `index.html`.
  - Theme state is persisted in `localStorage` as `theme`.
  - Logic resides in `assets/js/theme.js` and toggles via a button with FontAwesome icons.
  - Default theme is dark unless user has previously selected light mode.

## Code Conventions & Patterns
- **Language**: The site content is in Portuguese (pt-br).
- **HTML Injection**:
  - When modifying `update_projects.py`, ensure the generated HTML matches the existing design patterns (alternating timeline layout).
  - Always preserve the comment markers `<!-- PROJECTS_START -->` and `<!-- PROJECTS_END -->`.
  - Projects are rendered as a grid layout with 3 columns (content | dot | empty/empty | dot | content alternating).
  - Card styling uses inline styles for consistency: background (#f6f8fa), border (#d0d7de), padding (20px), border-radius (8px).
  - Date badges use time elements with `datetime` attribute for semantic HTML and accessibility.
- **Contact Form**:
  - Uses Formspree (`https://formspree.io/f/mdoqyljj`) with POST method.
  - Includes fallbacks: on fetch error, redirects to `mailto:` link; on network error, opens Gmail compose page.
  - Form fields: `name`, `email`, `message` (all plaintext).
  - Success toast message: "Mensagem enviada com sucesso! Obrigado."
  - Form resets after successful submission; submit button shows temporary "Enviado! ✓" state.
- **External Libraries**:
  - `particles.js` for background effects (included via CDN in index.html).
  - FontAwesome 6.4.0 for icons (via CDN).
  - Google Fonts: Outfit (body text, sans-serif) and Space Grotesk (headings, monospace).
  - CountAPI.xyz for unique views counter (persisted per browser session via localStorage).
- **JavaScript Patterns**:
  - All event listeners are vanilla DOM API (no jQuery or frameworks).
  - Toast notifications managed via `showToast()` helper with auto-hide after 3.5 seconds.
  - FAB (Floating Action Button) smoothly scrolls to contact form and focuses message field.
  - Theme persistence uses `localStorage.setItem('theme', theme)`.

## Development Guidelines
- **CSS**: Prefer using the defined CSS variables for colors to ensure dark/light mode compatibility. Main variables:
  - Dark mode: `--primary: #3b82f6`, `--secondary: #8b5cf6`, `--dark: #020617`, `--light: #f8fafc`, `--accent: #06b6d4`
  - Light mode: `--primary: #1d4ed8`, `--secondary: #9333ea`, `--dark: #f9fafb`, `--light: #111827`, `--accent: #0e7490`
  - For cards and backgrounds: `--bg-card`, `--header-bg`, `--glass-bg`, `--input-bg`, `--border-light`
- **JavaScript**: Keep it vanilla. Avoid adding heavy dependencies. Use fetch API for HTTP requests with appropriate error handling.
- **Python Script (`update_projects.py`)**:
  - Use `requests` library if available, maintain `urllib` fallback for compatibility.
  - Handle API errors gracefully with try-except blocks and informative print statements.
  - Always track downloaded images globally via `downloaded_images` set for git commit.
  - Image selection strategy (in order): README content images → social preview → org avatar → placeholder.
  - Exclude forks and repositories without descriptions from selection.
  - Output timeline HTML with 3-column grid layout for alternating left/right cards.
  - Update copyright year and "Última atualização" timestamp in footer on each run.
- **Responsive Design**: 
  - Use media queries from `_breakpoints.scss` for mobile/tablet/desktop layouts.
  - Timeline collapses to single column on smaller screens (align items to center).
  - Font sizes scale appropriately for readability.

## Key Files
- `index.html`: Main entry point. Contains structure and critical CSS.
- `update_projects.py`: Automation script for content updates.
- `assets/js/theme.js`: Theme toggling and form logic.
