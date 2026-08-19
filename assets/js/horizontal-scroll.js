/**
 * Navigation & Vertical Scroll Manager
 * Handles smooth scrolling, active section tracking, progress bar, and floating controls
 */

class ScrollNavigationHandler {
    constructor() {
        this.sections = [];
        this.navLinks = [];
        this.progressBar = document.getElementById('scroll-progress');
        this.backToTopBtn = document.getElementById('back-to-top');
        this.header = document.querySelector('header');
        this.currentSectionIndex = 0;
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.isNavigating = false;

        this.init();
    }

    init() {
        this.refreshSections();
        this.refreshNavLinks();

        if (this.sections.length === 0) {
            return;
        }

        this.setupScrollListener();
        this.setupSectionObserver();
        this.setupAnchorClicks();
        this.setupBackToTop();
        this.setupKeyboardNavigation();
        this.handleInitialHash();

        this.updateActiveSection();
        this.updateProgressBar();
    }

    refreshSections() {
        this.sections = Array.from(document.querySelectorAll('main > section'));
        if (this.sections.length === 0) {
            this.sections = Array.from(document.querySelectorAll('section'));
        }
    }

    refreshNavLinks() {
        this.navLinks = Array.from(document.querySelectorAll('header nav a[href^="#"], footer a[href^="#"], .logo[href^="#"]'));
    }

    getHeaderHeight() {
        return this.header ? this.header.offsetHeight : 76;
    }

    setupScrollListener() {
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    this.updateProgressBar();
                    this.updateBackToTopVisibility();
                    if (!this.isNavigating) {
                        this.updateActiveSectionByScroll();
                    }
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    updateProgressBar() {
        if (!this.progressBar) return;
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
        
        if (maxScrollY <= 0) {
            this.progressBar.style.transform = 'scaleX(0)';
            return;
        }

        const percentage = Math.max(0, Math.min(1, scrollY / maxScrollY));
        this.progressBar.style.transform = `scaleX(${percentage})`;
    }

    updateBackToTopVisibility() {
        if (!this.backToTopBtn) return;
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        if (scrollY > 400) {
            this.backToTopBtn.classList.add('visible');
        } else {
            this.backToTopBtn.classList.remove('visible');
        }
    }

    setupBackToTop() {
        if (!this.backToTopBtn) return;

        this.backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: this.prefersReducedMotion.matches ? 'auto' : 'smooth'
            });

            if (window.history && window.history.replaceState) {
                try {
                    window.history.replaceState(null, '', window.location.pathname + window.location.search);
                } catch (e) {}
            }
        });
    }

    setupSectionObserver() {
        if (!('IntersectionObserver' in window)) return;

        const observer = new IntersectionObserver((entries) => {
            if (this.isNavigating) return;

            const intersecting = entries
                .filter(entry => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

            if (intersecting.length > 0) {
                const target = intersecting[0].target;
                const index = this.sections.indexOf(target);
                if (index >= 0) {
                    this.setActiveSection(index, false);
                }
            }
        }, {
            root: null,
            rootMargin: `-${this.getHeaderHeight()}px 0px -40% 0px`,
            threshold: [0.1, 0.3, 0.6]
        });

        this.sections.forEach(section => observer.observe(section));
    }

    updateActiveSectionByScroll() {
        const scrollPosition = (window.scrollY || document.documentElement.scrollTop) + this.getHeaderHeight() + 60;
        let activeIndex = 0;

        for (let i = 0; i < this.sections.length; i++) {
            const section = this.sections[i];
            const sectionTop = section.offsetTop;
            if (scrollPosition >= sectionTop) {
                activeIndex = i;
            }
        }

        this.setActiveSection(activeIndex, false);
    }

    updateActiveSection() {
        this.updateActiveSectionByScroll();
    }

    setActiveSection(index, updateHistory = false) {
        if (index < 0 || index >= this.sections.length) return;
        this.currentSectionIndex = index;
        const currentSection = this.sections[index];
        const sectionId = currentSection ? currentSection.id : '';

        // Update nav links
        const targetHash = sectionId ? `#${sectionId}` : '';
        this.navLinks.forEach(link => {
            const isMatch = link.getAttribute('href') === targetHash;
            link.classList.toggle('active', isMatch);
            if (isMatch) {
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
        });

        if (updateHistory && sectionId && window.history && window.history.replaceState) {
            try {
                window.history.replaceState(null, '', `#${sectionId}`);
            } catch (e) {}
        }
    }

    scrollToSection(indexOrId, options = {}) {
        let targetElement = null;

        if (typeof indexOrId === 'number') {
            targetElement = this.sections[indexOrId] || null;
        } else if (typeof indexOrId === 'string') {
            const cleanId = indexOrId.startsWith('#') ? indexOrId : `#${indexOrId}`;
            try {
                targetElement = document.querySelector(cleanId);
            } catch (e) {}
        }

        if (!targetElement) return;

        const headerHeight = this.getHeaderHeight();
        const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = Math.max(0, elementPosition - headerHeight + 1);

        this.isNavigating = true;
        const behavior = options.behavior || (this.prefersReducedMotion.matches ? 'auto' : 'smooth');

        window.scrollTo({
            top: offsetPosition,
            behavior
        });

        const targetIndex = this.sections.indexOf(targetElement);
        if (targetIndex >= 0) {
            this.setActiveSection(targetIndex, options.updateHash !== false);
        }

        window.setTimeout(() => {
            this.isNavigating = false;
        }, 600);
    }

    next() {
        if (this.currentSectionIndex < this.sections.length - 1) {
            this.scrollToSection(this.currentSectionIndex + 1);
        }
    }

    previous() {
        if (this.currentSectionIndex > 0) {
            this.scrollToSection(this.currentSectionIndex - 1);
        }
    }

    setupAnchorClicks() {
        document.addEventListener('click', (event) => {
            const anchor = event.target.closest('a[href^="#"]');
            if (!anchor) return;

            const href = anchor.getAttribute('href');
            if (!href || href === '#') return;

            let targetElement = null;
            try {
                targetElement = document.querySelector(href);
            } catch (e) {
                return;
            }

            if (!targetElement) return;

            event.preventDefault();
            this.scrollToSection(href, { updateHash: true });

            if (window.mobileMenuHandler) {
                window.mobileMenuHandler.closeMenu();
            }
        });
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (event) => {
            const activeEl = document.activeElement;
            const isTyping = activeEl && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName);
            if (isTyping || event.altKey || event.ctrlKey || event.metaKey) return;

            if (event.key === 'Home') {
                event.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else if (event.key === 'End') {
                event.preventDefault();
                window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
            }
        });
    }

    handleInitialHash() {
        const hash = window.__initialPortfolioHash || window.location.hash;
        if (!hash || hash === '#') return;

        window.setTimeout(() => {
            this.scrollToSection(hash, { behavior: 'auto', updateHash: false });
        }, 100);
    }
}

// Backwards compatibility for external references
window.HorizontalScrollHandler = ScrollNavigationHandler;

document.addEventListener('DOMContentLoaded', () => {
    window.horizontalScroll = new ScrollNavigationHandler();
});
