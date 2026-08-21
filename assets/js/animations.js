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

/**
 * Matrix Hacker Easter Egg Handler
 * Detects pull-up/overscroll at the top of the page and triggers the digital matrix terminal
 */
class MatrixEasterEggHandler {
    constructor() {
        this.overlay = document.getElementById('matrix-easter-egg');
        this.canvas = document.getElementById('matrix-canvas');
        this.closeBtn = document.getElementById('matrix-close-btn');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        
        this.isActive = false;
        this.attempts = 0;
        this.attemptResetTimer = null;
        this.autoCloseTimer = null;
        this.animationFrame = null;
        this.touchStartY = 0;
        this.columns = 0;
        this.drops = [];

        this.matrixChars = '0101010101010101λπ∑√Ω0123456789ABCDEF0x7F0xFFUFPA<>{}/*~+=#@!ROOT_AI_CORE'.split('');
        
        this.init();
    }

    init() {
        if (!this.overlay || !this.canvas || !this.ctx) return;

        this.setupDetectionListeners();
        this.setupCloseEvents();
    }

    setupDetectionListeners() {
        // 1. Wheel Overscroll at top
        window.addEventListener('wheel', (e) => {
            const scrollY = window.scrollY || document.documentElement.scrollTop;
            if (scrollY <= 8 && e.deltaY < -10) {
                this.registerAttempt();
            } else if (this.isActive && e.deltaY > 15) {
                this.deactivate();
            }
        }, { passive: true });

        // 2. Mobile Touch Pull-down at top
        window.addEventListener('touchstart', (e) => {
            if (e.touches && e.touches[0]) {
                this.touchStartY = e.touches[0].clientY;
            }
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            const scrollY = window.scrollY || document.documentElement.scrollTop;
            if (scrollY <= 8 && e.touches && e.touches[0]) {
                const diff = e.touches[0].clientY - this.touchStartY;
                if (diff > 50) {
                    this.registerAttempt();
                    this.touchStartY = e.touches[0].clientY;
                }
            } else if (this.isActive && scrollY > 20) {
                this.deactivate();
            }
        }, { passive: true });

        // 3. Keyboard ArrowUp / PageUp at top
        window.addEventListener('keydown', (e) => {
            const scrollY = window.scrollY || document.documentElement.scrollTop;
            if (scrollY <= 8 && (e.key === 'ArrowUp' || e.key === 'PageUp')) {
                this.registerAttempt();
            } else if (e.key === 'Escape' && this.isActive) {
                this.deactivate();
            }
        });

        // 4. Close if scrolled down
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY || document.documentElement.scrollTop;
            if (this.isActive && scrollY > 40) {
                this.deactivate();
            }
        }, { passive: true });
    }

    setupCloseEvents() {
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deactivate();
            });
        }

        if (this.overlay) {
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay || e.target === this.canvas) {
                    this.deactivate();
                }
            });
        }
    }

    registerAttempt() {
        if (this.isActive) return;

        this.attempts += 1;
        if (this.attemptResetTimer) {
            clearTimeout(this.attemptResetTimer);
        }

        if (this.attempts >= 2) {
            this.attempts = 0;
            this.activate();
        } else {
            this.attemptResetTimer = setTimeout(() => {
                this.attempts = 0;
            }, 1800);
        }
    }

    activate() {
        if (this.isActive) return;
        this.isActive = true;

        this.overlay.classList.add('active');
        this.overlay.setAttribute('aria-hidden', 'false');

        this.initMatrixCanvas();
        this.startMatrixAnimation();

        // Telemetria de evento
        if (typeof window.trackPortfolioEvent === 'function') {
            window.trackPortfolioEvent('easter_egg_matrix_unlocked', {
                timestamp: new Date().toISOString(),
                device: 'web'
            });
        }

        // Auto close após 4.5 segundos
        if (this.autoCloseTimer) clearTimeout(this.autoCloseTimer);
        this.autoCloseTimer = setTimeout(() => {
            this.deactivate();
        }, 4500);
    }

    deactivate() {
        if (!this.isActive) return;
        this.isActive = false;

        this.overlay.classList.remove('active');
        this.overlay.setAttribute('aria-hidden', 'true');

        if (this.autoCloseTimer) {
            clearTimeout(this.autoCloseTimer);
            this.autoCloseTimer = null;
        }

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    initMatrixCanvas() {
        if (!this.canvas || !this.ctx) return;

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        const fontSize = 16;
        this.columns = Math.floor(this.canvas.width / fontSize);
        this.drops = [];

        for (let i = 0; i < this.columns; i++) {
            this.drops[i] = Math.floor(Math.random() * -30);
        }
    }

    startMatrixAnimation() {
        if (!this.canvas || !this.ctx) return;

        const fontSize = 16;
        const ctx = this.ctx;
        let lastTime = 0;
        const fpsInterval = 1000 / 30; // 30 FPS para fluidez estética retrô

        const render = (currentTime) => {
            if (!this.isActive) return;

            this.animationFrame = requestAnimationFrame(render);

            const elapsed = currentTime - lastTime;
            if (elapsed < fpsInterval) return;
            lastTime = currentTime - (elapsed % fpsInterval);

            // Rastro translúcido escuro
            ctx.fillStyle = 'rgba(2, 6, 23, 0.14)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            ctx.font = `bold ${fontSize}px 'Space Grotesk', monospace`;

            for (let i = 0; i < this.drops.length; i++) {
                const char = this.matrixChars[Math.floor(Math.random() * this.matrixChars.length)];
                const x = i * fontSize;
                const y = this.drops[i] * fontSize;

                // Primeiro caractere com brilho branco/verde claro
                if (Math.random() > 0.85) {
                    ctx.fillStyle = '#ffffff';
                } else if (Math.random() > 0.5) {
                    ctx.fillStyle = '#34d399';
                } else {
                    ctx.fillStyle = '#10b981';
                }

                ctx.fillText(char, x, y);

                if (y > this.canvas.height && Math.random() > 0.975) {
                    this.drops[i] = 0;
                }

                this.drops[i]++;
            }
        };

        this.animationFrame = requestAnimationFrame(render);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.animationsHandler = new AnimationsHandler();
    window.matrixEasterEggHandler = new MatrixEasterEggHandler();
});
