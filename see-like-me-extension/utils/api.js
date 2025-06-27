// V0.DEV Style API Utility Module
class SeelikeMeAPI {
    constructor() {
        this.baseURL = 'http://localhost:8000';
        this.timeout = 30000;
        this.retryAttempts = 3;
        this.retryDelay = 1000;
    }
    
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = { timeout: this.timeout, ...options };
        
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const response = await this.fetchWithTimeout(url, config);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                return await response.json();
                
            } catch (error) {
                console.warn(`API request attempt ${attempt} failed:`, error.message);
                
                if (attempt === this.retryAttempts) {
                    throw new Error(`API request failed after ${this.retryAttempts} attempts: ${error.message}`);
                }
                
                await this.delay(this.retryDelay * attempt);
            }
        }
    }
    
    async fetchWithTimeout(url, options) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async healthCheck() {
        try {
            const response = await this.request('/');
            return { status: 'healthy', data: response };
        } catch (error) {
            return { status: 'unhealthy', error: error.message };
        }
    }
    
    async submitAssessment(formData) {
        const form = new FormData();
        Object.keys(formData).forEach(key => {
            form.append(key, formData[key]);
        });
        
        return await this.request('/api/v1/detect/comprehensive', {
            method: 'POST',
            body: form
        });
    }
    
    async getSession(sessionId) {
        return await this.request(`/api/v1/session/${sessionId}`);
    }
    
    async submitFeedback(feedbackData) {
        const form = new FormData();
        Object.keys(feedbackData).forEach(key => {
            form.append(key, feedbackData[key]);
        });
        
        return await this.request('/api/v1/feedback', {
            method: 'POST',
            body: form
        });
    }
    
    async getModelInfo() {
        return await this.request('/api/v1/models/info');
    }
}

window.SeelikeMeAPI = new SeelikeMeAPI();
