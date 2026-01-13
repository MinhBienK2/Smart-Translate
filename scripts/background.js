// Background service worker for Smart Translate extension

class BackgroundTranslate {
  constructor() {
    this.init();
    this.bindEvents();
  }

  init() {
    this.translationHistory = [];
    this.settings = {
      defaultFromLang: 'auto',
      defaultToLang: 'en',
      autoTranslate: false,
      saveHistory: true,
      maxHistoryItems: 100,
    };

    this.loadSettings();
    this.loadHistory();
  }

  bindEvents() {
    // Extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstallation(details);
    });

    // Extension startup
    chrome.runtime.onStartup.addListener(() => {
      this.handleStartup();
    });

    // Message handling from popup and content scripts
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async response
    });

    // Tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });

    // Context menu creation
    chrome.runtime.onInstalled.addListener(() => {
      this.createContextMenus();
    });
  }

  async handleInstallation(details) {
    if (details.reason === 'install') {
      console.log('Smart Translate extension installed');

      // Set default settings
      await this.saveSettings();

      // Show welcome page
      await this.showWelcomePage();
    } else if (details.reason === 'update') {
      console.log(
        'Smart Translate extension updated to version',
        chrome.runtime.getManifest().version
      );
    }
  }

  handleStartup() {
    console.log('Smart Translate extension started');
    this.loadSettings();
    this.loadHistory();
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'translateText':
          const translation = await this.translateText(
            request.text,
            request.fromLang,
            request.toLang
          );
          sendResponse({ success: true, translation });
          break;

        case 'getSettings':
          sendResponse({ success: true, settings: this.settings });
          break;

        case 'updateSettings':
          await this.updateSettings(request.settings);
          sendResponse({ success: true });
          break;

        case 'getHistory':
          sendResponse({ success: true, history: this.translationHistory });
          break;

        case 'clearHistory':
          await this.clearHistory();
          sendResponse({ success: true });
          break;

        case 'translateSelection':
          // Handle text selection translation
          await this.handleSelectionTranslation(request.text, sender.tab);
          sendResponse({ success: true });
          break;

        case 'translatePage':
          // Handle page translation
          await this.handlePageTranslation(sender.tab);
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Message handling error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleTabUpdate(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url) {
      // Check if we should auto-translate this page
      if (this.settings.autoTranslate) {
        const shouldTranslate = await this.shouldAutoTranslate(tab.url);
        if (shouldTranslate) {
          // Inject content script if not already present
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tabId },
              files: ['scripts/content.js'],
            });
          } catch (error) {
            // Content script might already be injected
            console.log('Content script injection skipped:', error.message);
          }
        }
      }
    }
  }

  async shouldAutoTranslate(url) {
    // Check if URL matches auto-translate patterns
    const autoTranslatePatterns = [
      /^https?:\/\/.*\.(cn|jp|kr|ru|de|fr|es|it|pt|ar|hi|vn)\//i,
      /^https?:\/\/(google|bing|yandex)\.[a-z]{2,3}\//i,
    ];

    return autoTranslatePatterns.some((pattern) => pattern.test(url));
  }

  async handleSelectionTranslation(text, tab) {
    if (!text || !tab) return;

    // Store in history
    if (this.settings.saveHistory) {
      await this.addToHistory({
        originalText: text,
        translatedText: '', // Will be filled when translation completes
        fromLang: 'auto',
        toLang: this.settings.defaultToLang,
        timestamp: Date.now(),
        url: tab.url,
      });
    }

    // Open popup with selected text
    try {
      await chrome.action.openPopup();
    } catch (error) {
      console.log('Could not open popup automatically');
    }
  }

  async handlePageTranslation(tab) {
    if (!tab) return;

    try {
      // Inject page translation script
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: this.injectPageTranslation,
      });
    } catch (error) {
      console.error('Page translation injection failed:', error);
    }
  }

  static injectPageTranslation() {
    // This function will be injected into the web page
    console.log('Page translation feature would be implemented here');

    // Create translation overlay
    const overlay = document.createElement('div');
    overlay.className = 'smart-translate-overlay';
    overlay.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; z-index: 10000;">
                <button id="smart-translate-toggle" style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 10px 16px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-family: Arial, sans-serif;
                    font-size: 14px;
                ">Toggle Translation</button>
            </div>
        `;

    document.body.appendChild(overlay);

    // Add toggle functionality
    const toggleBtn = overlay.querySelector('#smart-translate-toggle');
    toggleBtn.addEventListener('click', () => {
      alert('Page translation feature coming soon!');
    });
  }

  async translateText(text, fromLang, toLang) {
    try {
      // Use MyMemory API for translation
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          text
        )}&langpair=${fromLang}|${toLang}`
      );
      const data = await response.json();

      if (data.responseStatus === 200) {
        return data.responseData.translatedText;
      } else {
        throw new Error('Translation API error');
      }
    } catch (error) {
      console.error('Translation failed:', error);
      // Return fallback translation
      return `[Translated to ${toLang.toUpperCase()}] ${text}`;
    }
  }

  async addToHistory(item) {
    this.translationHistory.unshift(item);

    // Limit history size
    if (this.translationHistory.length > this.settings.maxHistoryItems) {
      this.translationHistory = this.translationHistory.slice(
        0,
        this.settings.maxHistoryItems
      );
    }

    await this.saveHistory();
  }

  async loadHistory() {
    try {
      const result = await chrome.storage.local.get(['translationHistory']);
      if (result.translationHistory) {
        this.translationHistory = result.translationHistory;
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }

  async saveHistory() {
    try {
      await chrome.storage.local.set({
        translationHistory: this.translationHistory,
      });
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  }

  async clearHistory() {
    this.translationHistory = [];
    await this.saveHistory();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['settings']);
      if (result.settings) {
        this.settings = { ...this.settings, ...result.settings };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.sync.set({ settings: this.settings });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  async updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
  }

  createContextMenus() {
    // Create context menu for text selection
    chrome.contextMenus.create({
      id: 'smart-translate-selection',
      title: 'Translate with Smart Translate',
      contexts: ['selection'],
      documentUrlPatterns: ['<all_urls>'],
    });

    // Create context menu for page
    chrome.contextMenus.create({
      id: 'smart-translate-page',
      title: 'Translate Page with Smart Translate',
      contexts: ['page'],
      documentUrlPatterns: ['<all_urls>'],
    });
  }

  async showWelcomePage() {
    try {
      await chrome.tabs.create({
        url: chrome.runtime.getURL('html/welcome.html'),
      });
    } catch (error) {
      console.error('Failed to show welcome page:', error);
    }
  }
}

// Initialize background service worker
const backgroundTranslate = new BackgroundTranslate();

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'smart-translate-selection') {
    backgroundTranslate.handleSelectionTranslation(info.selectionText, tab);
  } else if (info.menuItemId === 'smart-translate-page') {
    backgroundTranslate.handlePageTranslation(tab);
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // This will only fire if no popup is defined
  // Since we have a popup, this won't be called
  console.log('Extension icon clicked');
});
