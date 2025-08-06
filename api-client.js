// API Client for Tamil Names Website
class TamilNamesAPI {
    constructor() {
        // Use port 3000 for API calls when accessing from any port
        this.baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:3000/api'
            : '/api';
        this.sessionId = this.getOrCreateSessionId();
    }

    getOrCreateSessionId() {
        let sessionId = localStorage.getItem('tamilNamesSessionId');
        if (!sessionId) {
            sessionId = this.generateSessionId();
            localStorage.setItem('tamilNamesSessionId', sessionId);
        }
        return sessionId;
    }

    generateSessionId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Names API
    async getNames(filters = {}) {
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                params.append(key, filters[key]);
            }
        });
        
        const endpoint = `/names${params.toString() ? '?' + params.toString() : ''}`;
        return this.request(endpoint);
    }

    async getName(id) {
        return this.request(`/names/${id}`);
    }

    async submitName(nameData) {
        return this.request('/names', {
            method: 'POST',
            body: { ...nameData, sessionId: this.sessionId }
        });
    }

    async voteForName(nameId) {
        return this.request(`/names/${nameId}/vote`, {
            method: 'POST',
            body: { sessionId: this.sessionId }
        });
    }

    async getUserVotes() {
        return this.request(`/users/${this.sessionId}/votes`);
    }

    async toggleFavorite(nameId) {
        return this.request(`/names/${nameId}/favorite`, {
            method: 'POST',
            body: { sessionId: this.sessionId }
        });
    }

    async getUserFavorites() {
        return this.request(`/users/${this.sessionId}/favorites`);
    }

    // Admin API
    async getAdminStats() {
        return this.request('/admin/stats');
    }

    async approveName(nameId) {
        return this.request(`/admin/names/${nameId}/approve`, {
            method: 'POST'
        });
    }

    async deleteName(nameId) {
        return this.request(`/admin/names/${nameId}`, {
            method: 'DELETE'
        });
    }

    async updateName(nameId, nameData) {
        return this.request(`/admin/names/${nameId}`, {
            method: 'PUT',
            body: nameData
        });
    }
}

// Global API instance
const api = new TamilNamesAPI();
