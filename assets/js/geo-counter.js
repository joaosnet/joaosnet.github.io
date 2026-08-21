/**
 * Geo Views Counter & Telemetry Handler
 * 
 * Funcionalidades:
 * - Telemetria de Visitas (Dispositivo, SO, Navegador, Resolução, Fuso IANA, Idioma, Origem/UTM)
 * - Rastreamento de Eventos de Conversão (Download de CV, Cliques em Redes/Telegram, Envio de Formulário)
 * - Contador de Visitas Anual no LocalStorage
 * - Envio resiliente em modo no-cors para Google Apps Script / Google Sheets
 * - 100% Cookieless e em conformidade com privacidade (sem chamar APIs públicas de terceiros no navegador)
 */

class GeoViewsCounter {
    static instance = null;

    constructor() {
        if (GeoViewsCounter.instance) {
            return GeoViewsCounter.instance;
        }

        this.GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxzLmn6N4YTTDG_e0JvTxagP3NqXRxaoxj22yuNi7GPrAIg9ZhMksw85kORdgCUTgwWdQ/exec";
        this.counterEl = document.getElementById('unique-views');

        this.RETENTION_DAYS = 7;
        this.STORAGE_KEY_PREFIX = 'joaosnet_geo_';
        this.GEO_DATA_KEY = this.STORAGE_KEY_PREFIX + 'data';
        this.LAST_SEND_KEY = this.STORAGE_KEY_PREFIX + 'last_send';
        this.YEARLY_VIEWS_KEY = 'joaosnet_views_';
        this.SEND_THROTTLE_MS = 60 * 60 * 1000;
        this.DEBUG = false;

        GeoViewsCounter.instance = this;

        this.init();
        this.setupEventListeners();
    }

    debug(...args) {
        if (this.DEBUG) {
            console.debug(...args);
        }
    }

    shouldSkipNetworkCollection() {
        const host = window.location.hostname || '';
        return window.location.protocol === 'file:' || 
               window.location.origin === 'null' ||
               host === 'localhost' ||
               host === '127.0.0.1' ||
               host.includes('docker');
    }

    async init() {
        try {
            const initKey = this.STORAGE_KEY_PREFIX + 'initialized_today';
            const today = new Date().toDateString();
            const lastInit = localStorage.getItem(initKey);

            if (lastInit !== today) {
                localStorage.setItem(initKey, today);
                this.updateViewCounter();

                if (!this.shouldSkipNetworkCollection()) {
                    this.collectAndSendVisitData();
                }

                this.cleanOldData();
            } else {
                this.updateViewCounter(false);
            }
        } catch (error) {
            // Silencioso para não poluir o console
        }
    }

    updateViewCounter(increment = true) {
        try {
            const year = new Date().getFullYear();
            const yearKey = this.YEARLY_VIEWS_KEY + year;
            let count = parseInt(localStorage.getItem(yearKey) || '0', 10);

            if (increment) {
                count += 1;
                localStorage.setItem(yearKey, count.toString());
            }

            this.targetCount = count > 0 ? count : 1;
            this.initAchievementCollapse();
            this.setupAchievementObserver();
        } catch (error) {
            // ignore
        }
    }

    initAchievementCollapse() {
        const root = document.getElementById('achievement-card-root');
        if (!root) return;

        const isCollapsed = localStorage.getItem('achievementCollapsed') === 'true';
        this.setAchievementCollapsed(isCollapsed);

        const collapseBtn = document.getElementById('btn-achievement-collapse');
        const expandBtn = document.getElementById('btn-achievement-expand');

        if (collapseBtn) {
            collapseBtn.addEventListener('click', () => {
                this.setAchievementCollapsed(true);
                this.trackEvent('collapse_achievement');
            });
        }

        if (expandBtn) {
            expandBtn.addEventListener('click', () => {
                this.setAchievementCollapsed(false);
                this.trackEvent('expand_achievement');
            });
        }

        const celebrateBtn = document.getElementById('btn-celebrate');
        if (celebrateBtn) {
            celebrateBtn.addEventListener('click', () => {
                this.launchConfetti();
                this.trackEvent('click_celebrate_achievement', { count: this.targetCount });
            });
        }
    }

    setAchievementCollapsed(collapsed) {
        const root = document.getElementById('achievement-card-root');
        if (!root) return;

        root.classList.toggle('is-collapsed', collapsed);
        localStorage.setItem('achievementCollapsed', String(collapsed));

        const collapseBtn = document.getElementById('btn-achievement-collapse');
        const expandBtn = document.getElementById('btn-achievement-expand');

        if (collapseBtn) collapseBtn.setAttribute('aria-expanded', String(!collapsed));
        if (expandBtn) expandBtn.setAttribute('aria-expanded', String(!collapsed));
    }

    launchConfetti() {
        const canvas = document.getElementById('achievement-confetti-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const parent = canvas.parentElement;
        const rect = parent.getBoundingClientRect();
        canvas.width = rect.width || 600;
        canvas.height = rect.height || 260;

        const colors = ['#38bdf8', '#f43f5e', '#fbbf24', '#a855f7', '#10b981', '#ffffff', '#eab308'];
        const particles = [];
        const count = 55;

        for (let i = 0; i < count; i++) {
            particles.push({
                x: canvas.width * 0.5 + (Math.random() - 0.5) * 80,
                y: canvas.height * 0.4 + (Math.random() - 0.5) * 40,
                vx: (Math.random() - 0.5) * 14,
                vy: (Math.random() - 1.2) * 10 - 2,
                size: Math.random() * 7 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                vRot: (Math.random() - 0.5) * 12,
                alpha: 1,
                decay: Math.random() * 0.014 + 0.008
            });
        }

        let animationFrame;
        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let active = 0;

            particles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.28; // gravity
                p.rotation += p.vRot;
                p.alpha -= p.decay;

                if (p.alpha > 0) {
                    active++;
                    ctx.save();
                    ctx.globalAlpha = Math.max(0, p.alpha);
                    ctx.translate(p.x, p.y);
                    ctx.rotate((p.rotation * Math.PI) / 180);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                    ctx.restore();
                }
            });

            if (active > 0) {
                animationFrame = requestAnimationFrame(render);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        };

        render();
    }

    animateCountUp(target) {
        const collapsedCounter = document.getElementById('collapsed-views');
        if (!this.counterEl && !collapsedCounter) return;

        const duration = 1200;
        const start = 0;
        const startTime = performance.now();

        const setVal = (val) => {
            const formatted = val > 0 ? val.toLocaleString('pt-BR') : '1';
            if (this.counterEl) this.counterEl.textContent = formatted;
            if (collapsedCounter) collapsedCounter.textContent = formatted;
        };

        const updateCount = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (target - start) * easeOut);

            setVal(current);

            if (progress < 1) {
                requestAnimationFrame(updateCount);
            } else {
                setVal(target);
            }
        };

        requestAnimationFrame(updateCount);
    }

    setupAchievementObserver() {
        const achievementCard = document.getElementById('footer-achievement');
        if (!achievementCard) {
            if (this.counterEl) {
                this.counterEl.textContent = this.targetCount ? this.targetCount.toLocaleString('pt-BR') : '1';
            }
            return;
        }

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        achievementCard.classList.add('achievement-unlocked');
                        this.animateCountUp(this.targetCount || 1);
                        this.launchConfetti();
                        this.trackEvent('achievement_footer_reached', { count: this.targetCount });
                        observer.disconnect();
                    }
                });
            }, { threshold: 0.2 });

            observer.observe(achievementCard);
        } else {
            achievementCard.classList.add('achievement-unlocked');
            this.animateCountUp(this.targetCount || 1);
        }
    }

    detectOS() {
        const ua = navigator.userAgent || '';
        if (/Windows NT 10.0|Windows NT 11.0/i.test(ua)) return 'Windows 10/11';
        if (/Windows NT 6.3/i.test(ua)) return 'Windows 8.1';
        if (/Windows/i.test(ua)) return 'Windows';
        if (/Android/i.test(ua)) return 'Android';
        if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
        if (/Mac OS X/i.test(ua)) return 'macOS';
        if (/Linux/i.test(ua)) return 'Linux';
        if (/CrOS/i.test(ua)) return 'ChromeOS';
        return 'Outro';
    }

    detectBrowser() {
        const ua = navigator.userAgent || '';
        if (/Edg\//i.test(ua)) return 'Edge';
        if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua) && !/OPR\//i.test(ua)) return 'Chrome';
        if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return 'Safari';
        if (/Firefox\//i.test(ua)) return 'Firefox';
        if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return 'Opera';
        if (/SamsungBrowser\//i.test(ua)) return 'Samsung Internet';
        return 'Outro';
    }

    detectDevice() {
        const width = window.innerWidth || document.documentElement.clientWidth || 0;
        const ua = navigator.userAgent || '';
        if (/Mobi|Android|iPhone|iPod/i.test(ua) || width < 768) {
            return 'Mobile';
        }
        if (/iPad|Tablet/i.test(ua) || (width >= 768 && width < 1024)) {
            return 'Tablet';
        }
        return 'Desktop';
    }

    extractLocationInfo() {
        let timezone = '';
        let cityRegion = '';
        let utcOffset = '';
        try {
            timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
            if (timezone.includes('/')) {
                cityRegion = timezone.split('/')[1].replace(/_/g, ' ');
            } else {
                cityRegion = timezone;
            }
            const offsetMinutes = -new Date().getTimezoneOffset();
            const offsetHours = offsetMinutes / 60;
            utcOffset = `UTC${offsetHours >= 0 ? '+' : ''}${offsetHours}`;
        } catch (e) {
            timezone = 'Desconhecido';
            cityRegion = 'Desconhecido';
            utcOffset = 'Desconhecido';
        }
        return { timezone, cityRegion, utcOffset };
    }

    extractScreenInfo() {
        const width = window.screen ? window.screen.width : 0;
        const height = window.screen ? window.screen.height : 0;
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
        return {
            screenResolution: width && height ? `${width}x${height}` : 'Desconhecido',
            viewport: `${viewportWidth}x${viewportHeight}`
        };
    }

    classifyReferrer(referrer) {
        if (!referrer) {
            return { host: 'Direto', category: 'direct' };
        }
        let host = '';
        try {
            host = new URL(referrer).hostname.replace(/^www\./, '');
        } catch (e) {
            return { host: referrer, category: 'other' };
        }

        if (host === window.location.hostname) {
            return { host, category: 'internal' };
        }

        const map = [
            { category: 'search', hosts: ['google.', 'bing.', 'duckduckgo.', 'yahoo.', 'ecosia.', 'yandex.', 'baidu.'] },
            { category: 'social', hosts: ['linkedin.', 'lnkd.in', 't.co', 'twitter.', 'x.com', 'facebook.', 'instagram.', 'reddit.', 'youtube.'] },
            { category: 'messaging', hosts: ['t.me', 'telegram.', 'whatsapp.', 'web.whatsapp.'] },
            { category: 'dev', hosts: ['github.', 'gitlab.', 'stackoverflow.', 'dev.to', 'lattes.cnpq.'] }
        ];

        for (const entry of map) {
            if (entry.hosts.some((h) => host.includes(h))) {
                return { host, category: entry.category };
            }
        }
        return { host, category: 'other' };
    }

    createVisitData() {
        const referrer = document.referrer || '';
        const { host: referrerHost, category: referrerSource } = this.classifyReferrer(referrer);
        const params = new URLSearchParams(window.location.search);
        const { timezone, cityRegion, utcOffset } = this.extractLocationInfo();
        const { screenResolution, viewport } = this.extractScreenInfo();

        return {
            type: 'visit',
            timestamp: new Date().toISOString(),
            path: window.location.pathname + window.location.hash,
            url: window.location.href,
            referrer: referrer,
            referrerHost: referrerHost,
            referrerSource: referrerSource,
            utmSource: params.get('utm_source') || '',
            utmMedium: params.get('utm_medium') || '',
            utmCampaign: params.get('utm_campaign') || '',
            utmContent: params.get('utm_content') || '',
            language: navigator.language || '',
            device: this.detectDevice(),
            os: this.detectOS(),
            browser: this.detectBrowser(),
            screenResolution: screenResolution,
            viewport: viewport,
            timezone: timezone,
            cityRegion: cityRegion,
            utcOffset: utcOffset,
            source: 'portfolio-client'
        };
    }

    async collectAndSendVisitData() {
        try {
            const lastSend = localStorage.getItem(this.LAST_SEND_KEY);
            const now = Date.now();

            if (lastSend && (now - parseInt(lastSend, 10)) < this.SEND_THROTTLE_MS) {
                return;
            }

            const visitData = this.createVisitData();
            this.storeVisitData(visitData);
            this.sendToGoogleAppsScript(visitData);
            localStorage.setItem(this.LAST_SEND_KEY, now.toString());
        } catch (error) {
            // Silencioso
        }
    }

    trackEvent(eventName, eventDetails = {}) {
        if (this.shouldSkipNetworkCollection()) {
            return;
        }

        try {
            const { timezone, cityRegion } = this.extractLocationInfo();
            const payload = {
                type: 'event',
                eventName: eventName,
                timestamp: new Date().toISOString(),
                path: window.location.pathname + window.location.hash,
                device: this.detectDevice(),
                os: this.detectOS(),
                browser: this.detectBrowser(),
                timezone: timezone,
                cityRegion: cityRegion,
                language: navigator.language || '',
                details: JSON.stringify(eventDetails)
            };

            this.sendToGoogleAppsScript(payload);
            this.debug('[GeoViewsCounter] Evento de conversão:', payload);
        } catch (error) {
            // Silencioso
        }
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('a, button');
            if (!target) return;

            const href = target.getAttribute('href') || '';
            const download = target.getAttribute('download');
            const trackAttr = target.getAttribute('data-track-event');

            if (trackAttr) {
                this.trackEvent(trackAttr, { text: target.textContent.trim() });
            } else if (download || href.includes('crv.pdf') || href.includes('curriculo')) {
                this.trackEvent('download_cv', { source: target.className });
            } else if (href.includes('t.me/')) {
                this.trackEvent('click_telegram', { href });
            } else if (href.includes('linkedin.com/')) {
                this.trackEvent('click_linkedin', { href });
            } else if (href.includes('lattes.cnpq.br/')) {
                this.trackEvent('click_lattes', { href });
            } else if (href.includes('github.com/')) {
                this.trackEvent('click_github', { href });
            }
        });
    }

    storeVisitData(visitData) {
        try {
            const stored = localStorage.getItem(this.GEO_DATA_KEY);
            let visits = stored ? JSON.parse(stored) : [];
            visits.push(visitData);

            if (visits.length > 500) {
                visits = visits.slice(-500);
            }

            localStorage.setItem(this.GEO_DATA_KEY, JSON.stringify(visits));
        } catch (error) {
            // ignore
        }
    }

    async sendToGoogleAppsScript(payload) {
        if (!this.GOOGLE_APPS_SCRIPT_URL || !this.GOOGLE_APPS_SCRIPT_URL.includes('script.google.com')) {
            return;
        }

        try {
            const body = JSON.stringify(payload);
            await fetch(this.GOOGLE_APPS_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },
                body: body,
                keepalive: true
            }).catch(() => {});
        } catch (error) {
            // Silencioso para evitar poluição de console
        }
    }

    cleanOldData() {
        try {
            const stored = localStorage.getItem(this.GEO_DATA_KEY);
            if (!stored) return;

            let visits = JSON.parse(stored);
            const now = Date.now();
            const maxAge = this.RETENTION_DAYS * 24 * 60 * 60 * 1000;

            visits = visits.filter((visit) => {
                const visitTime = new Date(visit.timestamp).getTime();
                return (now - visitTime) < maxAge;
            });

            localStorage.setItem(this.GEO_DATA_KEY, JSON.stringify(visits));
        } catch (error) {
            // ignore
        }
    }
}

// Expor função global de rastreamento de eventos
window.trackPortfolioEvent = function(eventName, details) {
    if (GeoViewsCounter.instance) {
        GeoViewsCounter.instance.trackEvent(eventName, details);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    new GeoViewsCounter();
});
