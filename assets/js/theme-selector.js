/**
/**
 * Theme Selector Module
 * Handles design system selection with 14 color palettes
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
                textGray: '#94a3b8',
                accentTextLight: '#0284c7',
                primaryTextLight: '#1d4ed8'
            },
            'dracula': {
                name: 'Dracula',
                icon: '🧛',
                primary: '#bd93f9',
                secondary: '#ff79c6',
                accent: '#8be9fd',
                dark: '#282a36',
                light: '#f8f8f2',
                textGray: '#bfbfbf',
                accentTextLight: '#0891b2',
                primaryTextLight: '#7c3aed'
            },
            'tokyo-night': {
                name: 'Tokyo Night',
                icon: '🗼',
                primary: '#7aa2f7',
                secondary: '#bb9af7',
                accent: '#7dcfff',
                dark: '#1a1b26',
                light: '#c0caf5',
                textGray: '#9aa5ce',
                accentTextLight: '#0284c7',
                primaryTextLight: '#2563eb'
            },
            'nord': {
                name: 'Nord Arctic',
                icon: '❄️',
                primary: '#88c0d0',
                secondary: '#81a1c1',
                accent: '#5e81ac',
                dark: '#2e3440',
                light: '#eceff4',
                textGray: '#d8dee9',
                accentTextLight: '#2b6cb0',
                primaryTextLight: '#0284c7'
            },
            'catppuccin-mocha': {
                name: 'Catppuccin Mocha',
                icon: '🐱',
                primary: '#cba6f7',
                secondary: '#f38ba8',
                accent: '#89dceb',
                dark: '#1e1e2e',
                light: '#cdd6f4',
                textGray: '#a6adc8',
                accentTextLight: '#0284c7',
                primaryTextLight: '#7c3aed'
            },
            'amoled-black': {
                name: 'AMOLED Pure Black',
                icon: '🖤',
                primary: '#38bdf8',
                secondary: '#818cf8',
                accent: '#f43f5e',
                dark: '#000000',
                light: '#f8fafc',
                textGray: '#a1a1aa',
                accentTextLight: '#e11d48',
                primaryTextLight: '#0284c7'
            },
            'synthwave': {
                name: 'Synthwave 80s',
                icon: '🌆',
                primary: '#ff007f',
                secondary: '#00f0ff',
                accent: '#ffb800',
                dark: '#1a102f',
                light: '#fdf4ff',
                textGray: '#d8b4e2',
                accentTextLight: '#b45309',
                primaryTextLight: '#c026d3'
            },
            'sunset-orange': {
                name: 'Pôr do Sol',
                icon: '🌅',
                primary: '#f97316',
                secondary: '#ef4444',
                accent: '#f59e0b',
                dark: '#1c1917',
                light: '#fef2f2',
                textGray: '#a8a29e',
                accentTextLight: '#b45309',
                primaryTextLight: '#c2410c'
            },
            'forest-green': {
                name: 'Verde Floresta',
                icon: '🌲',
                primary: '#10b981',
                secondary: '#059669',
                accent: '#84cc16',
                dark: '#022c22',
                light: '#f0fdf4',
                textGray: '#6b7280',
                accentTextLight: '#4d7c0f',
                primaryTextLight: '#047857'
            },
            'neon-pink': {
                name: 'Rosa Neon',
                icon: '💖',
                primary: '#ec4899',
                secondary: '#f43f5e',
                accent: '#d946ef',
                dark: '#1a0b2e',
                light: '#fdf2f8',
                textGray: '#9ca3af',
                accentTextLight: '#a21caf',
                primaryTextLight: '#be185d'
            },
            'golden-amber': {
                name: 'Âmbar Dourado',
                icon: '✨',
                primary: '#eab308',
                secondary: '#f59e0b',
                accent: '#fb923c',
                dark: '#1c1917',
                light: '#fffbeb',
                textGray: '#78716c',
                accentTextLight: '#c2410c',
                primaryTextLight: '#a16207'
            },
            'ocean-teal': {
                name: 'Azul Oceano',
                icon: '🌊',
                primary: '#14b8a6',
                secondary: '#0d9488',
                accent: '#06b6d4',
                dark: '#042f2e',
                light: '#f0fdfa',
                textGray: '#64748b',
                accentTextLight: '#0e7490',
                primaryTextLight: '#0f766e'
            },
            'royal-purple': {
                name: 'Roxo Real',
                icon: '👑',
                primary: '#8b5cf6',
                secondary: '#7c3aed',
                accent: '#a78bfa',
                dark: '#0f0a1e',
                light: '#faf5ff',
                textGray: '#8b8b9e',
                accentTextLight: '#6d28d9',
                primaryTextLight: '#6d28d9'
            },
            'crimson-red': {
                name: 'Vermelho Intenso',
                icon: '🔥',
                primary: '#ef4444',
                secondary: '#dc2626',
                accent: '#f87171',
                dark: '#1a0505',
                light: '#fef2f2',
                textGray: '#991b1b',
                accentTextLight: '#b91c1c',
                primaryTextLight: '#b91c1c'
            }
        };

        this.STORAGE_KEY = 'selectedTheme';
        this.FIRST_VISIT_KEY = 'hasVisitedBefore';
        this.HINT_DISMISSED_KEY = 'themeHintDismissed';
        this.modal = null;
        this.previouslyFocusedElement = null;
        this.openedFromFirstVisit = false;
        this.selectorButton = null;
        this.hintElement = null;
        this.init();
    }

    init() {
        this.createModal();
        this.setupEventListeners();
        
        // Apply saved palette quietly or default to amoled-black
        const savedTheme = this.getCurrentTheme();
        this.applyTheme(savedTheme);
        localStorage.setItem(this.FIRST_VISIT_KEY, 'true');
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
                       <small>Você pode mudar isso depois pelo menu ou botão de paleta.</small>
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
        const isSelected = key === this.getCurrentTheme();
        return `
            <button type="button" class="theme-card ${isSelected ? 'selected' : ''}" 
                    data-theme="${key}"
                    role="option"
                    aria-pressed="${isSelected}"
                    aria-label="Paleta ${theme.name}">
                <div class="theme-preview-circle" style="background: linear-gradient(135deg, ${theme.primary}, ${theme.secondary});"></div>
                <h3>${theme.name}</h3>
                <div class="theme-colors">
                    <span class="color-dot" style="background: ${theme.primary};" title="Primária"></span>
                    <span class="color-dot" style="background: ${theme.secondary};" title="Secundária"></span>
                    <span class="color-dot" style="background: ${theme.accent};" title="Destaque"></span>
                </div>
            </button>
        `;
    }

    setupEventListeners() {
        // Modal overlay and close button
        this.modal.querySelector('.theme-modal-overlay').addEventListener('click', () => this.closeModal());
        this.modal.querySelector('.theme-modal-close').addEventListener('click', () => this.closeModal());

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
        const toggleBtn = document.getElementById('theme-toggle');
        const container = toggleBtn ? toggleBtn.parentElement : document.querySelector('header .header-actions') || document.querySelector('header .header-content');
        if (container && !document.querySelector('.theme-selector-btn')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'theme-selector-wrapper';

            const btn = document.createElement('button');
            btn.className = 'theme-selector-btn';
            btn.type = 'button';
            btn.setAttribute('aria-label', 'Selecionar tema');
            btn.setAttribute('title', 'Selecionar tema');
            btn.innerHTML = '<i class="fas fa-palette" aria-hidden="true"></i>';
            btn.addEventListener('click', () => {
                this.dismissHint();
                this.showModal();
            });
            this.selectorButton = btn;
            this.updateSelectorButtonLabel();

            wrapper.appendChild(btn);

            // Add visual hint for new users if not dismissed
            const isDismissed = localStorage.getItem(this.HINT_DISMISSED_KEY) === 'true';
            if (!isDismissed) {
                const hint = document.createElement('div');
                hint.className = 'theme-hint-tooltip';
                hint.id = 'theme-hint-tooltip';
                hint.setAttribute('role', 'tooltip');
                hint.innerHTML = `
                    <span class="hint-pulse-dot"></span>
                    <span class="hint-label">Personalize as cores</span>
                    <button type="button" class="hint-close-btn" aria-label="Fechar dica de cores">&times;</button>
                `;
                hint.addEventListener('click', (e) => {
                    if (e.target.closest('.hint-close-btn')) {
                        e.stopPropagation();
                        this.dismissHint();
                    } else {
                        this.dismissHint();
                        this.showModal();
                    }
                });
                wrapper.appendChild(hint);
                this.hintElement = hint;
            }

            if (toggleBtn) {
                container.insertBefore(wrapper, toggleBtn);
            } else {
                container.appendChild(wrapper);
            }
        }
    }

    dismissHint() {
        localStorage.setItem(this.HINT_DISMISSED_KEY, 'true');
        if (this.hintElement) {
            this.hintElement.classList.add('fade-out');
            setTimeout(() => {
                this.hintElement?.remove();
                this.hintElement = null;
            }, 300);
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
            this.dismissHint();
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
        this.dismissHint();
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
        const theme = this.THEMES[themeKey] || this.THEMES['cyber-blue'];
        if (!theme) return;

        const root = document.documentElement;
        const isLight = root.getAttribute('data-theme') === 'light';

        root.style.setProperty('--primary', theme.primary);
        root.style.setProperty('--secondary', theme.secondary);
        root.style.setProperty('--accent', theme.accent);

        if (!isLight) {
            root.style.setProperty('--dark', theme.dark);
            root.style.setProperty('--light', theme.light);
            root.style.setProperty('--text-gray', theme.textGray);
            root.style.setProperty('--primary-text', theme.primary);
            root.style.setProperty('--accent-text', theme.accent);
        } else {
            root.style.removeProperty('--dark');
            root.style.removeProperty('--light');
            root.style.removeProperty('--text-gray');
            root.style.setProperty('--primary-text', theme.primaryTextLight || theme.primary);
            root.style.setProperty('--accent-text', theme.accentTextLight || theme.accent);
        }

        // Store current theme
        localStorage.setItem(this.STORAGE_KEY, themeKey);
        this.updateSelectorButtonLabel(themeKey);

        // Dispatch custom event for reactive elements (like particles.js)
        try {
            window.dispatchEvent(new CustomEvent('themePaletteChanged', {
                detail: { themeKey, theme, isLight }
            }));
            if (typeof window.trackPortfolioEvent === 'function') {
                window.trackPortfolioEvent('change_palette', { palette: themeKey });
            }
        } catch (e) {
            // ignore
        }
    }

    getCurrentTheme() {
        return localStorage.getItem(this.STORAGE_KEY) || 'amoled-black';
    }

    updateSelectedThemeCard(themeKey) {
        this.modal.querySelectorAll('.theme-card').forEach((card) => {
            const isSelected = card.dataset.theme === themeKey;
            card.classList.toggle('selected', isSelected);
            card.setAttribute('aria-pressed', String(isSelected));
        });
    }

    updateSelectorButtonLabel(themeKey = this.getCurrentTheme()) {
        if (!this.selectorButton) {
            return;
        }

        const theme = this.THEMES[themeKey] || this.THEMES['amoled-black'];
        const label = `Selecionar paleta. Atual: ${theme.name}`;
        this.selectorButton.setAttribute('aria-label', label);
        this.selectorButton.setAttribute('title', label);
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
