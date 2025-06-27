// V0.DEV Style Storage Utility Module
class SeelikeMeStorage {
    constructor() {
        this.prefix = 'seelikeme_';
        this.version = '1.0.0';
    }
    
    async set(key, value) {
        try {
            const storageKey = this.prefix + key;
            await chrome.storage.local.set({ [storageKey]: value });
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    }
    
    async get(key, defaultValue = null) {
        try {
            const storageKey = this.prefix + key;
            const result = await chrome.storage.local.get([storageKey]);
            return result[storageKey] !== undefined ? result[storageKey] : defaultValue;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    }
    
    async remove(key) {
        try {
            const storageKey = this.prefix + key;
            await chrome.storage.local.remove([storageKey]);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    }
    
    async clear() {
        try {
            const allKeys = await chrome.storage.local.get();
            const keysToRemove = Object.keys(allKeys).filter(key => 
                key.startsWith(this.prefix)
            );
            await chrome.storage.local.remove(keysToRemove);
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }
    
    async saveAssessment(assessmentData) {
        const data = {
            ...assessmentData,
            timestamp: Date.now(),
            version: this.version
        };
        return await this.set('last_assessment', data);
    }
    
    async getLastAssessment() {
        return await this.get('last_assessment');
    }
    
    async saveSimulationStates(states) {
        return await this.set('simulation_states', states);
    }
    
    async getSimulationStates() {
        return await this.get('simulation_states', {});
    }
    
    async saveUserPreferences(preferences) {
        return await this.set('user_preferences', preferences);
    }
    
    async getUserPreferences() {
        return await this.get('user_preferences', {
            theme: 'auto',
            notifications: true,
            autoSave: true,
            simulationIntensity: 'medium'
        });
    }
    
    async trackUsage(eventType, eventData = {}) {
        const usageData = await this.get('usage_analytics', []);
        
        usageData.push({
            type: eventType,
            data: eventData,
            timestamp: Date.now(),
            version: this.version
        });
        
        if (usageData.length > 100) {
            usageData.splice(0, usageData.length - 100);
        }
        
        return await this.set('usage_analytics', usageData);
    }
}

window.SeelikeMeStorage = new SeelikeMeStorage();
