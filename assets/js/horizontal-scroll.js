/**
 * Horizontal Scroll Manager
 * Handles horizontal scrolling, navigation dots, and scroll indicators
 */

class HorizontalScrollHandler {
    constructor() {
        this.wrapper = document.documentElement; // Now scrolling happens on the root element
        this.scrollContainer = document.querySelector('.horizontal-wrapper');
        this.sections = [];
        this.scrollIndicator = null;
        this.scrollHint = null;
        this.currentSection = 0;
        this.hasShownHint = false;
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        
        this.init();
    }

    init() {
        if (!this.scrollContainer) {
            console.warn('Horizontal wrapper not found');
            return;
        }

        // Get all sections within the horizontal wrapper
        this.sections = Array.from(this.scrollContainer.querySelectorAll('section'));
        
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
        // Convert vertical scroll (mouse wheel/trackpad) to horizontal scroll ONLY if not scrolling a vertical list
        window.addEventListener('wheel', (e) => {
            if (this.scrollNestedHorizontalArea(e)) {
                return;
            }

            if (this.shouldLetSectionScrollVertically(e)) {
                return; // Let the native vertical scroll happen
            }

            // Convert vertical wheel to horizontal document scroll
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                // If the body/html has vertical scroll AND we are not at the top/bottom, 
                // we might want to let it scroll vertically instead of forcing horizontal?
                // Wait, if we want to read a long section, we must allow vertical scroll!
                // Actually, if we are in a long section, we SHOULD let the window scroll vertically!
                // So if deltaY > 0 (down) and we are not at the bottom of the document, let it scroll!
                // BUT we want horizontal navigation...
                // A better approach for 2D scrolling: 
                // Only convert to horizontal if the current section doesn't need vertical scrolling,
                // OR if the user holds Shift. But browser does Shift+Wheel natively for horizontal.
                // Let's remove the forced vertical-to-horizontal conversion so we don't break vertical reading,
                // OR we only convert if the document cannot scroll vertically anymore.
                
                const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
                const isScrollableVertically = maxScrollY > 10;
                
                if (isScrollableVertically) {
                    // Let the native vertical scroll happen if the page is tall
                    return;
                }

                // If the page is not vertically tall, we can convert vertical wheel to horizontal
                e.preventDefault();
                const scrollSpeed = window.innerWidth <= 768 ? 0.85 : 1.1;
                const scrollAmount = e.deltaY * scrollSpeed;
                
                window.scrollBy({
                    left: scrollAmount,
                    behavior: 'auto'
                });
            }
        }, { passive: false });
    }

    scrollNestedHorizontalArea(event) {
        const nestedScroller = event.target.closest('.timeline-container, .published-pages-list');

        if (!nestedScroller) {
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
        // Since sections now grow by content and we scroll the document,
        // we check if the element itself has internal overflow (e.g. a textarea).
        const scrollableParent = event.target.closest('.footer-panel footer, textarea');
        
        if (!scrollableParent) {
            return false;
        }

        const hasVerticalOverflow = scrollableParent.scrollHeight > scrollableParent.clientHeight + 2;

        if (!hasVerticalOverflow) {
            return false;
        }

        const scrollingUp = event.deltaY < 0;
        const scrollingDown = event.deltaY > 0;
        const atTop = scrollableParent.scrollTop <= 0;
        const atBottom = scrollableParent.scrollTop + scrollableParent.clientHeight >= scrollableParent.scrollHeight - 2;

        return (scrollingUp && !atTop) || (scrollingDown && !atBottom);
    }

    createScrollIndicator() {
        this.scrollIndicator = document.createElement('div');
        this.scrollIndicator.className = 'scroll-indicator';
        this.scrollIndicator.setAttribute('aria-label', 'Navegação entre seções');
        
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
        this.scrollHint.innerHTML = '<span>Role para os lados ou use os pontos para explorar</span><i class="fas fa-arrow-right"></i>';
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
        let ticking = false;
        
        window.addEventListener('scroll', () => {
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
            
            window.scrollTo({
                left: scrollLeft,
                top: 0, // Reset vertical scroll when navigating between sections
                behavior: this.prefersReducedMotion.matches ? 'auto' : 'smooth'
            });
        }
    }

    updateActiveSection() {
        const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
        const viewportCenter = scrollLeft + (window.innerWidth / 2);
        
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
                // If it's PageDown, let the native vertical scroll happen if applicable
                if (event.key === 'PageDown') return; 
                event.preventDefault();
                this.next();
            }

            if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
                if (event.key === 'PageUp') return;
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
                this.sections = Array.from(this.scrollContainer.querySelectorAll('section'));
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

    next() {
        if (this.currentSection < this.sections.length - 1) {
            this.scrollToSection(this.currentSection + 1);
        }
    }

    previous() {
        if (this.currentSection > 0) {
            this.scrollToSection(this.currentSection - 1);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.horizontalScroll = new HorizontalScrollHandler();
});
