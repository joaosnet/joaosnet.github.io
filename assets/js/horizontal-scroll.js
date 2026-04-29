/**
 * Horizontal Scroll Manager
 * Handles horizontal scrolling, navigation dots, and scroll indicators
 */

class HorizontalScrollHandler {
    constructor() {
        this.wrapper = document.querySelector('.horizontal-wrapper');
        this.sections = [];
        this.scrollIndicator = null;
        this.scrollHint = null;
        this.currentSection = 0;
        this.hasShownHint = false;
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        
        this.init();
    }

    init() {
        if (!this.wrapper) {
            console.warn('Horizontal wrapper not found');
            return;
        }

        // Get all sections within the horizontal wrapper
        this.sections = Array.from(this.wrapper.querySelectorAll('section'));
        
        if (this.sections.length === 0) {
            console.warn('No sections found in horizontal wrapper');
            return;
        }
        
        // Create navigation indicators
        this.createScrollIndicator();
        this.createScrollHint();
        
        // Setup scroll event listeners
        this.setupScrollListener();
        this.setupVerticalToHorizontalScroll();
        this.setupKeyboardNavigation();
        this.setupResizeListener();
        
        // Setup scroll dot clicks
        this.setupDotClicks();
        
        // Update initial state
        this.updateActiveSection();
        
        // Show scroll hint briefly
        setTimeout(() => {
            this.showScrollHint();
        }, 2000);
    }

    setupVerticalToHorizontalScroll() {
        // Convert vertical scroll (mouse wheel/trackpad) to horizontal scroll
        this.wrapper.addEventListener('wheel', (e) => {
            if (this.scrollNestedHorizontalArea(e)) {
                return;
            }

            if (this.shouldLetSectionScrollVertically(e)) {
                return;
            }

            // Only convert if scrolling vertically
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                
                // Scroll horizontally by the vertical delta amount
                const scrollSpeed = window.innerWidth <= 768 ? 0.85 : 1.1;
                const scrollAmount = e.deltaY * scrollSpeed;
                
                this.wrapper.scrollBy({
                    left: scrollAmount,
                    behavior: 'auto' // Use 'auto' for immediate response
                });
            }
        }, { passive: false });
    }

    scrollNestedHorizontalArea(event) {
        const nestedScroller = event.target.closest('.timeline-container, .published-pages-list');

        if (!nestedScroller || !this.wrapper.contains(nestedScroller)) {
            return false;
        }

        const hasHorizontalOverflow = nestedScroller.scrollWidth > nestedScroller.clientWidth + 2;
        if (!hasHorizontalOverflow) {
            return false;
        }

        const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
        const scrollingLeft = delta < 0;
        const scrollingRight = delta > 0;
        const atLeft = nestedScroller.scrollLeft <= 0;
        const atRight = nestedScroller.scrollLeft + nestedScroller.clientWidth >= nestedScroller.scrollWidth - 2;

        if ((scrollingLeft && atLeft) || (scrollingRight && atRight)) {
            return false;
        }

        event.preventDefault();
        nestedScroller.scrollBy({
            left: delta,
            behavior: 'auto'
        });

        return true;
    }

    shouldLetSectionScrollVertically(event) {
        const section = event.target.closest('.horizontal-wrapper > section');

        if (!section) {
            return false;
        }

        const hasVerticalOverflow = section.scrollHeight > section.clientHeight + 2;

        if (!hasVerticalOverflow) {
            return false;
        }

        const scrollingUp = event.deltaY < 0;
        const scrollingDown = event.deltaY > 0;
        const atTop = section.scrollTop <= 0;
        const atBottom = section.scrollTop + section.clientHeight >= section.scrollHeight - 2;

        return (scrollingUp && !atTop) || (scrollingDown && !atBottom);
    }

    createScrollIndicator() {
        this.scrollIndicator = document.createElement('div');
        this.scrollIndicator.className = 'scroll-indicator';
        this.scrollIndicator.setAttribute('aria-label', 'Navegação entre seções');
        
        // Create a dot for each section
        this.sections.forEach((section, index) => {
            const dot = document.createElement('button');
            dot.className = 'scroll-dot';
            dot.type = 'button';
            dot.setAttribute('data-index', index);
            dot.setAttribute('title', this.getSectionLabel(section, index));
            dot.setAttribute('aria-label', this.getSectionLabel(section, index));
            this.scrollIndicator.appendChild(dot);
        });
        
        document.body.appendChild(this.scrollIndicator);
    }

    createScrollHint() {
        this.scrollHint = document.createElement('div');
        this.scrollHint.className = 'scroll-hint';
        this.scrollHint.innerHTML = '<span>Role ou arraste para explorar</span><i class="fas fa-arrow-right"></i>';
        document.body.appendChild(this.scrollHint);
    }

    getSectionLabel(section, index) {
        const heading = section.querySelector('h1, h2');
        const fallbackLabels = ['Início', 'Habilidades', 'Projetos', 'Contato', 'Currículo'];

        if (heading && heading.textContent.trim()) {
            return heading.textContent.trim();
        }

        return fallbackLabels[index] || `Seção ${index + 1}`;
    }

    setupScrollListener() {
        // Throttled scroll listener
        let ticking = false;
        
        this.wrapper.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    this.updateActiveSection();
                    this.hideScrollHint();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    setupDotClicks() {
        const dots = this.scrollIndicator.querySelectorAll('.scroll-dot');
        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                const index = parseInt(dot.dataset.index);
                this.scrollToSection(index);
            });
        });
    }

    scrollToSection(index) {
        if (index >= 0 && index < this.sections.length) {
            const section = this.sections[index];
            const scrollLeft = section.offsetLeft;
            
            this.wrapper.scrollTo({
                left: scrollLeft,
                behavior: this.prefersReducedMotion.matches ? 'auto' : 'smooth'
            });
        }
    }

    updateActiveSection() {
        const scrollLeft = this.wrapper.scrollLeft;
        const viewportCenter = scrollLeft + (this.wrapper.clientWidth / 2);
        
        // Calculate current section by the closest visible section center.
        let newIndex = 0;
        let shortestDistance = Number.POSITIVE_INFINITY;

        this.sections.forEach((section, index) => {
            const sectionCenter = section.offsetLeft + (section.offsetWidth / 2);
            const distance = Math.abs(sectionCenter - viewportCenter);

            if (distance < shortestDistance) {
                shortestDistance = distance;
                newIndex = index;
            }
        });
        
        if (newIndex !== this.currentSection) {
            this.currentSection = newIndex;
        }
        
        // Update active dot
        const dots = this.scrollIndicator.querySelectorAll('.scroll-dot');
        dots.forEach((dot, index) => {
            dot.setAttribute('aria-current', index === this.currentSection ? 'true' : 'false');
            if (index === this.currentSection) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    showScrollHint() {
        if (!this.hasShownHint && this.scrollHint) {
            this.scrollHint.classList.add('visible');
            this.hasShownHint = true;
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                this.hideScrollHint();
            }, 5000);
        }
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (event) => {
            const activeElement = document.activeElement;
            const isTyping = activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName);

            if (isTyping || event.altKey || event.ctrlKey || event.metaKey) {
                return;
            }

            if (event.key === 'ArrowRight' || event.key === 'PageDown') {
                event.preventDefault();
                this.next();
            }

            if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
                event.preventDefault();
                this.previous();
            }
        });
    }

    setupResizeListener() {
        let resizeTimer;

        window.addEventListener('resize', () => {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(() => {
                this.sections = Array.from(this.wrapper.querySelectorAll('section'));
                this.scrollToSection(this.currentSection);
                this.updateActiveSection();
            }, 150);
        });
    }

    hideScrollHint() {
        if (this.scrollHint) {
            this.scrollHint.classList.remove('visible');
        }
    }

    // Navigate to next section
    next() {
        if (this.currentSection < this.sections.length - 1) {
            this.scrollToSection(this.currentSection + 1);
        }
    }

    // Navigate to previous section
    previous() {
        if (this.currentSection > 0) {
            this.scrollToSection(this.currentSection - 1);
        }
    }
}

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.horizontalScroll = new HorizontalScrollHandler();
});
