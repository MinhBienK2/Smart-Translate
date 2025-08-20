class SmartTranslate {
  constructor() {
    this.init();
    this.bindEvents();
    this.loadSettings();
  }

  init() {
    this.elements = {
      fromLang: document.getElementById('fromLang'),
      toLang: document.getElementById('toLang'),
      swapBtn: document.getElementById('swapBtn'),
      inputText: document.getElementById('inputText'),
      wordDisplay: document.getElementById('wordDisplay'),
      displayedWord: document.getElementById('displayedWord'),
      usPronunciationLabel: document.getElementById('usPronunciationLabel'),
      ukPronunciationLabel: document.getElementById('ukPronunciationLabel'),
      usPhonetic: document.getElementById('usPhonetic'),
      ukPhonetic: document.getElementById('ukPhonetic'),

      translateBtn: document.getElementById('translateBtn'),
      resultSection: document.getElementById('resultSection'),
      translatedText: document.getElementById('translatedText'),
      copyBtn: document.getElementById('copyBtn'),
      pageTranslateBtn: document.getElementById('pageTranslateBtn'),
      selectionBtn: document.getElementById('selectionBtn'),
      settingsBtn: document.getElementById('settingsBtn'),
      autoFillStatus: document.getElementById('autoFillStatus'),
      autoPronounceToggle: document.getElementById('autoPronounceToggle'),
      autoTranslateToggle: document.getElementById('autoTranslateToggle'),
      showSelectionIconToggle: document.getElementById(
        'showSelectionIconToggle'
      ),
      translationSource: document.getElementById('translationSource'),
    };

    this.isTranslating = false;
    this.currentTranslation = '';

    // API keys for phonetic data
    this.wordsAPIKey = '';
    this.forvoAPIKey = '';

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

    // Translation source toggle
    this.elements.translationSource.addEventListener('change', () => {
      this.saveTranslationSourceSetting();
    });

    // Feature buttons
    this.elements.pageTranslateBtn.addEventListener('click', () =>
      this.translatePage()
    );
    this.elements.selectionBtn.addEventListener('click', () =>
      this.translateSelection()
    );
    this.elements.settingsBtn.addEventListener('click', () =>
      this.openSettings()
    );

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
        'wordsAPIKey',
        'forvoAPIKey',
        'autoPronounce',
        'autoTranslate',
        'showSelectionIcon',
        'translationSource',
      ]);
      if (result.fromLang) {
        this.elements.fromLang.value = result.fromLang;
      }
      if (result.toLang) {
        this.elements.toLang.value = result.toLang;
      }
      if (result.wordsAPIKey) {
        this.wordsAPIKey = result.wordsAPIKey;
      }
      if (result.forvoAPIKey) {
        this.forvoAPIKey = result.forvoAPIKey;
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

    // Then automatically pronounce in US accent after a short delay (if auto-pronounce is enabled)
    if (this.elements.autoPronounceToggle.checked) {
      setTimeout(() => {
        this.pronounceWord('us');
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

    // Try WordsAPI (requires API key but more comprehensive)
    try {
      if (this.wordsAPIKey) {
        const response = await fetch(
          `https://wordsapiv1.p.rapidapi.com/words/${word}/pronunciation`,
          {
            headers: {
              'X-RapidAPI-Key': this.wordsAPIKey,
              'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com',
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          if (data.pronunciation && data.pronunciation.all) {
            return `[${data.pronunciation.all}]`;
          }
        }
      }
    } catch (error) {
      console.log('WordsAPI failed...');
    }

    // Try Forvo API for pronunciation (requires API key)
    try {
      if (this.forvoAPIKey) {
        const response = await fetch(
          `https://apifree.forvo.com/key/${this.forvoAPIKey}/format/json/action/word-pronunciations/word/${word}/language/en`
        );
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            // Get pronunciation based on accent preference
            const pronunciations = data.filter((p) =>
              accent === 'uk'
                ? p.country === 'United Kingdom'
                : p.country === 'United States'
            );
            if (pronunciations.length > 0) {
              return `[${pronunciations[0].pronunciation}]`;
            }
          }
        }
      }
    } catch (error) {
      console.log('Forvo API failed...');
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
      const accentText = accent === 'uk' ? 'UK' : 'US';
      const accentFlag = accent === 'uk' ? '🇬🇧' : '🇺🇸';

      pronunciationDiv.innerHTML = `
                <div class="pronunciation-info">
                    <span class="pronunciation-icon">🔊</span>
                    <span class="pronunciation-text">Listening to ${accentText} English pronunciation ${accentFlag}</span>
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
      // Load current API keys
      this.loadAPIKeys();
      settingsSection.style.display = 'block';
    }
  }

  // Hide settings
  hideSettings() {
    const settingsSection = document.getElementById('settingsSection');
    if (settingsSection) {
      // Save API keys before hiding
      this.saveAPIKeys();
      settingsSection.style.display = 'none';
    }
  }

  // Load API keys from storage
  async loadAPIKeys() {
    try {
      const result = await chrome.storage.sync.get([
        'wordsAPIKey',
        'forvoAPIKey',
      ]);
      if (result.wordsAPIKey) {
        document.getElementById('wordsAPIKey').value = result.wordsAPIKey;
      }
      if (result.forvoAPIKey) {
        document.getElementById('forvoAPIKey').value = result.forvoAPIKey;
      }

      // Also load auto-pronounce, auto-translate, and show selection icon settings
      const settingsResult = await chrome.storage.sync.get([
        'autoPronounce',
        'autoTranslate',
        'showSelectionIcon',
      ]);
      if (settingsResult.autoPronounce !== undefined) {
        this.elements.autoPronounceToggle.checked =
          settingsResult.autoPronounce;
      }
      if (settingsResult.autoTranslate !== undefined) {
        this.elements.autoTranslateToggle.checked =
          settingsResult.autoTranslate;
      }
      if (settingsResult.showSelectionIcon !== undefined) {
        this.elements.showSelectionIconToggle.checked =
          settingsResult.showSelectionIcon;
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
    }
  }

  // Save API keys to storage
  async saveAPIKeys() {
    try {
      const wordsAPIKey = document.getElementById('wordsAPIKey').value;
      const forvoAPIKey = document.getElementById('forvoAPIKey').value;

      await chrome.storage.sync.set({
        wordsAPIKey: wordsAPIKey || '',
        forvoAPIKey: forvoAPIKey || '',
      });

      // Update the instance variables
      this.wordsAPIKey = wordsAPIKey;
      this.forvoAPIKey = forvoAPIKey;

      console.log('API keys saved successfully');
    } catch (error) {
      console.error('Error saving API keys:', error);
    }
  }

  // Show word display with phonetic transcription
  async showWordDisplay(text) {
    // Display the word
    this.elements.displayedWord.textContent = text;

    // Show loading state for phonetic transcription
    this.elements.usPhonetic.textContent = 'Loading...';
    this.elements.ukPhonetic.textContent = 'Loading...';

    // Show the word display section
    this.elements.wordDisplay.style.display = 'block';

    try {
      // Generate and display phonetic transcription asynchronously
      const usPhonetic = await this.generatePhoneticTranscription(text, 'us');
      const ukPhonetic = await this.generatePhoneticTranscription(text, 'uk');

      this.elements.usPhonetic.textContent = usPhonetic;
      this.elements.ukPhonetic.textContent = ukPhonetic;
    } catch (error) {
      console.error('Failed to load phonetic transcription:', error);
      // Show fallback
      this.elements.usPhonetic.textContent = '[Loading failed]';
      this.elements.ukPhonetic.textContent = '[Loading failed]';
    }
  }

  // Show enhanced translation details
  showEnhancedDetails(details) {
    const detailsContainer = document.getElementById('translationDetails');
    if (!detailsContainer) return;

    // Show translation details
    detailsContainer.innerHTML = `
      <div class="detail-section">
        <div class="word-definition">
          <div class="word-main">- ${details.word}</div>
          <div class="word-type">${details.type}</div>
          <div class="word-meanings">${details.meanings}</div>
        </div>
      </div>
    `;

    // Show the details container
    detailsContainer.style.display = 'block';
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

    // Show enhanced details if available
    if (details) {
      this.showEnhancedDetails(details);
    }
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

  // Pronounce the word
  async pronounceWord(accent = 'us') {
    const word = this.elements.displayedWord.textContent;
    if (!word) return;

    try {
      // Use Web Speech API for pronunciation
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = this.getLanguageCodeWithAccent('en', accent);
        utterance.rate = 0.8; // Slightly slower for clarity
        utterance.pitch = 1.0;

        // Show pronunciation info
        this.showWordPronunciationInfo(accent);

        // Speak the text
        speechSynthesis.speak(utterance);

        // Add visual feedback
        const labelId =
          accent === 'uk' ? 'ukPronunciationLabel' : 'usPronunciationLabel';
        const originalHTML = this.elements[labelId].innerHTML;

        // Show playing state
        this.elements[labelId].style.opacity = '0.6';

        setTimeout(() => {
          // Restore original state
          this.elements[labelId].style.opacity = '1';
        }, 2000);
      } else {
        this.showError('Speech synthesis not supported in this browser');
      }
    } catch (error) {
      console.error('Word pronunciation failed:', error);
      this.showError('Pronunciation failed. Please try again.');
    }
  }

  // Pronounce the translated text
  async pronounceText(accent = 'us') {
    if (!this.currentTranslation) return;

    try {
      // Get the target language for pronunciation
      const targetLang = this.elements.toLang.value;

      // Use Web Speech API for pronunciation
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(this.currentTranslation);
        utterance.lang = this.getLanguageCodeWithAccent(targetLang, accent);
        utterance.rate = 0.8; // Slightly slower for clarity
        utterance.pitch = 1.0;

        // Show pronunciation info
        this.showPronunciationInfo(targetLang, accent);

        // Speak the text
        speechSynthesis.speak(utterance);

        // Add visual feedback
        const buttonId = accent === 'uk' ? 'pronounceUkBtn' : 'pronounceUsBtn';
        this.elements[buttonId].innerHTML = '<span>⏸️</span>';
        setTimeout(() => {
          this.elements[buttonId].innerHTML =
            accent === 'uk' ? '<span>🇬🇧 🔊</span>' : '<span>🇺🇸 🔊</span>';
        }, 2000);
      } else {
        this.showError('Speech synthesis not supported in this browser');
      }
    } catch (error) {
      console.error('Pronunciation failed:', error);
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

      const accentText =
        lang === 'en' ? ` (${accent.toUpperCase()} accent)` : '';
      const accentFlag = lang === 'en' ? (accent === 'uk' ? '🇬🇧' : '🇺🇸') : '';

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

  async translatePage() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: this.injectPageTranslation,
      });
      window.close();
    } catch (error) {
      console.error('Page translation failed:', error);
      this.showError('Page translation failed. Please try again.');
    }
  }

  async translateSelection() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: this.getSelectedText,
      });

      const selectedText = result[0]?.result;
      if (selectedText && selectedText.trim()) {
        this.elements.inputText.value = selectedText;
        this.handleInput();
        this.translateText();
      } else {
        this.showError(
          'No text selected. Please select some text on the page first.'
        );
      }
    } catch (error) {
      console.error('Selection translation failed:', error);
      this.showError('Selection translation failed. Please try again.');
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
            this.pronounceWord('us');
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
                this.pronounceWord('us');
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

  openSettings() {
    // In a real extension, this would open a settings page
    // For now, we'll just show a message
    alert(
      'Settings feature coming soon! This would include:\n• API key configuration\n• Default languages\n• Translation history\n• Theme preferences'
    );
  }

  // Functions to be injected into web pages
  static injectPageTranslation() {
    // This function will be injected into the web page
    console.log('Page translation feature would be implemented here');
    alert('Page translation feature coming soon!');
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
