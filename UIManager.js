/**
 * UIManager - Quản lý UI components và interactions
 */
class UIManager {
  constructor() {
    this.elements = {};
    this.isInitialized = false;
  }

  /**
   * Initialize UI elements
   */
  init() {
    this.elements = {
      // Language selection
      fromLang: document.getElementById('fromLang'),
      toLang: document.getElementById('toLang'),
      swapBtn: document.getElementById('swapBtn'),

      // Input section
      inputText: document.getElementById('inputText'),
      translateBtn: document.getElementById('translateBtn'),
      autoFillStatus: document.getElementById('autoFillStatus'),

      // Word display
      wordDisplay: document.getElementById('wordDisplay'),
      displayedWord: document.getElementById('displayedWord'),
      ggPronunciationLabel: document.getElementById('ggPronunciationLabel'),
      usPronunciationLabel: document.getElementById('usPronunciationLabel'),
      ukPronunciationLabel: document.getElementById('ukPronunciationLabel'),
      ggPronunciationItem: document.getElementById('ggPronunciationItem'),
      usPronunciationItem: document.getElementById('usPronunciationItem'),
      ukPronunciationItem: document.getElementById('ukPronunciationItem'),
      ggPhonetic: document.getElementById('ggPhonetic'),
      usPhonetic: document.getElementById('usPhonetic'),
      ukPhonetic: document.getElementById('ukPhonetic'),

      // Result section
      resultSection: document.getElementById('resultSection'),
      translatedText: document.getElementById('translatedText'),
      copyBtn: document.getElementById('copyBtn'),
      saveWordBtn: document.getElementById('saveWordBtn'),

      // Settings section
      settingsSection: document.getElementById('settingsSection'),
      settingsBtn: document.getElementById('settingsBtn'),
      closeSettingsBtn: document.getElementById('closeSettingsBtn'),
      autoPronounceToggle: document.getElementById('autoPronounceToggle'),
      autoTranslateToggle: document.getElementById('autoTranslateToggle'),
      showSelectionIconToggle: document.getElementById(
        'showSelectionIconToggle'
      ),
      defaultPronunciation: document.getElementById('defaultPronunciation'),
      showUsPronunciationToggle: document.getElementById(
        'showUsPronunciationToggle'
      ),
      showUkPronunciationToggle: document.getElementById(
        'showUkPronunciationToggle'
      ),
      translationSource: document.getElementById('translationSource'),

      // Saved words section
      savedWordsSection: document.getElementById('savedWordsSection'),
      savedWordsBtn: document.getElementById('savedWordsBtn'),
      closeSavedWordsBtn: document.getElementById('closeSavedWordsBtn'),
      savedWordsList: document.getElementById('savedWordsList'),
    };

    this.isInitialized = true;
    this.bindEvents();
    this.autoFocusInput();
  }

  /**
   * Bind UI events
   */
  bindEvents() {
    // Swap languages
    if (this.elements.swapBtn) {
      this.elements.swapBtn.addEventListener('click', () => {
        this.onLanguageSwap();
      });
    }

    // Translation button
    if (this.elements.translateBtn) {
      this.elements.translateBtn.addEventListener('click', () => {
        this.onTranslateClick();
      });
    }

    // Pronunciation buttons
    if (this.elements.ggPronunciationLabel) {
      this.elements.ggPronunciationLabel.addEventListener('click', () => {
        this.onPronounceClick('gg');
      });
    }
    if (this.elements.usPronunciationLabel) {
      this.elements.usPronunciationLabel.addEventListener('click', () => {
        this.onPronounceClick('us');
      });
    }
    if (this.elements.ukPronunciationLabel) {
      this.elements.ukPronunciationLabel.addEventListener('click', () => {
        this.onPronounceClick('uk');
      });
    }

    // Copy button
    if (this.elements.copyBtn) {
      this.elements.copyBtn.addEventListener('click', () => {
        this.onCopyClick();
      });
    }

    // Save word button
    if (this.elements.saveWordBtn) {
      this.elements.saveWordBtn.addEventListener('click', () => {
        this.onSaveWordClick();
      });
    }

    // Settings buttons
    if (this.elements.settingsBtn) {
      this.elements.settingsBtn.addEventListener('click', () => {
        this.showSettings();
      });
    }
    if (this.elements.closeSettingsBtn) {
      this.elements.closeSettingsBtn.addEventListener('click', () => {
        this.hideSettings();
      });
    }

    // Saved words buttons
    if (this.elements.savedWordsBtn) {
      this.elements.savedWordsBtn.addEventListener('click', () => {
        this.showSavedWords();
      });
    }
    if (this.elements.closeSavedWordsBtn) {
      this.elements.closeSavedWordsBtn.addEventListener('click', () => {
        this.hideSavedWords();
      });
    }

    // Keyboard events
    document.addEventListener('keydown', (e) => {
      this.handleKeyboard(e);
    });

    // Input events
    if (this.elements.inputText) {
      this.elements.inputText.addEventListener('input', () => {
        this.onInputChange();
      });
    }
  }

  /**
   * Set callbacks for UI events
   */
  setCallbacks(callbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Handle language swap
   */
  onLanguageSwap() {
    if (this.callbacks && this.callbacks.onLanguageSwap) {
      this.callbacks.onLanguageSwap();
    }
  }

  /**
   * Handle translate click
   */
  onTranslateClick() {
    if (this.callbacks && this.callbacks.onTranslate) {
      const text = this.elements.inputText.value.trim();
      const fromLang = this.elements.fromLang.value;
      const toLang = this.elements.toLang.value;
      this.callbacks.onTranslate(text, fromLang, toLang);
    }
  }

  /**
   * Handle pronounce click
   */
  onPronounceClick(accent) {
    if (this.callbacks && this.callbacks.onPronounce) {
      const text = this.elements.inputText.value.trim();
      this.callbacks.onPronounce(text, accent);
    }
  }

  /**
   * Handle copy click
   */
  onCopyClick() {
    if (this.callbacks && this.callbacks.onCopy) {
      this.callbacks.onCopy();
    }
  }

  /**
   * Handle save word click
   */
  onSaveWordClick() {
    if (this.callbacks && this.callbacks.onSaveWord) {
      const word = this.elements.inputText.value.trim();
      const translation = this.elements.translatedText.textContent;
      const fromLang = this.elements.fromLang.value;
      const toLang = this.elements.toLang.value;
      this.callbacks.onSaveWord(word, translation, fromLang, toLang);
    }
  }

  /**
   * Handle input change
   */
  onInputChange() {
    if (this.callbacks && this.callbacks.onInputChange) {
      this.callbacks.onInputChange();
    }
  }

  /**
   * Handle keyboard events
   */
  handleKeyboard(e) {
    // Enter key to translate
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.onTranslateClick();
    }
  }

  /**
   * Auto focus input field
   */
  autoFocusInput() {
    if (this.elements.inputText) {
      this.elements.inputText.focus();
    }
  }

  /**
   * Show word display section
   */
  showWordDisplay(word) {
    if (this.elements.wordDisplay && this.elements.displayedWord) {
      this.elements.displayedWord.textContent = word;
      this.elements.wordDisplay.style.display = 'block';
    }
  }

  /**
   * Hide word display section
   */
  hideWordDisplay() {
    if (this.elements.wordDisplay) {
      this.elements.wordDisplay.style.display = 'none';
    }
  }

  /**
   * Update pronunciation visibility based on settings
   */
  updatePronunciationVisibility(settings) {
    if (!settings) return;

    if (this.elements.usPronunciationItem) {
      this.elements.usPronunciationItem.style.display =
        settings.showUsPronunciation ? 'block' : 'none';
    }
    if (this.elements.ukPronunciationItem) {
      this.elements.ukPronunciationItem.style.display =
        settings.showUkPronunciation ? 'block' : 'none';
    }
  }

  /**
   * Show translation result
   */
  showResult(translation) {
    if (this.elements.translatedText && this.elements.resultSection) {
      this.elements.translatedText.textContent = translation;
      this.elements.translatedText.style.color = '#333';
      this.elements.resultSection.style.display = 'block';
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    if (this.elements.translatedText && this.elements.resultSection) {
      this.elements.translatedText.textContent = message;
      this.elements.translatedText.style.color = '#dc3545';
      this.elements.resultSection.style.display = 'block';
    }
  }

  /**
   * Hide result section
   */
  hideResult() {
    if (this.elements.resultSection) {
      this.elements.resultSection.style.display = 'none';
    }
  }

  /**
   * Set translating state
   */
  setTranslating(translating) {
    if (!this.elements.translateBtn) return;

    this.elements.translateBtn.disabled = translating;

    const btnText = this.elements.translateBtn.querySelector('.btn-text');
    const spinner =
      this.elements.translateBtn.querySelector('.loading-spinner');

    if (btnText && spinner) {
      if (translating) {
        btnText.style.display = 'none';
        spinner.style.display = 'inline';
      } else {
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
      }
    }
  }

  /**
   * Show auto-fill status
   */
  showAutoFillStatus(message) {
    if (this.elements.autoFillStatus) {
      this.elements.autoFillStatus.textContent = message;
      this.elements.autoFillStatus.style.display = 'block';

      // Auto hide after 3 seconds
      setTimeout(() => {
        this.hideAutoFillStatus();
      }, 3000);
    }
  }

  /**
   * Hide auto-fill status
   */
  hideAutoFillStatus() {
    if (this.elements.autoFillStatus) {
      this.elements.autoFillStatus.style.display = 'none';
    }
  }

  /**
   * Set input text
   */
  setInputText(text) {
    if (this.elements.inputText) {
      this.elements.inputText.value = text;
    }
  }

  /**
   * Get input text
   */
  getInputText() {
    return this.elements.inputText ? this.elements.inputText.value.trim() : '';
  }

  /**
   * Set language selection
   */
  setLanguages(fromLang, toLang) {
    if (this.elements.fromLang) {
      this.elements.fromLang.value = fromLang;
    }
    if (this.elements.toLang) {
      this.elements.toLang.value = toLang;
    }
  }

  /**
   * Get language selection
   */
  getLanguages() {
    return {
      fromLang: this.elements.fromLang ? this.elements.fromLang.value : 'auto',
      toLang: this.elements.toLang ? this.elements.toLang.value : 'en',
    };
  }

  /**
   * Show settings section
   */
  showSettings() {
    if (this.elements.settingsSection) {
      this.elements.settingsSection.style.display = 'block';
    }
  }

  /**
   * Hide settings section
   */
  hideSettings() {
    if (this.elements.settingsSection) {
      this.elements.settingsSection.style.display = 'none';
    }
  }

  /**
   * Show saved words section
   */
  showSavedWords() {
    if (this.elements.savedWordsSection) {
      this.elements.savedWordsSection.style.display = 'block';
    }
  }

  /**
   * Hide saved words section
   */
  hideSavedWords() {
    if (this.elements.savedWordsSection) {
      this.elements.savedWordsSection.style.display = 'none';
    }
  }

  /**
   * Copy text to clipboard
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true };
    } catch (error) {
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return { success: true };
      } catch (fallbackError) {
        return { success: false, error: fallbackError.message };
      }
    }
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Style the notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 20px',
      borderRadius: '8px',
      color: 'white',
      fontSize: '14px',
      fontWeight: '500',
      zIndex: '10000',
      opacity: '0',
      transform: 'translateX(100%)',
      transition: 'all 0.3s ease',
    });

    // Set background color based on type
    const colors = {
      info: '#007bff',
      success: '#28a745',
      warning: '#ffc107',
      error: '#dc3545',
    };
    notification.style.backgroundColor = colors[type] || colors.info;

    // Add to document
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  /**
   * Get all UI elements
   */
  getElements() {
    return { ...this.elements };
  }

  /**
   * Check if UI is initialized
   */
  isUIInitialized() {
    return this.isInitialized;
  }
}

// Export cho module system (nếu cần)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIManager;
}
