class SeelikeMeContentScript {
    constructor() {
        this.isInitialized = false;
        this.pageAnalyzer = null;
        
        this.init();
    }
    
    init() {
        if (this.isInitialized) return;
        
        this.setupPageAnalyzer();
        this.setupMessageHandlers();
        this.observePageChanges();
        
        this.isInitialized = true;
        console.log('See Like Me content script initialized');
    }
    
    setupPageAnalyzer() {
        this.pageAnalyzer = {
            analyzeTextComplexity: () => {
                const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');
                let totalWords = 0;
                let complexWords = 0;
                let sentences = 0;
                
                textElements.forEach(element => {
                    const text = element.textContent.trim();
                    if (text.length > 0) {
                        const words = text.split(/\s+/);
                        totalWords += words.length;
                        
                        words.forEach(word => {
                            if (this.countSyllables(word) >= 3) {
                                complexWords++;
                            }
                        });
                        
                        sentences += (text.match(/[.!?]+/g) || []).length;
                    }
                });
                
                return {
                    totalWords,
                    complexWords,
                    sentences,
                    readabilityScore: this.calculateReadabilityScore(totalWords, complexWords, sentences)
                };
            }
        };
    }
    
    setupMessageHandlers() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.type) {
                case 'ANALYZE_PAGE':
                    const analysis = this.analyzePage();
                    sendResponse(analysis);
                    break;
                    
                case 'GET_PAGE_METRICS':
                    const metrics = this.getPageMetrics();
                    sendResponse(metrics);
                    break;
                    
                default:
                    sendResponse({ error: 'Unknown message type' });
            }
            
            return true;
        });
    }
    
    observePageChanges() {
        const observer = new MutationObserver((mutations) => {
            let hasSignificantChanges = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            hasSignificantChanges = true;
                        }
                    });
                }
            });
            
            if (hasSignificantChanges) {
                this.reapplyActiveSimulations();
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    analyzePage() {
        const textComplexity = this.pageAnalyzer.analyzeTextComplexity();
        
        return {
            url: window.location.href,
            title: document.title,
            textComplexity,
            timestamp: Date.now()
        };
    }
    
    getPageMetrics() {
        return {
            readability: this.pageAnalyzer.analyzeTextComplexity().readabilityScore,
            timestamp: Date.now()
        };
    }
    
    countSyllables(word) {
        word = word.toLowerCase();
        if (word.length <= 3) return 1;
        word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
        word = word.replace(/^y/, '');
        const matches = word.match(/[aeiouy]{1,2}/g);
        return matches ? matches.length : 1;
    }
    
    calculateReadabilityScore(words, complexWords, sentences) {
        if (sentences === 0 || words === 0) return 0;
        
        const avgWordsPerSentence = words / sentences;
        const complexWordRatio = complexWords / words;
        
        return Math.max(0, 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * complexWordRatio));
    }
    
    reapplyActiveSimulations() {
        if (window.disabilitySimulator && window.disabilitySimulator.isEnabled) {
            window.disabilitySimulator.applyActiveSimulations();
        }
    }
}

const seelikeMeContent = new SeelikeMeContentScript();

window.addEventListener('beforeunload', () => {
    console.log('See Like Me content script cleaned up');
});
