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
    // Try MyMemory API for translation
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
            details: this.generateEnhancedDetails(text, fromLang, toLang),
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
            details: this.generateEnhancedDetails(text, fromLang, toLang),
          };
        }
      }
    } catch (error) {
      console.error('API call failed:', error);
    }

    // Fallback: return a mock translation with enhanced details
    return {
      translation: `[Translated to ${toLang.toUpperCase()}] ${text}`,
      details: this.generateEnhancedDetails(text, fromLang, toLang),
    };
  }

  // Generate enhanced translation details
  generateEnhancedDetails(text, fromLang, toLang) {
    const details = {
      partsOfSpeech: [],
      multipleMeanings: [],
      relatedWords: [],
      exampleSentences: [],
    };

    // Generate mock parts of speech (in a real app, this would come from a dictionary API)
    const commonParts = [
      'noun',
      'verb',
      'adjective',
      'adverb',
      'preposition',
      'conjunction',
    ];
    const randomParts = commonParts
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.min(3, commonParts.length));
    details.partsOfSpeech = randomParts;

    // Generate mock multiple meanings
    if (text.length > 3) {
      details.multipleMeanings = [
        `Primary meaning: ${text}`,
        `Alternative meaning: ${text} (variant)`,
        `Contextual meaning: ${text} (context-specific)`,
      ];
    }

    // Generate mock related words
    details.relatedWords = [
      `${text}ly`,
      `${text}ness`,
      `${text}ful`,
      `${text}less`,
    ];

    // Generate mock example sentences
    details.exampleSentences = [
      `I use the word "${text}" in my daily conversations.`,
      `The "${text}" is an important concept to understand.`,
      `She explained the "${text}" very clearly.`,
    ];

    return details;
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

      // Also load auto-pronounce and auto-translate settings
      const settingsResult = await chrome.storage.sync.get([
        'autoPronounce',
        'autoTranslate',
      ]);
      if (settingsResult.autoPronounce !== undefined) {
        this.elements.autoPronounceToggle.checked =
          settingsResult.autoPronounce;
      }
      if (settingsResult.autoTranslate !== undefined) {
        this.elements.autoTranslateToggle.checked =
          settingsResult.autoTranslate;
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

    // Show parts of speech
    const partsOfSpeechDiv = document.getElementById('partsOfSpeech');
    if (partsOfSpeechDiv && details.partsOfSpeech.length > 0) {
      partsOfSpeechDiv.innerHTML = `
                <div class="detail-section">
                    <h5>📝 Parts of Speech</h5>
                    <div class="tags">
                        ${details.partsOfSpeech
                          .map((part) => `<span class="tag">${part}</span>`)
                          .join('')}
                    </div>
                </div>
            `;
    }

    // Show multiple meanings
    const multipleMeaningsDiv = document.getElementById('multipleMeanings');
    if (multipleMeaningsDiv && details.multipleMeanings.length > 0) {
      multipleMeaningsDiv.innerHTML = `
                <div class="detail-section">
                    <h5>🔍 Multiple Meanings</h5>
                    <ul>
                        ${details.multipleMeanings
                          .map((meaning) => `<li>${meaning}</li>`)
                          .join('')}
                    </ul>
                </div>
            `;
    }

    // Show related words
    const relatedWordsDiv = document.getElementById('relatedWords');
    if (relatedWordsDiv && details.relatedWords.length > 0) {
      relatedWordsDiv.innerHTML = `
                <div class="detail-section">
                    <h5>🔗 Related Words</h5>
                    <div class="tags">
                        ${details.relatedWords
                          .map((word) => `<span class="tag">${word}</span>`)
                          .join('')}
                    </div>
                </div>
            `;
    }

    // Show example sentences
    const exampleSentencesDiv = document.getElementById('exampleSentences');
    if (exampleSentencesDiv && details.exampleSentences.length > 0) {
      exampleSentencesDiv.innerHTML = `
                <div class="detail-section">
                    <h5>💬 Example Sentences</h5>
                    <ul>
                        ${details.exampleSentences
                          .map((sentence) => `<li>${sentence}</li>`)
                          .join('')}
                    </ul>
                </div>
            `;
    }

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
