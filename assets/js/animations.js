/**
 * Animations Handler - Scroll animations and observers
 */
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
        this.setup3DTilt();
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

        // Observer for hidden elements with staggered delay
        const observer = new IntersectionObserver((entries) => {
            let delay = 0;
            // Sort intersecting entries horizontally and vertically to stagger animations nicely
            const visibleEntries = entries
                .filter(entry => entry.isIntersecting)
                .sort((a, b) => {
                    const rectA = a.target.getBoundingClientRect();
                    const rectB = b.target.getBoundingClientRect();
                    return (rectA.left - rectB.left) || (rectA.top - rectB.top);
                });

            visibleEntries.forEach((entry) => {
                const el = entry.target;
                if (!el.classList.contains('show')) {
                    setTimeout(() => {
                        el.classList.add('show');
                    }, delay);
                    delay += 100; // Increment delay for stagger effect
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 100px -30px 100px' // Expanded horizontal margin for horizontal scrolling
        });

        hiddenElements.forEach((el) => observer.observe(el));

        // Observer for timeline items
        const timelineObserver = new IntersectionObserver((entries) => {
            let delay = 0;
            const visibleEntries = entries
                .filter(entry => entry.isIntersecting)
                .sort((a, b) => {
                    const rectA = a.target.getBoundingClientRect();
                    const rectB = b.target.getBoundingClientRect();
                    return (rectA.left - rectB.left) || (rectA.top - rectB.top);
                });

            visibleEntries.forEach((entry) => {
                const el = entry.target;
                if (!el.classList.contains('show')) {
                    setTimeout(() => {
                        el.classList.add('show');
                    }, delay);
                    delay += 120;
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 100px 0px 100px'
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

            const scroller = document.querySelector('main') || window;

            scroller.scrollTo({
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

    setup3DTilt() {
        // Disabilitar se o usuário prefere movimento reduzido ou em dispositivos com toque
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (this.prefersReducedMotion.matches || isTouchDevice) {
            return;
        }

        const cards = document.querySelectorAll('.feature-card, .timeline-card');
        
        cards.forEach(card => {
            // Adicionar a classe tilt-card do CSS para prepará-lo
            card.classList.add('tilt-card');
            
            // Criar o elemento de glare reflexivo dinamicamente se não existir
            let glare = card.querySelector('.tilt-glare');
            if (!glare) {
                glare = document.createElement('div');
                glare.className = 'tilt-glare';
                card.appendChild(glare);
            }
            
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left; // posição X
                const y = e.clientY - rect.top;  // posição Y
                
                // Posição normalizada de -1 a 1 em relação ao centro
                const percentX = (x / rect.width) * 2 - 1;
                const percentY = (y / rect.height) * 2 - 1;
                
                // Graus de rotação máxima
                const maxRotation = 10; // inclinação suave
                const rotateX = (-percentY * maxRotation).toFixed(2);
                const rotateY = (percentX * maxRotation).toFixed(2);
                
                // Aplicar transform tridimensional e perspectiva
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
                
                // Mover a luz de glare radial
                const glareX = (x / rect.width) * 100;
                const glareY = (y / rect.height) * 100;
                glare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 65%)`;
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
                // Glare voltando ao padrão
                glare.style.background = `radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 60%)`;
            });
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.animationsHandler = new AnimationsHandler();
});
