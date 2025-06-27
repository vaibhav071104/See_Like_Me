class DisabilitySimulator {
    constructor() {
        this.activeSimulations = new Set();
        this.simulationConfigs = {};
        this.originalStyles = new Map();
        this.observers = [];
        this.isEnabled = false;
        
        this.init();
    }
    
    init() {
        this.createSimulationStyles();
        this.setupMessageListener();
        this.loadActiveSimulations();
    }
    
    createSimulationStyles() {
        const style = document.createElement('style');
        style.id = 'seelikeme-simulation-styles';
        style.textContent = `
            .seelikeme-dyslexia-active {
                font-family: 'OpenDyslexic', Arial, sans-serif !important;
                letter-spacing: 0.12em !important;
                word-spacing: 0.16em !important;
                line-height: 1.8 !important;
            }
            
            .seelikeme-dyslexia-text-shimmer {
                animation: dyslexiaShimmer 3s ease-in-out infinite !important;
            }
            
            @keyframes dyslexiaShimmer {
                0%, 100% { transform: translateX(0px); }
                25% { transform: translateX(1px); }
                50% { transform: translateX(-1px); }
                75% { transform: translateX(0.5px); }
            }
            
            .seelikeme-adhd-blur {
                filter: blur(1px) !important;
                opacity: 0.7 !important;
                transition: all 0.3s ease !important;
            }
            
            .seelikeme-adhd-focus-highlight {
                box-shadow: 0 0 20px rgba(99, 102, 241, 0.5) !important;
                border: 2px solid rgba(99, 102, 241, 0.3) !important;
                border-radius: 8px !important;
            }
            
            .seelikeme-autism-active {
                filter: brightness(0.8) contrast(0.9) !important;
            }
            
            .seelikeme-autism-sensory-filter {
                background: rgba(255, 248, 220, 0.1) !important;
                backdrop-filter: blur(0.5px) !important;
            }
            
            .seelikeme-simulation-indicator {
                position: fixed !important;
                top: 20px !important;
                right: 20px !important;
                background: rgba(99, 102, 241, 0.9) !important;
                color: white !important;
                padding: 8px 16px !important;
                border-radius: 20px !important;
                font-size: 12px !important;
                font-weight: 600 !important;
                z-index: 10000 !important;
                backdrop-filter: blur(10px) !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'TOGGLE_SIMULATION') {
                this.toggleSimulation(message.disability, message.enabled, message.config);
                sendResponse({ success: true });
            }
            return true;
        });
    }
    
    async loadActiveSimulations() {
        try {
            const result = await chrome.storage.local.get(['simulationStates']);
            if (result.simulationStates) {
                Object.keys(result.simulationStates).forEach(disability => {
                    if (result.simulationStates[disability]) {
                        this.activeSimulations.add(disability);
                    }
                });
                
                if (this.activeSimulations.size > 0) {
                    this.isEnabled = true;
                    this.applyActiveSimulations();
                }
            }
        } catch (error) {
            console.error('Error loading active simulations:', error);
        }
    }
    
    toggleSimulation(disability, enabled, config = {}) {
        if (enabled) {
            this.activeSimulations.add(disability);
            this.simulationConfigs[disability] = config;
            this.applySimulation(disability, config);
        } else {
            this.activeSimulations.delete(disability);
            this.removeSimulation(disability);
        }
        
        this.isEnabled = this.activeSimulations.size > 0;
        this.updateSimulationIndicator();
        this.saveSimulationState();
    }
    
    applyActiveSimulations() {
        this.activeSimulations.forEach(disability => {
            const config = this.simulationConfigs[disability] || {};
            this.applySimulation(disability, config);
        });
        
        this.updateSimulationIndicator();
    }
    
    applySimulation(disability, config) {
        switch (disability) {
            case 'dyslexia':
                this.applyDyslexiaSimulation(config);
                break;
            case 'adhd':
                this.applyADHDSimulation(config);
                break;
            case 'autism':
                this.applyAutismSimulation(config);
                break;
        }
    }
    
    applyDyslexiaSimulation(config) {
        const textElements = this.getAllTextElements();
        
        textElements.forEach(element => {
            if (!this.originalStyles.has(element)) {
                this.originalStyles.set(element, {
                    fontFamily: element.style.fontFamily,
                    letterSpacing: element.style.letterSpacing,
                    wordSpacing: element.style.wordSpacing,
                    lineHeight: element.style.lineHeight
                });
            }
            
            element.classList.add('seelikeme-dyslexia-active');
            
            if (config.settings && config.settings.text_shimmer) {
                element.classList.add('seelikeme-dyslexia-text-shimmer');
            }
        });
    }
    
    applyADHDSimulation(config) {
        const allElements = document.querySelectorAll('*:not(script):not(style):not(meta)');
        
        allElements.forEach((element, index) => {
            if (!this.originalStyles.has(element)) {
                this.originalStyles.set(element, {
                    filter: element.style.filter,
                    opacity: element.style.opacity
                });
            }
            
            if (Math.random() < 0.7) {
                element.classList.add('seelikeme-adhd-blur');
            }
            
            if (this.isFocusableElement(element)) {
                element.addEventListener('mouseenter', () => {
                    element.classList.add('seelikeme-adhd-focus-highlight');
                    element.classList.remove('seelikeme-adhd-blur');
                });
                
                element.addEventListener('mouseleave', () => {
                    element.classList.remove('seelikeme-adhd-focus-highlight');
                    if (Math.random() < 0.7) {
                        element.classList.add('seelikeme-adhd-blur');
                    }
                });
            }
        });
    }
    
    applyAutismSimulation(config) {
        document.body.classList.add('seelikeme-autism-active');
        
        if (config.settings && config.settings.sensory_filtering) {
            document.body.classList.add('seelikeme-autism-sensory-filter');
        }
        
        if (config.settings) {
            const brightnessReduction = config.settings.brightness_reduction || 0;
            const contrastReduction = config.settings.contrast_reduction || 0;
            
            document.body.style.filter = `brightness(${1 - brightnessReduction}) contrast(${1 - contrastReduction})`;
        }
    }
    
    removeSimulation(disability) {
        switch (disability) {
            case 'dyslexia':
                this.removeDyslexiaSimulation();
                break;
            case 'adhd':
                this.removeADHDSimulation();
                break;
            case 'autism':
                this.removeAutismSimulation();
                break;
        }
    }
    
    removeDyslexiaSimulation() {
        const elements = document.querySelectorAll('.seelikeme-dyslexia-active');
        elements.forEach(element => {
            element.classList.remove('seelikeme-dyslexia-active', 'seelikeme-dyslexia-text-shimmer');
            
            if (this.originalStyles.has(element)) {
                const original = this.originalStyles.get(element);
                element.style.fontFamily = original.fontFamily;
                element.style.letterSpacing = original.letterSpacing;
                element.style.wordSpacing = original.wordSpacing;
                element.style.lineHeight = original.lineHeight;
                this.originalStyles.delete(element);
            }
        });
    }
    
    removeADHDSimulation() {
        const elements = document.querySelectorAll('.seelikeme-adhd-blur, .seelikeme-adhd-focus-highlight');
        elements.forEach(element => {
            element.classList.remove('seelikeme-adhd-blur', 'seelikeme-adhd-focus-highlight');
            
            if (this.originalStyles.has(element)) {
                const original = this.originalStyles.get(element);
                element.style.filter = original.filter;
                element.style.opacity = original.opacity;
                this.originalStyles.delete(element);
            }
        });
    }
    
    removeAutismSimulation() {
        document.body.classList.remove('seelikeme-autism-active', 'seelikeme-autism-sensory-filter');
        document.body.style.filter = '';
    }
    
    getAllTextElements() {
        const textSelectors = 'p, h1, h2, h3, h4, h5, h6, span, div, a, li, td, th, label, button';
        return document.querySelectorAll(textSelectors);
    }
    
    isFocusableElement(element) {
        const focusableSelectors = 'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])';
        return element.matches(focusableSelectors);
    }
    
    updateSimulationIndicator() {
        const existingIndicator = document.querySelector('.seelikeme-simulation-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        if (this.activeSimulations.size > 0) {
            const indicator = document.createElement('div');
            indicator.className = 'seelikeme-simulation-indicator';
            indicator.textContent = `🧠 Simulating: ${Array.from(this.activeSimulations).join(', ')}`;
            
            indicator.addEventListener('click', () => {
                chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
            });
            
            document.body.appendChild(indicator);
            
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.style.opacity = '0.3';
                }
            }, 5000);
        }
    }
    
    async saveSimulationState() {
        try {
            const simulationStates = {};
            this.activeSimulations.forEach(disability => {
                simulationStates[disability] = true;
            });
            
            await chrome.storage.local.set({ simulationStates });
        } catch (error) {
            console.error('Error saving simulation state:', error);
        }
    }
}

window.disabilitySimulator = new DisabilitySimulator();
