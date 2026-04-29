/**
 * Mobile Menu Handler - Manages mobile menu open/close
 */
class MobileMenuHandler {
    constructor() {
        this.menuToggle = document.querySelector('.menu-toggle');
        this.body = document.body;
        this.overlay = document.querySelector('.overlay');
        this.navLinks = document.querySelectorAll('nav ul li a');

        if (this.menuToggle) {
            this.init();
        }
    }

    init() {
        this.menuToggle.addEventListener('click', () => this.toggleMenu());
        this.menuToggle.setAttribute('aria-expanded', 'false');
        
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.closeMenu());
        }

        this.navLinks.forEach(link => {
            link.addEventListener('click', () => this.closeMenu());
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeMenu();
            }
        });
    }

    toggleMenu() {
        this.body.classList.toggle('menu-open');
        this.syncAriaState();
    }

    closeMenu() {
        this.body.classList.remove('menu-open');
        this.syncAriaState();
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
