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
 * Particles.js Configuration & Dynamic Theme Reactivity
 */
function initParticles() {
    if (typeof particlesJS === 'undefined' || !document.getElementById('particles-js')) {
        return;
    }

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const computedPrimary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
    const particleColor = isLight ? (computedPrimary || '#1d4ed8') : '#ffffff';
    const lineColor = isLight ? (computedPrimary || '#1d4ed8') : '#ffffff';
    const particleOpacity = isLight ? 0.22 : 0.12;
    const lineOpacity = isLight ? 0.12 : 0.06;

    particlesJS('particles-js', {
        'particles': {
            'number': { 'value': 50, 'density': { 'enable': true, 'value_area': 800 } },
            'color': { 'value': particleColor },
            'shape': { 'type': 'circle', 'stroke': { 'width': 0, 'color': '#000000' } },
            'opacity': { 'value': particleOpacity, 'random': true, 'anim': { 'enable': true, 'speed': 1, 'opacity_min': 0.05, 'sync': false } },
            'size': { 'value': 3, 'random': true, 'anim': { 'enable': true, 'speed': 2, 'size_min': 0.1, 'sync': false } },
            'line_linked': { 'enable': true, 'distance': 150, 'color': lineColor, 'opacity': lineOpacity, 'width': 1 },
            'move': { 'enable': true, 'speed': 1, 'direction': 'none', 'random': false, 'straight': false, 'out_mode': 'out', 'bounce': false }
        },
        'interactivity': {
            'detect_on': 'canvas',
            'events': { 'onhover': { 'enable': true, 'mode': 'repulse' }, 'onclick': { 'enable': true, 'mode': 'push' }, 'resize': true },
            'modes': { 'repulse': { 'distance': 100, 'duration': 0.4 }, 'push': { 'particles_nb': 3 } }
        },
        'retina_detect': true
    });
}

// Re-initialize particles when theme or palette changes
window.addEventListener('themePaletteChanged', () => {
    initParticles();
});

window.addEventListener('themeModeChanged', () => {
    initParticles();
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new FloatingShapesHandler();
    initParticles();
});
