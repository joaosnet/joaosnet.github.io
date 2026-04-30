/**
 * Theme Selector Module
 * Handles design system selection with 10 color palettes
 */

class ThemeSelector {
    constructor() {
        this.THEMES = {
            'cyber-blue': {
                name: 'Azul Cyber',
                icon: '💎',
                primary: '#3b82f6',
                secondary: '#8b5cf6',
                accent: '#06b6d4',
                dark: '#020617',
                light: '#f8fafc',
                textGray: '#94a3b8'
            },
            'sunset-orange': {
                name: 'Pôr do Sol',
                icon: '🌅',
                primary: '#f97316',
                secondary: '#ef4444',
                accent: '#f59e0b',
                dark: '#1c1917',
                light: '#fef2f2',
                textGray: '#a8a29e'
            },
            'forest-green': {
                name: 'Verde Floresta',
                icon: '🌲',
                primary: '#10b981',
                secondary: '#059669',
                accent: '#84cc16',
                dark: '#022c22',
                light: '#f0fdf4',
                textGray: '#6b7280'
            },
            'neon-pink': {
                name: 'Rosa Neon',
                icon: '💖',
                primary: '#ec4899',
                secondary: '#f43f5e',
                accent: '#d946ef',
                dark: '#1a0b2e',
                light: '#fdf2f8',
                textGray: '#9ca3af'
            },
            'golden-amber': {
                name: 'Âmbar Dourado',
                icon: '✨',
                primary: '#eab308',
                secondary: '#f59e0b',
                accent: '#fb923c',
                dark: '#1c1917',
                light: '#fffbeb',
                textGray: '#78716c'
            },
            'ocean-teal': {
                name: 'Azul Oceano',
                icon: '🌊',
                primary: '#14b8a6',
                secondary: '#0d9488',
                accent: '#06b6d4',
                dark: '#042f2e',
                light: '#f0fdfa',
                textGray: '#64748b'
            },
            'royal-purple': {
                name: 'Roxo Real',
                icon: '👑',
                primary: '#8b5cf6',
                secondary: '#7c3aed',
                accent: '#a78bfa',
                dark: '#0f0a1e',
                light: '#faf5ff',
                textGray: '#8b8b9e'
            },
            'crimson-red': {
                name: 'Vermelho Intenso',
                icon: '🔥',
                primary: '#ef4444',
                secondary: '#dc2626',
                accent: '#f87171',
                dark: '#1a0505',
                light: '#fef2f2',
                textGray: '#991b1b'
            },
            'midnight-blue': {
                name: 'Azul Meia-noite',
                icon: '🌙',
                primary: '#6366f1',
                secondary: '#4f46e5',
                accent: '#818cf8',
                dark: '#0a0e1a',
                light: '#eef2ff',
                textGray: '#6366f1'
            },
            'emerald-dream': {
                name: 'Verde Esmeralda',
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
        this.previouslyFocusedElement = null;
        this.openedFromFirstVisit = false;
        this.init();
    }

    init() {
        this.createModal();
        this.setupEventListeners();
        
        // Apply saved palette quietly, then invite first-time visitors to choose one.
        const savedTheme = localStorage.getItem(this.STORAGE_KEY);
        if (savedTheme && this.THEMES[savedTheme]) {
            this.applyTheme(savedTheme);
            localStorage.setItem(this.FIRST_VISIT_KEY, 'true');
        }

        this.promptFirstVisitPalette();
    }

    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'theme-selector-modal';
        this.modal.setAttribute('aria-hidden', 'true');
        this.modal.innerHTML = `
            <div class="theme-modal-overlay"></div>
            <div class="theme-modal-content" role="dialog" aria-modal="true" aria-labelledby="theme-modal-title" aria-describedby="theme-modal-description">
                <button class="theme-modal-close" aria-label="Fechar">
                    <i class="fas fa-times" aria-hidden="true"></i>
                </button>
                <div class="theme-modal-header">
                    <h2 id="theme-modal-title">Escolha sua paleta</h2>
                    <p id="theme-modal-description">Selecione uma combinação de cores para personalizar o portfólio.
                       <small>Você pode mudar isso depois pelo menu.</small>
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
            <button type="button" class="theme-card" data-theme="${key}" aria-label="Aplicar paleta ${theme.name}" aria-pressed="false">
                <div class="theme-preview">
                    <div class="theme-preview-circle" style="background: linear-gradient(135deg, ${theme.primary}, ${theme.secondary});"></div>
                    <span class="theme-icon" aria-hidden="true">${theme.icon}</span>
                </div>
                <h3>${theme.name}</h3>
                <div class="theme-colors">
                    <span class="color-dot" style="background: ${theme.primary};"></span>
                    <span class="color-dot" style="background: ${theme.secondary};"></span>
                    <span class="color-dot" style="background: ${theme.accent};"></span>
                </div>
            </button>
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

        this.modal.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeModal();
                return;
            }

            if (event.key === 'Tab') {
                this.keepFocusInsideModal(event);
            }
        });

        // Add theme selector button to header (next to theme toggle)
        this.addThemeSelectorButton();
        this.addThemeSelectorMenuButton();
    }

    addThemeSelectorButton() {
        const header = document.querySelector('header .header-content');
        if (header && !header.querySelector('.theme-selector-btn')) {
            const btn = document.createElement('button');
            btn.className = 'theme-selector-btn';
            btn.type = 'button';
            btn.setAttribute('aria-label', 'Selecionar tema');
            btn.setAttribute('title', 'Selecionar tema');
            btn.innerHTML = '<i class="fas fa-palette" aria-hidden="true"></i>';
            btn.addEventListener('click', () => this.showModal());
            header.insertBefore(btn, document.querySelector('.theme-toggle'));
        }
    }

    addThemeSelectorMenuButton() {
        const navList = document.querySelector('header nav ul');

        if (!navList || navList.querySelector('.theme-selector-menu-item')) {
            return;
        }

        const item = document.createElement('li');
        item.className = 'theme-selector-menu-item';
        item.innerHTML = `
            <button type="button" class="theme-selector-menu-btn">
                <i class="fas fa-palette" aria-hidden="true"></i>
                <span>Paleta de cores</span>
            </button>
        `;

        item.querySelector('button').addEventListener('click', () => {
            window.mobileMenuHandler?.closeMenu();
            this.showModal();
        });

        navList.appendChild(item);
    }

    promptFirstVisitPalette() {
        const hasVisitedBefore = localStorage.getItem(this.FIRST_VISIT_KEY) === 'true';
        const hasSelectedTheme = Boolean(localStorage.getItem(this.STORAGE_KEY));

        if (hasVisitedBefore || hasSelectedTheme) {
            return;
        }

        window.setTimeout(() => {
            this.showModal({ firstVisit: true });
        }, 700);
    }

    showModal(options = {}) {
        this.previouslyFocusedElement = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        this.openedFromFirstVisit = Boolean(options.firstVisit);

        // Mark current theme as selected
        const currentTheme = this.getCurrentTheme();
        const themeCards = this.modal.querySelectorAll('.theme-card');
        themeCards.forEach(card => {
            const isSelected = card.dataset.theme === currentTheme;
            card.classList.toggle('selected', isSelected);
            card.setAttribute('aria-pressed', String(isSelected));
        });
        
        this.modal.classList.add('active');
        this.modal.classList.toggle('theme-selector-modal--first-visit', this.openedFromFirstVisit);
        this.modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('theme-modal-open');
        document.body.style.overflow = 'hidden';

        const selectedCard = this.modal.querySelector('.theme-card.selected');
        const closeBtn = this.modal.querySelector('.theme-modal-close');
        window.setTimeout(() => (selectedCard || closeBtn)?.focus(), 50);
    }

    closeModal() {
        this.modal.classList.remove('active');
        this.modal.classList.remove('theme-selector-modal--first-visit');
        this.modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('theme-modal-open');
        document.body.style.overflow = '';
        this.openedFromFirstVisit = false;

        if (this.previouslyFocusedElement) {
            this.previouslyFocusedElement.focus();
        }

        // Mark as visited
        localStorage.setItem(this.FIRST_VISIT_KEY, 'true');
    }

    selectTheme(themeKey) {
        if (this.THEMES[themeKey]) {
            this.applyTheme(themeKey);
            localStorage.setItem(this.STORAGE_KEY, themeKey);
            this.updateSelectedThemeCard(themeKey);
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

        if (root.getAttribute('data-theme') !== 'light') {
            root.style.setProperty('--dark', theme.dark);
            root.style.setProperty('--light', theme.light);
            root.style.setProperty('--text-gray', theme.textGray);
        }

        // Store current theme
        localStorage.setItem(this.STORAGE_KEY, themeKey);
    }

    getCurrentTheme() {
        return localStorage.getItem(this.STORAGE_KEY) || 'cyber-blue';
    }

    updateSelectedThemeCard(themeKey) {
        this.modal.querySelectorAll('.theme-card').forEach((card) => {
            const isSelected = card.dataset.theme === themeKey;
            card.classList.toggle('selected', isSelected);
            card.setAttribute('aria-pressed', String(isSelected));
        });
    }

    keepFocusInsideModal(event) {
        const focusableElements = Array.from(this.modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )).filter((element) => !element.disabled && element.offsetParent !== null);

        if (!focusableElements.length) {
            return;
        }

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
            return;
        }

        if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }
}

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.themeSelector = new ThemeSelector();
});
