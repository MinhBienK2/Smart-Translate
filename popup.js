/**
 * SmartTranslate - Main controller cho extension
 * Điều phối các manager và xử lý logic chính
 */
class SmartTranslate {
  constructor() {
    this.settingsManager = new SettingsManager();
    this.savedWordsManager = new SavedWordsManager();
    this.translationManager = new TranslationManager();
    this.uiManager = new UIManager();

    this.init();
  }

  /**
   * Initialize extension
   */
  async init() {
    try {
      // Initialize UI
      this.uiManager.init();

      // Load settings
      await this.settingsManager.loadSettings();

      // Load saved words
      await this.savedWordsManager.loadSavedWords();

      // Load translation history
      await this.translationManager.loadHistoryFromStorage();

      // Apply settings to UI
      this.settingsManager.applySettingsToUI(this.uiManager.getElements());

      // Bind UI callbacks
      this.bindUICallbacks();

      // Bind settings events
      this.bindSettingsEvents();

      // Check for auto-fill text
      await this.checkAutoFill();

      // Pronunciation settings removed; default to Google TTS

      console.log('Smart Translate initialized successfully');
    } catch (error) {
      console.error('Error initializing Smart Translate:', error);
    }
  }

  /**
   * Bind UI callbacks
   */
  bindUICallbacks() {
    this.uiManager.setCallbacks({
      onLanguageSwap: () => this.handleLanguageSwap(),
      onTranslate: (text, fromLang, toLang) =>
        this.handleTranslate(text, fromLang, toLang),
      onPronounce: (text, accent) => this.handlePronounce(text, accent),
      onCopy: () => this.handleCopy(),
      onSaveWord: (word, translation, fromLang, toLang) =>
        this.handleSaveWord(word, translation, fromLang, toLang),
      onInputChange: () => this.handleInputChange(),
      onShowSavedWords: () => this.showSavedWords(),
      onExportSavedWords: () => this.exportSavedWordsTxt(),
    });
  }

  /**
   * Bind settings events
   */
  bindSettingsEvents() {
    this.settingsManager.bindSettingsEvents(this.uiManager.getElements(), {
      onLanguageChange: () => this.handleLanguageChange(),
      onSettingChange: (key, value) => this.handleSettingChange(key, value),
    });
  }

  /**
   * Handle language swap
   */
  handleLanguageSwap() {
    const { fromLang, toLang } = this.uiManager.getLanguages();
    const swapped = this.translationManager.swapLanguages(fromLang, toLang);

    this.uiManager.setLanguages(swapped.fromLang, swapped.toLang);
    this.settingsManager.updateSetting('defaultFromLang', swapped.fromLang);
    this.settingsManager.updateSetting('defaultToLang', swapped.toLang);
  }

  /**
   * Handle translate request
   */
  async handleTranslate(text, fromLang, toLang) {
    if (!text || !text.trim()) {
      this.uiManager.showError('Please enter text to translate');
      return;
    }

    try {
      this.uiManager.setTranslating(true);
      this.uiManager.hideResult();

      // Show word display for single words
      if (this.isSingleWord(text)) {
        this.uiManager.showWordDisplay(text);
      } else {
        this.uiManager.hideWordDisplay();
      }

      // Translate text
      const result = await this.translationManager.translateText(
        text,
        fromLang,
        toLang
      );

      if (result.success) {
        this.uiManager.showResult(result.translation);

        // Auto-pronounce if enabled
        if (
          this.settingsManager.getSetting('autoPronounce') &&
          this.isSingleWord(text)
        ) {
          const defaultAccent = this.settingsManager.getSetting(
            'defaultPronunciation'
          );
          setTimeout(() => {
            this.handlePronounce(text, defaultAccent);
          }, 500);
        }
      }
    } catch (error) {
      console.error('Translation error:', error);
      this.uiManager.showError('Translation failed. Please try again.');
    } finally {
      this.uiManager.setTranslating(false);
    }
  }

  /**
   * Handle pronounce request
   */
  async handlePronounce(text, accent = 'gg') {
    if (!text || !text.trim()) {
      this.uiManager.showNotification('No text to pronounce', 'warning');
      return;
    }

    try {
      const { fromLang } = this.uiManager.getLanguages();
      const lang = fromLang === 'auto' ? 'en' : fromLang;

      await this.translationManager.pronounceText(text, lang, accent);
    } catch (error) {
      console.error('Pronunciation error:', error);
      this.uiManager.showNotification('Pronunciation failed', 'error');
    }
  }

  /**
   * Handle copy request
   */
  async handleCopy() {
    const translation = this.uiManager.getElements().translatedText.textContent;
    if (!translation) {
      this.uiManager.showNotification('No translation to copy', 'warning');
      return;
    }

    const result = await this.uiManager.copyToClipboard(translation);
    if (result.success) {
      this.uiManager.showNotification(
        'Translation copied to clipboard',
        'success'
      );
    } else {
      this.uiManager.showNotification('Failed to copy translation', 'error');
    }
  }

  /**
   * Handle save word request
   */
  async handleSaveWord(word, translation, fromLang, toLang) {
    if (!word || !translation) {
      this.uiManager.showNotification('No word to save', 'warning');
      return;
    }

    try {
      const result = await this.savedWordsManager.addWord(
        word,
        translation,
        fromLang,
        toLang
      );

      if (result.success) {
        this.uiManager.showNotification('Word saved successfully', 'success');
      } else {
        this.uiManager.showNotification(result.message, 'warning');
      }
    } catch (error) {
      console.error('Save word error:', error);
      this.uiManager.showNotification('Failed to save word', 'error');
    }
  }

  /**
   * Handle input change
   */
  handleInputChange() {
    // Hide result when input changes
    this.uiManager.hideResult();
    this.uiManager.hideWordDisplay();
  }

  /**
   * Handle language change
   */
  handleLanguageChange() {
    // Update settings
    const { fromLang, toLang } = this.uiManager.getLanguages();
    this.settingsManager.updateSetting('defaultFromLang', fromLang);
    this.settingsManager.updateSetting('defaultToLang', toLang);
  }

  /**
   * Handle setting change
   */
  handleSettingChange(key, value) {
    switch (key) {
      case 'showSelectionIcon':
        // Notify content script about selection icon setting
        this.notifyContentScript('updateSelectionIconSetting', {
          showSelectionIcon: value,
        });
        break;

        // removed pronunciation UI toggles
        break;
    }
  }

  /**
   * Check for auto-fill text from content script
   */
  async checkAutoFill() {
    try {
      const result = await chrome.storage.local.get([
        'selectedText',
        'selectionTimestamp',
      ]);

      if (result.selectedText && result.selectionTimestamp) {
        const timeDiff = Date.now() - result.selectionTimestamp;

        // Only auto-fill if selection is recent (within 30 seconds)
        if (timeDiff < 30000) {
          // Add small delay to ensure UI is ready
          setTimeout(() => {
            this.uiManager.setInputText(result.selectedText);
            this.uiManager.showAutoFillStatus(
              'Text auto-filled from selection'
            );
          }, 100);

          // Auto-translate if enabled
          if (this.settingsManager.getSetting('autoTranslate')) {
            const { fromLang, toLang } = this.uiManager.getLanguages();
            setTimeout(() => {
              this.handleTranslate(result.selectedText, fromLang, toLang);
            }, 500);
          }

          // Clear the stored text
          chrome.storage.local.remove(['selectedText', 'selectionTimestamp']);
        }
      }
    } catch (error) {
      console.error('Error checking auto-fill:', error);
    }
  }

  // Removed: updatePronunciationVisibility (US/UK toggles no longer supported)

  /**
   * Check if text is a single word
   */
  isSingleWord(text) {
    return text.trim().split(/\s+/).length === 1;
  }

  /**
   * Notify content script
   */
  async notifyContentScript(action, data) {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab && tab.id) {
        chrome.tabs.sendMessage(tab.id, { action, ...data });
      }
    } catch (error) {
      console.error('Error notifying content script:', error);
    }
  }

  /**
   * Show saved words
   */
  showSavedWords() {
    console.log('showSavedWords called');
    console.log('savedWordsManager:', this.savedWordsManager);
    console.log('savedWords:', this.savedWordsManager.getSavedWords());

    this.uiManager.showSavedWords();
    this.savedWordsManager.renderSavedWordsList(
      this.uiManager.getElements().savedWordsList
    );
    this.bindSavedWordsEvents();
  }

  /**
   * Bind saved words events
   */
  bindSavedWordsEvents() {
    this.savedWordsManager.bindSavedWordsEvents(
      this.uiManager.getElements().savedWordsList,
      {
        onTranslateWord: (word) => this.handleSavedWordTranslate(word),
        onPronounceWord: (word) => this.handleSavedWordPronounce(word),
        onDeleteWord: (wordId) => this.handleDeleteWord(wordId),
      }
    );
  }

  /**
   * Export saved words as .txt and download
   */
  exportSavedWordsTxt() {
    try {
      const content = this.savedWordsManager.exportAsTxt();
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().slice(0, 10);
      a.download = `saved-words-${date}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.uiManager.showNotification('Exported saved words', 'success');
    } catch (error) {
      console.error('Export saved words failed:', error);
      this.uiManager.showNotification('Export failed', 'error');
    }
  }

  /**
   * Handle saved word translate
   */
  handleSavedWordTranslate(word) {
    this.uiManager.setInputText(word.word);
    this.uiManager.setLanguages(word.fromLang, word.toLang);
    this.handleTranslate(word.word, word.fromLang, word.toLang);
    this.uiManager.hideSavedWords();
  }

  /**
   * Handle saved word pronounce
   */
  handleSavedWordPronounce(word) {
    this.handlePronounce(word.word, 'gg');
  }

  /**
   * Handle delete word
   */
  async handleDeleteWord(wordId) {
    try {
      const result = await this.savedWordsManager.removeWord(wordId);

      if (result.success) {
        this.uiManager.showNotification('Word deleted', 'success');
        this.savedWordsManager.renderSavedWordsList(
          this.uiManager.getElements().savedWordsList
        );
      } else {
        this.uiManager.showNotification(result.message, 'error');
      }
    } catch (error) {
      console.error('Error deleting word:', error);
      this.uiManager.showNotification('Failed to delete word', 'error');
    }
  }

  /**
   * Get managers for external access
   */
  getManagers() {
    return {
      settings: this.settingsManager,
      savedWords: this.savedWordsManager,
      translation: this.translationManager,
      ui: this.uiManager,
    };
  }
}

// Initialize extension when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.smartTranslate = new SmartTranslate();
});
