# GitHub Copilot Instructions for joaosnet.github.io

## Project Overview
This is a personal portfolio website hosted on GitHub Pages. It uses a static HTML/CSS/JS architecture with a Python automation script to dynamically update project listings from GitHub.

## Architecture & Key Components
- **Frontend**: Vanilla HTML5, CSS3 (SCSS), and JavaScript. No framework (React/Vue/etc.) is used for the runtime site.
- **Automation**: `update_projects.py` is the core automation engine. It fetches repository data from the GitHub API and injects HTML into `index.html`.
- **Styling**: Uses CSS variables for theming (Light/Dark mode). Critical styles are inline in `index.html` or in `assets/css/main.css`.
- **Assets**: Located in `assets/`. `assets/js/theme.js` handles client-side logic like theming and form submission.

## Critical Workflows
- **Updating Projects**:
  - Run `python update_projects.py` to fetch the latest top 4 repositories and update `index.html`.
  - **Requirement**: Set `GITHUB_TOKEN` environment variable to avoid API rate limits.
  - **Mechanism**: The script looks for `<!-- PROJECTS_START -->` and `<!-- PROJECTS_END -->` markers in `index.html`. **Do not remove these markers.**

- **Theme Management**:
  - Themes are controlled via the `data-theme` attribute on the `<html>` tag (`light` or `dark`).
  - CSS variables (e.g., `--primary`, `--bg-card`) are defined in the `<style>` block in `index.html`.
  - Logic resides in `assets/js/theme.js`.

## Code Conventions & Patterns
- **Language**: The site content is in Portuguese (pt-br).
- **HTML Injection**:
  - When modifying `update_projects.py`, ensure the generated HTML matches the existing design patterns (Timeline style).
  - Always preserve the comment markers `<!-- PROJECTS_START -->` and `<!-- PROJECTS_END -->`.
- **Contact Form**:
  - Uses Formspree (`https://formspree.io/f/mdoqyljj`).
  - Includes fallbacks for `mailto:` and Gmail if the fetch request fails.
- **External Libraries**:
  - `particles.js` for background effects.
  - FontAwesome for icons.
  - Google Fonts (Outfit, Space Grotesk).

## Development Guidelines
- **CSS**: Prefer using the defined CSS variables for colors to ensure dark/light mode compatibility.
- **JavaScript**: Keep it vanilla. Avoid adding heavy dependencies.
- **Python Script**:
  - Use `requests` if available, but keep the `urllib` fallback for compatibility.
  - Handle API errors gracefully to prevent breaking the build.

## Key Files
- `index.html`: Main entry point. Contains structure and critical CSS.
- `update_projects.py`: Automation script for content updates.
- `assets/js/theme.js`: Theme toggling and form logic.
