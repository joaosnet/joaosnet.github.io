/**
 * Contact Form Handler - Manages form submission, quick actions, copy feedback, and toast notifications
 */
class ContactFormHandler {
    constructor() {
        this.form = document.getElementById('contact-form');
        this.toastEl = document.getElementById('toast');
        this.sendMailBtn = document.getElementById('send-mail-btn');
        this.copyEmailBtn = document.getElementById('copy-email-btn');
        this.openGmailBtn = document.getElementById('open-gmail-btn');
        this.fabContact = document.getElementById('fab-contact');

        this.EMAIL = 'joao.silva.neto@itec.ufpa.br';
        this.SUBJECT = 'Contato pelo portfólio';
        this.toastTimeout = null;

        if (this.form || this.copyEmailBtn || this.sendMailBtn) {
            this.init();
        }
    }

    init() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        if (this.sendMailBtn) {
            this.sendMailBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openMailClient();
            });
        }

        if (this.copyEmailBtn) {
            this.copyEmailBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.copyEmailToClipboard();
            });
        }

        if (this.openGmailBtn) {
            this.openGmailBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openGmail();
            });
        }

        if (this.fabContact) {
            this.fabContact.addEventListener('click', () => this.scrollToForm());
        }
    }

    validateForm() {
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const messageInput = document.getElementById('message');

        const name = nameInput ? nameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const message = messageInput ? messageInput.value.trim() : '';

        if (!name) {
            this.showToast('Por favor, informe seu nome.', 'error');
            if (nameInput) nameInput.focus();
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            this.showToast('Por favor, informe um e-mail válido.', 'error');
            if (emailInput) emailInput.focus();
            return false;
        }

        if (!message || message.length < 3) {
            this.showToast('Por favor, escreva uma mensagem breve.', 'error');
            if (messageInput) messageInput.focus();
            return false;
        }

        return true;
    }

    async handleSubmit(e) {
        e.preventDefault();

        if (!this.validateForm()) {
            return;
        }

        const submitBtn = this.form.querySelector('button[type="submit"]');
        const originalHtml = submitBtn ? submitBtn.innerHTML : 'Enviar mensagem';

        if (submitBtn) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            submitBtn.setAttribute('aria-busy', 'true');
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> <span>Enviando...</span>';
        }

        try {
            const response = await fetch(this.form.action, {
                method: 'POST',
                body: new FormData(this.form),
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                if (window.trackPortfolioEvent) {
                    window.trackPortfolioEvent('submit_contact', {
                        hasName: Boolean(document.getElementById('name')?.value),
                        hasEmail: Boolean(document.getElementById('email')?.value)
                    });
                }
                this.form.reset();
                this.showToast('Mensagem enviada com sucesso! Responderei em breve.', 'success');
                if (submitBtn) {
                    this.flashSubmitSuccess(submitBtn, originalHtml);
                }
            } else {
                this.handleFormError(submitBtn, originalHtml);
            }
        } catch (error) {
            this.handleFormError(submitBtn, originalHtml);
        } finally {
            if (submitBtn && !submitBtn.classList.contains('sent')) {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
                submitBtn.removeAttribute('aria-busy');
                submitBtn.innerHTML = originalHtml;
            }
        }
    }

    handleFormError(submitBtn, originalHtml) {
        const name = (document.getElementById('name')?.value || 'Visitante').trim();
        const email = (document.getElementById('email')?.value || '').trim();
        const message = (document.getElementById('message')?.value || '').trim();

        if (message) {
            this.showToast('Redirecionando para seu app de email...', 'info');

            const to = encodeURIComponent(this.EMAIL);
            const subject = encodeURIComponent(`${this.SUBJECT} - ${name}`);
            const body = encodeURIComponent(`Olá João,\n\n${message}\n\n--\nNome: ${name}\nEmail: ${email}`);

            setTimeout(() => {
                window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
            }, 700);
        } else {
            this.showToast('Não foi possível enviar pelo formulário. Tente abrir o e-mail diretamente.', 'error');
        }

        if (submitBtn) {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            submitBtn.removeAttribute('aria-busy');
            submitBtn.innerHTML = originalHtml;
        }
    }

    openMailClient() {
        const name = (document.getElementById('name')?.value || '').trim();
        const email = (document.getElementById('email')?.value || '').trim();
        const message = (document.getElementById('message')?.value || '').trim();

        const subject = encodeURIComponent(name ? `${this.SUBJECT} - ${name}` : this.SUBJECT);
        let bodyContent = message;
        if (name || email) {
            bodyContent = `${message}\n\n--\nNome: ${name || 'Não informado'}\nEmail: ${email || 'Não informado'}`;
        }
        const body = encodeURIComponent(bodyContent);

        this.showToast('Abrindo aplicativo de e-mail...', 'info');
        window.location.href = `mailto:${this.EMAIL}?subject=${subject}&body=${body}`;
    }

    async copyEmailToClipboard() {
        const btnTextEl = this.copyEmailBtn ? this.copyEmailBtn.querySelector('.contact-action-text') : null;
        const originalText = btnTextEl ? btnTextEl.textContent : 'Copiar e-mail';

        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(this.EMAIL);
            } else {
                // Fallback for older webviews
                const textArea = document.createElement('textarea');
                textArea.value = this.EMAIL;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }

            if (this.copyEmailBtn) {
                this.copyEmailBtn.classList.add('copied');
                if (btnTextEl) btnTextEl.textContent = 'Copiado!';
            }

            this.showToast('E-mail copiado para a área de transferência!', 'success');

            setTimeout(() => {
                if (this.copyEmailBtn) {
                    this.copyEmailBtn.classList.remove('copied');
                    if (btnTextEl) btnTextEl.textContent = originalText;
                }
            }, 2500);
        } catch (error) {
            this.showToast('E-mail: ' + this.EMAIL, 'info');
        }
    }

    openGmail() {
        const name = (document.getElementById('name')?.value || '').trim();
        const message = (document.getElementById('message')?.value || '').trim();

        const subject = encodeURIComponent(name ? `${this.SUBJECT} - ${name}` : this.SUBJECT);
        const body = encodeURIComponent(message ? `${message}\n\n--\n${name}` : '');

        this.showToast('Abrindo Gmail Web...', 'info');
        window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${this.EMAIL}&su=${subject}&body=${body}`, '_blank', 'noopener,noreferrer');
    }

    scrollToForm() {
        const target = document.getElementById('contact');
        if (target) {
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            if (window.horizontalScroll && typeof window.horizontalScroll.scrollToSection === 'function') {
                window.horizontalScroll.scrollToSection('#contact', { updateHash: true });
            } else {
                const header = document.querySelector('header');
                const headerHeight = header ? header.offsetHeight : 68;
                const targetPosition = Math.max(0, target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 16);

                window.scrollTo({
                    top: targetPosition,
                    behavior: prefersReducedMotion ? 'auto' : 'smooth'
                });
            }
        }
    }

    showToast(message, type = 'success') {
        if (!this.toastEl) return;

        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
        }

        this.toastEl.textContent = message;
        this.toastEl.style.display = 'block';
        this.toastEl.classList.remove('hide');
        this.toastEl.classList.add('show');

        this.toastEl.style.background = 'var(--toast-bg)';
        this.toastEl.style.color = 'var(--toast-color)';

        if (type === 'error') {
            this.toastEl.style.borderLeft = '4px solid #ef4444';
        } else if (type === 'info') {
            this.toastEl.style.borderLeft = '4px solid #3b82f6';
        } else {
            this.toastEl.style.borderLeft = '4px solid #10b981';
        }

        this.toastTimeout = setTimeout(() => {
            this.toastEl.classList.remove('show');
            this.toastEl.classList.add('hide');
            setTimeout(() => {
                this.toastEl.style.display = 'none';
            }, 300);
        }, 3500);
    }

    flashSubmitSuccess(submitBtn, originalHtml) {
        submitBtn.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> <span>Enviado com sucesso!</span>';
        submitBtn.classList.remove('loading');
        submitBtn.classList.add('sent');
        submitBtn.disabled = false;
        submitBtn.removeAttribute('aria-busy');

        setTimeout(() => {
            submitBtn.innerHTML = originalHtml;
            submitBtn.classList.remove('sent');
        }, 3000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.contactFormHandler = new ContactFormHandler();
});
