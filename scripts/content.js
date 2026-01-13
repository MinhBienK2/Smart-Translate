// Content script for Smart Translate extension
// This script runs on every web page to enable translation features

class ContentTranslate {
  constructor() {
    this.init();
    this.bindEvents();
    this.createFloatingButton();
    this.loadSettings();
  }

  init() {
    this.isActive = false;
    this.floatingButton = null;
    this.translationOverlay = null;
    this.selectedText = '';
    this.currentPosition = { x: 0, y: 0 };
    this.showSelectionIcon = true; // Default to true
  }

  bindEvents() {
    // Listen for text selection
    document.addEventListener('mouseup', (e) => this.handleTextSelection(e));
    document.addEventListener('keyup', (e) => this.handleTextSelection(e));

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'translateSelection') {
        this.translateSelectedText();
        sendResponse({ success: true });
      } else if (request.action === 'updateSelectionIconSetting') {
        this.showSelectionIcon = request.showSelectionIcon;
        // Hide the button if the setting is turned off
        if (!this.showSelectionIcon) {
          this.hideFloatingButton();
        }
        sendResponse({ success: true });
      }
    });

    // Handle right-click context menu
    document.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['showSelectionIcon']);
      if (result.showSelectionIcon !== undefined) {
        this.showSelectionIcon = result.showSelectionIcon;
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  handleTextSelection(e) {
    // Use setTimeout to ensure selection is complete
    setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();

      if (selectedText && selectedText.length > 0) {
        this.selectedText = selectedText;
        this.currentPosition = { x: e.pageX, y: e.pageY };

        // Only show the floating button if the setting is enabled
        if (this.showSelectionIcon) {
          this.showFloatingButton();
        }

        // Store selected text immediately for popup access
        chrome.storage.local
          .set({
            selectedText: selectedText,
            selectionTimestamp: Date.now(),
          })
          .catch((error) => {
            console.error('Error saving selected text:', error);
          });
      } else {
        this.hideFloatingButton();
      }
    }, 10);
  }

  handleContextMenu(e) {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText && selectedText.length > 0) {
      // Add custom context menu item
      this.addContextMenuItem(e);
    }
  }

  addContextMenuItem(e) {
    // This would add a custom context menu item
    // For now, we'll just show the floating button
    setTimeout(() => {
      if (this.showSelectionIcon) {
        this.showFloatingButton();
      }
    }, 100);
  }

  createFloatingButton() {
    this.floatingButton = document.createElement('div');
    this.floatingButton.id = 'smart-translate-floating-btn';
    this.floatingButton.innerHTML = `
            <div class="translate-icon">🌐</div>
            <div class="translate-tooltip">Translate Selection</div>
        `;
    this.floatingButton.style.cssText = `
            position: fixed;
            z-index: 10000;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 50%;
            width: 48px;
            height: 48px;
            display: none;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            transition: all 0.2s ease;
            font-size: 20px;
        `;

    // Add hover effects
    this.floatingButton.addEventListener('mouseenter', () => {
      this.floatingButton.style.transform = 'scale(1.1)';
      this.showTooltip();
    });

    this.floatingButton.addEventListener('mouseleave', () => {
      this.floatingButton.style.transform = 'scale(1)';
      this.hideTooltip();
    });

    this.floatingButton.addEventListener('click', () => {
      this.translateSelectedText();
    });

    document.body.appendChild(this.floatingButton);
  }

  showFloatingButton() {
    if (this.floatingButton) {
      this.floatingButton.style.display = 'flex';
      this.floatingButton.style.left = `${this.currentPosition.x + 20}px`;
      this.floatingButton.style.top = `${this.currentPosition.y - 24}px`;
    }
  }

  hideFloatingButton() {
    if (this.floatingButton) {
      this.floatingButton.style.display = 'none';
    }
  }

  showTooltip() {
    const tooltip = this.floatingButton.querySelector('.translate-tooltip');
    if (tooltip) {
      tooltip.style.display = 'block';
    }
  }

  hideTooltip() {
    const tooltip = this.floatingButton.querySelector('.translate-tooltip');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }

  async translateSelectedText() {
    if (!this.selectedText) return;

    try {
      // Store selected text for popup access
      chrome.storage.local.set({
        selectedText: this.selectedText,
        selectionTimestamp: Date.now(),
      });

      // Send message to popup to translate the selected text
      chrome.runtime.sendMessage({
        action: 'translateSelection',
        text: this.selectedText,
      });

      // Show a quick notification
      this.showTranslationNotification();
    } catch (error) {
      console.error('Translation request failed:', error);
    }
  }

  showTranslationNotification() {
    const notification = document.createElement('div');
    notification.id = 'smart-translate-notification';
    notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">🌐</span>
                <span class="notification-text">Opening translation for: "${this.selectedText.substring(
                  0,
                  30
                )}${this.selectedText.length > 30 ? '...' : ''}"</span>
            </div>
        `;

    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 10001;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            max-width: 300px;
            animation: slideInRight 0.3s ease-out;
        `;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, 3000);
  }

  // Method to translate entire page (placeholder for future implementation)
  translatePage() {
    console.log('Page translation feature would be implemented here');
    // This would involve:
    // 1. Detecting the page language
    // 2. Translating all text content
    // 3. Replacing text while preserving formatting
    // 4. Adding toggle to switch between original and translated
  }

  // Method to detect page language
  detectPageLanguage() {
    const htmlLang = document.documentElement.lang;
    if (htmlLang) {
      return htmlLang.substring(0, 2);
    }

    // Fallback: try to detect from content
    const text = document.body.innerText.substring(0, 1000);
    // Simple language detection logic could be implemented here
    return 'en'; // Default to English
  }
}

// Initialize the content script
const contentTranslate = new ContentTranslate();

// Listen for page changes (for SPA support)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    // Re-initialize for new pages
    setTimeout(() => {
      if (!document.getElementById('smart-translate-floating-btn')) {
        new ContentTranslate();
      }
    }, 1000);
  }
}).observe(document, { subtree: true, childList: true });

// Export for potential use in other scripts
window.SmartTranslate = ContentTranslate;
