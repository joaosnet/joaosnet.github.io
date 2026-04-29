/**
 * Animations Handler - Scroll animations and observers
 */
class AnimationsHandler {
    constructor() {
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

        window.addEventListener('scroll', updateHeaderState);
    }

    setupScrollAnimations() {
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

        document.querySelectorAll('.hidden').forEach((el) => observer.observe(el));

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

        document.querySelectorAll('.timeline-item-left, .timeline-item-right').forEach((item) => {
            timelineObserver.observe(item);
        });
    }

    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();

                const targetId = anchor.getAttribute('href');
                const targetElement = document.querySelector(targetId);

                if (targetElement) {
                    // Check if we're in horizontal scroll mode
                    const horizontalWrapper = document.querySelector('.horizontal-wrapper');
                    
                    if (horizontalWrapper && targetElement.closest('.horizontal-wrapper')) {
                        // Horizontal scroll to section
                        const scrollLeft = targetElement.offsetLeft;
                        horizontalWrapper.scrollTo({
                            left: scrollLeft,
                            behavior: 'smooth'
                        });
                        targetElement.scrollTo({
                            top: 0,
                            behavior: 'smooth'
                        });
                    } else {
                        // Traditional vertical scroll
                        const header = document.querySelector('header');
                        const headerHeight = header ? header.offsetHeight : 0;
                        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;

                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });
                    }
                    
                    // Close mobile menu if open
                    const body = document.body;
                    if (body.classList.contains('menu-open')) {
                        const mobileMenuHandler = window.mobileMenuHandler;
                        if (mobileMenuHandler) {
                            mobileMenuHandler.closeMenu();
                        }
                    }
                }
            });
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AnimationsHandler();
});
addEventListener('DOMContentLoaded', () => {
    new AnimationsHandler();
});
