/**
 * Geo Views Counter - contador de visitas com envio mínimo
 *
 * Funcionalidades:
 * - Mantém contador anual no localStorage
 * - Armazena últimos 7 dias de visitas locais
 * - Envia um evento mínimo ao Google Apps Script em modo no-cors
 * - Não chama APIs públicas de IP/geolocalização no navegador
 */

class GeoViewsCounter {
    static instance = null;

    constructor() {
        if (GeoViewsCounter.instance) {
            return GeoViewsCounter.instance;
        }

        this.GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyP5GRTqg6H2n7ueIWohyI5wK3EDqWupwmbfkx3FEUNH4cx0Sk6zv8r8wK7T69sMHNG0g/exec";
        this.counterEl = document.getElementById('unique-views');

        this.RETENTION_DAYS = 7;
        this.STORAGE_KEY_PREFIX = 'joaosnet_geo_';
        this.GEO_DATA_KEY = this.STORAGE_KEY_PREFIX + 'data';
        this.LAST_SEND_KEY = this.STORAGE_KEY_PREFIX + 'last_send';
        this.YEARLY_VIEWS_KEY = 'joaosnet_views_';
        this.SEND_THROTTLE_MS = 60 * 60 * 1000;
        this.DEBUG = false;

        GeoViewsCounter.instance = this;

        if (this.counterEl) {
            this.init();
        }
    }

    debug(...args) {
        if (this.DEBUG) {
            console.debug(...args);
        }
    }

    shouldSkipNetworkCollection() {
        return window.location.protocol === 'file:' || window.location.origin === 'null';
    }

    async init() {
        try {
            const initKey = this.STORAGE_KEY_PREFIX + 'initialized_today';
            const today = new Date().toDateString();
            const lastInit = localStorage.getItem(initKey);

            if (lastInit === today) {
                this.debug('[GeoViewsCounter] Já inicializado hoje - pulando');
                return;
            }

            localStorage.setItem(initKey, today);
            this.updateViewCounter();

            if (!this.shouldSkipNetworkCollection()) {
                this.collectAndSendVisitData();
            }

            this.cleanOldData();
        } catch (error) {
            console.warn('[GeoViewsCounter] Erro na inicialização:', error);
        }
    }

    updateViewCounter() {
        try {
            const year = new Date().getFullYear();
            const yearKey = this.YEARLY_VIEWS_KEY + year;
            const count = parseInt(localStorage.getItem(yearKey) || '0') + 1;

            localStorage.setItem(yearKey, count.toString());

            if (this.counterEl) {
                this.counterEl.textContent = count.toLocaleString('pt-BR');
            }

            this.debug(`[GeoViewsCounter] Visitas em ${year}: ${count}`);
        } catch (error) {
            console.warn('[GeoViewsCounter] Erro ao atualizar contador:', error);
        }
    }

    async collectAndSendVisitData() {
        try {
            const lastSend = localStorage.getItem(this.LAST_SEND_KEY);
            const now = Date.now();

            if (lastSend && (now - parseInt(lastSend)) < this.SEND_THROTTLE_MS) {
                this.debug('[GeoViewsCounter] Throttled - já enviado recentemente');
                return;
            }

            const visitData = this.createVisitData();

            this.storeVisitData(visitData);
            this.sendToGoogleAppsScript(visitData);
            localStorage.setItem(this.LAST_SEND_KEY, now.toString());

            this.debug('[GeoViewsCounter] Visita mínima coletada e armazenada:', visitData);
        } catch (error) {
            console.warn('[GeoViewsCounter] Erro ao coletar visita:', error);
        }
    }

    createVisitData() {
        return {
            timestamp: new Date().toISOString(),
            ip: 'Não coletado',
            country: 'Não coletado',
            city: 'Não coletado',
            isp: 'Não coletado',
            path: window.location.pathname,
            url: window.location.href,
            referrer: document.referrer || '',
            source: 'client-minimal'
        };
    }

    storeVisitData(visitData) {
        try {
            const stored = localStorage.getItem(this.GEO_DATA_KEY);
            let visits = stored ? JSON.parse(stored) : [];

            visits.push(visitData);

            if (visits.length > 1000) {
                visits = visits.slice(-1000);
            }

            localStorage.setItem(this.GEO_DATA_KEY, JSON.stringify(visits));
        } catch (error) {
            console.warn('[GeoViewsCounter] Erro ao armazenar dados:', error);
            this.cleanOldData();
        }
    }

    async sendToGoogleAppsScript(visitData) {
        try {
            if (!this.GOOGLE_APPS_SCRIPT_URL || !this.GOOGLE_APPS_SCRIPT_URL.includes('script.google.com')) {
                this.debug('[GeoViewsCounter] Google Apps Script URL não configurada - dados armazenados localmente');
                return;
            }

            const payload = JSON.stringify(visitData);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            try {
                await fetch(this.GOOGLE_APPS_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: {
                        'Content-Type': 'text/plain;charset=utf-8'
                    },
                    body: payload,
                    keepalive: true,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                this.debug('[GeoViewsCounter] Requisição mínima enviada ao Google Apps Script');
            } catch (fetchError) {
                clearTimeout(timeoutId);

                if (fetchError.name === 'AbortError') {
                    console.warn('[GeoViewsCounter] Timeout ao enviar visita mínima (>5s)');
                } else {
                    console.warn('[GeoViewsCounter] Erro de conexão com Google Apps Script:', fetchError.message);
                }
            }
        } catch (error) {
            console.warn('[GeoViewsCounter] Erro ao enviar para Google Apps Script:', error.message);
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
            this.debug(`[GeoViewsCounter] Dados limpos - mantendo últimas ${visits.length} visitas`);
        } catch (error) {
            console.warn('[GeoViewsCounter] Erro ao limpar dados antigos:', error);
        }
    }

    getStoredData() {
        const stored = localStorage.getItem(this.GEO_DATA_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    getLocalStatistics() {
        const visits = this.getStoredData();
        const stats = {
            total: visits.length,
            byCountry: {},
            byCity: {},
            byISP: {}
        };

        visits.forEach((visit) => {
            stats.byCountry[visit.country] = (stats.byCountry[visit.country] || 0) + 1;
            stats.byCity[visit.city] = (stats.byCity[visit.city] || 0) + 1;
            stats.byISP[visit.isp] = (stats.byISP[visit.isp] || 0) + 1;
        });

        return stats;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GeoViewsCounter();
});
