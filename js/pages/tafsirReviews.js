/**
 * Tafsir Reviews Page - Simple grid with modal details
 */

import State from '../state.js';
import { icon } from '../utils/dom.js';

const TafsirReviewsPage = {
  container: null,
  activeBook: null,
  keydownHandler: null,
  scrollUnsub: null,
  searchUnsub: null,
  hasRendered: false,

  /**
   * Mount tafsir reviews page
   * @param {Element} container - Container element
   */
  mount(container) {
    this.container = container;
    this.activeBook = null;

    // Only render if not already rendered
    if (!this.hasRendered || !this.container.innerHTML.trim()) {
      this.render();
      this._setupEventListeners();
      this.hasRendered = true;
    }

    this._focusTargetBook();
    this._focusSearchTarget();

    this.scrollUnsub = State.subscribe('tafsirScrollTo', () => this._focusTargetBook());
    this.searchUnsub = State.subscribe('searchTarget', () => this._focusSearchTarget());

    this.keydownHandler = (event) => {
      if (event.key === 'Escape' && this.activeBook) {
        this._closeModal();
      }
    };

    document.addEventListener('keydown', this.keydownHandler);
  },

  /**
   * Render tafsir reviews page HTML
   */
  render() {
    const appData = State.get('appData');
    const strings = appData?.uiStrings || {};
    const books = appData?.tafsirBooks || [];
    const hasModal = Boolean(this.activeBook);

    document.body.classList.toggle('modal-open', hasModal);

    const title = strings.tafsirReviewsTitle || 'ناساندنی تەفسیرەکان';
    const subtitle = strings.tafsirReviewsSubtitle || 'کورتەیەک لەسەر کتێبە تەفسیرەکان بۆ هەڵبژاردنی باشترین سەرچاوە';

    this.container.innerHTML = `
      <div class="tafsir-library min-h-screen">
        <div class="tafsir-hero">
          <div class="max-w-6xl mx-auto px-4 py-10 md:py-14">
            <div class="tafsir-hero-inner">
              <h1 class="tafsir-hero-title">${title}</h1>
              <p class="tafsir-hero-subtitle">
                ${subtitle}
              </p>
            </div>
          </div>
        </div>

        <div class="max-w-6xl mx-auto px-4 pb-16">
          ${books.length > 0 ? `
            <div class="tafsir-grid-simple" id="books-grid">
              ${books.map((book, index) => this._renderBookCard(book, index)).join('')}
            </div>
          ` : `
            <div class="text-center py-16 text-gray-500">
              <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                ${icon('book', 'w-8 h-8 text-gray-400')}
              </div>
              <p class="text-lg">${strings.noBooksFound || '??? ?????? ???????????'}</p>
            </div>
          `}
        </div>

        ${this._renderModal()}
      </div>
    `;
  },

  /**
   * Render a book card
   * @param {Object} book - Book object
   * @param {number} index - Book index
   * @returns {string} HTML string
   */
  _renderBookCard(book, index) {
    const coverImage = book.coverImage || '';
    const coverMarkup = coverImage
      ? `<img class="tafsir-cover-image" src="${coverImage}" alt="${book.title}" loading="lazy">`
      : '';
    return `
      <button class="tafsir-card" data-book-id="${book.id}" type="button"
              style="--delay:${index * 70}ms;"
              aria-label="کتێبی تەفسیر ${book.title}">
        <div class="tafsir-cover">
          ${coverMarkup}
          <div class="tafsir-cover-shine"></div>
          <div class="tafsir-cover-mark"></div>
        </div>
        <div class="tafsir-meta">
          <h3 class="tafsir-book-title">${book.title}</h3>
          <p class="tafsir-book-author">${book.author}</p>
        </div>
      </button>
    `;
  },

  _renderModal() {
    const book = this.activeBook;
    const title = book?.title || '';
    const author = book?.author || '';
    const description = book?.description || '';
    const coverImage = book?.coverImage || '';
    const formattedDescription = description
      .replace(/\r\n/g, '\n')
      .replace(/\s*🔸/g, '\n\n🔸')
      .replace(/\s*▫️/g, '\n▫️');
    const coverMarkup = coverImage
      ? `<img class="tafsir-cover-image" src="${coverImage}" alt="${title}" loading="lazy">`
      : '';
    const isOpen = Boolean(book);

    return `
      <div class="tafsir-modal ${isOpen ? 'open' : ''}" aria-hidden="${!isOpen}">
        <div class="tafsir-modal-overlay" data-modal-close></div>
        <div class="tafsir-modal-card" role="dialog" aria-modal="true" aria-labelledby="tafsir-modal-title">
          <button class="tafsir-modal-close" type="button" data-modal-close aria-label="Close">
            ${icon('close', 'w-5 h-5')}
          </button>
          <div class="tafsir-modal-body">
            <div class="tafsir-modal-content">
              <div class="tafsir-modal-cover">
                ${coverMarkup}
              </div>
              <h3 id="tafsir-modal-title" class="tafsir-modal-title">${title}</h3>
              <p class="tafsir-modal-author">${author}</p>
              <div class="tafsir-modal-divider"></div>
              <p class="tafsir-modal-description">${formattedDescription}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Set up event listeners
   */
  _setupEventListeners() {
    // Book card clicks
    this.container.querySelectorAll('.tafsir-card').forEach(card => {
      card.addEventListener('click', () => {
        const bookId = card.dataset.bookId;
        const book = State.get('appData')?.tafsirBooks?.find(b => b.id === bookId);
        if (book) {
          this._openModal(book);
        }
      });
    });

    this.container.querySelectorAll('[data-modal-close]').forEach(el => {
      el.addEventListener('click', () => {
        this._closeModal();
      });
    });
  },

  /**
   * Open modal with book details
   * @param {Object} book - Book object
   */
  _openModal(book) {
    this.activeBook = book;
    document.body.classList.add('modal-open');

    const modalElement = this.container.querySelector('.tafsir-modal');
    if (modalElement) {
      // Update modal content
      const title = book?.title || '';
      const author = book?.author || '';
      const description = book?.description || '';
      const coverImage = book?.coverImage || '';
      const formattedDescription = description
        .replace(/\r\n/g, '\n')
        .replace(/\s*🔸/g, '\n\n🔸')
        .replace(/\s*▫️/g, '\n▫️');
      const coverMarkup = coverImage
        ? `<img class="tafsir-cover-image" src="${coverImage}" alt="${title}" loading="lazy">`
        : '';

      modalElement.classList.add('open');
      modalElement.setAttribute('aria-hidden', 'false');

      const modalContent = modalElement.querySelector('.tafsir-modal-content');
      if (modalContent) {
        modalContent.innerHTML = `
          <div class="tafsir-modal-cover">
            ${coverMarkup}
          </div>
          <h3 id="tafsir-modal-title" class="tafsir-modal-title">${title}</h3>
          <p class="tafsir-modal-author">${author}</p>
          <div class="tafsir-modal-divider"></div>
          <p class="tafsir-modal-description">${formattedDescription}</p>
        `;
      }

      // Re-attach close event listeners
      modalElement.querySelectorAll('[data-modal-close]').forEach(el => {
        el.addEventListener('click', () => this._closeModal());
      });
    }
  },

  _openModalWithHighlight(book, highlight) {
    this.activeBook = book;
    document.body.classList.add('modal-open');

    const modalElement = this.container.querySelector('.tafsir-modal');
    if (!modalElement) return;

    const title = book?.title || '';
    const author = book?.author || '';
    const description = book?.description || '';
    const coverImage = book?.coverImage || '';
    const formattedDescription = description
      .replace(/\r\n/g, '\n')
      .replace(/\s*🔸/g, '\n\n🔸')
      .replace(/\s*▫️/g, '\n▫️');
    const coverMarkup = coverImage
      ? `<img class="tafsir-cover-image" src="${coverImage}" alt="${title}" loading="lazy">`
      : '';

    const highlightedTitle = this._highlightMatch(title, highlight?.query, highlight?.matchField === 'title');
    const highlightedAuthor = this._highlightMatch(author, highlight?.query, highlight?.matchField === 'author');
    const highlightedDescription = this._highlightMatch(
      formattedDescription,
      highlight?.query,
      highlight?.matchField === 'description'
    );

    modalElement.classList.add('open');
    modalElement.setAttribute('aria-hidden', 'false');

    const modalContent = modalElement.querySelector('.tafsir-modal-content');
    if (modalContent) {
      modalContent.innerHTML = `
        <div class="tafsir-modal-cover">
          ${coverMarkup}
        </div>
        <h3 id="tafsir-modal-title" class="tafsir-modal-title">${highlightedTitle}</h3>
        <p class="tafsir-modal-author">${highlightedAuthor}</p>
        <div class="tafsir-modal-divider"></div>
        <p class="tafsir-modal-description">${highlightedDescription}</p>
      `;
    }

    modalElement.querySelectorAll('[data-modal-close]').forEach(el => {
      el.addEventListener('click', () => this._closeModal());
    });

    requestAnimationFrame(() => {
      const highlightElement = modalElement.querySelector('.search-highlight-text');
      if (highlightElement) {
        highlightElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    window.setTimeout(() => {
      modalElement.querySelectorAll('.search-highlight-text').forEach(el => {
        el.classList.remove('search-highlight-text');
      });
    }, 1800);
  },

  _highlightMatch(text, query, shouldHighlight) {
    if (!text || !query || !shouldHighlight) return text || '';
    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = text.match(new RegExp(safeQuery, 'i'));
    if (!match) return text;
    const target = match[0];
    return text.replace(new RegExp(safeQuery, 'i'), `<span class="search-highlight-text">${target}</span>`);
  },

  /**
   * Close modal
   */
  _closeModal() {
    this.activeBook = null;
    document.body.classList.remove('modal-open');

    const modalElement = this.container.querySelector('.tafsir-modal');
    if (modalElement) {
      modalElement.classList.remove('open');
      modalElement.setAttribute('aria-hidden', 'true');
    }
  },

  _focusTargetBook() {
    const targetId = State.get('tafsirScrollTo');
    if (!targetId) return;
    const card = this.container.querySelector(`[data-book-id="${targetId}"]`);
    if (!card) return;
    requestAnimationFrame(() => {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('tafsir-card-highlight');
      window.setTimeout(() => {
        card.classList.remove('tafsir-card-highlight');
      }, 1200);
    });
    State.set('tafsirScrollTo', null);
  },

  _focusSearchTarget() {
    const target = State.get('searchTarget');
    if (!target || target.type !== 'book') return;

    const targetId = target.bookId;
    const card = this.container.querySelector(`[data-book-id="${targetId}"]`);
    const book = State.get('appData')?.tafsirBooks?.find(item => item.id === targetId);

    if (card) {
      requestAnimationFrame(() => {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('tafsir-card-highlight');
        window.setTimeout(() => {
          card.classList.remove('tafsir-card-highlight');
        }, 1800);
      });
    }

    if (book && target.query) {
      this._openModalWithHighlight(book, target);
    }

    State.set('searchTarget', null);
  },

  /**
   * Unmount component
   */
  unmount() {
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
    if (this.scrollUnsub) {
      this.scrollUnsub();
      this.scrollUnsub = null;
    }
    if (this.searchUnsub) {
      this.searchUnsub();
      this.searchUnsub = null;
    }
    document.body.classList.remove('modal-open');
    this.container.innerHTML = '';
  }
};

export default TafsirReviewsPage;
