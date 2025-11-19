/**
 * Geo Views Counter - Coleta dados de visita e envia para Google Drive
 * 
 * Funcionalidades:
 * - Coleta IP, país, cidade, ISP via ip-api.com (grátis, 45 req/min)
 * - Coleta timestamp e user-agent
 * - Armazena últimos 7 dias de dados em localStorage
 * - Envia dados a cada visita para Google Apps Script (async, não bloqueia)
 * - Mantém contador de visitantes único por ano no localStorage
 */

class GeoViewsCounter {
    constructor() {
        // URL do Google Apps Script - VOCÊ DEVE PREENCHER ISSO COM A URL GERADA
        this.GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyP5GRTqg6H2n7ueIWohyI5wK3EDqWupwmbfkx3FEUNH4cx0Sk6zv8r8wK7T69sMHNG0g/exec";
        
        // Elementos HTML
        this.counterEl = document.getElementById('unique-views');
        
        // Configurações
        this.RETENTION_DAYS = 7; // Manter apenas últimos 7 dias
        this.STORAGE_KEY_PREFIX = 'joaosnet_geo_';
        this.GEO_DATA_KEY = this.STORAGE_KEY_PREFIX + 'data';
        this.LAST_SEND_KEY = this.STORAGE_KEY_PREFIX + 'last_send';
        this.YEARLY_VIEWS_KEY = 'joaosnet_views_';
        
        // Rate limiting - não enviar duas vezes na mesma hora de um mesmo IP
        this.SEND_THROTTLE_MS = 60 * 60 * 1000; // 1 hora
        
        // API endpoint para geolocalização
        this.GEO_API_URL = 'https://ip-api.com/json/';
        
        if (this.counterEl) {
            this.init();
        }
    }

    /**
     * Inicializa o contador e coleta dados
     */
    async init() {
        try {
            // Atualizar contador de visitas únicas
            this.updateViewCounter();
            
            // Coletar dados de geolocalização (async, não bloqueia)
            this.collectAndSendGeoData();
            
            // Limpar dados antigos (>7 dias)
            this.cleanOldData();
            
        } catch (error) {
            console.warn('[GeoViewsCounter] Erro na inicialização:', error);
        }
    }

    /**
     * Atualiza o contador de visitantes únicos anual
     */
    updateViewCounter() {
        try {
            const year = new Date().getFullYear();
            const yearKey = this.YEARLY_VIEWS_KEY + year;
            
            // Incrementar contador
            let count = parseInt(localStorage.getItem(yearKey) || '0') + 1;
            localStorage.setItem(yearKey, count.toString());
            
            // Mostrar no HTML
            if (this.counterEl) {
                this.counterEl.textContent = count.toLocaleString('pt-BR');
            }
            
            console.log(`[GeoViewsCounter] Visitas em ${year}: ${count}`);
            
        } catch (error) {
            console.warn('[GeoViewsCounter] Erro ao atualizar contador:', error);
        }
    }

    /**
     * Coleta dados de geolocalização e envia para Google Apps Script
     */
    async collectAndSendGeoData() {
        try {
            // Verificar rate limiting
            const lastSend = localStorage.getItem(this.LAST_SEND_KEY);
            const now = Date.now();
            
            if (lastSend && (now - parseInt(lastSend)) < this.SEND_THROTTLE_MS) {
                console.log('[GeoViewsCounter] Throttled - já enviado recentemente');
                return;
            }
            
            // Coletar dados de geolocalização
            const geoData = await this.fetchGeoData();
            
            if (!geoData) {
                console.warn('[GeoViewsCounter] Falha ao obter dados de geo');
                return;
            }
            
            // Preparar dados para enviar
            const visitData = {
                timestamp: new Date().toISOString(),
                ip: geoData.ip,
                country: geoData.country,
                city: geoData.city,
                isp: geoData.isp,
                userAgent: navigator.userAgent,
                url: window.location.href,
                referrer: document.referrer
            };
            
            // Armazenar localmente
            this.storeVisitData(visitData);
            
            // Enviar para Google Apps Script (async, não bloqueia)
            this.sendToGoogleAppsScript(visitData);
            
            // Atualizar timestamp de último envio
            localStorage.setItem(this.LAST_SEND_KEY, now.toString());
            
            console.log('[GeoViewsCounter] Dados coletados e armazenados:', visitData);
            
        } catch (error) {
            console.warn('[GeoViewsCounter] Erro ao coletar dados de geo:', error);
        }
    }

    /**
     * Faz request para obter geolocalização (com fallback para múltiplos serviços)
     * Ordem baseada em pesquisa de melhores práticas:
     * 1. ipapi.co - Melhor suporte CORS, recomendado para client-side
     * 2. country.is - Simples, apenas país, com CORS, sem limite de taxa
     * 3. ipify.org - Apenas IP, confiável
     */
    async fetchGeoData() {
        try {
            console.log('[GeoViewsCounter] Iniciando coleta de geolocalização...');
            
            // Tentar primeiro com ipapi.co (melhor CORS para client-side)
            let data = await this.tryIpapiCo();
            if (data) {
                console.log('[GeoViewsCounter] ✓ ipapi.co funcionou');
                return data;
            }
            
            // Fallback para country.is (simples, apenas país, excelente CORS)
            data = await this.tryCountryIs();
            if (data) {
                console.log('[GeoViewsCounter] ✓ country.is funcionou');
                return data;
            }
            
            // Fallback para ip-api.com (pode ter problemas CORS em navegador)
            data = await this.tryIpApiCom();
            if (data) {
                console.log('[GeoViewsCounter] ✓ ip-api.com funcionou');
                return data;
            }
            
            // Último fallback: apenas IP sem geolocalização
            const ipData = await this.tryGetIpOnly();
            if (ipData) {
                console.log('[GeoViewsCounter] ✓ ipify.org (apenas IP) funcionou');
                return ipData;
            }
            
            console.warn('[GeoViewsCounter] ✗ Nenhum serviço de geo funcionou');
            return null;
            
        } catch (error) {
            console.warn('[GeoViewsCounter] Erro ao fazer fetch de geo:', error);
            return null;
        }
    }

    /**
     * Tenta usar ipapi.co - Recomendado para client-side (JavaScript no navegador)
     * API: https://ipapi.co/api/?javascript
     * Retorna: ip, city, region, country, timezone, etc.
     */
    async tryIpapiCo() {
        try {
            const response = await fetch('https://ipapi.co/json/', {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            
            if (!response.ok) {
                console.log(`[GeoViewsCounter] ipapi.co HTTP ${response.status}`);
                return null;
            }
            
            const data = await response.json();
            
            // Validar resposta
            if (data.error) {
                console.log('[GeoViewsCounter] ipapi.co erro:', data.reason);
                return null;
            }
            
            if (!data.ip) {
                console.log('[GeoViewsCounter] ipapi.co sem IP na resposta');
                return null;
            }
            
            return {
                ip: data.ip,
                country: data.country_name || data.country || 'Desconhecido',
                city: data.city || 'Desconhecido',
                isp: data.org || 'Desconhecido'
            };
        } catch (error) {
            console.log('[GeoViewsCounter] ipapi.co erro:', error.message);
            return null;
        }
    }

    /**
     * Tenta usar country.is - API simples, excelente CORS, sem limite de taxa
     * API: https://country.is/
     * Retorna: Apenas país (o2)
     * Baseado em MaxMind GeoIP2
     */
    async tryCountryIs() {
        try {
            const response = await fetch('https://api.country.is/', {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            
            if (!response.ok) {
                console.log(`[GeoViewsCounter] country.is HTTP ${response.status}`);
                return null;
            }
            
            const data = await response.json();
            
            // Validar resposta
            if (!data.country) {
                console.log('[GeoViewsCounter] country.is sem país na resposta');
                return null;
            }
            
            // Tentar obter IP também
            let ip = 'Desconhecido';
            try {
                const ipResponse = await fetch('https://api.ipify.org?format=json', {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                });
                if (ipResponse.ok) {
                    const ipData = await ipResponse.json();
                    ip = ipData.ip || 'Desconhecido';
                }
            } catch (e) {
                // Ignorar erro de obter IP
            }
            
            return {
                ip: ip,
                country: data.country || 'Desconhecido',
                city: 'Desconhecido',
                isp: 'Desconhecido'
            };
        } catch (error) {
            console.log('[GeoViewsCounter] country.is erro:', error.message);
            return null;
        }
    }

    /**
     * Tenta usar ip-api.com - Pode ter problemas CORS em navegador
     * Testado após ipapi.co e country.is como fallback
     */
    async tryIpApiCom() {
        try {
            const response = await fetch(this.GEO_API_URL + '?fields=ip,country,city,isp', {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            
            if (!response.ok) {
                console.log(`[GeoViewsCounter] ip-api.com HTTP ${response.status}`);
                return null;
            }
            
            const data = await response.json();
            
            // Validar resposta
            if (!data.ip || data.status === 'fail') {
                console.log('[GeoViewsCounter] ip-api.com resposta fail:', data);
                return null;
            }
            
            return {
                ip: data.ip,
                country: data.country || 'Desconhecido',
                city: data.city || 'Desconhecido',
                isp: data.isp || 'Desconhecido'
            };
        } catch (error) {
            console.log('[GeoViewsCounter] ip-api.com erro:', error.message);
            return null;
        }
    }

    /**
     * Último fallback: apenas obter IP público via ipify
     * Simples, confiável, sem geolocalização
     */
    async tryGetIpOnly() {
        try {
            const response = await fetch('https://api.ipify.org?format=json', {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            
            if (!response.ok) {
                console.log(`[GeoViewsCounter] ipify HTTP ${response.status}`);
                return null;
            }
            
            const data = await response.json();
            
            if (!data.ip) {
                console.log('[GeoViewsCounter] ipify sem IP na resposta');
                return null;
            }
            
            return {
                ip: data.ip,
                country: 'Desconhecido',
                city: 'Desconhecido',
                isp: 'Desconhecido'
            };
        } catch (error) {
            console.log('[GeoViewsCounter] ipify erro:', error.message);
            return null;
        }
    }

    /**
     * Armazena dados de visita em localStorage
     */
    storeVisitData(visitData) {
        try {
            // Obter dados existentes
            const stored = localStorage.getItem(this.GEO_DATA_KEY);
            let visits = stored ? JSON.parse(stored) : [];
            
            // Adicionar nova visita
            visits.push(visitData);
            
            // Limitar a últimas 1000 visitas (para não estourar localStorage)
            if (visits.length > 1000) {
                visits = visits.slice(-1000);
            }
            
            // Salvar
            localStorage.setItem(this.GEO_DATA_KEY, JSON.stringify(visits));
            
        } catch (error) {
            console.warn('[GeoViewsCounter] Erro ao armazenar dados:', error);
            // Se localStorage falhar (cheio), limpar dados antigos
            this.cleanOldData();
        }
    }

    /**
     * Envia dados para Google Apps Script
     */
    async sendToGoogleAppsScript(visitData) {
        try {
            // Se URL não está configurada ou é inválida, pular
            if (!this.GOOGLE_APPS_SCRIPT_URL || !this.GOOGLE_APPS_SCRIPT_URL.includes('script.google.com')) {
                console.log('[GeoViewsCounter] Google Apps Script URL não configurada - dados não enviados');
                return;
            }
            
            const payload = JSON.stringify(visitData);
            
            // Usar fetch com keepalive para não bloquear navegação
            const response = await fetch(this.GOOGLE_APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: payload,
                keepalive: true // Permite que request continue mesmo se página fecha
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('[GeoViewsCounter] Enviado para Google Drive:', result);
            } else {
                console.warn('[GeoViewsCounter] Erro ao enviar para Google Drive:', response.status);
            }
            
        } catch (error) {
            // Erros de envio não devem interromper o uso do site
            console.warn('[GeoViewsCounter] Erro ao enviar para Google Apps Script:', error);
        }
    }

    /**
     * Remove dados com mais de 7 dias de localStorage
     */
    cleanOldData() {
        try {
            const stored = localStorage.getItem(this.GEO_DATA_KEY);
            if (!stored) return;
            
            let visits = JSON.parse(stored);
            const now = Date.now();
            const maxAge = this.RETENTION_DAYS * 24 * 60 * 60 * 1000; // 7 dias em ms
            
            // Filtrar: manter apenas dados com menos de 7 dias
            visits = visits.filter(visit => {
                const visitTime = new Date(visit.timestamp).getTime();
                return (now - visitTime) < maxAge;
            });
            
            // Salvar dados limpos
            localStorage.setItem(this.GEO_DATA_KEY, JSON.stringify(visits));
            
            console.log(`[GeoViewsCounter] Dados limpos - mantendo últimas ${visits.length} visitas`);
            
        } catch (error) {
            console.warn('[GeoViewsCounter] Erro ao limpar dados antigos:', error);
        }
    }

    /**
     * Método útil para debugar: retorna todos os dados armazenados
     * Use no console: new GeoViewsCounter().getStoredData()
     */
    getStoredData() {
        const stored = localStorage.getItem(this.GEO_DATA_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Método útil: retorna estatísticas dos dados locais
     */
    getLocalStatistics() {
        const visits = this.getStoredData();
        const stats = {
            total: visits.length,
            byCountry: {},
            byCity: {},
            byISP: {}
        };
        
        visits.forEach(visit => {
            stats.byCountry[visit.country] = (stats.byCountry[visit.country] || 0) + 1;
            stats.byCity[visit.city] = (stats.byCity[visit.city] || 0) + 1;
            stats.byISP[visit.isp] = (stats.byISP[visit.isp] || 0) + 1;
        });
        
        return stats;
    }
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new GeoViewsCounter();
});
