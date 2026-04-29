/**
 * Mobile Menu Handler - Manages mobile menu open/close
 */
class MobileMenuHandler {
    constructor() {
        this.menuToggle = document.querySelector('.menu-toggle');
        this.body = document.body;
        this.overlay = document.querySelector('.overlay');
        this.navLinks = document.querySelectorAll('nav ul li a');
        this.firstNavLink = this.navLinks[0] || null;
        this.lastFocusedElement = null;

        if (this.menuToggle) {
            this.init();
        }
    }

    init() {
        this.menuToggle.addEventListener('click', () => this.toggleMenu());
        this.menuToggle.setAttribute('aria-expanded', 'false');
        
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.closeMenu({ restoreFocus: true }));
        }

        this.navLinks.forEach(link => {
            link.addEventListener('click', () => this.closeMenu());
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeMenu({ restoreFocus: true });
            }
        });
    }

    toggleMenu() {
        if (this.body.classList.contains('menu-open')) {
            this.closeMenu({ restoreFocus: true });
            return;
        }

        this.openMenu();
    }

    openMenu() {
        this.lastFocusedElement = document.activeElement;
        this.body.classList.add('menu-open');
        this.syncAriaState();

        if (this.firstNavLink) {
            window.setTimeout(() => this.firstNavLink.focus(), 120);
        }
    }

    closeMenu(options = {}) {
        const wasOpen = this.body.classList.contains('menu-open');

        this.body.classList.remove('menu-open');
        this.syncAriaState();

        if (wasOpen && options.restoreFocus) {
            const target = this.lastFocusedElement instanceof HTMLElement
                ? this.lastFocusedElement
                : this.menuToggle;

            window.setTimeout(() => target.focus(), 0);
        }
    }

    syncAriaState() {
        const isOpen = this.body.classList.contains('menu-open');
        this.menuToggle.setAttribute('aria-expanded', String(isOpen));
        this.menuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.mobileMenuHandler = new MobileMenuHandler();
});
