class SeelikeMePopup {
    constructor() {
        this.currentSection = 'assessment';
        this.sessionId = this.generateSessionId();
        this.detectionResults = null;
        this.simulationConfig = null;
        this.formProgress = 0;
        this.totalFields = 17;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupRangeInputs();
        this.setupFormValidation();
        this.loadSavedData();
        this.showSection('assessment');
        this.updateConnectionStatus();
    }
    
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    setupEventListeners() {
        const assessmentForm = document.getElementById('assessment-form');
        if (assessmentForm) {
            assessmentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAssessmentSubmit();
            });
        }
        
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetAssessment();
            });
        }
        
        const retryBtn = document.getElementById('retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.handleAssessmentSubmit();
            });
        }
        
        const feedbackBtn = document.getElementById('feedback-btn');
        if (feedbackBtn) {
            feedbackBtn.addEventListener('click', () => {
                this.openFeedbackForm();
            });
        }
        
        const dyslexiaToggle = document.getElementById('dyslexia-toggle');
        if (dyslexiaToggle) {
            dyslexiaToggle.addEventListener('change', (e) => {
                this.toggleSimulation('dyslexia', e.target.checked);
            });
        }
        
        const adhdToggle = document.getElementById('adhd-toggle');
        if (adhdToggle) {
            adhdToggle.addEventListener('change', (e) => {
                this.toggleSimulation('adhd', e.target.checked);
            });
        }
        
        const autismToggle = document.getElementById('autism-toggle');
        if (autismToggle) {
            autismToggle.addEventListener('change', (e) => {
                this.toggleSimulation('autism', e.target.checked);
            });
        }
        
        const formInputs = document.querySelectorAll('#assessment-form input');
        formInputs.forEach(input => {
            input.addEventListener('input', () => {
                this.updateFormProgress();
            });
        });
    }
    
    setupRangeInputs() {
        const rangeInputs = document.querySelectorAll('input[type="range"]');
        rangeInputs.forEach(input => {
            const valueDisplay = document.getElementById(input.id + '-value');
            const sliderFill = input.parentElement.querySelector('.slider-fill');
            
            if (valueDisplay) {
                const updateDisplay = () => {
                    let value = input.value;
                    const max = parseInt(input.max);
                    const min = parseInt(input.min);
                    
                    if (input.id.includes('comprehension') || 
                        input.id.includes('spelling') || 
                        input.id.includes('task-completion')) {
                        value += '%';
                    }
                    
                    valueDisplay.textContent = value;
                    
                    if (sliderFill) {
                        const percentage = ((input.value - min) / (max - min)) * 100;
                        sliderFill.style.width = percentage + '%';
                    }
                };
                
                input.addEventListener('input', updateDisplay);
                updateDisplay();
            }
        });
    }
    
    setupFormValidation() {
        const form = document.getElementById('assessment-form');
        const submitBtn = document.getElementById('analyze-btn');
        
        if (!form || !submitBtn) return;
        
        const validateForm = () => {
            const requiredInputs = form.querySelectorAll('input[required]');
            let isValid = true;
            
            requiredInputs.forEach(input => {
                if (!input.value || input.value === '') {
                    isValid = false;
                }
            });
            
            submitBtn.disabled = !isValid;
            return isValid;
        };
        
        form.addEventListener('input', validateForm);
        validateForm();
    }
    
    updateFormProgress() {
        const formInputs = document.querySelectorAll('#assessment-form input');
        let filledFields = 0;
        
        formInputs.forEach(input => {
            if (input.value && input.value !== '') {
                filledFields++;
            }
        });
        
        this.formProgress = (filledFields / this.totalFields) * 100;
        
        const progressFill = document.getElementById('form-progress');
        const progressText = document.querySelector('.progress-text');
        
        if (progressFill) {
            progressFill.style.width = this.formProgress + '%';
        }
        
        if (progressText) {
            progressText.textContent = Math.round(this.formProgress) + '% Complete';
        }
    }
    
    async updateConnectionStatus() {
        const statusIndicator = document.getElementById('connection-status');
        if (!statusIndicator) return;
        
        const statusDot = statusIndicator.querySelector('.status-dot');
        const statusText = statusIndicator.querySelector('.status-text');
        
        try {
            const response = await fetch('http://localhost:8000/', { 
                method: 'GET',
                timeout: 5000 
            });
            
            if (response.ok) {
                if (statusDot) statusDot.style.background = 'var(--success-500)';
                if (statusText) statusText.textContent = 'Connected';
            } else {
                throw new Error('Backend not responding');
            }
        } catch (error) {
            if (statusDot) statusDot.style.background = 'var(--error-500)';
            if (statusText) statusText.textContent = 'Offline';
        }
    }
    
    async loadSavedData() {
        try {
            const result = await chrome.storage.local.get([
                'lastAssessment', 
                'simulationStates', 
                'lastAssessmentTime'
            ]);
            
            if (result.lastAssessment && result.lastAssessmentTime) {
                const timeDiff = Date.now() - result.lastAssessmentTime;
                const hoursDiff = timeDiff / (1000 * 60 * 60);
                
                if (hoursDiff < 24) {
                    this.populateFormWithData(result.lastAssessment);
                    this.showToast('Previous assessment loaded', 'success');
                }
            }
            
            if (result.simulationStates) {
                this.applySimulationStates(result.simulationStates);
            }
        } catch (error) {
            console.error('Error loading saved data:', error);
        }
    }
    
    populateFormWithData(data) {
        Object.keys(data).forEach(key => {
            const input = document.getElementById(key.replace('_', '-'));
            if (input) {
                input.value = data[key];
                input.dispatchEvent(new Event('input'));
            }
        });
        
        this.updateFormProgress();
    }
    
    applySimulationStates(states) {
        Object.keys(states).forEach(disability => {
            const toggle = document.getElementById(`${disability}-toggle`);
            if (toggle) {
                toggle.checked = states[disability];
                this.updateControlItemState(disability, states[disability]);
            }
        });
    }
    
    updateControlItemState(disability, enabled) {
        const controlItem = document.querySelector(`[data-disability="${disability}"]`);
        if (controlItem) {
            if (enabled) {
                controlItem.classList.add('active');
            } else {
                controlItem.classList.remove('active');
            }
        }
    }
    
    async handleAssessmentSubmit() {
        try {
            this.showSection('loading');
            
            const formData = this.collectFormData();
            await this.saveAssessmentData(formData);
            
            const results = await this.submitToBackend(formData);
            
            this.detectionResults = results.detection_results;
            this.simulationConfig = results.simulation_config;
            
            this.displayResults(results);
            this.showSection('results');
            
            this.showToast('Analysis complete!', 'success');
            
        } catch (error) {
            console.error('Assessment submission error:', error);
            this.showSection('error');
            this.showToast('Analysis failed. Please try again.', 'error');
        }
    }
    
    collectFormData() {
        const formData = {
            reading_speed: parseFloat(document.getElementById('reading-speed')?.value || 120),
            comprehension_score: parseFloat(document.getElementById('comprehension')?.value || 75),
            spelling_accuracy: parseFloat(document.getElementById('spelling')?.value || 80),
            phonemic_awareness: parseFloat(document.getElementById('phonemic')?.value || 6),
            working_memory: parseFloat(document.getElementById('working-memory')?.value || 6),
            attention_span: parseFloat(document.getElementById('attention-span')?.value || 15),
            hyperactivity_level: parseFloat(document.getElementById('hyperactivity')?.value || 5),
            impulsivity_score: parseFloat(document.getElementById('impulsivity')?.value || 5),
            focus_duration: parseFloat(document.getElementById('focus-duration')?.value || 20),
            task_completion: parseFloat(document.getElementById('task-completion')?.value || 70),
            light_sensitivity: parseInt(document.getElementById('light-sensitivity')?.value || 3),
            sound_sensitivity: parseInt(document.getElementById('sound-sensitivity')?.value || 3),
            texture_sensitivity: parseInt(document.getElementById('texture-sensitivity')?.value || 3),
            eye_contact_difficulty: parseInt(document.getElementById('eye-contact')?.value || 2),
            social_interaction_challenges: parseInt(document.getElementById('social-interaction')?.value || 2),
            routine_importance: parseInt(document.getElementById('routine-importance')?.value || 3),
            change_resistance: parseInt(document.getElementById('change-resistance')?.value || 3),
            session_id: this.sessionId
        };
        
        return formData;
    }
    
    async saveAssessmentData(formData) {
        try {
            await chrome.storage.local.set({
                lastAssessment: formData,
                lastAssessmentTime: Date.now()
            });
        } catch (error) {
            console.error('Error saving assessment data:', error);
        }
    }
    
    async submitToBackend(formData) {
        const API_BASE_URL = 'http://localhost:8000';
        
        const form = new FormData();
        Object.keys(formData).forEach(key => {
            form.append(key, formData[key]);
        });
        
        const response = await fetch(`${API_BASE_URL}/api/v1/detect/comprehensive`, {
            method: 'POST',
            body: form
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    }
    
    displayResults(results) {
        const resultsContainer = document.getElementById('detection-results');
        if (!resultsContainer) return;
        
        resultsContainer.innerHTML = '';
        
        const disabilities = ['dyslexia', 'adhd', 'autism'];
        
        disabilities.forEach(disability => {
            const result = results.detection_results[disability];
            const card = this.createResultCard(disability, result);
            resultsContainer.appendChild(card);
        });
        
        this.updateSimulationToggles(results.simulation_config);
    }
    
    createResultCard(disability, result) {
        const card = document.createElement('div');
        card.className = `result-card ${result.prediction === 1 ? 'detected' : 'not-detected'}`;
        
        const icons = { dyslexia: '📚', adhd: '🎯', autism: '🌟' };
        const titles = { dyslexia: 'Dyslexia', adhd: 'ADHD', autism: 'Autism' };
        const descriptions = {
            dyslexia: 'Reading and language processing differences',
            adhd: 'Attention and hyperactivity patterns',
            autism: 'Sensory and social processing differences'
        };
        
        const confidenceLevel = result.confidence > 0.8 ? 'high' : 
                               result.confidence > 0.6 ? 'medium' : 'low';
        
        card.innerHTML = `
            <div class="result-header">
                <div class="result-title">
                    <span class="result-icon">${icons[disability]}</span>
                    ${titles[disability]}
                </div>
                <div class="confidence-badge ${confidenceLevel}">
                    ${Math.round(result.confidence * 100)}%
                </div>
            </div>
            <div class="result-description">
                ${descriptions[disability]}
            </div>
            <div class="result-accuracy">
                Model accuracy: ${Math.round(result.accuracy * 100)}% • Method: ${result.method}
            </div>
        `;
        
        return card;
    }
    
    updateSimulationToggles(simulationConfig) {
        Object.keys(simulationConfig).forEach(disability => {
            if (disability !== 'global_settings') {
                const toggle = document.getElementById(`${disability}-toggle`);
                if (toggle) {
                    toggle.checked = simulationConfig[disability].enabled;
                    this.updateControlItemState(disability, simulationConfig[disability].enabled);
                }
            }
        });
    }
    
    // FIXED: Complete rewrite of toggleSimulation to fix connection error
    async toggleSimulation(disability, enabled) {
        try {
            // Save simulation state first
            const simulationStates = await this.getSimulationStates();
            simulationStates[disability] = enabled;
            await chrome.storage.local.set({ simulationStates });
            
            this.updateControlItemState(disability, enabled);
            
            // Get active tab with comprehensive error handling
            let tabs;
            try {
                tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            } catch (error) {
                throw new Error('Cannot access tab information');
            }
            
            if (!tabs || tabs.length === 0) {
                throw new Error('No active tab found');
            }
            
            const tab = tabs[0];
            
            // Validate tab URL
            if (!tab.url) {
                throw new Error('Tab URL not accessible');
            }
            
            // Check if tab URL supports content scripts
            const restrictedUrls = [
                'chrome://', 'chrome-extension://', 'edge://', 'about:', 
                'moz-extension://', 'safari-extension://', 'opera://',
                'chrome-search://', 'chrome-devtools://'
            ];
            
            const isRestricted = restrictedUrls.some(prefix => tab.url.startsWith(prefix));
            if (isRestricted) {
                this.showToast(`Cannot run simulations on ${tab.url.split('://')[0]} pages`, 'warning');
                // Revert toggle
                const toggle = document.getElementById(`${disability}-toggle`);
                if (toggle) {
                    toggle.checked = !enabled;
                    this.updateControlItemState(disability, !enabled);
                }
                return;
            }
            
            // Method 1: Try direct message first
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    type: 'TOGGLE_SIMULATION',
                    disability: disability,
                    enabled: enabled,
                    config: this.simulationConfig?.[disability] || {}
                });
                
                this.showToggleFeedback(disability, enabled);
                return;
                
            } catch (directError) {
                console.log('Direct message failed, trying script injection:', directError.message);
            }
            
            // Method 2: Inject content script if direct message failed
            try {
                // First inject the simulation script
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content/simulation.js']
                });
                
                // Wait for script to initialize
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Try sending message again
                await chrome.tabs.sendMessage(tab.id, {
                    type: 'TOGGLE_SIMULATION',
                    disability: disability,
                    enabled: enabled,
                    config: this.simulationConfig?.[disability] || {}
                });
                
                this.showToggleFeedback(disability, enabled);
                return;
                
            } catch (injectError) {
                console.log('Script injection failed, trying direct execution:', injectError.message);
            }
            
            // Method 3: Direct script execution as last resort
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: (disability, enabled, config) => {
                        // Inline simulation function
                        function applySimulation(disability, enabled) {
                            if (enabled) {
                                if (disability === 'dyslexia') {
                                    document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, a').forEach(el => {
                                        el.style.fontFamily = 'OpenDyslexic, Arial, sans-serif';
                                        el.style.letterSpacing = '0.12em';
                                        el.style.lineHeight = '1.8';
                                    });
                                } else if (disability === 'adhd') {
                                    document.querySelectorAll('*:not(script):not(style)').forEach(el => {
                                        if (Math.random() < 0.7) {
                                            el.style.filter = 'blur(1px)';
                                            el.style.opacity = '0.7';
                                        }
                                    });
                                } else if (disability === 'autism') {
                                    document.body.style.filter = 'brightness(0.8) contrast(0.9)';
                                }
                                
                                // Add indicator
                                let indicator = document.querySelector('.seelikeme-simulation-indicator');
                                if (!indicator) {
                                    indicator = document.createElement('div');
                                    indicator.className = 'seelikeme-simulation-indicator';
                                    indicator.style.cssText = `
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
                                    `;
                                    document.body.appendChild(indicator);
                                }
                                indicator.textContent = `🧠 ${disability} simulation active`;
                                
                            } else {
                                // Remove simulation
                                if (disability === 'dyslexia') {
                                    document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, a').forEach(el => {
                                        el.style.fontFamily = '';
                                        el.style.letterSpacing = '';
                                        el.style.lineHeight = '';
                                    });
                                } else if (disability === 'adhd') {
                                    document.querySelectorAll('*').forEach(el => {
                                        el.style.filter = '';
                                        el.style.opacity = '';
                                    });
                                } else if (disability === 'autism') {
                                    document.body.style.filter = '';
                                }
                                
                                // Remove indicator
                                const indicator = document.querySelector('.seelikeme-simulation-indicator');
                                if (indicator) {
                                    indicator.remove();
                                }
                            }
                        }
                        
                        applySimulation(disability, enabled);
                    },
                    args: [disability, enabled, this.simulationConfig?.[disability] || {}]
                });
                
                this.showToggleFeedback(disability, enabled);
                return;
                
            } catch (execError) {
                throw new Error(`All methods failed: ${execError.message}`);
            }
            
        } catch (error) {
            console.error('Error toggling simulation:', error);
            this.showToast(`Failed to ${enabled ? 'enable' : 'disable'} ${disability} simulation: ${error.message}`, 'error');
            
            // Revert toggle state
            const toggle = document.getElementById(`${disability}-toggle`);
            if (toggle) {
                toggle.checked = !enabled;
                this.updateControlItemState(disability, !enabled);
            }
            
            // Revert storage state
            const simulationStates = await this.getSimulationStates();
            simulationStates[disability] = !enabled;
            await chrome.storage.local.set({ simulationStates });
        }
    }
    
    async getSimulationStates() {
        try {
            const result = await chrome.storage.local.get(['simulationStates']);
            return result.simulationStates || {};
        } catch (error) {
            console.error('Error getting simulation states:', error);
            return {};
        }
    }
    
    showToggleFeedback(disability, enabled) {
        const toggle = document.getElementById(`${disability}-toggle`);
        if (!toggle) return;
        
        const controlItem = toggle.closest('.control-item');
        if (controlItem) {
            controlItem.style.transform = 'scale(1.02)';
            setTimeout(() => {
                controlItem.style.transform = 'scale(1)';
            }, 200);
        }
        
        this.showToast(
            `${disability.charAt(0).toUpperCase() + disability.slice(1)} simulation ${enabled ? 'enabled' : 'disabled'}`,
            'success'
        );
    }
    
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, 3000);
    }
    
    resetAssessment() {
        const form = document.getElementById('assessment-form');
        if (form) {
            form.reset();
        }
        
        this.setupRangeInputs();
        this.updateFormProgress();
        
        chrome.storage.local.remove(['lastAssessment', 'simulationStates', 'lastAssessmentTime']);
        
        this.sessionId = this.generateSessionId();
        this.detectionResults = null;
        this.simulationConfig = null;
        
        this.showSection('assessment');
        this.showToast('Assessment reset successfully', 'success');
    }
    
    showSection(sectionName) {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        this.currentSection = sectionName;
    }
    
    openFeedbackForm() {
        chrome.tabs.create({
            url: 'https://forms.google.com/your-feedback-form'
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SeelikeMePopup();
});
