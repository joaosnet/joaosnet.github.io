/**
 * Horizontal Scroll Manager
 * Handles horizontal scrolling, navigation dots, and scroll indicators
 */

class HorizontalScrollHandler {
    constructor() {
        this.wrapper = document.querySelector('main') || document.documentElement;
        this.scrollContainer = document.querySelector('.horizontal-wrapper');
        this.sections = [];
        this.navLinks = [];
        this.scrollIndicator = null;
        this.scrollHint = null;
        this.currentSection = 0;
        this.lastSettledSection = 0;
        this.hasShownHint = false;
        this.initialHash = window.__initialPortfolioHash || window.location.hash;
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.sectionObserver = null;
        this.scrollEndTimer = null;
        this.resizeTimer = null;
        this.wheelSnapTimer = null;
        this.wheelTarget = null;
        this.scrollEdge = 2;
        
        this.init();
    }

    init() {
        if (!this.scrollContainer) {
            console.warn('Horizontal wrapper not found');
            return;
        }

        this.setupScrollRestoration();
        this.refreshSections();
        this.refreshNavLinks();
        
        if (this.sections.length === 0) {
            console.warn('No sections found in horizontal wrapper');
            return;
        }
        
        this.createScrollIndicator();
        this.createScrollHint();
        
        this.setupScrollListener();
        this.setupScrollEndListener();
        this.setupSectionObserver();
        this.setupVerticalToHorizontalScroll();
        this.setupKeyboardNavigation();
        this.setupResizeListener();
        this.setupDotClicks();
        this.restoreInitialPosition();
        
        this.updateActiveSection();
        this.lastSettledSection = this.currentSection;
        
        setTimeout(() => {
            this.showScrollHint();
        }, 2000);
    }

    refreshSections() {
        this.sections = Array.from(this.scrollContainer.querySelectorAll('section'));
    }

    refreshNavLinks() {
        this.navLinks = Array.from(document.querySelectorAll('header nav a[href^="#"], footer a[href^="#"], .logo[href^="#"]'));
    }

    setupScrollRestoration() {
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }
    }

    setupVerticalToHorizontalScroll() {
        this.wheelTarget = this.wrapper === document.documentElement ? window : this.wrapper;
        this.wheelTarget.addEventListener('wheel', (event) => {
            this.handleWheel(event);
        }, { passive: false });
    }

    handleWheel(event) {
        if (event.ctrlKey || event.defaultPrevented || this.sections.length === 0) {
            return;
        }

        const intent = this.getWheelIntent(event);

        if (intent.axis === 'vertical') {
            const verticalScroller = this.findScrollableParent(event.target, 'y');

            if (verticalScroller && this.canElementScroll(verticalScroller, intent.delta, 'y')) {
                return;
            }
        }

        if (this.scrollNestedHorizontalArea(event)) {
            return;
        }

        if (!this.canScrollHorizontally(intent.delta)) {
            this.hideScrollHint();
            return;
        }

        event.preventDefault();
        this.hideScrollHint();
        this.scrollHorizontally(intent.delta);
    }

    getWheelIntent(event) {
        const deltaX = this.normalizeWheelDelta(event.deltaX, event.deltaMode);
        const deltaY = this.normalizeWheelDelta(event.deltaY, event.deltaMode);

        if (event.shiftKey && Math.abs(deltaY) > this.scrollEdge) {
            return { axis: 'horizontal', delta: deltaY };
        }

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            return { axis: 'horizontal', delta: deltaX };
        }

        return { axis: 'vertical', delta: deltaY };
    }

    normalizeWheelDelta(delta, deltaMode) {
        if (deltaMode === WheelEvent.DOM_DELTA_LINE) {
            return delta * 16;
        }

        if (deltaMode === WheelEvent.DOM_DELTA_PAGE) {
            return delta * window.innerHeight;
        }

        return delta;
    }

    scrollNestedHorizontalArea(event) {
        const eventTarget = event.target instanceof Element ? event.target : null;
        const nestedScroller = eventTarget?.closest('.timeline-container, .published-pages-list');

        if (!nestedScroller) {
            return false;
        }

        const hasHorizontalOverflow = nestedScroller.scrollWidth > nestedScroller.clientWidth + this.scrollEdge;
        if (!hasHorizontalOverflow) {
            return false;
        }

        const deltaX = this.normalizeWheelDelta(event.deltaX, event.deltaMode);
        const deltaY = this.normalizeWheelDelta(event.deltaY, event.deltaMode);
        const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;

        if (!this.canElementScroll(nestedScroller, delta, 'x')) {
            return false;
        }

        event.preventDefault();
        nestedScroller.scrollBy({
            left: delta,
            behavior: 'auto'
        });

        return true;
    }

    findScrollableParent(target, axis) {
        let element = target instanceof Element ? target : target?.parentElement;

        while (element && element !== document.body && element !== document.documentElement) {
            if (this.hasScrollableOverflow(element, axis)) {
                return element;
            }

            element = element.parentElement;
        }

        return null;
    }

    hasScrollableOverflow(element, axis) {
        const style = window.getComputedStyle(element);
        const overflow = axis === 'y' ? style.overflowY : style.overflowX;
        const scrollSize = axis === 'y' ? element.scrollHeight : element.scrollWidth;
        const clientSize = axis === 'y' ? element.clientHeight : element.clientWidth;
        const canOverflow = /(auto|scroll|overlay)/.test(overflow) || element.tagName === 'TEXTAREA';

        return canOverflow && scrollSize > clientSize + this.scrollEdge;
    }

    canElementScroll(element, delta, axis) {
        const scrollPosition = axis === 'y' ? element.scrollTop : element.scrollLeft;
        const scrollSize = axis === 'y' ? element.scrollHeight : element.scrollWidth;
        const clientSize = axis === 'y' ? element.clientHeight : element.clientWidth;
        const atStart = scrollPosition <= this.scrollEdge;
        const atEnd = scrollPosition + clientSize >= scrollSize - this.scrollEdge;

        return delta < 0 ? !atStart : !atEnd;
    }

    canScrollHorizontally(deltaX) {
        const scrollX = this.getScrollX();
        const maxScrollX = this.getMaxScrollX();

        return deltaX < 0
            ? scrollX > this.scrollEdge
            : scrollX < maxScrollX - this.scrollEdge;
    }

    scrollHorizontally(deltaX) {
        const scrollSpeed = window.innerWidth <= 768 ? 0.85 : 1.1;

        this.pauseScrollSnap();
        this.wrapper.scrollBy({
            left: deltaX * scrollSpeed,
            behavior: 'auto'
        });
    }

    pauseScrollSnap() {
        if (!this.wrapper.classList) {
            return;
        }

        this.wrapper.classList.add('is-wheel-scrolling');
        window.clearTimeout(this.wheelSnapTimer);
        this.wheelSnapTimer = window.setTimeout(() => {
            this.wrapper.classList.remove('is-wheel-scrolling');
        }, 180);
    }

    getCurrentSection() {
        return this.sections[this.currentSection] || null;
    }

    getNearestSectionIndex() {
        const scrollLeft = this.getScrollX();
        const viewportCenter = scrollLeft + (this.getViewportWidth() / 2);
        let nearestIndex = 0;
        let shortestDistance = Number.POSITIVE_INFINITY;

        this.sections.forEach((section, index) => {
            const sectionCenter = section.offsetLeft + (section.offsetWidth / 2);
            const distance = Math.abs(sectionCenter - viewportCenter);

            if (distance < shortestDistance) {
                shortestDistance = distance;
                nearestIndex = index;
            }
        });

        return nearestIndex;
    }

    getScrollX() {
        if (this.wrapper === document.documentElement) {
            return window.scrollX || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
        }

        return this.wrapper.scrollLeft || 0;
    }

    getMaxScrollX() {
        if (this.wrapper === document.documentElement) {
            return Math.max(
                0,
                Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth
            );
        }

        return Math.max(0, this.wrapper.scrollWidth - this.wrapper.clientWidth);
    }

    getViewportWidth() {
        if (this.wrapper === document.documentElement) {
            return window.innerWidth;
        }

        return this.wrapper.clientWidth || window.innerWidth;
    }

    createScrollIndicator() {
        this.scrollIndicator = document.createElement('nav');
        this.scrollIndicator.className = 'scroll-indicator';
        this.scrollIndicator.setAttribute('aria-label', 'Navegação entre seções');
        
        this.sections.forEach((section, index) => {
            const dot = document.createElement('button');
            const label = this.getSectionLabel(section, index);

            dot.className = 'scroll-dot';
            dot.type = 'button';
            dot.setAttribute('data-index', index);
            dot.setAttribute('title', label);
            dot.setAttribute('aria-label', label);

            if (section.id) {
                dot.setAttribute('aria-controls', section.id);
            }

            this.scrollIndicator.appendChild(dot);
        });
        
        document.body.appendChild(this.scrollIndicator);
    }

    createScrollHint() {
        this.scrollHint = document.createElement('div');
        this.scrollHint.className = 'scroll-hint';
        this.scrollHint.setAttribute('aria-hidden', 'true');
        this.scrollHint.innerHTML = '<span>Role para os lados ou use os pontos para explorar</span><i class="fas fa-arrow-right" aria-hidden="true"></i>';
        document.body.appendChild(this.scrollHint);
    }

    getSectionLabel(section, index) {
        const heading = section.querySelector('h1, h2');
        const fallbackLabels = ['Início', 'Habilidades', 'Projetos', 'Páginas publicadas', 'Contato', 'Currículo'];

        if (heading && heading.textContent.trim()) {
            return heading.textContent.trim();
        }

        return fallbackLabels[index] || `Seção ${index + 1}`;
    }

    setupScrollListener() {
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
        }, { passive: true });
    }

    setupScrollEndListener() {
        const handleSettledScroll = () => {
            this.handleSettledScroll();
        };

        if ('onscrollend' in this.wrapper) {
            this.wrapper.addEventListener('scrollend', handleSettledScroll);
            return;
        }

        this.wrapper.addEventListener('scroll', () => {
            window.clearTimeout(this.scrollEndTimer);
            this.scrollEndTimer = window.setTimeout(handleSettledScroll, 140);
        }, { passive: true });
    }

    handleSettledScroll() {
        const settledSection = this.getNearestSectionIndex();

        this.setCurrentSection(settledSection);
        this.lastSettledSection = settledSection;
    }

    setupSectionObserver() {
        if (!('IntersectionObserver' in window)) {
            return;
        }

        if (this.sectionObserver) {
            this.sectionObserver.disconnect();
        }

        this.sectionObserver = new IntersectionObserver((entries) => {
            const visibleSection = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

            if (!visibleSection) {
                return;
            }

            const index = this.sections.indexOf(visibleSection.target);

            if (index >= 0) {
                this.setCurrentSection(index);
            }
        }, {
            root: this.wrapper === document.documentElement ? null : this.wrapper,
            rootMargin: '0px -35% 0px -35%',
            threshold: [0.25, 0.5, 0.75]
        });

        this.sections.forEach((section) => {
            this.sectionObserver.observe(section);
        });
    }

    setupDotClicks() {
        const dots = this.scrollIndicator.querySelectorAll('.scroll-dot');
        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                const index = parseInt(dot.dataset.index, 10);
                this.scrollToSection(index, { updateHash: true });
            });
        });
    }

    scrollToSection(index, options = {}) {
        if (index < 0 || index >= this.sections.length) {
            return;
        }

        const section = this.sections[index];
        const behavior = options.behavior || (this.prefersReducedMotion.matches ? 'auto' : 'smooth');

        this.setCurrentSection(index);
        this.revealSection(section);
        
        this.wrapper.scrollTo({
            left: section.offsetLeft,
            top: 0,
            behavior
        });

        this.lastSettledSection = index;

        if (options.updateHash && section.id) {
            this.updateHash(section.id);
        }
    }

    updateActiveSection() {
        this.setCurrentSection(this.getNearestSectionIndex());
    }

    setCurrentSection(index) {
        const safeIndex = Math.max(0, Math.min(index, this.sections.length - 1));

        if (safeIndex !== this.currentSection) {
            this.currentSection = safeIndex;
        }

        this.revealSection(this.sections[this.currentSection]);
        this.updateDots();
        this.updateNavLinks();
    }

    revealSection(section) {
        if (!section) {
            return;
        }

        section.querySelectorAll('.hidden, .timeline-item-left, .timeline-item-right').forEach((element) => {
            element.classList.add('show');
        });
    }

    updateDots() {
        if (!this.scrollIndicator) {
            return;
        }

        const dots = this.scrollIndicator.querySelectorAll('.scroll-dot');
        dots.forEach((dot, index) => {
            const isActive = index === this.currentSection;

            dot.setAttribute('aria-current', isActive ? 'true' : 'false');
            dot.classList.toggle('active', isActive);
        });
    }

    updateNavLinks() {
        if (!this.navLinks.length) {
            return;
        }

        const activeSection = this.sections[this.currentSection];
        const activeHash = activeSection?.id ? `#${activeSection.id}` : '';

        this.navLinks.forEach((link) => {
            const isActive = link.getAttribute('href') === activeHash;

            link.classList.toggle('active', isActive);

            if (isActive) {
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    }

    scrollToInitialHash() {
        const hash = this.initialHash || window.location.hash;

        if (!hash || hash === '#') {
            return;
        }

        let target = null;

        try {
            target = document.querySelector(hash);
        } catch (error) {
            return;
        }

        if (!target || !target.closest('.horizontal-wrapper')) {
            return;
        }

        const targetSection = target.matches('section')
            ? target
            : target.closest('.horizontal-wrapper > section');
        const sectionIndex = this.sections.indexOf(targetSection);

        if (sectionIndex >= 0) {
            this.scrollToSection(sectionIndex, { behavior: 'auto', updateHash: true });
        }
    }

    restoreInitialPosition() {
        const runWithRetries = (callback) => {
            callback();
            window.requestAnimationFrame(callback);
            window.setTimeout(callback, 80);
            window.setTimeout(callback, 300);
            window.addEventListener('load', callback, { once: true });
        };

        if (this.initialHash || window.location.hash) {
            runWithRetries(() => this.scrollToInitialHash());
            return;
        }

        runWithRetries(() => {
            this.scrollToSection(0, { behavior: 'auto' });
        });
    }

    updateHash(sectionId) {
        if (!window.history || !window.history.replaceState) {
            return;
        }

        try {
            window.history.replaceState(null, '', `#${sectionId}`);
        } catch (error) {
            // Ignore history errors in embedded browsers.
        }
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

            if (event.key === 'ArrowRight') {
                event.preventDefault();
                this.next();
            }

            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                this.previous();
            }

            if (event.key === 'Home') {
                event.preventDefault();
                this.scrollToSection(0);
            }

            if (event.key === 'End') {
                event.preventDefault();
                this.scrollToSection(this.sections.length - 1);
            }
        });
    }

    setupResizeListener() {
        window.addEventListener('resize', () => {
            window.clearTimeout(this.resizeTimer);
            this.resizeTimer = window.setTimeout(() => {
                this.refreshSections();
                this.refreshNavLinks();
                this.setupSectionObserver();
                this.setCurrentSection(Math.min(this.currentSection, this.sections.length - 1));
                this.scrollToSection(this.currentSection, { behavior: 'auto' });
                this.updateActiveSection();
            }, 150);
        }, { passive: true });
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
