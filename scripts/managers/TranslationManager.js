/**
 * TranslationManager - Quản lý logic dịch thuật
 */
class TranslationManager {
  constructor() {
    this.isTranslating = false;
    this.currentTranslation = '';
    this.translationHistory = [];
    this.maxHistoryItems = 50;
  }

  /**
   * Dịch text từ ngôn ngữ này sang ngôn ngữ khác
   */
  async translateText(text, fromLang, toLang) {
    if (!text || !text.trim()) {
      throw new Error('Text is required');
    }

    if (fromLang === toLang) {
      throw new Error('Source and target languages cannot be the same');
    }

    this.isTranslating = true;

    try {
      // Sử dụng Google Translate API
      const translation = await this.translateWithGoogle(
        text,
        fromLang,
        toLang
      );

      // Lưu vào history
      this.addToHistory(text, translation, fromLang, toLang);

      this.currentTranslation = translation;
      return {
        success: true,
        translation,
        originalText: text,
        fromLang,
        toLang,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Translation error:', error);
      throw error;
    } finally {
      this.isTranslating = false;
    }
  }

  /**
   * Dịch với Google Translate API
   */
  async translateWithGoogle(text, fromLang, toLang) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromLang}&tl=${toLang}&dt=t&q=${encodeURIComponent(
      text
    )}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data[0] && data[0][0] && data[0][0][0]) {
        return data[0][0][0];
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Google Translate API error:', error);
      throw new Error('Translation service unavailable');
    }
  }

  /**
   * Phát âm text với Google TTS
   */
  async pronounceText(text, lang = 'en', accent = 'us') {
    if (!text || !text.trim()) {
      throw new Error('Text is required for pronunciation');
    }

    try {
      // Xác định voice dựa trên ngôn ngữ và accent
      const voice = this.getVoiceForLanguage(lang, accent);

      // Tạo audio URL
      const audioUrl = `https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=${voice}&client=gtx&q=${encodeURIComponent(
        text
      )}`;

      // Tạo và phát audio
      const audio = new Audio(audioUrl);
      audio.crossOrigin = 'anonymous';

      return new Promise((resolve, reject) => {
        audio.onloadeddata = () => {
          audio
            .play()
            .then(() => {
              resolve({ success: true, voice, text });
            })
            .catch(reject);
        };

        audio.onerror = () => {
          reject(new Error('Failed to load audio'));
        };

        // Timeout sau 10 giây
        setTimeout(() => {
          reject(new Error('Audio loading timeout'));
        }, 10000);
      });
    } catch (error) {
      console.error('Pronunciation error:', error);
      throw error;
    }
  }

  /**
   * Lấy voice phù hợp cho ngôn ngữ và accent
   */
  getVoiceForLanguage(lang, accent = 'us') {
    const voiceMap = {
      en: accent === 'uk' ? 'en-GB' : 'en-US',
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

    return voiceMap[lang] || 'en-US';
  }

  /**
   * Thêm vào lịch sử dịch thuật
   */
  addToHistory(originalText, translation, fromLang, toLang) {
    const historyItem = {
      id: Date.now().toString(),
      originalText,
      translation,
      fromLang,
      toLang,
      timestamp: Date.now(),
    };

    this.translationHistory.unshift(historyItem);

    // Giới hạn số lượng history
    if (this.translationHistory.length > this.maxHistoryItems) {
      this.translationHistory = this.translationHistory.slice(
        0,
        this.maxHistoryItems
      );
    }

    // Lưu vào storage
    this.saveHistoryToStorage();
  }

  /**
   * Lưu history vào Chrome storage
   */
  async saveHistoryToStorage() {
    try {
      await chrome.storage.local.set({
        translationHistory: this.translationHistory,
      });
    } catch (error) {
      console.error('Error saving translation history:', error);
    }
  }

  /**
   * Load history từ Chrome storage
   */
  async loadHistoryFromStorage() {
    try {
      const result = await chrome.storage.local.get(['translationHistory']);
      this.translationHistory = result.translationHistory || [];
      return this.translationHistory;
    } catch (error) {
      console.error('Error loading translation history:', error);
      this.translationHistory = [];
      return this.translationHistory;
    }
  }

  /**
   * Xóa lịch sử dịch thuật
   */
  async clearHistory() {
    this.translationHistory = [];
    try {
      await chrome.storage.local.remove(['translationHistory']);
      return { success: true };
    } catch (error) {
      console.error('Error clearing translation history:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Lấy lịch sử dịch thuật
   */
  getHistory() {
    return [...this.translationHistory];
  }

  /**
   * Kiểm tra trạng thái dịch thuật
   */
  isCurrentlyTranslating() {
    return this.isTranslating;
  }

  /**
   * Lấy bản dịch hiện tại
   */
  getCurrentTranslation() {
    return this.currentTranslation;
  }

  /**
   * Hoán đổi ngôn ngữ
   */
  swapLanguages(fromLang, toLang) {
    // Không hoán đổi nếu một trong hai là 'auto'
    if (fromLang === 'auto' || toLang === 'auto') {
      return { fromLang, toLang };
    }

    return { fromLang: toLang, toLang: fromLang };
  }
}

// Export cho module system (nếu cần)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TranslationManager;
}
