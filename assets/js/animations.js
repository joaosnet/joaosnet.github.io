/**
 * Animations Handler - Scroll animations and observers
 */
class AnimationsHandler {
    constructor() {
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.init();
    }

    init() {
        this.setupScrollAnimations();
        this.setupHeaderScrollEffect();
        this.setupSmoothScrolling();
    }

    setupHeaderScrollEffect() {
        const header = document.querySelector('header');
        if (!header) return;

        const updateHeaderState = () => {
            const horizontalScroll = window.scrollX || document.documentElement.scrollLeft;
            if (window.scrollY > 50 || horizontalScroll > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        };

        window.addEventListener('scroll', updateHeaderState, { passive: true });
        updateHeaderState();
    }

    setupScrollAnimations() {
        const hiddenElements = document.querySelectorAll('.hidden');
        const timelineItems = document.querySelectorAll('.timeline-item-left, .timeline-item-right');

        if (!('IntersectionObserver' in window) || this.prefersReducedMotion.matches) {
            hiddenElements.forEach((el) => el.classList.add('show'));
            timelineItems.forEach((item) => item.classList.add('show'));
            return;
        }

        // Observer for hidden elements
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('show');
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        });

        hiddenElements.forEach((el) => observer.observe(el));

        // Observer for timeline items
        const timelineObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('show');
                }
            });
        }, {
            threshold: 0.2,
            rootMargin: '0px'
        });

        timelineItems.forEach((item) => timelineObserver.observe(item));
    }

    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const targetId = anchor.getAttribute('href');
                const targetElement = this.getTargetElement(targetId);

                if (!targetElement) {
                    return;
                }

                e.preventDefault();
                this.scrollToTarget(targetElement);
                this.updateUrlHash(targetId);
                this.focusTarget(targetElement);
                this.closeMobileMenu();
            });
        });
    }

    getTargetElement(targetId) {
        if (!targetId || targetId === '#') {
            return null;
        }

        try {
            return document.querySelector(targetId);
        } catch (error) {
            return null;
        }
    }

    scrollToTarget(targetElement) {
        const horizontalWrapper = document.querySelector('.horizontal-wrapper');
        const targetSection = targetElement.matches('section')
            ? targetElement
            : targetElement.closest('.horizontal-wrapper > section');

        if (horizontalWrapper && targetSection && targetElement.closest('.horizontal-wrapper')) {
            const sections = Array.from(horizontalWrapper.querySelectorAll('section'));
            const sectionIndex = sections.indexOf(targetSection);

            if (window.horizontalScroll && typeof window.horizontalScroll.scrollToSection === 'function' && sectionIndex >= 0) {
                window.horizontalScroll.scrollToSection(sectionIndex);
                return;
            }

            window.scrollTo({
                left: targetSection.offsetLeft,
                top: 0,
                behavior: this.getScrollBehavior()
            });
            return;
        }

        const header = document.querySelector('header');
        const headerHeight = header ? header.offsetHeight : 0;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;

        window.scrollTo({
            top: targetPosition,
            behavior: this.getScrollBehavior()
        });
    }

    getScrollBehavior() {
        return this.prefersReducedMotion.matches ? 'auto' : 'smooth';
    }

    updateUrlHash(targetId) {
        if (!targetId || !window.history || !window.history.pushState) {
            return;
        }

        try {
            window.history.pushState(null, '', targetId);
        } catch (error) {
            // Some embedded browsers can reject history updates.
        }
    }

    focusTarget(targetElement) {
        const delay = this.prefersReducedMotion.matches ? 0 : 450;
        const isNaturallyFocusable = /^(A|BUTTON|INPUT|TEXTAREA|SELECT)$/.test(targetElement.tagName);
        const hadTabindex = targetElement.hasAttribute('tabindex');

        if (!isNaturallyFocusable && !hadTabindex) {
            targetElement.setAttribute('tabindex', '-1');
        }

        window.setTimeout(() => {
            targetElement.focus({ preventScroll: true });

            if (!hadTabindex) {
                targetElement.addEventListener('blur', () => {
                    targetElement.removeAttribute('tabindex');
                }, { once: true });
            }
        }, delay);
    }

    closeMobileMenu() {
        if (!document.body.classList.contains('menu-open')) {
            return;
        }

        const mobileMenuHandler = window.mobileMenuHandler;
        if (mobileMenuHandler) {
            mobileMenuHandler.closeMenu();
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.animationsHandler = new AnimationsHandler();
});
