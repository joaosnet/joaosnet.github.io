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

/* Simple toast helper */
function showToast(message, duration = 3500) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.display = 'block';
    toast.style.opacity = '1';
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => { toast.style.display = 'none'; }, 350);
    }, duration);
}

/* Initialize contact form and convenience buttons */
function initContact() {
    const email = 'joao.silva.neto@itec.ufpa.br';
    const form = document.getElementById('contact-form');
    const sendMailBtn = document.getElementById('send-mail-btn');
    const copyEmailBtn = document.getElementById('copy-email-btn');
    const openGmailBtn = document.getElementById('open-gmail-btn');

    function buildMailtoLink(formData) {
        const name = formData.get('name') || '';
        const sender = formData.get('email') || '';
        const message = formData.get('message') || '';
        const subject = 'Contato pelo site';
        const body = `Nome: ${encodeURIComponent(name)}%0D%0AEmail: ${encodeURIComponent(sender)}%0D%0A%0D%0AMensagem:%0D%0A${encodeURIComponent(message)}`;
        return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${body}`;
    }

    if (sendMailBtn) {
        sendMailBtn.addEventListener('click', () => {
            const formEl = document.getElementById('contact-form');
            const fd = new FormData(formEl);
            const link = buildMailtoLink(fd);
            window.location.href = link;
        });
    }

    if (copyEmailBtn) {
        copyEmailBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(email);
                showToast('Email copiado! Agora cole no seu app de email.');
            } catch (e) {
                showToast('Não foi possível copiar automaticamente.');
            }
        });
    }

    if (openGmailBtn) {
        openGmailBtn.addEventListener('click', () => {
            const formEl = document.getElementById('contact-form');
            const fd = new FormData(formEl);
            const to = email;
            const subject = 'Contato pelo site';
            const name = fd.get('name') || '';
            const sender = fd.get('email') || '';
            const message = fd.get('message') || '';
            const body = `Nome: ${encodeURIComponent(name)}%0D%0AEmail: ${encodeURIComponent(sender)}%0D%0A%0D%0AMensagem:%0D%0A${encodeURIComponent(message)}`;
            const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${body}`;
            window.open(url, '_blank');
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const action = form.action;
            const fd = new FormData(form);
            const submitBtn = form.querySelector('button[type="submit"]');
            try {
                const res = await fetch(action, { method: 'POST', body: fd, headers: { 'Accept': 'application/json' } });
                if (res.ok) {
                    showToast('Mensagem enviada com sucesso! Obrigado.');
                    form.reset();
                    if (submitBtn) {
                        const prev = submitBtn.textContent;
                        submitBtn.disabled = true;
                        submitBtn.textContent = 'Enviado! ✓';
                        setTimeout(() => { submitBtn.disabled = false; submitBtn.textContent = prev; }, 4500);
                    }
                } else {
                    // fallback: open mailto so user can send via their email client
                    const mailto = buildMailtoLink(fd);
                    window.location.href = mailto;
                    showToast('Redirecionando para seu cliente de email...');
                }
            } catch (err) {
                // On network error fallback to mailto
                const mailto = buildMailtoLink(fd);
                window.location.href = mailto;
                showToast('Sem conexão ao servidor, abrindo seu cliente de email...');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    const prev = submitBtn.textContent;
                    submitBtn.textContent = 'Abrindo email...';
                    setTimeout(() => { submitBtn.disabled = false; submitBtn.textContent = prev; }, 4500);
                }
            }
        });
    }
}

/* Floating Action Button behavior */
function initFab() {
    const fab = document.getElementById('fab-contact');
    if (!fab) return;
    fab.addEventListener('click', (e) => {
        e.preventDefault();
        const form = document.getElementById('contact-form');
        if (!form) return;
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
            const message = document.getElementById('message');
            if (message) message.focus({ preventScroll: true });
        }, 650);
    });
}

/* Unique views counter using CountAPI and localStorage to ensure unique-in-browser hits */
function initUniqueViews() {
    const el = document.getElementById('unique-views');
    if (!el) return;
    const NS = 'joaosnet-github-io';
    const KEY = 'unique-views';
    const flagKey = `visited_${NS}_${KEY}`;
    const countUrl = `https://api.countapi.xyz/get/${NS}/${KEY}`;
    const hitUrl = `https://api.countapi.xyz/hit/${NS}/${KEY}`;

    async function refreshCount() {
        try {
            const resp = await fetch(countUrl);
            if (!resp.ok) return;
            const data = await resp.json();
            el.textContent = data.value.toLocaleString();
        } catch (e) {
            // ignore
        }
    }

    async function hitIfNeeded() {
        const visited = localStorage.getItem(flagKey);
        if (!visited) {
            try {
                await fetch(hitUrl);
                localStorage.setItem(flagKey, '1');
            } catch (e) {
                // ignore
            }
        }
        await refreshCount();
    }

    hitIfNeeded();
}

/* Initialize features after load */
document.addEventListener('DOMContentLoaded', () => {
    initContact();
    initUniqueViews();
    initFab();
});