/**
 * Global State Management
 * Simple pub/sub pattern for reactive state updates
 */

const State = {
  _data: {
    appData: null,
    currentRoute: '/',
    currentSurah: null,
    currentVerseIndex: -1,
    audioState: {
      playing: false,
      currentTime: 0,
      duration: 0,
      speed: 1,
      loaded: false,
      surahId: null
    },
    searchQuery: '',
    searchResults: [],
    searchTarget: null,
    isLoading: true,
    mobileMenuOpen: false
  },

  _listeners: {},

  /**
   * Get a state value
   * @param {string} key - The state key to get
   * @returns {*} The state value
   */
  get(key) {
    if (key.includes('.')) {
      const keys = key.split('.');
      let value = this._data;
      for (const k of keys) {
        value = value?.[k];
      }
      return value;
    }
    return this._data[key];
  },

  /**
   * Set a state value and notify listeners
   * @param {string} key - The state key to set
   * @param {*} value - The value to set
   */
  set(key, value) {
    if (key.includes('.')) {
      const keys = key.split('.');
      const lastKey = keys.pop();
      let obj = this._data;
      for (const k of keys) {
        if (!obj[k]) obj[k] = {};
        obj = obj[k];
      }
      obj[lastKey] = value;
    } else {
      this._data[key] = value;
    }
    this._notify(key, value);
  },

  /**
   * Update audio state partially
   * @param {Object} updates - Partial audio state updates
   */
  updateAudioState(updates) {
    this._data.audioState = { ...this._data.audioState, ...updates };
    this._notify('audioState', this._data.audioState);
  },

  /**
   * Subscribe to state changes
   * @param {string} key - The state key to watch
   * @param {Function} callback - Callback function when state changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(key, callback) {
    if (!this._listeners[key]) {
      this._listeners[key] = [];
    }
    this._listeners[key].push(callback);

    // Return unsubscribe function
    return () => {
      this._listeners[key] = this._listeners[key].filter(cb => cb !== callback);
    };
  },

  /**
   * Notify all listeners for a key
   * @param {string} key - The state key that changed
   * @param {*} value - The new value
   */
  _notify(key, value) {
    // Notify exact key listeners
    if (this._listeners[key]) {
      this._listeners[key].forEach(callback => callback(value));
    }

    // Notify parent key listeners (e.g., 'audioState' when 'audioState.playing' changes)
    const parentKey = key.split('.')[0];
    if (parentKey !== key && this._listeners[parentKey]) {
      this._listeners[parentKey].forEach(callback => callback(this._data[parentKey]));
    }
  },

  /**
   * Load application data from data.json
   * @returns {Promise<Object>} The loaded data
   */
  async loadData() {
    try {
      const dataUrl = new URL('data/data.json', window.location.href).toString();
      const response = await fetch(dataUrl);
      if (!response.ok) {
        throw new Error('Failed to load data');
      }
      const data = await response.json();
      this.set('appData', data);
      return data;
    } catch (error) {
      console.error('Error loading data:', error);
      throw error;
    }
  },

  /**
   * Get a surah by ID
   * @param {number} id - The surah ID
   * @returns {Object|null} The surah object
   */
  getSurah(id) {
    const surahs = this.get('appData')?.surahs || [];
    return surahs.find(s => s.id === parseInt(id)) || null;
  },

  /**
   * Get a contiguous range of surahs by their `number` field.
   * Does not modify the original data; returns a new array sorted by `number` ascending.
   * @param {number} start - Starting surah number (inclusive)
   * @param {number} end - Ending surah number (inclusive)
   * @returns {Array} Array of surah objects in the requested range
   */
  getSurahsRange(start = 1, end = 114) {
    const surahs = Array.isArray(this.get('appData')?.surahs) ? [...this.get('appData').surahs] : [];
    return surahs
      .filter(s => typeof s.number === 'number' && s.number >= start && s.number <= end)
      .sort((a, b) => a.number - b.number);
  },

  /**
   * Get surahs with available lessons
   * @returns {Array} Array of surahs with lessons
   */
  getSurahsWithLessons() {
    const surahs = this.get('appData')?.surahs || [];
    return surahs.filter(s => s.hasLessons && s.verses.length > 0);
  },

  /**
   * Search through surahs and tafsir books
   * @param {string} query - Search query
   * @returns {Object} Search results
   */
  search(query) {
    if (!query || query.length < 2) {
      return { surahs: [], verses: [], books: [] };
    }

    const appData = this.get('appData');
    if (!appData) return { surahs: [], verses: [], books: [] };

    const normalize = (value) =>
      String(value || '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
        .replace(/\u0640/g, '')
        .replace(/[\u200c\u200d\u200e\u200f\u2066-\u2069]/g, '')
        .replace(/[إأآ]/g, 'ا')
        .replace(/ى/g, 'ي')
        .replace(/ؤ/g, 'و')
        .replace(/ئ/g, 'ي')
        .replace(/\s+/g, ' ')
        .trim();

    const normalizedQuery = normalize(query);
    if (!normalizedQuery) {
      return { surahs: [], verses: [], books: [] };
    }

    const scoreField = (text, baseScore = 0) => {
      if (!text) return null;
      const normalizedText = normalize(text);
      const index = normalizedText.indexOf(normalizedQuery);
      if (index === -1) return null;

      let score = baseScore;
      if (normalizedText === normalizedQuery) {
        score += 100;
      } else if (normalizedText.startsWith(normalizedQuery)) {
        score += 70;
      } else {
        score += 40;
      }
      score += Math.max(0, 40 - index);
      return { score, index, text };
    };

    const scoreKeywordList = (values, baseScore = 0) => {
      if (!values) return null;
      const list = Array.isArray(values) ? values : [values];
      let best = null;
      list.forEach((value) => {
        if (!value) return;
        const result = scoreField(value, baseScore);
        if (!result) return;
        if (!best || result.score > best.score) {
          best = result;
        }
      });
      return best;
    };

    const buildSnippet = (text, index, length = 90) => {
      if (!text) return '';
      const safeText = String(text);
      if (typeof index !== 'number' || index < 0) {
        return safeText.length > length ? `${safeText.slice(0, length)}…` : safeText;
      }
      const start = Math.max(0, index - Math.floor(length / 2));
      const end = Math.min(safeText.length, start + length);
      let snippet = safeText.slice(start, end);
      if (start > 0) snippet = `…${snippet}`;
      if (end < safeText.length) snippet = `${snippet}…`;
      return snippet;
    };

    // Search surahs
    const surahs = (appData.surahs || [])
      .map((surah) => {
        const candidates = [
          { field: 'nameArabic', result: scoreField(surah.nameArabic, 60) },
          { field: 'nameKurdish', result: scoreField(surah.nameKurdish, 70) },
          { field: 'meaningKurdish', result: scoreField(surah.meaningKurdish, 45) },
          { field: 'nameTranslit', result: scoreField(surah.nameTranslit, 35) }
        ].filter(item => item.result);

        if (candidates.length === 0) return null;
        const best = candidates.reduce((max, item) =>
          item.result.score > max.result.score ? item : max
        );
        return {
          ...surah,
          score: best.result.score,
          matchField: best.field
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    // Search verses
    const verseMatches = [];
    (appData.surahs || []).forEach((surah) => {
      const verses = Array.isArray(surah.verses) ? surah.verses : [];
      verses.forEach((verse, index) => {
        const verseText = verse.textUthmani || verse.textArabic || verse.textKurdish || '';
        const candidates = [
          { type: 'keyword', result: scoreKeywordList(verse.keywords, 90) },
          { type: 'tagline', result: scoreKeywordList(verse.taglines, 85) },
          { type: 'arabic', result: scoreField(verse.textArabic, 55) },
          { type: 'uthmani', result: scoreField(verse.textUthmani, 60) },
          { type: 'translation', result: scoreField(verse.textKurdish, 70) },
          { type: 'tafsir', result: scoreField(verse.tafsirKurdish, 50) }
        ].filter(item => item.result);

        if (candidates.length === 0) return;
        const best = candidates.reduce((max, item) =>
          item.result.score > max.result.score ? item : max
        );

        const useIndex = best.type !== 'keyword' && best.type !== 'tagline';
        const snippet = buildSnippet(verseText || best.result.text, useIndex ? best.result.index : undefined);
        verseMatches.push({
          surahId: surah.id,
          surahNameArabic: surah.nameArabic,
          surahNameKurdish: surah.nameKurdish,
          verseIndex: index,
          verseNumber: verse.numberInSurah ?? verse.number ?? index + 1,
          snippet,
          score: best.result.score,
          matchType: best.type
        });
      });
    });

    const verses = verseMatches
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    // Search tafsir books
    const books = (appData.tafsirBooks || [])
      .map((book) => {
        const candidates = [
          { field: 'title', result: scoreField(book.title, 75) },
          { field: 'author', result: scoreField(book.author, 55) },
          { field: 'description', result: scoreField(book.description, 35) }
        ].filter(item => item.result);

        if (candidates.length === 0) return null;
        const best = candidates.reduce((max, item) =>
          item.result.score > max.result.score ? item : max
        );
        return {
          ...book,
          score: best.result.score,
          matchField: best.field,
          matchIndex: best.result.index,
          matchText: best.result.text,
          snippet: best.field === 'description'
            ? buildSnippet(best.result.text, best.result.index)
            : ''
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    return { surahs, verses, books };
  },

  /**
   * Reset state to initial values
   */
  reset() {
    this.set('currentSurah', null);
    this.set('currentVerseIndex', -1);
    this.set('searchQuery', '');
    this.set('searchResults', []);
  }
};

export default State;
