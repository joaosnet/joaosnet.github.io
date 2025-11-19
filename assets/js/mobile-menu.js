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
        
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.closeMenu());
        }

        this.navLinks.forEach(link => {
            link.addEventListener('click', () => this.closeMenu());
        });
    }

    toggleMenu() {
        this.body.classList.toggle('menu-open');
    }

    closeMenu() {
        this.body.classList.remove('menu-open');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new MobileMenuHandler();
});
