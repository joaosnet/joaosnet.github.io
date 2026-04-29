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
        const theme = this.getCurrentTheme();
        this.applyTheme(theme);

        // If the user hasn't explicitly chosen a theme, respond to system preference changes
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (!stored && window.matchMedia) {
            try {
                const mq = window.matchMedia('(prefers-color-scheme: dark)');
                const handleChange = (e) => {
                    const newTheme = e.matches ? 'dark' : 'light';
                    this.applyTheme(newTheme);
                };
                if (mq.addEventListener) mq.addEventListener('change', handleChange);
                else if (mq.addListener) mq.addListener(handleChange);
            } catch (err) {
                // ignore if matchMedia isn't available
            }
        }
    }

    getCurrentTheme() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) return stored;
        // If HTML already has a theme attribute, use it
        const attr = this.htmlEl.getAttribute('data-theme');
        if (attr === 'light' || attr === 'dark') return attr;
        // Otherwise use system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
        return 'dark';
    }

    toggleTheme() {
        const newTheme = this.getCurrentTheme() === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }

    applyTheme(theme) {
        this.htmlEl.setAttribute('data-theme', theme);
        localStorage.setItem(this.STORAGE_KEY, theme);
        this.updateToggleIcon(theme);
        
        // Handle integration with Theme Selector palette
        if (theme === 'light') {
            this.htmlEl.style.removeProperty('--dark');
            this.htmlEl.style.removeProperty('--light');
            this.htmlEl.style.removeProperty('--text-gray');
        } else if (window.themeSelector) {
            const currentPalette = window.themeSelector.getCurrentTheme();
            window.themeSelector.applyTheme(currentPalette);
        }
    }

    updateToggleIcon(theme) {
        const icon = theme === 'light' ? 'fa-moon' : 'fa-sun';
        const title = theme === 'dark' ? 'Alternar para modo claro' : 'Alternar para modo escuro';
        
        this.toggleBtn.innerHTML = `<i class="fas ${icon}"></i>`;
        this.toggleBtn.title = title;
        this.toggleBtn.setAttribute('aria-label', title);
        this.toggleBtn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
});
