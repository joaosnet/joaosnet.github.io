/**
 * Theme Manager - Handles light/dark theme toggling
 */
class ThemeManager {
    constructor() {
        this.toggleBtn = document.getElementById('theme-toggle');
        this.htmlEl = document.documentElement;
        this.STORAGE_KEY = 'theme';

        if (this.toggleBtn) {
            this.init();
        }
    }

    init() {
        this.toggleBtn.addEventListener('click', () => this.toggleTheme());
        this.applyTheme(this.getCurrentTheme());
    }

    getCurrentTheme() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) return stored;
        return this.htmlEl.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    }

    toggleTheme() {
        const newTheme = this.getCurrentTheme() === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }

    applyTheme(theme) {
        this.htmlEl.setAttribute('data-theme', theme);
        localStorage.setItem(this.STORAGE_KEY, theme);
        this.updateToggleIcon(theme);
    }

    updateToggleIcon(theme) {
        const icon = theme === 'light' ? 'fa-moon' : 'fa-sun';
        const title = theme === 'dark' ? 'Modo claro' : 'Modo escuro';
        
        this.toggleBtn.innerHTML = `<i class="fas ${icon}"></i>`;
        this.toggleBtn.title = title;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
});
