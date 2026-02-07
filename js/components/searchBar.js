/**
 * Search Bar Component
 * Universal search across audio lessons and tafsir reviews
 */

import State from '../state.js';
import { icon, $ } from '../utils/dom.js';
import { debounce, toKurdishNumber } from '../utils/formatters.js';

const SearchBar = {
  container: null,
  inputElement: null,
  resultsContainer: null,
  isOpen: false,

  /**
   * Create search bar HTML
   * @param {Object} options - Configuration options
   * @returns {string} HTML string
   */
  create(options = {}) {
    const {
      id = 'search',
      placeholder = 'گەڕان...',
      className = ''
    } = options;

    const strings = State.get('appData')?.uiStrings || {};

    return `
      <div class="relative ${className}" id="${id}-wrapper">
        <input type="text"
               id="${id}-input"
               placeholder="${placeholder}"
               class="search-input bg-white text-gray-900 placeholder-gray-400
                      border border-cream-200 rounded-lg px-4 py-3 pr-10 w-full
                      focus:border-emerald-500 transition-colors">
        <div class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          ${icon('search', 'w-5 h-5')}
        </div>

        <!-- Search Results -->
        <div id="${id}-results"
             class="absolute top-full right-0 left-0 mt-2 bg-white rounded-lg shadow-xl
                    border border-cream-200 max-h-96 overflow-y-auto hidden z-50">
        </div>
      </div>
    `;
  },

  /**
   * Initialize search functionality on an existing search bar
   * @param {string} inputId - ID of the search input element
   * @param {string} resultsId - ID of the results container
   * @param {Function} onSelect - Callback when a result is selected
   */
  init(inputId, resultsId, onSelect) {
    this.inputElement = document.getElementById(inputId);
    this.resultsContainer = document.getElementById(resultsId);

    if (!this.inputElement || !this.resultsContainer) return;

    // Debounced search handler
    const handleSearch = debounce((query) => {
      if (query.length < 2) {
        this._hideResults();
        return;
      }

      const results = State.search(query);
      this._showResults(results, query, onSelect);
    }, 300);

    // Input event
    this.inputElement.addEventListener('input', (e) => {
      handleSearch(e.target.value);
    });

    // Focus event
    this.inputElement.addEventListener('focus', () => {
      const query = this.inputElement.value;
      if (query.length >= 2) {
        const results = State.search(query);
        this._showResults(results, query, onSelect);
      }
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!this.inputElement.contains(e.target) &&
          !this.resultsContainer.contains(e.target)) {
        this._hideResults();
      }
    });

    // Keyboard navigation
    this.inputElement.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this._hideResults();
        this.inputElement.blur();
      }
    });
  },

  /**
   * Show search results
   * @param {Object} results - Search results
   * @param {string} query - Search query
   * @param {Function} onSelect - Selection callback
   */
  _showResults(results, query, onSelect) {
    const strings = State.get('appData')?.uiStrings || {};
    const { surahs, verses, books } = results;

    if (surahs.length === 0 && verses.length === 0 && books.length === 0) {
      this.resultsContainer.innerHTML = `
        <div class="p-4 text-center text-gray-500">
          <p>${strings.noResults || '??? ???????? ???????????'}</p>
        </div>
      `;
      this.resultsContainer.classList.remove('hidden');
      return;
    }

    let html = '';

    if (surahs.length > 0) {
      html += `
        <div class="p-2 bg-emerald-50 border-b sticky top-0">
          <span class="text-xs font-medium text-emerald-700">${strings.surah || '????'}</span>
        </div>
      `;
      surahs.slice(0, 5).forEach(surah => {
        html += `
          <a href="#/surah/${surah.id}"
             class="search-result block p-3 hover:bg-cream-50 border-b transition-colors"
             data-search-type="surah" data-surah-id="${surah.id}">
            <div class="flex items-center gap-3">
              <span class="w-8 h-8 bg-emerald-100 text-emerald-800 rounded-full
                          flex items-center justify-center text-sm font-bold">
                ${toKurdishNumber(surah.number)}
              </span>
              <div>
                <div class="font-medium text-gray-900">${surah.nameKurdish}</div>
                <div class="text-sm text-gray-500 font-quran">${surah.nameArabic}</div>
              </div>
            </div>
          </a>
        `;
      });
    }

    if (verses.length > 0) {
      html += `
        <div class="p-2 bg-emerald-50 border-b sticky top-0">
          <span class="text-xs font-medium text-emerald-700">${strings.verse || '?????'}</span>
        </div>
      `;
      verses.slice(0, 5).forEach(result => {
        html += `
          <a href="#/surah/${result.surahId}"
             class="search-result block p-3 hover:bg-cream-50 border-b transition-colors"
             data-search-type="verse" data-surah-id="${result.surahId}" data-verse-index="${result.verseIndex}">
            <div class="text-xs text-emerald-700 mb-1">
              ${result.surahNameKurdish || result.surahNameArabic} · ${strings.verse || '?????'} ${toKurdishNumber(result.verseNumber)}
            </div>
            <div class="text-sm text-gray-700">${result.snippet}</div>
          </a>
        `;
      });
    }

    if (books.length > 0) {
      html += `
        <div class="p-2 bg-purple-50 border-b sticky top-0">
          <span class="text-xs font-medium text-purple-700">${strings.reviews || '???????????'}</span>
        </div>
      `;
      books.slice(0, 3).forEach(book => {
        html += `
          <a href="#/tafsir-reviews"
             class="search-result block p-3 hover:bg-cream-50 border-b transition-colors"
             data-search-type="book" data-book-id="${book.id}">
            <div class="font-medium text-gray-900">${book.title}</div>
            <div class="text-sm text-gray-500">${book.author}</div>
            ${book.snippet ? `<div class="text-xs text-gray-500 mt-1">${book.snippet}</div>` : ''}
          </a>
        `;
      });
    }

    this.resultsContainer.innerHTML = html;
    this.resultsContainer.classList.remove('hidden');
    this.isOpen = true;

    this.resultsContainer.querySelectorAll('.search-result').forEach(result => {
      result.addEventListener('click', () => {
        const type = result.dataset.searchType;
        const surahId = result.dataset.surahId;
        const verseIndex = result.dataset.verseIndex;
        const bookId = result.dataset.bookId;
        const targetQuery = query;
        if (type === 'verse') {
          State.set('searchTarget', {
            type: 'verse',
            surahId: Number(surahId),
            verseIndex: Number(verseIndex),
            query: targetQuery
          });
        } else if (type === 'surah') {
          State.set('searchTarget', {
            type: 'surah',
            surahId: Number(surahId),
            query: targetQuery
          });
        } else if (type === 'book' && bookId) {
          const matchedBook = books.find(book => book.id === bookId);
          if (matchedBook) {
            State.set('searchTarget', {
              type: 'book',
              bookId,
              matchField: matchedBook.matchField,
              query: targetQuery
            });
          }
          State.set('tafsirScrollTo', bookId);
        }
        this._hideResults();
        this.inputElement.value = '';
        if (onSelect) onSelect();
      });
    });
  },

  /**
   * Hide search results
   */
  _hideResults() {
    if (this.resultsContainer) {
      this.resultsContainer.classList.add('hidden');
    }
    this.isOpen = false;
  },

  /**
   * Clear search input and results
   */
  clear() {
    if (this.inputElement) {
      this.inputElement.value = '';
    }
    this._hideResults();
  }
};

export default SearchBar;
