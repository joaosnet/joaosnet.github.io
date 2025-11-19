/**
 * Floating Shapes Handler - Handles mouse movement for floating shapes
 */
class FloatingShapesHandler {
    constructor() {
        this.shapes = document.querySelectorAll('.shape');
        
        if (this.shapes.length > 0) {
            this.init();
        }
    }

    init() {
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    }

    handleMouseMove(e) {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;

        this.shapes.forEach((shape, index) => {
            const factor = (index + 1) * 0.01;
            const moveX = (x - 0.5) * factor * 50;
            const moveY = (y - 0.5) * factor * 50;

            shape.style.transform = `translate(${moveX}px, ${moveY}px) rotate(${moveX * 0.2}deg)`;
        });
    }
}

/**
 * Views Counter - Tracks unique views per year
 */
class ViewsCounter {
    constructor() {
        this.counterEl = document.getElementById('unique-views');
        
        if (this.counterEl) {
            this.init();
        }
    }

    init() {
        const year = new Date().getFullYear();
        const yearKey = `joaosnet_views_${year}`;
        
        let count = parseInt(localStorage.getItem(yearKey) || '0') + 1;
        localStorage.setItem(yearKey, count.toString());
        
        this.counterEl.textContent = count.toLocaleString();

        // Reset diário para contagem única por dia
        const today = new Date().toDateString();
        const lastVisitKey = 'joaosnet_last_visit';
        
        if (!localStorage.getItem(lastVisitKey)) {
            localStorage.setItem(lastVisitKey, today);
        } else if (localStorage.getItem(lastVisitKey) !== today) {
            localStorage.setItem(lastVisitKey, today);
            // Incrementa contador global anual
            const globalKey = `joaosnet_global_${year}`;
            let globalCount = parseInt(localStorage.getItem(globalKey) || '0') + 1;
            localStorage.setItem(globalKey, globalCount.toString());
        }
    }
}

/**
 * Particles.js Configuration
 */
function initParticles() {
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            'particles': {
                'number': { 'value': 60, 'density': { 'enable': true, 'value_area': 800 } },
                'color': { 'value': '#ffffff' },
                'shape': { 'type': 'circle', 'stroke': { 'width': 0, 'color': '#000000' }, 'polygon': { 'nb_sides': 5 } },
                'opacity': { 'value': 0.1, 'random': true, 'anim': { 'enable': true, 'speed': 1, 'opacity_min': 0.05, 'sync': false } },
                'size': { 'value': 3, 'random': true, 'anim': { 'enable': true, 'speed': 2, 'size_min': 0.1, 'sync': false } },
                'line_linked': { 'enable': true, 'distance': 150, 'color': '#ffffff', 'opacity': 0.05, 'width': 1 },
                'move': { 'enable': true, 'speed': 1, 'direction': 'none', 'random': false, 'straight': false, 'out_mode': 'out', 'bounce': false, 'attract': { 'enable': false, 'rotateX': 600, 'rotateY': 1200 } }
            },
            'interactivity': {
                'detect_on': 'canvas',
                'events': { 'onhover': { 'enable': true, 'mode': 'repulse' }, 'onclick': { 'enable': true, 'mode': 'push' }, 'resize': true },
                'modes': { 'grab': { 'distance': 400, 'line_linked': { 'opacity': 1 } }, 'bubble': { 'distance': 400, 'size': 40, 'duration': 2, 'opacity': 8, 'speed': 3 }, 'repulse': { 'distance': 100, 'duration': 0.4 }, 'push': { 'particles_nb': 4 }, 'remove': { 'particles_nb': 2 } }
            },
            'retina_detect': true
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new FloatingShapesHandler();
    new ViewsCounter();
    initParticles();
});
