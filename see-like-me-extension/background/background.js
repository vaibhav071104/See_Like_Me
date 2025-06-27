class SeelikeMeBackground {
    constructor() {
        this.activeSimulations = new Map();
        this.userSessions = new Map();
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        console.log('See Like Me background service worker initialized');
    }
    
    setupEventListeners() {
        // MOVE onClicked listener to TOP LEVEL - NOT inside any function
        chrome.contextMenus.onClicked.addListener((info, tab) => {
            this.handleContextMenuClick(info, tab);
        });
        
        chrome.runtime.onInstalled.addListener((details) => {
            this.handleInstallation(details);
            // Setup context menus ONLY after installation
            this.setupContextMenus();
        });
        
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            this.handleTabUpdate(tabId, changeInfo, tab);
        });
        
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true;
        });
        
        chrome.storage.onChanged.addListener((changes, namespace) => {
            this.handleStorageChange(changes, namespace);
        });
    }
    
    setupContextMenus() {
        // ONLY do removeAll and create - NO onClicked here
        chrome.contextMenus.removeAll(() => {
            chrome.contextMenus.create({
                id: 'seelikeme-main',
                title: 'See Like Me',
                contexts: ['page']
            });
            
            chrome.contextMenus.create({
                id: 'toggle-dyslexia',
                parentId: 'seelikeme-main',
                title: 'Toggle Dyslexia Simulation',
                contexts: ['page']
            });
            
            chrome.contextMenus.create({
                id: 'toggle-adhd',
                parentId: 'seelikeme-main',
                title: 'Toggle ADHD Simulation',
                contexts: ['page']
            });
            
            chrome.contextMenus.create({
                id: 'toggle-autism',
                parentId: 'seelikeme-main',
                title: 'Toggle Autism Simulation',
                contexts: ['page']
            });
        });
    }
    
    async handleInstallation(details) {
        if (details.reason === 'install') {
            await this.setupDefaultSettings();
            console.log('Extension installed successfully');
        }
    }
    
    async setupDefaultSettings() {
        const defaultSettings = {
            notifications: true,
            autoAnalysis: true,
            simulationIntensity: 'medium',
            theme: 'auto',
            firstRun: true
        };
        
        await chrome.storage.local.set({ userSettings: defaultSettings });
    }
    
    handleTabUpdate(tabId, changeInfo, tab) {
        if (changeInfo.status === 'complete' && tab.url) {
            this.checkAndApplySimulations(tabId, tab.url);
        }
    }
    
    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.type) {
                case 'OPEN_POPUP':
                    await this.openPopup();
                    sendResponse({ success: true });
                    break;
                    
                default:
                    sendResponse({ error: 'Unknown message type' });
            }
        } catch (error) {
            console.error('Background message handling error:', error);
            sendResponse({ error: error.message });
        }
    }
    
    handleStorageChange(changes, namespace) {
        if (namespace === 'local') {
            if (changes.simulationStates) {
                this.updateSimulationStates(changes.simulationStates.newValue);
            }
        }
    }
    
    async handleContextMenuClick(info, tab) {
        switch (info.menuItemId) {
            case 'toggle-dyslexia':
                await this.toggleSimulation(tab.id, 'dyslexia');
                break;
                
            case 'toggle-adhd':
                await this.toggleSimulation(tab.id, 'adhd');
                break;
                
            case 'toggle-autism':
                await this.toggleSimulation(tab.id, 'autism');
                break;
        }
    }
    
    async checkAndApplySimulations(tabId, url) {
        try {
            const result = await chrome.storage.local.get(['simulationStates']);
            if (result.simulationStates) {
                Object.keys(result.simulationStates).forEach(async (disability) => {
                    if (result.simulationStates[disability]) {
                        try {
                            await chrome.tabs.sendMessage(tabId, {
                                type: 'TOGGLE_SIMULATION',
                                disability: disability,
                                enabled: true,
                                config: {}
                            });
                        } catch (error) {
                            console.log('Could not send message to tab');
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error applying simulations:', error);
        }
    }
    
    async toggleSimulation(tabId, disability) {
        try {
            const result = await chrome.storage.local.get(['simulationStates']);
            const currentStates = result.simulationStates || {};
            const newState = !currentStates[disability];
            
            currentStates[disability] = newState;
            await chrome.storage.local.set({ simulationStates: currentStates });
            
            try {
                await chrome.tabs.sendMessage(tabId, {
                    type: 'TOGGLE_SIMULATION',
                    disability: disability,
                    enabled: newState,
                    config: {}
                });
            } catch (error) {
                console.log('Could not send message to tab');
            }
            
        } catch (error) {
            console.error('Error toggling simulation:', error);
        }
    }
    
    async openPopup() {
        try {
            chrome.action.openPopup();
        } catch (error) {
            chrome.tabs.create({
                url: chrome.runtime.getURL('popup/popup.html')
            });
        }
    }
    
    updateSimulationStates(newStates) {
        if (newStates) {
            this.activeSimulations.clear();
            Object.keys(newStates).forEach(disability => {
                if (newStates[disability]) {
                    this.activeSimulations.set(disability, true);
                }
            });
        }
    }
}

const seelikeMeBackground = new SeelikeMeBackground();
