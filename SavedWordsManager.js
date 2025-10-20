/**
 * SavedWordsManager - Quản lý từ vựng đã lưu
 */
class SavedWordsManager {
  constructor() {
    this.savedWords = [];
    this.maxWords = 100;
    // Don't call loadSavedWords here, it will be called explicitly

    // Keep a single bound handler to avoid duplicate event triggers
    this._listClickHandler = null;
  }

  /**
   * Load saved words từ Chrome storage
   */
  async loadSavedWords() {
    try {
      const result = await chrome.storage.local.get(['savedWords']);
      this.savedWords = result.savedWords || [];
      return this.savedWords;
    } catch (error) {
      console.error('Error loading saved words:', error);
      this.savedWords = [];
      return this.savedWords;
    }
  }

  /**
   * Get saved words array
   */
  getSavedWords() {
    return this.savedWords;
  }

  /**
   * Export saved words to txt string
   */
  exportAsTxt() {
    if (!this.savedWords || this.savedWords.length === 0) {
      return 'No saved words';
    }

    // Format: word \t translation \t from->to \t YYYY-MM-DD
    const lines = this.savedWords.map((w) => {
      const date = this.formatDate(w.timestamp);
      return `${w.word}\t${w.translation}`;
    });

    return lines.join('\n');
  }

  /**
   * Save saved words vào Chrome storage
   */
  async saveSavedWords() {
    try {
      await chrome.storage.local.set({ savedWords: this.savedWords });
      return true;
    } catch (error) {
      console.error('Error saving saved words:', error);
      return false;
    }
  }

  /**
   * Thêm từ mới vào danh sách
   */
  async addWord(word, translation, fromLang = 'auto', toLang = 'en') {
    // Kiểm tra xem từ đã tồn tại chưa
    const existingWord = this.savedWords.find(
      (item) =>
        item.word.toLowerCase() === word.toLowerCase() &&
        item.fromLang === fromLang &&
        item.toLang === toLang
    );

    if (existingWord) {
      return { success: false, message: 'Word already exists in saved list' };
    }

    // Thêm từ mới
    const newWord = {
      id: Date.now().toString(),
      word: word.trim(),
      translation: translation.trim(),
      fromLang,
      toLang,
      timestamp: Date.now(),
      phonetic: '',
      pronunciation: '',
    };

    this.savedWords.unshift(newWord);

    // Giới hạn số lượng từ
    if (this.savedWords.length > this.maxWords) {
      this.savedWords = this.savedWords.slice(0, this.maxWords);
    }

    await this.saveSavedWords();
    return { success: true, word: newWord };
  }

  /**
   * Xóa từ khỏi danh sách
   */
  async removeWord(wordId) {
    const index = this.savedWords.findIndex((item) => item.id === wordId);
    if (index !== -1) {
      this.savedWords.splice(index, 1);
      await this.saveSavedWords();
      return { success: true };
    }
    return { success: false, message: 'Word not found' };
  }

  /**
   * Cập nhật từ
   */
  async updateWord(wordId, updates) {
    const index = this.savedWords.findIndex((item) => item.id === wordId);
    if (index !== -1) {
      this.savedWords[index] = { ...this.savedWords[index], ...updates };
      await this.saveSavedWords();
      return { success: true, word: this.savedWords[index] };
    }
    return { success: false, message: 'Word not found' };
  }

  /**
   * Tìm kiếm từ
   */
  searchWords(query) {
    if (!query.trim()) {
      return this.savedWords;
    }

    const searchTerm = query.toLowerCase();
    return this.savedWords.filter(
      (item) =>
        item.word.toLowerCase().includes(searchTerm) ||
        item.translation.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Lấy từ theo ID
   */
  getWordById(wordId) {
    return this.savedWords.find((item) => item.id === wordId);
  }

  /**
   * Lấy tất cả từ
   */
  getAllWords() {
    return [...this.savedWords];
  }

  /**
   * Xóa tất cả từ
   */
  async clearAllWords() {
    this.savedWords = [];
    await this.saveSavedWords();
    return { success: true };
  }

  /**
   * Export từ ra JSON
   */
  exportWords() {
    return JSON.stringify(this.savedWords, null, 2);
  }

  /**
   * Import từ từ JSON
   */
  async importWords(jsonData) {
    try {
      const importedWords = JSON.parse(jsonData);
      if (Array.isArray(importedWords)) {
        // Merge với từ hiện tại, tránh duplicate
        const existingWords = this.savedWords.map(
          (item) => `${item.word.toLowerCase()}_${item.fromLang}_${item.toLang}`
        );

        const newWords = importedWords.filter((item) => {
          const key = `${item.word.toLowerCase()}_${item.fromLang}_${
            item.toLang
          }`;
          return !existingWords.includes(key);
        });

        this.savedWords = [...this.savedWords, ...newWords];
        await this.saveSavedWords();
        return { success: true, imported: newWords.length };
      }
      return { success: false, message: 'Invalid data format' };
    } catch (error) {
      return { success: false, message: 'Error parsing JSON data' };
    }
  }

  /**
   * Render saved words list vào UI
   */
  renderSavedWordsList(container) {
    console.log('renderSavedWordsList called with container:', container);
    console.log('savedWords length:', this.savedWords.length);
    console.log('savedWords:', this.savedWords);

    if (!container) {
      console.error('Container is null or undefined');
      return;
    }

    if (this.savedWords.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📚</div>
          <div class="empty-text">No saved words yet</div>
          <div class="empty-subtext">Save words while translating to build your vocabulary</div>
        </div>
      `;
      return;
    }

    const wordsHtml = this.savedWords
      .map(
        (word) => `
      <div class="saved-word-item" data-word-id="${word.id}">
        <div class="word-text">${this.escapeHtml(word.word)}</div>
        <div class="word-translation">${this.escapeHtml(word.translation)}</div>
        <div class="word-actions">
          <div style="display: flex; align-items: center; gap: 6px;">
            <div class="word-lang">${word.fromLang} → ${word.toLang}</div>
            <button class="action-btn" data-action="pronounce" title="Pronounce">🔊</button>
          </div>
          <button class="action-btn" data-action="delete" title="Delete">🗑️</button>
        </div>
      </div>
    `
      )
      .join('');

    container.innerHTML = wordsHtml;
  }

  /**
   * Bind events cho saved words UI
   */
  bindSavedWordsEvents(container, callbacks = {}) {
    if (!container) return;

    // Remove previous handler if exists to prevent duplicate bindings
    if (this._listClickHandler) {
      container.removeEventListener('click', this._listClickHandler);
    }

    this._listClickHandler = (e) => {
      const actionBtn = e.target.closest('.action-btn');
      if (!actionBtn) return;

      const wordItem = actionBtn.closest('.saved-word-item');
      const wordId = wordItem.dataset.wordId;
      const action = actionBtn.dataset.action;

      switch (action) {
        case 'pronounce':
          if (callbacks.onPronounceWord) {
            const word = this.getWordById(wordId);
            callbacks.onPronounceWord(word);
          }
          break;

        case 'delete':
          if (callbacks.onDeleteWord) {
            callbacks.onDeleteWord(wordId);
          }
          break;
      }
    };

    container.addEventListener('click', this._listClickHandler);
  }

  /**
   * Escape HTML để tránh XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Format date
   */
  formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) {
      // Less than 1 minute
      return 'Just now';
    } else if (diff < 3600000) {
      // Less than 1 hour
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    } else if (diff < 86400000) {
      // Less than 1 day
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}

// Export cho module system (nếu cần)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SavedWordsManager;
}
