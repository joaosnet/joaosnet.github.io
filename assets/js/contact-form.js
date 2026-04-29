/**
 * Contact Form Handler - Manages form submission and toast notifications
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
        this.SUBJECT = 'Contato pelo site';

        if (this.form) {
            this.init();
        }
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
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

    async handleSubmit(e) {
        e.preventDefault();

        const submitBtn = this.form.querySelector('button[type="submit"]');
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        try {
            const response = await fetch(this.form.action, {
                method: 'POST',
                body: new FormData(this.form),
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                this.form.reset();
                this.showToast('Mensagem enviada com sucesso! Obrigado.');
            } else {
                this.handleFormError();
            }
        } catch (error) {
            this.handleFormError();
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }

    handleFormError() {
        const formData = new FormData(this.form);
        const name = formData.get('name') || 'Visitante';
        const email = formData.get('email') || '';
        const message = formData.get('message');

        if (message) {
            // Show user-friendly message before redirect
            this.showToast('Abrindo seu cliente de email...', 'info');

            // Try mailto as fallback
            const to = encodeURIComponent(this.EMAIL);
            const subject = encodeURIComponent(`${this.SUBJECT} - ${name}`);
            const body = encodeURIComponent(`Nome: ${name}\nEmail: ${email}\n\nMensagem:\n${message}`);

            // Small delay to show toast before redirect
            setTimeout(() => {
                window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
            }, 800);
        } else {
            this.showToast('Por favor, preencha todos os campos.', 'error');
        }
    }

    openMailClient() {
        const name = document.getElementById('name').value || 'Visitante';
        const email = document.getElementById('email').value || '';
        const message = document.getElementById('message').value || '';

        const subject = encodeURIComponent(`${this.SUBJECT} - ${name}`);
        const body = encodeURIComponent(`Nome: ${name}\nEmail: ${email}\n\n${message}`);
        
        window.location.href = `mailto:${this.EMAIL}?subject=${subject}&body=${body}`;
    }

    copyEmailToClipboard() {
        navigator.clipboard.writeText(this.EMAIL).then(() => {
            this.showToast('Email copiado.');
        }).catch(() => {
            this.showToast('Erro ao copiar email.', 'error');
        });
    }

    openGmail() {
        const message = document.getElementById('message').value || '';
        const name = document.getElementById('name').value || '';
        
        const subject = encodeURIComponent(this.SUBJECT);
        const body = encodeURIComponent(`${message}\n\n--\n${name}`);
        
        window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${this.EMAIL}&su=${subject}&body=${body}`, '_blank');
    }

    scrollToForm() {
        const form = document.getElementById('contact-form');
        if (form) {
            const contactSection = document.getElementById('contact');
            const horizontalWrapper = document.querySelector('.horizontal-wrapper');

            if (horizontalWrapper && contactSection && contactSection.closest('.horizontal-wrapper')) {
                horizontalWrapper.scrollTo({
                    left: contactSection.offsetLeft,
                    behavior: 'smooth'
                });
                contactSection.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            } else {
                const header = document.querySelector('header');
                const headerHeight = header ? header.offsetHeight : 0;
                const targetPosition = form.getBoundingClientRect().top + window.pageYOffset - headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }

            // Focus message field
            const messageField = document.getElementById('message');
            if (messageField) {
                setTimeout(() => messageField.focus(), 500);
            }
        }
    }

    showToast(message, type = 'success') {
        if (!this.toastEl) return;

        // Set toast message
        this.toastEl.textContent = message;
        this.toastEl.style.display = 'block';
        this.toastEl.classList.remove('hide');
        this.toastEl.classList.add('show');

        // Apply type-based styling
        this.toastEl.style.background = 'var(--toast-bg)';
        this.toastEl.style.color = 'var(--toast-color)';

        if (type === 'error') {
            this.toastEl.style.borderLeft = '4px solid #ef4444';
        } else if (type === 'info') {
            this.toastEl.style.borderLeft = '4px solid #3b82f6';
        } else {
            this.toastEl.style.borderLeft = '4px solid #10b981';
        }

        // Auto-hide after 3.5 seconds
        setTimeout(() => {
            this.toastEl.classList.remove('show');
            this.toastEl.classList.add('hide');
            setTimeout(() => {
                this.toastEl.style.display = 'none';
            }, 300);
        }, 3500);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ContactFormHandler();
});
