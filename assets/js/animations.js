/**
 * Animations Handler - Scroll animations, header effects, and 3D tilt
 */

class AnimationsHandler {
    constructor() {
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.init();
    }

    init() {
        this.setupScrollAnimations();
        this.setupHeaderScrollEffect();
        this.setup3DTilt();
    }

    setupHeaderScrollEffect() {
        const header = document.querySelector('header');
        if (!header) return;

        const updateHeaderState = () => {
            const scrollY = window.scrollY || document.documentElement.scrollTop;
            if (scrollY > 30) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        };

        window.addEventListener('scroll', updateHeaderState, { passive: true });
        updateHeaderState();
    }

    setupScrollAnimations() {
        const animatedElements = document.querySelectorAll('.hidden, .animate-on-scroll, .feature-card, .timeline-item, .education-card, .published-page-link');

        if (!('IntersectionObserver' in window) || this.prefersReducedMotion.matches) {
            animatedElements.forEach((el) => el.classList.add('show'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('show');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.08,
            rootMargin: '0px 0px -40px 0px'
        });

        animatedElements.forEach((el) => observer.observe(el));
    }

    setup3DTilt() {
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (this.prefersReducedMotion.matches || isTouchDevice) {
            return;
        }

        const cards = document.querySelectorAll('.feature-card, .timeline-card, .education-card, .published-page-link');
        
        cards.forEach(card => {
            card.classList.add('tilt-card');
            
            let glare = card.querySelector('.tilt-glare');
            if (!glare) {
                glare = document.createElement('div');
                glare.className = 'tilt-glare';
                card.appendChild(glare);
            }
            
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const percentX = (x / rect.width) * 2 - 1;
                const percentY = (y / rect.height) * 2 - 1;
                
                const maxRotation = 8;
                const rotateX = (-percentY * maxRotation).toFixed(2);
                const rotateY = (percentX * maxRotation).toFixed(2);
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`;
                
                const glareX = (x / rect.width) * 100;
                const glareY = (y / rect.height) * 100;
                glare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 65%)`;
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
                glare.style.background = `radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 60%)`;
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.animationsHandler = new AnimationsHandler();
});
