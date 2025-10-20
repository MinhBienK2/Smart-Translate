/**
 * SettingsManager - Quản lý tất cả settings của extension
 */
class SettingsManager {
  constructor() {
    this.defaultSettings = {
      defaultFromLang: 'auto',
      defaultToLang: 'en',
      autoPronounce: true,
      autoTranslate: true,
      showSelectionIcon: true,
      defaultPronunciation: 'gg',
      showUsPronunciation: true,
      showUkPronunciation: true,
      translationSource: 'google',
    };

    this.settings = { ...this.defaultSettings };
    this.loadSettings();
  }

  /**
   * Load settings từ Chrome storage
   */
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(
        Object.keys(this.defaultSettings)
      );
      this.settings = { ...this.defaultSettings, ...result };
      return this.settings;
    } catch (error) {
      console.error('Error loading settings:', error);
      return this.settings;
    }
  }

  /**
   * Save settings vào Chrome storage
   */
  async saveSettings() {
    try {
      await chrome.storage.sync.set(this.settings);
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }

  /**
   * Update một setting cụ thể
   */
  async updateSetting(key, value) {
    this.settings[key] = value;
    return await this.saveSettings();
  }

  /**
   * Get một setting cụ thể
   */
  getSetting(key) {
    return this.settings[key];
  }

  /**
   * Get tất cả settings
   */
  getAllSettings() {
    return { ...this.settings };
  }

  /**
   * Reset settings về mặc định
   */
  async resetSettings() {
    this.settings = { ...this.defaultSettings };
    return await this.saveSettings();
  }

  /**
   * Apply settings vào UI elements
   */
  applySettingsToUI(elements) {
    // Language settings
    if (elements.fromLang) {
      elements.fromLang.value = this.settings.defaultFromLang;
    }
    if (elements.toLang) {
      elements.toLang.value = this.settings.defaultToLang;
    }

    // Toggle settings
    if (elements.autoPronounceToggle) {
      elements.autoPronounceToggle.checked = this.settings.autoPronounce;
    }
    if (elements.autoTranslateToggle) {
      elements.autoTranslateToggle.checked = this.settings.autoTranslate;
    }
    if (elements.showSelectionIconToggle) {
      elements.showSelectionIconToggle.checked =
        this.settings.showSelectionIcon;
    }
    if (elements.showUsPronunciationToggle) {
      elements.showUsPronunciationToggle.checked =
        this.settings.showUsPronunciation;
    }
    if (elements.showUkPronunciationToggle) {
      elements.showUkPronunciationToggle.checked =
        this.settings.showUkPronunciation;
    }

    // Select settings
    if (elements.defaultPronunciation) {
      elements.defaultPronunciation.value = this.settings.defaultPronunciation;
    }
    if (elements.translationSource) {
      elements.translationSource.value = this.settings.translationSource;
    }
  }

  /**
   * Bind events cho settings UI
   */
  bindSettingsEvents(elements, callbacks = {}) {
    // Language change events
    if (elements.fromLang) {
      elements.fromLang.addEventListener('change', async () => {
        await this.updateSetting('defaultFromLang', elements.fromLang.value);
        if (callbacks.onLanguageChange) {
          callbacks.onLanguageChange();
        }
      });
    }

    if (elements.toLang) {
      elements.toLang.addEventListener('change', async () => {
        await this.updateSetting('defaultToLang', elements.toLang.value);
        if (callbacks.onLanguageChange) {
          callbacks.onLanguageChange();
        }
      });
    }

    // Toggle events
    const toggleElements = [
      { element: elements.autoPronounceToggle, key: 'autoPronounce' },
      { element: elements.autoTranslateToggle, key: 'autoTranslate' },
      { element: elements.showSelectionIconToggle, key: 'showSelectionIcon' },
      {
        element: elements.showUsPronunciationToggle,
        key: 'showUsPronunciation',
      },
      {
        element: elements.showUkPronunciationToggle,
        key: 'showUkPronunciation',
      },
    ];

    toggleElements.forEach(({ element, key }) => {
      if (element) {
        element.addEventListener('change', async () => {
          await this.updateSetting(key, element.checked);
          if (callbacks.onSettingChange) {
            callbacks.onSettingChange(key, element.checked);
          }
        });
      }
    });

    // Select events
    if (elements.defaultPronunciation) {
      elements.defaultPronunciation.addEventListener('change', async () => {
        await this.updateSetting(
          'defaultPronunciation',
          elements.defaultPronunciation.value
        );
        if (callbacks.onSettingChange) {
          callbacks.onSettingChange(
            'defaultPronunciation',
            elements.defaultPronunciation.value
          );
        }
      });
    }

    if (elements.translationSource) {
      elements.translationSource.addEventListener('change', async () => {
        await this.updateSetting(
          'translationSource',
          elements.translationSource.value
        );
        if (callbacks.onSettingChange) {
          callbacks.onSettingChange(
            'translationSource',
            elements.translationSource.value
          );
        }
      });
    }
  }
}

// Export cho module system (nếu cần)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SettingsManager;
}
