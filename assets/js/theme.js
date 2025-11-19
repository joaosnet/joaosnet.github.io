// Theme toggle functionality
const toggleBtn = document.getElementById('theme-toggle');
const htmlEl = document.documentElement;

function currentTheme() {
    return htmlEl.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function applyTheme(theme) {
    htmlEl.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (toggleBtn) {
        toggleBtn.innerHTML = theme === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        toggleBtn.setAttribute('aria-pressed', theme === 'dark');
        toggleBtn.setAttribute('title', theme === 'dark' ? 'Alternar para modo claro' : 'Alternar para modo escuro');
    }
}

if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        const newTheme = currentTheme() === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
    });
}

// No automatic switching on system change - default is dark unless user chooses otherwise

// Set initial icon
if (toggleBtn) {
    toggleBtn.innerHTML = currentTheme() === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    toggleBtn.setAttribute('aria-pressed', currentTheme() === 'dark');
    toggleBtn.setAttribute('title', currentTheme() === 'dark' ? 'Alternar para modo claro' : 'Alternar para modo escuro');
}