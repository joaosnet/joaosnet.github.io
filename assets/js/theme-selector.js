/**
 * Theme Selector Module
 * Handles design system selection with 10 color palettes
 */

class ThemeSelector {
    constructor() {
        this.THEMES = {
            'cyber-blue': {
                name: 'Cyber Blue',
                icon: '💎',
                primary: '#3b82f6',
                secondary: '#8b5cf6',
                accent: '#06b6d4',
                dark: '#020617',
                light: '#f8fafc',
                textGray: '#94a3b8'
            },
            'sunset-orange': {
                name: 'Sunset Orange',
                icon: '🌅',
                primary: '#f97316',
                secondary: '#ef4444',
                accent: '#f59e0b',
                dark: '#1c1917',
                light: '#fef2f2',
                textGray: '#a8a29e'
            },
            'forest-green': {
                name: 'Forest Green',
                icon: '🌲',
                primary: '#10b981',
                secondary: '#059669',
                accent: '#84cc16',
                dark: '#022c22',
                light: '#f0fdf4',
                textGray: '#6b7280'
            },
            'neon-pink': {
                name: 'Neon Pink',
                icon: '💖',
                primary: '#ec4899',
                secondary: '#f43f5e',
                accent: '#d946ef',
                dark: '#1a0b2e',
                light: '#fdf2f8',
                textGray: '#9ca3af'
            },
            'golden-amber': {
                name: 'Golden Amber',
                icon: '✨',
                primary: '#eab308',
                secondary: '#f59e0b',
                accent: '#fb923c',
                dark: '#1c1917',
                light: '#fffbeb',
                textGray: '#78716c'
            },
            'ocean-teal': {
                name: 'Ocean Teal',
                icon: '🌊',
                primary: '#14b8a6',
                secondary: '#0d9488',
                accent: '#06b6d4',
                dark: '#042f2e',
                light: '#f0fdfa',
                textGray: '#64748b'
            },
            'royal-purple': {
                name: 'Royal Purple',
                icon: '👑',
                primary: '#8b5cf6',
                secondary: '#7c3aed',
                accent: '#a78bfa',
                dark: '#0f0a1e',
                light: '#faf5ff',
                textGray: '#8b8b9e'
            },
            'crimson-red': {
                name: 'Crimson Red',
                icon: '🔥',
                primary: '#ef4444',
                secondary: '#dc2626',
                accent: '#f87171',
                dark: '#1a0505',
                light: '#fef2f2',
                textGray: '#991b1b'
            },
            'midnight-blue': {
                name: 'Midnight Blue',
                icon: '🌙',
                primary: '#6366f1',
                secondary: '#4f46e5',
                accent: '#818cf8',
                dark: '#0a0e1a',
                light: '#eef2ff',
                textGray: '#6366f1'
            },
            'emerald-dream': {
                name: 'Emerald Dream',
                icon: '💚',
                primary: '#34d399',
                secondary: '#10b981',
                accent: '#6ee7b7',
                dark: '#064e3b',
                light: '#ecfdf5',
                textGray: '#059669'
            }
        };

        this.STORAGE_KEY = 'selectedTheme';
        this.FIRST_VISIT_KEY = 'hasVisitedBefore';
        this.modal = null;
        this.init();
    }

    init() {
        this.createModal();
        this.setupEventListeners();
        
        // Check if first visit
        const hasVisited = localStorage.getItem(this.FIRST_VISIT_KEY);
        if (!hasVisited) {
            this.showModal();
        } else {
            // Apply saved theme
            const savedTheme = localStorage.getItem(this.STORAGE_KEY);
            if (savedTheme && this.THEMES[savedTheme]) {
                this.applyTheme(savedTheme);
            }
        }
    }

    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'theme-selector-modal';
        this.modal.innerHTML = `
            <div class="theme-modal-overlay"></div>
            <div class="theme-modal-content">
                <button class="theme-modal-close" aria-label="Fechar">
                    <i class="fas fa-times"></i>
                </button>
                <div class="theme-modal-header">
                    <h2>Escolha seu Design System</h2>
                    <p>Selecione a paleta de cores que mais combina com você! 
                       <small>(Você pode mudar depois no botão de tema no header)</small>
                    </p>
                </div>
                <div class="theme-grid">
                    ${Object.entries(this.THEMES).map(([key, theme]) => this.createThemeCard(key, theme)).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(this.modal);
    }

    createThemeCard(key, theme) {
        return `
            <div class="theme-card" data-theme="${key}">
                <div class="theme-preview">
                    <div class="theme-preview-circle" style="background: linear-gradient(135deg, ${theme.primary}, ${theme.secondary});"></div>
                    <span class="theme-icon">${theme.icon}</span>
                </div>
                <h3>${theme.name}</h3>
                <div class="theme-colors">
                    <span class="color-dot" style="background: ${theme.primary};"></span>
                    <span class="color-dot" style="background: ${theme.secondary};"></span>
                    <span class="color-dot" style="background: ${theme.accent};"></span>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Close button
        const closeBtn = this.modal.querySelector('.theme-modal-close');
        closeBtn.addEventListener('click', () => this.closeModal());

        // Overlay click
        const overlay = this.modal.querySelector('.theme-modal-overlay');
        overlay.addEventListener('click', () => this.closeModal());

        // Theme card clicks
        const themeCards = this.modal.querySelectorAll('.theme-card');
        themeCards.forEach(card => {
            card.addEventListener('click', async () => {
                const theme = card.dataset.theme;
                
                // Visual feedback
                themeCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                // Small delay for animation
                await new Promise(resolve => setTimeout(resolve, 200));
                
                this.selectTheme(theme);
            });
        });

        // Add theme selector button to header (next to theme toggle)
        this.addThemeSelectorButton();
    }

    addThemeSelectorButton() {
        const header = document.querySelector('header .header-content');
        if (header) {
            const btn = document.createElement('button');
            btn.className = 'theme-selector-btn';
            btn.setAttribute('aria-label', 'Selecionar tema');
            btn.setAttribute('title', 'Selecionar tema');
            btn.innerHTML = '<i class="fas fa-palette"></i>';
            btn.addEventListener('click', () => this.showModal());
            header.insertBefore(btn, document.querySelector('.theme-toggle'));
        }
    }

    showModal() {
        // Mark current theme as selected
        const currentTheme = this.getCurrentTheme();
        const themeCards = this.modal.querySelectorAll('.theme-card');
        themeCards.forEach(card => {
            if (card.dataset.theme === currentTheme) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
        
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        // Mark as visited
        localStorage.setItem(this.FIRST_VISIT_KEY, 'true');
    }

    selectTheme(themeKey) {
        if (this.THEMES[themeKey]) {
            this.applyTheme(themeKey);
            localStorage.setItem(this.STORAGE_KEY, themeKey);
            this.closeModal();
        }
    }

    applyTheme(themeKey) {
        const theme = this.THEMES[themeKey];
        if (!theme) return;

        const root = document.documentElement;
        root.style.setProperty('--primary', theme.primary);
        root.style.setProperty('--secondary', theme.secondary);
        root.style.setProperty('--accent', theme.accent);
        root.style.setProperty('--dark', theme.dark);
        root.style.setProperty('--light', theme.light);
        root.style.setProperty('--text-gray', theme.textGray);

        // Update theme toggle icon to match
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                // Check if it's a light theme
                const isLight = theme.light === '#fef2f2' || theme.light === '#f0fdf4' || 
                               theme.light === '#fdf2f8' || theme.light === '#fffbeb' ||
                               theme.light === '#f0fdfa' || theme.light === '#faf5ff' ||
                               theme.light === '#eef2ff' || theme.light === '#ecfdf5';
                icon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';
            }
        }

        // Store current theme
        localStorage.setItem(this.STORAGE_KEY, themeKey);
    }

    getCurrentTheme() {
        return localStorage.getItem(this.STORAGE_KEY) || 'cyber-blue';
    }
}

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.themeSelector = new ThemeSelector();
});
