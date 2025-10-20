class SmartTranslate {
  constructor() {
    this.init();
    this.bindEvents();
    this.loadSettings();

    // Ensure pronunciation visibility is updated after everything is loaded
    setTimeout(() => {
      this.updatePronunciationVisibility();
    }, 100);
  }

  init() {
    this.elements = {
      fromLang: document.getElementById('fromLang'),
      toLang: document.getElementById('toLang'),
      swapBtn: document.getElementById('swapBtn'),
      inputText: document.getElementById('inputText'),
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

      translateBtn: document.getElementById('translateBtn'),
      resultSection: document.getElementById('resultSection'),
      translatedText: document.getElementById('translatedText'),
      copyBtn: document.getElementById('copyBtn'),
      settingsBtn: document.getElementById('settingsBtn'),
      savedWordsBtn: document.getElementById('savedWordsBtn'),
      saveWordBtn: document.getElementById('saveWordBtn'),
      savedWordsSection: document.getElementById('savedWordsSection'),
      savedWordsList: document.getElementById('savedWordsList'),
      autoFillStatus: document.getElementById('autoFillStatus'),
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
    };

    this.isTranslating = false;
    this.currentTranslation = '';

    // Auto-focus on input field when popup opens
    this.elements.inputText.focus();
  }

  bindEvents() {
    // Language selection events
    this.elements.swapBtn.addEventListener('click', () => this.swapLanguages());
    this.elements.fromLang.addEventListener('change', () =>
      this.saveSettings()
    );
    this.elements.toLang.addEventListener('change', () => this.saveSettings());

    // Translation events
    this.elements.translateBtn.addEventListener('click', () =>
      this.translateText()
    );

    this.elements.ggPronunciationLabel.addEventListener('click', () =>
      this.pronounceWord('gg')
    );
    this.elements.usPronunciationLabel.addEventListener('click', () =>
      this.pronounceWord('us')
    );
    this.elements.ukPronunciationLabel.addEventListener('click', () =>
      this.pronounceWord('uk')
    );
    this.elements.copyBtn.addEventListener('click', () =>
      this.copyTranslation()
    );

    // Settings button click handler
    this.elements.settingsBtn.addEventListener('click', () => {
      this.showSettings();
    });

    // Close settings button
    document
      .getElementById('closeSettingsBtn')
      .addEventListener('click', () => {
        this.hideSettings();
      });

    // Close saved words button
    document
      .getElementById('closeSavedWordsBtn')
      .addEventListener('click', () => {
        this.hideSavedWords();
      });

    // Auto-pronounce toggle
    this.elements.autoPronounceToggle.addEventListener('change', () => {
      this.saveAutoPronounceSetting();
    });

    // Auto-translate toggle
    this.elements.autoTranslateToggle.addEventListener('change', () => {
      this.saveAutoTranslateSetting();
    });

    // Show selection icon toggle
    this.elements.showSelectionIconToggle.addEventListener('change', () => {
      this.saveShowSelectionIconSetting();
    });

    // Default pronunciation toggle
    this.elements.defaultPronunciation.addEventListener('change', () => {
      this.saveDefaultPronunciationSetting();
    });

    // Show US pronunciation toggle
    this.elements.showUsPronunciationToggle.addEventListener('change', () => {
      this.saveShowUsPronunciationSetting();
    });

    // Show UK pronunciation toggle
    this.elements.showUkPronunciationToggle.addEventListener('change', () => {
      this.saveShowUkPronunciationSetting();
    });

    // Translation source toggle
    this.elements.translationSource.addEventListener('change', () => {
      this.saveTranslationSourceSetting();
    });

    // Feature buttons
    this.elements.settingsBtn.addEventListener('click', () =>
      this.showSettings()
    );
    this.elements.savedWordsBtn.addEventListener('click', () =>
      this.showSavedWords()
    );
    this.elements.saveWordBtn.addEventListener('click', () => this.saveWord());

    // Input events
    this.elements.inputText.addEventListener('input', () => this.handleInput());
    this.elements.inputText.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault(); // Prevent form submission
        this.handleEnterKey();
      }
    });
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'fromLang',
        'toLang',
        'autoPronounce',
        'autoTranslate',
        'showSelectionIcon',
        'defaultPronunciation',
        'showUsPronunciation',
        'showUkPronunciation',
        'translationSource',
      ]);
      if (result.fromLang) {
        this.elements.fromLang.value = result.fromLang;
      }
      if (result.toLang) {
        this.elements.toLang.value = result.toLang;
      }

      if (result.autoPronounce !== undefined) {
        this.elements.autoPronounceToggle.checked = result.autoPronounce;
      } else {
        // Default to true
        this.elements.autoPronounceToggle.checked = true;
      }

      if (result.autoTranslate !== undefined) {
        this.elements.autoTranslateToggle.checked = result.autoTranslate;
      } else {
        // Default to true
        this.elements.autoTranslateToggle.checked = true;
      }

      if (result.showSelectionIcon !== undefined) {
        this.elements.showSelectionIconToggle.checked =
          result.showSelectionIcon;
      } else {
        // Default to true
        this.elements.showSelectionIconToggle.checked = true;
      }

      if (result.defaultPronunciation) {
        this.elements.defaultPronunciation.value = result.defaultPronunciation;
      } else {
        // Default to GG
        this.elements.defaultPronunciation.value = 'gg';
      }

      if (result.showUsPronunciation !== undefined) {
        this.elements.showUsPronunciationToggle.checked =
          result.showUsPronunciation;
      } else {
        // Default to true
        this.elements.showUsPronunciationToggle.checked = true;
      }

      if (result.showUkPronunciation !== undefined) {
        this.elements.showUkPronunciationToggle.checked =
          result.showUkPronunciation;
      } else {
        // Default to true
        this.elements.showUkPronunciationToggle.checked = true;
      }

      if (result.translationSource) {
        this.elements.translationSource.value = result.translationSource;
      } else {
        // Default to Google Translate
        this.elements.translationSource.value = 'google';
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }

    // Auto-fill selected text after loading settings
    await this.autoFillSelectedText();

    // Ensure input field is focused after everything is loaded
    this.elements.inputText.focus();
  }

  async saveSettings() {
    try {
      await chrome.storage.sync.set({
        fromLang: this.elements.fromLang.value,
        toLang: this.elements.toLang.value,
        translationSource: this.elements.translationSource.value,
      });
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  async saveAutoPronounceSetting() {
    try {
      await chrome.storage.sync.set({
        autoPronounce: this.elements.autoPronounceToggle.checked,
      });
      console.log(
        'Auto-pronounce setting saved:',
        this.elements.autoPronounceToggle.checked
      );
    } catch (error) {
      console.error('Error saving auto-pronounce setting:', error);
    }
  }

  async saveAutoTranslateSetting() {
    try {
      await chrome.storage.sync.set({
        autoTranslate: this.elements.autoTranslateToggle.checked,
      });
      console.log(
        'Auto-translate setting saved:',
        this.elements.autoTranslateToggle.checked
      );
    } catch (error) {
      console.error('Error saving auto-translate setting:', error);
    }
  }

  async saveShowSelectionIconSetting() {
    try {
      await chrome.storage.sync.set({
        showSelectionIcon: this.elements.showSelectionIconToggle.checked,
      });
      console.log(
        'Show selection icon setting saved:',
        this.elements.showSelectionIconToggle.checked
      );

      // Send message to content script to update the setting
      this.updateContentScriptSetting();
    } catch (error) {
      console.error('Error saving show selection icon setting:', error);
    }
  }

  async saveDefaultPronunciationSetting() {
    try {
      await chrome.storage.sync.set({
        defaultPronunciation: this.elements.defaultPronunciation.value,
      });
      console.log(
        'Default pronunciation setting saved:',
        this.elements.defaultPronunciation.value
      );
    } catch (error) {
      console.error('Error saving default pronunciation setting:', error);
    }
  }

  async saveShowUsPronunciationSetting() {
    try {
      await chrome.storage.sync.set({
        showUsPronunciation: this.elements.showUsPronunciationToggle.checked,
      });
      console.log(
        'Show US pronunciation setting saved:',
        this.elements.showUsPronunciationToggle.checked
      );
      this.updatePronunciationVisibility();
    } catch (error) {
      console.error('Error saving show US pronunciation setting:', error);
    }
  }

  async saveShowUkPronunciationSetting() {
    try {
      await chrome.storage.sync.set({
        showUkPronunciation: this.elements.showUkPronunciationToggle.checked,
      });
      console.log(
        'Show UK pronunciation setting saved:',
        this.elements.showUkPronunciationToggle.checked
      );
      this.updatePronunciationVisibility();
    } catch (error) {
      console.error('Error saving show UK pronunciation setting:', error);
    }
  }

  async saveTranslationSourceSetting() {
    try {
      await chrome.storage.sync.set({
        translationSource: this.elements.translationSource.value,
      });
      console.log(
        'Translation source setting saved:',
        this.elements.translationSource.value
      );
    } catch (error) {
      console.error('Error saving translation source setting:', error);
    }
  }

  async updateContentScriptSetting() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (tab && tab.id) {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'updateSelectionIconSetting',
          showSelectionIcon: this.elements.showSelectionIconToggle.checked,
        });
      }
    } catch (error) {
      console.error('Error updating content script setting:', error);
    }
  }

  updatePronunciationVisibility() {
    // Show/hide US pronunciation
    if (this.elements.usPronunciationItem) {
      this.elements.usPronunciationItem.style.display = this.elements
        .showUsPronunciationToggle.checked
        ? 'block'
        : 'none';
    }

    // Show/hide UK pronunciation
    if (this.elements.ukPronunciationItem) {
      this.elements.ukPronunciationItem.style.display = this.elements
        .showUkPronunciationToggle.checked
        ? 'block'
        : 'none';
    }
  }

  swapLanguages() {
    const fromValue = this.elements.fromLang.value;
    const toValue = this.elements.toLang.value;

    if (fromValue !== 'auto') {
      this.elements.fromLang.value = toValue;
      this.elements.toLang.value = fromValue;
      this.saveSettings();
    }
  }

  // Handle Enter key press - translate and pronounce
  async handleEnterKey() {
    const text = this.elements.inputText.value.trim();
    if (!text) return;

    // First translate the text
    await this.translateText();

    // Then automatically pronounce in default accent after a short delay (if auto-pronounce is enabled)
    if (this.elements.autoPronounceToggle.checked) {
      setTimeout(() => {
        const defaultAccent = this.elements.defaultPronunciation.value;
        this.pronounceWord(defaultAccent);
      }, 1000); // Wait 1 second for translation to complete
    }
  }

  handleInput() {
    const text = this.elements.inputText.value.trim();
    if (text.length > 0) {
      this.elements.translateBtn.disabled = false;
    } else {
      this.elements.translateBtn.disabled = true;
      this.hideResult();
    }
  }

  async translateText() {
    const text = this.elements.inputText.value.trim();
    if (!text) return;

    this.setTranslating(true);
    this.hideResult();

    try {
      const fromLang = this.elements.fromLang.value;
      const toLang = this.elements.toLang.value;

      // Show the word display with phonetic transcription
      this.showWordDisplay(text);

      const result = await this.callTranslationAPI(text, fromLang, toLang);

      if (result && result.translation) {
        this.showResult(result.translation, result.details);
        this.currentTranslation = result.translation;
      } else {
        this.showError('Translation failed. Please try again.');
      }
    } catch (error) {
      console.error('Translation error:', error);
      this.showError(
        'Translation failed. Please check your internet connection.'
      );
    } finally {
      this.setTranslating(false);
    }
  }

  async callTranslationAPI(text, fromLang, toLang) {
    const translationSource = this.elements.translationSource.value;

    // Try the selected translation source first
    try {
      let result = null;

      switch (translationSource) {
        case 'google':
          result = await this.tryGoogleTranslate(text, fromLang, toLang);
          break;
        case 'mymemory':
          result = await this.tryMyMemoryAPI(text, fromLang, toLang);
          break;
        case 'libre':
          result = await this.tryLibreTranslate(text, fromLang, toLang);
          break;
        case 'yandex':
          result = await this.tryYandexTranslate(text, fromLang, toLang);
          break;
        default:
          result = await this.tryGoogleTranslate(text, fromLang, toLang);
      }

      if (result && result.translation) {
        const details = await this.generateEnhancedDetails(
          text,
          fromLang,
          toLang
        );
        return {
          translation: result.translation,
          details: details,
        };
      }
    } catch (error) {
      console.error(`${translationSource} API call failed:`, error);
    }

    // Fallback: try other sources if the selected one fails
    try {
      // Try Google Translate as fallback
      const googleResult = await this.tryGoogleTranslate(
        text,
        fromLang,
        toLang
      );
      if (googleResult && googleResult.translation) {
        const details = await this.generateEnhancedDetails(
          text,
          fromLang,
          toLang
        );
        return {
          translation: googleResult.translation,
          details: details,
        };
      }
    } catch (error) {
      console.error('Google Translate fallback failed:', error);
    }

    // Final fallback: return a mock translation with enhanced details
    const details = await this.generateEnhancedDetails(text, fromLang, toLang);
    return {
      translation: `[Translated to ${toLang.toUpperCase()}] ${text}`,
      details: details,
    };
  }

  // Try Google Translate API
  async tryGoogleTranslate(text, fromLang, toLang) {
    try {
      // Try the new Google Translate API first
      const response = await fetch(
        `https://translate-pa.googleapis.com/v1/translate?params.client=gtx&query.source_language=${
          fromLang === 'auto' ? 'auto' : fromLang
        }&query.target_language=${toLang}&query.display_language=en-US&query.text=${encodeURIComponent(
          text
        )}&key=AIzaSyDLEeFI5OtFBwYBIoK_jj5m32rZK5CkCXA&data_types=TRANSLATION&data_types=SENTENCE_SPLITS&data_types=BILINGUAL_DICTIONARY_FULL`
      );

      if (response.ok) {
        const data = await response.json();
        // Parse the response based on the new API format
        if (
          data &&
          data.data &&
          data.data.translations &&
          data.data.translations[0]
        ) {
          return {
            translation: data.data.translations[0].translatedText,
          };
        }
      }
    } catch (error) {
      console.error('New Google Translate API error:', error);
    }

    // Fallback to the old Google Translate API
    try {
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${
          fromLang === 'auto' ? 'en' : fromLang
        }&tl=${toLang}&dt=t&q=${encodeURIComponent(text)}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data[0] && data[0][0] && data[0][0][0]) {
          return {
            translation: data[0][0][0],
          };
        }
      }
    } catch (error) {
      console.error('Old Google Translate API error:', error);
    }

    return null;
  }

  // Try MyMemory API
  async tryMyMemoryAPI(text, fromLang, toLang) {
    try {
      if (fromLang === 'auto') {
        // Use MyMemory API for auto-detection
        const response = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
            text
          )}&langpair=${toLang}`
        );
        const data = await response.json();

        if (data.responseStatus === 200) {
          return {
            translation: data.responseData.translatedText,
          };
        }
      } else {
        // Use MyMemory API for specific language pairs
        const response = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
            text
          )}&langpair=${fromLang}|${toLang}`
        );
        const data = await response.json();

        if (data.responseStatus === 200) {
          return {
            translation: data.responseData.translatedText,
          };
        }
      }
    } catch (error) {
      console.error('MyMemory API error:', error);
    }
    return null;
  }

  // Try LibreTranslate API
  async tryLibreTranslate(text, fromLang, toLang) {
    try {
      const response = await fetch('https://libretranslate.de/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: fromLang === 'auto' ? 'auto' : fromLang,
          target: toLang,
          format: 'text',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.translatedText) {
          return {
            translation: data.translatedText,
          };
        }
      }
    } catch (error) {
      console.error('LibreTranslate API error:', error);
    }
    return null;
  }

  // Try Yandex Translate API
  async tryYandexTranslate(text, fromLang, toLang) {
    try {
      const response = await fetch(
        `https://translate.yandex.net/api/v1.5/tr.json/translate?key=trnsl.1.1.20231201T000000Z.1234567890abcdef.1234567890abcdef&text=${encodeURIComponent(
          text
        )}&lang=${fromLang === 'auto' ? 'en' : fromLang}-${toLang}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.text && data.text[0]) {
          return {
            translation: data.text[0],
          };
        }
      }
    } catch (error) {
      console.error('Yandex Translate API error:', error);
    }
    return null;
  }

  // Generate enhanced translation details using Google Translate
  async generateEnhancedDetails(text, fromLang, toLang) {
    try {
      // Use Google Translate API for accurate translation
      const googleTranslation = await this.getGoogleTranslation(
        text,
        fromLang,
        toLang
      );
      if (googleTranslation) {
        return googleTranslation;
      }
    } catch (error) {
      console.log('Google Translate failed, using fallback');
    }

    // Fallback: simple translation
    return this.simpleTranslationFallback(text, toLang);
  }

  // Get translation from multiple APIs for better accuracy
  async getGoogleTranslation(text, fromLang, toLang) {
    // Try multiple translation APIs in order of accuracy (Google Translate first)

    // 1. Try Google Translate Scraper first (most accurate - direct from Google)
    try {
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${
          fromLang === 'auto' ? 'en' : fromLang
        }&tl=${toLang}&dt=t&q=${encodeURIComponent(text)}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data[0] && data[0][0] && data[0][0][0]) {
          return {
            word: data[0][0][0],
            type: 'translation',
            meanings: data[0][0][0],
          };
        }
      }
    } catch (error) {
      console.error('Google Scraper API error:', error);
    }

    // 2. Try LibreTranslate (good free alternative)
    try {
      const response = await fetch('https://libretranslate.de/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: fromLang === 'auto' ? 'auto' : fromLang,
          target: toLang,
          format: 'text',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.translatedText) {
          return {
            word: data.translatedText,
            type: 'translation',
            meanings: data.translatedText,
          };
        }
      }
    } catch (error) {
      console.error('LibreTranslate API error:', error);
    }

    // 3. Try Yandex Translate (good accuracy)
    try {
      const response = await fetch(
        `https://translate.yandex.net/api/v1.5/tr.json/translate?key=trnsl.1.1.20231201T000000Z.1234567890abcdef.1234567890abcdef&text=${encodeURIComponent(
          text
        )}&lang=${fromLang === 'auto' ? 'en' : fromLang}-${toLang}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.text && data.text[0]) {
          return {
            word: data.text[0],
            type: 'translation',
            meanings: data.text[0],
          };
        }
      }
    } catch (error) {
      console.error('Yandex API error:', error);
    }

    // 4. Try Bing Translator (Microsoft)
    try {
      const response = await fetch(
        `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=${
          fromLang === 'auto' ? 'en' : fromLang
        }&to=${toLang}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': 'free-tier-key', // Free tier
          },
          body: JSON.stringify([{ text: text }]),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data[0] && data[0].translations && data[0].translations[0]) {
          return {
            word: data[0].translations[0].text,
            type: 'translation',
            meanings: data[0].translations[0].text,
          };
        }
      }
    } catch (error) {
      console.error('Bing API error:', error);
    }

    // 5. Try Apertium (excellent for Vietnamese)
    try {
      const response = await fetch(
        `https://apertium.org/apy/translate?langpair=${
          fromLang === 'auto' ? 'en' : fromLang
        }|${toLang}&q=${encodeURIComponent(text)}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.responseData && data.responseData.translatedText) {
          return {
            word: data.responseData.translatedText,
            type: 'translation',
            meanings: data.responseData.translatedText,
          };
        }
      }
    } catch (error) {
      console.error('Apertium API error:', error);
    }

    // 6. Try Google Translate Scraper (direct from Google)
    try {
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${
          fromLang === 'auto' ? 'en' : fromLang
        }&tl=${toLang}&dt=t&q=${encodeURIComponent(text)}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data[0] && data[0][0] && data[0][0][0]) {
          return {
            word: data[0][0][0],
            type: 'translation',
            meanings: data[0][0][0],
          };
        }
      }
    } catch (error) {
      console.error('Google Scraper API error:', error);
    }

    // 7. Fallback to MyMemory if all others fail
    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          text
        )}&langpair=${fromLang === 'auto' ? 'en' : fromLang}|${toLang}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.responseStatus === 200) {
          return {
            word: data.responseData.translatedText,
            type: 'translation',
            meanings: data.responseData.translatedText,
          };
        }
      }
    } catch (fallbackError) {
      console.error('MyMemory fallback error:', fallbackError);
    }

    return null;
  }

  // Simple fallback translation
  simpleTranslationFallback(text, toLang) {
    return {
      word: text,
      type: 'unknown',
      meanings: `Nghĩa của từ ${text} (cần tra cứu thêm)`,
    };
  }

  // Generate phonetic transcription using APIs
  async generatePhoneticTranscription(text, accent = 'us') {
    try {
      // For GG, use the source language (the language being pronounced)
      if (accent === 'gg') {
        const sourceLang = this.elements.fromLang.value;
        const displayLang =
          sourceLang === 'auto' ? 'EN' : sourceLang.toUpperCase();
        return `[${text}] (${displayLang})`;
      }

      // For US and UK, always use English
      if (accent === 'us' || accent === 'uk') {
        const accentText = accent === 'uk' ? 'UK' : 'US';
        return `[${text}] (EN-${accentText})`;
      }

      // Try multiple APIs for phonetic data
      const phoneticData = await this.getPhoneticFromAPIs(text, accent);
      return phoneticData;
    } catch (error) {
      console.error('Failed to get phonetic data:', error);
      // Fallback to basic transcription
      return this.getBasicPhonetic(text, accent);
    }
  }

  // Get phonetic data from multiple APIs
  async getPhoneticFromAPIs(text, accent) {
    const word = text.toLowerCase();

    // Try Free Dictionary API first (free, reliable)
    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
      );
      if (response.ok) {
        const data = await response.json();
        if (
          data &&
          data[0] &&
          data[0].phonetics &&
          data[0].phonetics.length > 0
        ) {
          // Get the first phonetic transcription
          const phonetic = data[0].phonetics[0].text;
          if (phonetic) {
            return phonetic;
          }
        }
      }
    } catch (error) {
      console.log('Free Dictionary API failed, trying alternatives...');
    }

    // Try Free Dictionary API (free, reliable)
    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
      );
      if (response.ok) {
        const data = await response.json();
        if (
          data &&
          data[0] &&
          data[0].phonetics &&
          data[0].phonetics.length > 0
        ) {
          // Get the first phonetic transcription
          const phonetic = data[0].phonetics[0].text;
          if (phonetic) {
            return phonetic;
          }
        }
      }
    } catch (error) {
      console.log('Free Dictionary API failed, trying alternatives...');
    }

    // If all APIs fail, throw error to trigger fallback
    throw new Error('All phonetic APIs failed');
  }

  // Basic fallback phonetic generation
  getBasicPhonetic(text, accent) {
    const word = text.toLowerCase();

    // Generic fallback
    return `[${word}]`;
  }

  // Show word pronunciation information
  showWordPronunciationInfo(accent) {
    const pronunciationDiv = document.getElementById('pronunciation');
    if (pronunciationDiv) {
      let accentText, accentFlag;

      if (accent === 'gg') {
        const sourceLang = this.elements.fromLang.value;
        const displayLang =
          sourceLang === 'auto' ? 'EN' : sourceLang.toUpperCase();
        accentText = `Google (${displayLang})`;
        accentFlag = '🌐';
      } else if (accent === 'uk') {
        accentText = 'UK English';
        accentFlag = '🇬🇧';
      } else if (accent === 'us') {
        accentText = 'US English';
        accentFlag = '🇺🇸';
      } else {
        accentText = 'English';
        accentFlag = '🇺🇸';
      }

      pronunciationDiv.innerHTML = `
                <div class="pronunciation-info">
                    <span class="pronunciation-icon">🔊</span>
                    <span class="pronunciation-text">Listening to ${accentText} pronunciation ${accentFlag}</span>
                </div>
            `;
      pronunciationDiv.style.display = 'block';

      // Hide after 3 seconds
      setTimeout(() => {
        pronunciationDiv.style.display = 'none';
      }, 3000);
    }
  }

  // Show settings
  showSettings() {
    const settingsSection = document.getElementById('settingsSection');
    if (settingsSection) {
      settingsSection.style.display = 'block';
    }
  }

  // Hide settings
  hideSettings() {
    const settingsSection = document.getElementById('settingsSection');
    if (settingsSection) {
      settingsSection.style.display = 'none';
    }
  }

  // Show word display with phonetic transcription
  async showWordDisplay(text) {
    // Display the word
    this.elements.displayedWord.textContent = text;

    // Show loading state for phonetic transcription
    this.elements.ggPhonetic.textContent = 'Loading...';
    this.elements.usPhonetic.textContent = 'Loading...';
    this.elements.ukPhonetic.textContent = 'Loading...';

    // Show the word display section
    this.elements.wordDisplay.style.display = 'block';

    try {
      // Generate and display phonetic transcription asynchronously
      const ggPhonetic = await this.generatePhoneticTranscription(text, 'gg');
      const usPhonetic = await this.generatePhoneticTranscription(text, 'us');
      const ukPhonetic = await this.generatePhoneticTranscription(text, 'uk');

      this.elements.ggPhonetic.textContent = ggPhonetic;
      this.elements.usPhonetic.textContent = usPhonetic;
      this.elements.ukPhonetic.textContent = ukPhonetic;
    } catch (error) {
      console.error('Failed to load phonetic transcription:', error);
      // Show fallback
      this.elements.ggPhonetic.textContent = '[Loading failed]';
      this.elements.usPhonetic.textContent = '[Loading failed]';
      this.elements.ukPhonetic.textContent = '[Loading failed]';
    }
  }

  setTranslating(translating) {
    this.isTranslating = translating;
    this.elements.translateBtn.disabled = translating;

    const btnText = this.elements.translateBtn.querySelector('.btn-text');
    const spinner =
      this.elements.translateBtn.querySelector('.loading-spinner');

    if (translating) {
      btnText.style.display = 'none';
      spinner.style.display = 'inline';
    } else {
      btnText.style.display = 'inline';
      spinner.style.display = 'none';
    }
  }

  showResult(translation, details = null) {
    this.elements.translatedText.textContent = translation;
    this.elements.resultSection.style.display = 'block';
  }

  showError(message) {
    this.elements.translatedText.textContent = message;
    this.elements.translatedText.style.color = '#dc3545';
    this.elements.resultSection.style.display = 'block';
  }

  hideResult() {
    this.elements.resultSection.style.display = 'none';
    this.elements.translatedText.style.color = '#495057';
  }

  async copyTranslation() {
    if (!this.currentTranslation) return;

    try {
      await navigator.clipboard.writeText(this.currentTranslation);
      this.showCopySuccess();
    } catch (error) {
      console.error('Copy failed:', error);
      // Fallback for older browsers
      this.fallbackCopy();
    }
  }

  showCopySuccess() {
    const copyBtn = this.elements.copyBtn;
    copyBtn.classList.add('copied');
    copyBtn.innerHTML = '<span>✓</span>';

    setTimeout(() => {
      copyBtn.classList.remove('copied');
      copyBtn.innerHTML = '<span>📋</span>';
    }, 2000);
  }

  fallbackCopy() {
    const textArea = document.createElement('textarea');
    textArea.value = this.currentTranslation;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    this.showCopySuccess();
  }

  // Pronounce the word using Google TTS
  async pronounceWord(accent = 'us') {
    const word = this.elements.displayedWord.textContent;
    if (!word) return;

    try {
      // Show pronunciation info
      this.showWordPronunciationInfo(accent);

      // Get language code for Google TTS
      let languageCode;
      if (accent === 'gg') {
        // GG uses the source language (the language being pronounced)
        languageCode = this.elements.fromLang.value;
        // If auto-detect, default to English
        if (languageCode === 'auto') {
          languageCode = 'en';
        }
      } else if (accent === 'us' || accent === 'uk') {
        // US and UK always use English with their respective accents
        languageCode = accent === 'uk' ? 'en-GB' : 'en-US';
      } else {
        languageCode = this.getGoogleTTSLanguageCode('en', accent);
      }

      // Create Google TTS URL
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        word
      )}&tl=${languageCode}&client=tw-ob`;

      // Create audio element and play
      const audio = new Audio(ttsUrl);

      // Add visual feedback
      let labelId;
      if (accent === 'gg') {
        labelId = 'ggPronunciationLabel';
      } else if (accent === 'uk') {
        labelId = 'ukPronunciationLabel';
      } else {
        labelId = 'usPronunciationLabel';
      }

      // Show playing state
      this.elements[labelId].style.opacity = '0.6';
      this.elements[labelId].style.transform = 'scale(1.1)';

      // Play audio
      await audio.play();

      // Restore original state after audio finishes
      audio.addEventListener('ended', () => {
        this.elements[labelId].style.opacity = '1';
        this.elements[labelId].style.transform = 'scale(1)';
      });

      // Fallback: restore state after 3 seconds if audio doesn't end properly
      setTimeout(() => {
        this.elements[labelId].style.opacity = '1';
        this.elements[labelId].style.transform = 'scale(1)';
      }, 3000);
    } catch (error) {
      console.error('Google TTS pronunciation failed:', error);
      this.showError('Pronunciation failed. Please try again.');

      // Restore visual state on error
      let labelId;
      if (accent === 'gg') {
        labelId = 'ggPronunciationLabel';
      } else if (accent === 'uk') {
        labelId = 'ukPronunciationLabel';
      } else {
        labelId = 'usPronunciationLabel';
      }
      this.elements[labelId].style.opacity = '1';
      this.elements[labelId].style.transform = 'scale(1)';
    }
  }

  // Pronounce the translated text using Google TTS
  async pronounceText(accent = 'us') {
    if (!this.currentTranslation) return;

    try {
      // Get the target language for pronunciation
      const targetLang = this.elements.toLang.value;

      // Show pronunciation info
      this.showPronunciationInfo(targetLang, accent);

      // Get language code for Google TTS
      let languageCode;
      if (accent === 'gg') {
        // GG uses the source language (the language being pronounced)
        languageCode = this.elements.fromLang.value;
        // If auto-detect, default to English
        if (languageCode === 'auto') {
          languageCode = 'en';
        }
      } else if (accent === 'us' || accent === 'uk') {
        // US and UK always use English with their respective accents
        languageCode = accent === 'uk' ? 'en-GB' : 'en-US';
      } else {
        languageCode = this.getGoogleTTSLanguageCode(targetLang, accent);
      }

      // Create Google TTS URL
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        this.currentTranslation
      )}&tl=${languageCode}&client=tw-ob`;

      // Create audio element and play
      const audio = new Audio(ttsUrl);

      // Add visual feedback
      const buttonId = accent === 'uk' ? 'pronounceUkBtn' : 'pronounceUsBtn';
      const originalHTML = this.elements[buttonId].innerHTML;

      // Show playing state
      this.elements[buttonId].innerHTML = '<span>⏸️</span>';
      this.elements[buttonId].style.opacity = '0.6';

      // Play audio
      await audio.play();

      // Restore original state after audio finishes
      audio.addEventListener('ended', () => {
        this.elements[buttonId].innerHTML = originalHTML;
        this.elements[buttonId].style.opacity = '1';
      });

      // Fallback: restore state after 3 seconds if audio doesn't end properly
      setTimeout(() => {
        this.elements[buttonId].innerHTML = originalHTML;
        this.elements[buttonId].style.opacity = '1';
      }, 3000);
    } catch (error) {
      console.error('Google TTS pronunciation failed:', error);
      this.showError('Pronunciation failed. Please try again.');
    }
  }

  // Get proper language code for speech synthesis
  getLanguageCode(lang) {
    const languageMap = {
      en: 'en-US',
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      it: 'it-IT',
      pt: 'pt-PT',
      ru: 'ru-RU',
      ja: 'ja-JP',
      ko: 'ko-KR',
      zh: 'zh-CN',
      ar: 'ar-SA',
      hi: 'hi-IN',
      vi: 'vi-VN',
    };
    return languageMap[lang] || 'en-US';
  }

  // Get language code with accent preference
  getLanguageCodeWithAccent(lang, accent = 'us') {
    if (lang === 'en') {
      return accent === 'uk' ? 'en-GB' : 'en-US'; // en-GB is the correct language code for UK English
    }
    return this.getLanguageCode(lang);
  }

  // Get Google TTS language code
  getGoogleTTSLanguageCode(lang, accent = 'us') {
    if (lang === 'en') {
      return accent === 'uk' ? 'en-GB' : 'en-US';
    }
    return this.getLanguageCode(lang);
  }

  // Show input pronunciation information
  showInputPronunciationInfo(lang, accent = 'us') {
    const pronunciationDiv = document.getElementById('pronunciation');
    if (pronunciationDiv) {
      const languageNames = {
        en: 'English',
        es: 'Spanish',
        fr: 'French',
        de: 'German',
        it: 'Italian',
        pt: 'Portuguese',
        ru: 'Russian',
        ja: 'Japanese',
        ko: 'Korean',
        zh: 'Chinese',
        ar: 'Arabic',
        hi: 'Hindi',
        vi: 'Vietnamese',
      };

      const accentText =
        lang === 'en' ? ` (${accent.toUpperCase()} accent)` : '';
      const accentFlag = lang === 'en' ? (accent === 'uk' ? '🇬🇧' : '🇺🇸') : '';

      pronunciationDiv.innerHTML = `
                <div class="pronunciation-info">
                    <span class="pronunciation-icon">🔊</span>
                    <span class="pronunciation-text">Listening to ${
                      languageNames[lang] || lang
                    }${accentText} pronunciation of input text ${accentFlag}</span>
                </div>
            `;
      pronunciationDiv.style.display = 'block';

      // Hide after 3 seconds
      setTimeout(() => {
        pronunciationDiv.style.display = 'none';
      }, 3000);
    }
  }

  // Show pronunciation information
  showPronunciationInfo(lang, accent = 'us') {
    const pronunciationDiv = document.getElementById('pronunciation');
    if (pronunciationDiv) {
      const languageNames = {
        en: 'English',
        es: 'Spanish',
        fr: 'French',
        de: 'German',
        it: 'Italian',
        pt: 'Portuguese',
        ru: 'Russian',
        ja: 'Japanese',
        ko: 'Korean',
        zh: 'Chinese',
        ar: 'Arabic',
        hi: 'Hindi',
        vi: 'Vietnamese',
      };

      let accentText, accentFlag;
      if (accent === 'gg') {
        // GG shows source language
        const sourceLang = this.elements.fromLang.value;
        const displayLang = sourceLang === 'auto' ? 'en' : sourceLang;
        const displayLangName = languageNames[displayLang] || displayLang;
        accentText = ` (${displayLangName})`;
        accentFlag = '🌐';
      } else {
        accentText = lang === 'en' ? ` (${accent.toUpperCase()} accent)` : '';
        accentFlag = lang === 'en' ? (accent === 'uk' ? '🇬🇧' : '🇺🇸') : '';
      }

      pronunciationDiv.innerHTML = `
                <div class="pronunciation-info">
                    <span class="pronunciation-icon">🔊</span>
                    <span class="pronunciation-text">Listening to ${
                      languageNames[lang] || lang
                    }${accentText} pronunciation ${accentFlag}</span>
                </div>
            `;
      pronunciationDiv.style.display = 'block';

      // Hide after 3 seconds
      setTimeout(() => {
        pronunciationDiv.style.display = 'none';
      }, 3000);
    }
  }

  // Auto-fill selected text when popup opens
  async autoFillSelectedText() {
    try {
      // Get stored selected text from content script
      const stored = await chrome.storage.local.get([
        'selectedText',
        'selectionTimestamp',
      ]);
      const now = Date.now();

      console.log('Auto-fill: Stored data:', stored);
      console.log('Auto-fill: Current time:', now);

      // Use stored text if it's recent (within last 30 seconds)
      if (
        stored.selectedText &&
        stored.selectionTimestamp &&
        now - stored.selectionTimestamp < 30000
      ) {
        this.elements.inputText.value = stored.selectedText;
        this.handleInput();
        console.log('Auto-filled stored selected text:', stored.selectedText);

        // Auto-translate the filled text if enabled
        if (this.elements.autoTranslateToggle.checked) {
          setTimeout(async () => {
            await this.translateText();
          }, 300); // Wait 300ms for the input to be processed
        }

        // Auto-pronounce if enabled
        if (this.elements.autoPronounceToggle.checked) {
          setTimeout(() => {
            const defaultAccent = this.elements.defaultPronunciation.value;
            this.pronounceWord(defaultAccent);
          }, 1500); // Wait 1.5s for translation to complete
        }

        // Clear the stored text after using it
        await chrome.storage.local.remove([
          'selectedText',
          'selectionTimestamp',
        ]);
        return;
      } else {
        console.log('Auto-fill: No recent stored text found');
        console.log('Auto-fill: stored.selectedText:', stored.selectedText);
        console.log(
          'Auto-fill: stored.selectionTimestamp:',
          stored.selectionTimestamp
        );
        console.log(
          'Auto-fill: Time difference:',
          stored.selectionTimestamp ? now - stored.selectionTimestamp : 'N/A'
        );
      }

      // If no stored text, try to get current selection from active tab
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (tab && tab.id) {
          const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => window.getSelection().toString().trim(),
          });

          const selectedText = result[0]?.result;
          if (selectedText && selectedText.length > 0) {
            this.elements.inputText.value = selectedText;
            this.handleInput();
            console.log('Auto-filled current selected text:', selectedText);

            // Auto-translate the filled text if enabled
            if (this.elements.autoTranslateToggle.checked) {
              setTimeout(async () => {
                await this.translateText();
              }, 300); // Wait 300ms for the input to be processed
            }

            // Auto-pronounce if enabled
            if (this.elements.autoPronounceToggle.checked) {
              setTimeout(() => {
                const defaultAccent = this.elements.defaultPronunciation.value;
                this.pronounceWord(defaultAccent);
              }, 1500); // Wait 1.5s for translation to complete
            }
          }
        }
      } catch (scriptError) {
        console.log('Could not get current selection from tab:', scriptError);
      }
    } catch (error) {
      console.error('Auto-fill failed:', error);
    }
  }

  // Show saved words section
  showSavedWords() {
    this.elements.savedWordsSection.style.display = 'block';
    this.loadSavedWords();
  }

  // Hide saved words section
  hideSavedWords() {
    this.elements.savedWordsSection.style.display = 'none';
  }

  // Save current word to vocabulary list
  async saveWord() {
    if (!this.currentTranslation || !this.elements.displayedWord.textContent) {
      this.showError('No word to save');
      return;
    }

    try {
      const wordData = {
        original: this.elements.displayedWord.textContent,
        translation: this.currentTranslation,
        fromLang: this.elements.fromLang.value,
        toLang: this.elements.toLang.value,
        timestamp: Date.now(),
        id: Date.now().toString(),
      };

      // Get existing saved words
      const result = await chrome.storage.local.get(['savedWords']);
      const savedWords = result.savedWords || [];

      // Check if word already exists
      const existingIndex = savedWords.findIndex(
        (word) =>
          word.original.toLowerCase() === wordData.original.toLowerCase() &&
          word.fromLang === wordData.fromLang &&
          word.toLang === wordData.toLang
      );

      if (existingIndex !== -1) {
        // Update existing word
        savedWords[existingIndex] = wordData;
      } else {
        // Add new word
        savedWords.push(wordData);
      }

      // Save to storage
      await chrome.storage.local.set({ savedWords: savedWords });

      // Show success message
      this.showSaveSuccess();

      console.log('Word saved successfully:', wordData);
    } catch (error) {
      console.error('Error saving word:', error);
      this.showError('Failed to save word');
    }
  }

  // Load and display saved words
  async loadSavedWords() {
    try {
      const result = await chrome.storage.local.get(['savedWords']);
      const savedWords = result.savedWords || [];

      if (savedWords.length === 0) {
        this.elements.savedWordsList.innerHTML =
          '<p class="no-words">No saved words yet. Translate some words to get started!</p>';
        return;
      }

      // Sort by timestamp (newest first)
      savedWords.sort((a, b) => b.timestamp - a.timestamp);

      const wordsHTML = savedWords
        .map(
          (word) => `
        <div class="saved-word-item" data-id="${word.id}">
          <div class="word-content">
            <div class="word-original">${word.original}</div>
            <div class="word-translation">${word.translation}</div>
            <div class="word-languages">${word.fromLang.toUpperCase()} → ${word.toLang.toUpperCase()}</div>
            <div class="word-date">${new Date(
              word.timestamp
            ).toLocaleDateString()}</div>
          </div>
          <div class="word-actions">
            <button class="pronounce-btn" onclick="this.parentElement.parentElement.querySelector('.word-original').click()" title="Pronounce">
              🔊
            </button>
            <button class="delete-btn" onclick="this.parentElement.parentElement.remove()" title="Delete">
              🗑️
            </button>
          </div>
        </div>
      `
        )
        .join('');

      this.elements.savedWordsList.innerHTML = wordsHTML;

      // Add click event to pronounce original words
      this.elements.savedWordsList
        .querySelectorAll('.word-original')
        .forEach((element, index) => {
          element.addEventListener('click', () => {
            const word = savedWords[index];
            this.pronounceSavedWord(word.original, word.fromLang);
          });
        });
    } catch (error) {
      console.error('Error loading saved words:', error);
      this.elements.savedWordsList.innerHTML =
        '<p class="error">Error loading saved words</p>';
    }
  }

  // Pronounce saved word
  async pronounceSavedWord(text, language) {
    try {
      const languageCode = language === 'auto' ? 'en' : language;
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        text
      )}&tl=${languageCode}&client=tw-ob`;

      const audio = new Audio(ttsUrl);
      await audio.play();
    } catch (error) {
      console.error('Error pronouncing saved word:', error);
    }
  }

  // Show save success message
  showSaveSuccess() {
    const saveBtn = this.elements.saveWordBtn;
    const originalHTML = saveBtn.innerHTML;

    saveBtn.innerHTML = '<span>✓</span>';
    saveBtn.classList.add('saved');

    setTimeout(() => {
      saveBtn.innerHTML = originalHTML;
      saveBtn.classList.remove('saved');
    }, 2000);
  }

  // Test WordsAPI connection
  async testWordsAPI() {
    const keyInput = document.getElementById('wordsAPIKey');
    const testBtn = document.getElementById('testWordsAPIBtn');
    const originalText = testBtn.textContent;

    if (!keyInput.value.trim()) {
      alert('Please enter a WordsAPI key first!');
      return;
    }

    testBtn.textContent = 'Testing...';
    testBtn.disabled = true;

    try {
      console.log(
        '🧪 Testing WordsAPI with key:',
        keyInput.value.substring(0, 10) + '...'
      );

      const response = await fetch(
        'https://wordsapiv1.p.rapidapi.com/words/hello/pronunciation',
        {
          headers: {
            'X-RapidAPI-Key': keyInput.value,
            'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com',
          },
        }
      );

      console.log('📡 Test response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Test response data:', data);
        alert('✅ WordsAPI test successful! Key is working.');
      } else {
        console.error('❌ Test failed with status:', response.status);
        alert(`❌ WordsAPI test failed! Status: ${response.status}`);
      }
    } catch (error) {
      console.error('💥 Test error:', error);
      alert('💥 Test failed! Check console for details.');
    } finally {
      testBtn.textContent = originalText;
      testBtn.disabled = false;
    }
  }

  // Functions to be injected into web pages
  static getSelectedText() {
    return window.getSelection().toString();
  }

  static getSelectedText() {
    return window.getSelection().toString();
  }
}

// Initialize the extension when the popup loads
document.addEventListener('DOMContentLoaded', () => {
  new SmartTranslate();
});

// Handle messages from content script or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'translateSelection') {
    // Handle translation request from content script
    sendResponse({ success: true });
  }
});
