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
            // Only convert if scrolling vertically
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                
                // Scroll horizontally by the vertical delta amount
                const scrollSpeed = 1.5; // Adjust speed factor
                const scrollAmount = e.deltaY * scrollSpeed;
                
                this.wrapper.scrollBy({
                    left: scrollAmount,
                    behavior: 'auto' // Use 'auto' for immediate response
                });
            }
        }, { passive: false });
    }

    createScrollIndicator() {
        this.scrollIndicator = document.createElement('div');
        this.scrollIndicator.className = 'scroll-indicator';
        
        // Create a dot for each section
        this.sections.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = 'scroll-dot';
            dot.setAttribute('data-index', index);
            dot.setAttribute('title', `Seção ${index + 1}`);
            this.scrollIndicator.appendChild(dot);
        });
        
        document.body.appendChild(this.scrollIndicator);
    }

    createScrollHint() {
        this.scrollHint = document.createElement('div');
        this.scrollHint.className = 'scroll-hint';
        this.scrollHint.innerHTML = '<span>Role para explorar</span><i class="fas fa-arrow-right"></i>';
        document.body.appendChild(this.scrollHint);
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
                behavior: 'smooth'
            });
        }
    }

    updateActiveSection() {
        const scrollLeft = this.wrapper.scrollLeft;
        const viewportWidth = window.innerWidth;
        
        // Calculate current section based on scroll position
        let newIndex = Math.round(scrollLeft / viewportWidth);
        newIndex = Math.max(0, Math.min(newIndex, this.sections.length - 1));
        
        if (newIndex !== this.currentSection) {
            this.currentSection = newIndex;
        }
        
        // Update active dot
        const dots = this.scrollIndicator.querySelectorAll('.scroll-dot');
        dots.forEach((dot, index) => {
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
