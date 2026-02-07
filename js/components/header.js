/**
 * Header Component with Navigation and Search
 */

import State from '../state.js';
import Router from '../router.js';
import { icon, $ } from '../utils/dom.js';
import { debounce, toKurdishNumber } from '../utils/formatters.js';

const Header = {
  container: null,
  searchInput: null,
  mobileMenuOpen: false,
  swipeStartX: 0,
  swipeStartY: 0,
  swipeCurrentX: 0,

  /**
   * Mount header component
   * @param {Element} container - Container element
   */
  mount(container) {
    this.container = container;
    this.render();
    this._setupEventListeners();
    this._toggleMobileMenu(false);

    // Subscribe to route changes to update active tab
    State.subscribe('currentRoute', () => this._updateActiveTab());
  },

  /**
   * Render header HTML
   */
  render() {
    const appData = State.get('appData');
    const navigation = appData?.navigation || [];
    const strings = appData?.uiStrings || {};

    this.container.innerHTML = `
      <nav class="bg-emerald-900 text-white shadow-lg">
        <div class="max-w-7xl mx-auto px-4">
          <div class="flex items-center justify-between h-16 flex-row-reverse md:flex-row">
            <!-- Logo (left on mobile, left on desktop) -->
            <a href="#/" class="flex items-center gap-3 flex-shrink-0 order-1">
              <img src="assets/images/TadabburLogo.png" alt="تەدەبوری قورئان" class="h-12 w-12">
              <span class="font-bold text-lg hidden sm:block">${appData?.meta?.appName || 'تەدەبوری قورئان'}</span>
            </a>

            <!-- Mobile Search (centered) -->
            <div class="flex md:hidden items-center order-2 flex-1 justify-center px-4">
              <div class="relative w-full max-w-xs">
                <input type="text"
                       id="search-input-mobile-nav"
                       placeholder="${strings.searchPlaceholder || 'گەڕان...'}"
                       class="search-input bg-emerald-800 text-white placeholder-emerald-300
                              border border-emerald-700 rounded-lg px-4 py-2 pr-10 w-full
                              focus:border-gold-400 transition-colors">
                <div class="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none">
                  ${icon('search', 'w-4 h-4')}
                </div>
                <div id="search-results-mobile" class="absolute top-full right-0 left-0 mt-2 bg-white rounded-lg shadow-xl
                            text-gray-900 max-h-80 overflow-y-auto hidden z-50">
                </div>
              </div>
            </div>

            <!-- Desktop Navigation -->
            <div class="hidden md:flex items-center gap-1 nav-desktop order-2">
              ${navigation.map(item => `
                <a href="#${item.route}"
                   class="nav-tab px-4 py-2 rounded-lg text-sm font-medium transition-colors
                          ${item.comingSoon ? 'opacity-75' : ''}"
                   data-route="${item.route}">
                  ${item.label}
                  ${item.comingSoon ? '<span class="mr-1 text-xs text-gold-400">(بەم زووانە)</span>' : ''}
                </a>
              `).join('')}
            </div>

            <!-- Search Bar (Desktop) -->
            <div class="hidden md:flex items-center gap-4 order-3">
              <div class="relative">
                <input type="text"
                       id="search-input-desktop"
                       placeholder="${strings.searchPlaceholder || 'گەڕان...'}"
                       class="search-input bg-emerald-800 text-white placeholder-emerald-300
                              border border-emerald-700 rounded-lg px-4 py-2 pr-10 w-64
                              focus:border-gold-400 transition-colors">
                <div class="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none">
                  ${icon('search', 'w-4 h-4')}
                </div>
                <!-- Search Results Dropdown -->
                <div id="search-results-desktop" class="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl
                            text-gray-900 max-h-96 overflow-y-auto hidden z-50">
                </div>
              </div>
            </div>

            <!-- Mobile Menu Button -->
            <button id="mobile-menu-btn" class="md:hidden p-2 rounded-lg hover:bg-emerald-800 transition-colors order-3">
              ${icon('menu', 'w-6 h-6')}
            </button>
          </div>
        </div>

        <!-- Mobile Menu -->
        <div id="mobile-menu" class="mobile-menu fixed inset-y-0 right-0 left-auto w-72 bg-emerald-900 shadow-2xl z-50 md:hidden">
          <div class="p-4">
            <div class="flex items-center justify-between mb-6">
              <span class="font-bold text-lg">${appData?.meta?.appName || 'تەدەبوری قورئان'}</span>
              <button id="mobile-menu-close" class="p-2 rounded-lg hover:bg-emerald-800">
                ${icon('close', 'w-5 h-5')}
              </button>
            </div>

            <!-- Mobile Navigation -->
            <nav class="space-y-2">
              ${navigation.map(item => `
                <a href="#${item.route}"
                   class="nav-tab-mobile flex items-center gap-3 px-4 py-3 rounded-lg
                          hover:bg-emerald-800 transition-colors
                          ${item.comingSoon ? 'opacity-75' : ''}"
                   data-route="${item.route}">
                  <span>${icon(item.icon, 'w-5 h-5')}</span>
                  <span>${item.label}</span>
                  ${item.comingSoon ? '<span class="text-xs text-gold-400">(بەم زووانە)</span>' : ''}
                </a>
              `).join('')}
            </nav>
          </div>
        </div>

        <!-- Mobile Menu Overlay -->
        <div id="mobile-menu-overlay" class="mobile-menu-overlay fixed inset-0 bg-black/50 z-40 md:hidden"></div>
      </nav>
    `;

    this._updateActiveTab();
  },

  /**
   * Set up event listeners
   */
  _setupEventListeners() {
    // Mobile menu toggle
    const menuBtn = $('#mobile-menu-btn', this.container);
    const menuClose = $('#mobile-menu-close', this.container);
    const menuOverlay = $('#mobile-menu-overlay', this.container);
    const mobileMenu = $('#mobile-menu', this.container);

    if (menuBtn) {
      menuBtn.addEventListener('click', () => this._toggleMobileMenu(true));
    }
    if (menuClose) {
      menuClose.addEventListener('click', () => this._toggleMobileMenu(false));
    }
    if (menuOverlay) {
      menuOverlay.addEventListener('click', () => this._toggleMobileMenu(false));
    }

    // Close mobile menu on navigation
    const mobileLinks = this.container.querySelectorAll('.nav-tab-mobile');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => this._toggleMobileMenu(false));
    });

    // Add swipe-to-close gesture
    if (mobileMenu) {
      this._setupSwipeGesture(mobileMenu);
    }

    // Search functionality
    const searchDesktop = $('#search-input-desktop', this.container);
    const searchMobileNav = $('#search-input-mobile-nav', this.container);

    const handleSearch = debounce((query, containerId) => {
      State.set('searchQuery', query);
      const results = State.search(query);
      this._showSearchResults(results, query, containerId);
    }, 300);

    if (searchDesktop) {
      searchDesktop.addEventListener('input', (e) => handleSearch(e.target.value, 'search-results-desktop'));
      searchDesktop.addEventListener('focus', () => {
        const query = searchDesktop.value;
        if (query.length >= 2) {
          const results = State.search(query);
          this._showSearchResults(results, query, 'search-results-desktop');
        }
      });
    }

    if (searchMobileNav) {
      searchMobileNav.addEventListener('input', (e) => handleSearch(e.target.value, 'search-results-mobile'));
      searchMobileNav.addEventListener('focus', () => {
        const query = searchMobileNav.value;
        if (query.length >= 2) {
          const results = State.search(query);
          this._showSearchResults(results, query, 'search-results-mobile');
        }
      });
    }

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
      const searchResults = $('#search-results-desktop', this.container);
      const searchInput = $('#search-input-desktop', this.container);
      const mobileResults = $('#search-results-mobile', this.container);
      const mobileInput = $('#search-input-mobile-nav', this.container);
      if (searchResults && !searchResults.contains(e.target) && e.target !== searchInput) {
        searchResults.classList.add('hidden');
      }
      if (mobileResults && !mobileResults.contains(e.target) && e.target !== mobileInput) {
        mobileResults.classList.add('hidden');
      }
    });
  },

  /**
   * Toggle mobile menu
   * @param {boolean} open - Whether to open or close
   */
  _toggleMobileMenu(open) {
    const mobileMenu = $('#mobile-menu', this.container);
    const menuOverlay = $('#mobile-menu-overlay', this.container);

    if (open) {
      mobileMenu.classList.add('open');
      menuOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    } else {
      mobileMenu.classList.remove('open');
      menuOverlay.classList.remove('open');
      document.body.style.overflow = '';
      // Reset any transform from swipe
      if (mobileMenu) {
        mobileMenu.style.transform = '';
      }
    }

    this.mobileMenuOpen = open;
    State.set('mobileMenuOpen', open);
  },

  /**
   * Setup swipe gesture for mobile menu
   * @param {HTMLElement} menu - Mobile menu element
   */
  _setupSwipeGesture(menu) {
    const handleTouchStart = (e) => {
      if (!this.mobileMenuOpen) return;
      this.swipeStartX = e.touches[0].clientX;
      this.swipeStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      if (!this.mobileMenuOpen) return;
      this.swipeCurrentX = e.touches[0].clientX;
      const swipeCurrentY = e.touches[0].clientY;

      const deltaX = this.swipeCurrentX - this.swipeStartX;
      const deltaY = Math.abs(swipeCurrentY - this.swipeStartY);

      // Only handle horizontal swipe (left to right)
      if (deltaX > 0 && deltaY < 50) {
        e.preventDefault();
        // Apply transform during swipe
        menu.style.transform = `translateX(${deltaX}px)`;
      }
    };

    const handleTouchEnd = () => {
      if (!this.mobileMenuOpen) return;

      const deltaX = this.swipeCurrentX - this.swipeStartX;

      // If swiped more than 100px to the right, close menu
      if (deltaX > 100) {
        this._toggleMobileMenu(false);
      } else {
        // Reset transform if swipe was insufficient
        menu.style.transform = '';
      }

      this.swipeStartX = 0;
      this.swipeStartY = 0;
      this.swipeCurrentX = 0;
    };

    menu.addEventListener('touchstart', handleTouchStart, { passive: false });
    menu.addEventListener('touchmove', handleTouchMove, { passive: false });
    menu.addEventListener('touchend', handleTouchEnd);
  },

  /**
   * Update active tab indicator
   */
  _updateActiveTab() {
    const currentPath = Router.getCurrentPath();
    const tabs = this.container.querySelectorAll('[data-route]');

    tabs.forEach(tab => {
      const route = tab.dataset.route;
      const isActive = route === '/'
        ? currentPath === '/'
        : currentPath.startsWith(route);

      tab.classList.toggle('active', isActive);
    });
  },

  /**
   * Show search results dropdown
   * @param {Object} results - Search results
   * @param {string} query - Search query
   */
  _showSearchResults(results, query, containerId = 'search-results-desktop') {
    const container = $(`#${containerId}`, this.container);
    if (!container) return;

    const strings = State.get('appData')?.uiStrings || {};

    if (!query || query.length < 2) {
      container.classList.add('hidden');
      return;
    }

    const { surahs, verses, books } = results;

    if (surahs.length === 0 && verses.length === 0 && books.length === 0) {
      container.innerHTML = `
        <div class="p-4 text-center text-gray-500">
          ${strings.noResults || '??? ???????? ???????????'}
        </div>
      `;
      container.classList.remove('hidden');
      return;
    }

    let html = '';

    if (surahs.length > 0) {
      html += `
        <div class="p-3 bg-emerald-50 border-b">
          <span class="text-sm font-medium text-emerald-800">${strings.surah || '????'}</span>
        </div>
      `;
      surahs.slice(0, 5).forEach(surah => {
        html += `
          <a href="#/surah/${surah.id}" class="search-result block p-3 hover:bg-gray-50 border-b"
             data-search-type="surah" data-surah-id="${surah.id}">
            <div class="flex items-center gap-3">
              <span class="w-8 h-8 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-sm font-medium">
                ${toKurdishNumber(surah.number)}
              </span>
              <div>
                <div class="font-medium">${surah.nameKurdish}</div>
                <div class="text-sm text-gray-500">${surah.nameArabic}</div>
              </div>
            </div>
          </a>
        `;
      });
    }

    if (verses.length > 0) {
      html += `
        <div class="p-3 bg-emerald-50 border-b">
          <span class="text-sm font-medium text-emerald-800">${strings.verse || '?????'}</span>
        </div>
      `;
      verses.slice(0, 5).forEach(result => {
        html += `
          <a href="#/surah/${result.surahId}" class="search-result block p-3 hover:bg-gray-50 border-b"
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
        <div class="p-3 bg-purple-50 border-b">
          <span class="text-sm font-medium text-purple-800">${strings.reviews || '???????????'}</span>
        </div>
      `;
      books.slice(0, 3).forEach(book => {
        html += `
          <a href="#/tafsir-reviews" class="search-result block p-3 hover:bg-gray-50 border-b"
             data-search-type="book" data-book-id="${book.id}">
            <div class="font-medium">${book.title}</div>
            <div class="text-sm text-gray-500">${book.author}</div>
            ${book.snippet ? `<div class="text-xs text-gray-500 mt-1">${book.snippet}</div>` : ''}
          </a>
        `;
      });
    }

    container.innerHTML = html;
    container.classList.remove('hidden');

    container.querySelectorAll('.search-result').forEach(result => {
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
        container.classList.add('hidden');
      });
    });
  },

  /**
   * Unmount component
   */
  unmount() {
    this.container.innerHTML = '';
  }
};

export default Header;
