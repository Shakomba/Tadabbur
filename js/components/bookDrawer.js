/**
 * Book Detail Drawer Component
 * Side drawer for "Focus Mode" reading of full book descriptions
 */
import State from '../state.js';
import { icon } from '../utils/dom.js';
import { toKurdishNumber } from '../utils/formatters.js';

const BookDrawer = {
  container: null,
  currentBook: null,
  isOpen: false,
  overlay: null,
  drawer: null,
  boundKeyHandler: null,

  /**
   * Mount the drawer component
   * @param {Element} container - Container to append drawer to (usually document.body)
   */
  mount(container) {
    this.container = container;
    this._createElements();
    this._setupEventListeners();
  },

  /**
   * Create the drawer DOM elements
   */
  _createElements() {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'book-drawer-overlay';
    this.container.appendChild(this.overlay);

    // Create drawer
    this.drawer = document.createElement('div');
    this.drawer.className = 'book-drawer';
    this.drawer.setAttribute('role', 'dialog');
    this.drawer.setAttribute('aria-modal', 'true');
    this.drawer.setAttribute('aria-hidden', 'true');
    this.drawer.setAttribute('dir', 'rtl');
    this.container.appendChild(this.drawer);
  },

  /**
   * Set up event listeners
   */
  _setupEventListeners() {
    // Close on overlay click
    this.overlay.addEventListener('click', () => this.close());

    // Close on Escape key
    this.boundKeyHandler = (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    };
    document.addEventListener('keydown', this.boundKeyHandler);
  },

  /**
   * Open the drawer with a book
   * @param {Object} book - Book object to display
   */
  open(book) {
    this.currentBook = book;
    this.isOpen = true;
    this._render();

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Animate in on next frame
    requestAnimationFrame(() => {
      this.overlay.classList.add('open');
      this.drawer.classList.add('open');
      this.drawer.setAttribute('aria-hidden', 'false');
    });
  },

  /**
   * Close the drawer
   */
  close() {
    this.isOpen = false;
    document.body.style.overflow = '';
    this.overlay.classList.remove('open');
    this.drawer.classList.remove('open');
    this.drawer.setAttribute('aria-hidden', 'true');
  },

  /**
   * Render the drawer content
   */
  _render() {
    const strings = State.get('appData')?.uiStrings || {};
    const book = this.currentBook;
    if (!book) return;

    // Generate star rating
    const stars = Array.from({ length: 5 }, (_, i) =>
      i < book.rating
        ? `<svg class="w-5 h-5 text-gold-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>`
        : `<svg class="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>`
    ).join('');

    // Format description paragraphs
    const descriptionHtml = (book.fullDescription || book.description)
      .split('\n\n')
      .map(p => `<p class="mb-4 last:mb-0">${p}</p>`)
      .join('');

    this.drawer.innerHTML = `
      <div class="drawer-content p-6 md:p-8">
        <!-- Close Button -->
        <button class="close-drawer w-10 h-10 bg-emerald-100 hover:bg-emerald-200
                       rounded-full flex items-center justify-center mb-6 transition-colors"
                aria-label="${strings.closeDrawer || 'داخستن'}"
                type="button">
          ${icon('close', 'w-5 h-5 text-emerald-800')}
        </button>

        <!-- 3D Book Cover (large) -->
        <div class="book-card mx-auto mb-8" style="width: 160px;">
          <div class="book-cover w-40 h-56 rounded-lg overflow-hidden relative shadow-xl"
               style="background-color: ${book.coverColor}">
            <!-- Book spine -->
            <div class="book-spine" style="background-color: ${this._darkenColor(book.coverColor)}"></div>
            <!-- Book edge -->
            <div class="book-edge"></div>
            <!-- Book front -->
            <div class="absolute inset-0 flex flex-col items-center justify-center p-4 text-white text-center">
              <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
                ${icon('book', 'w-6 h-6')}
              </div>
              <h4 class="text-sm font-bold leading-tight">${book.title}</h4>
            </div>
          </div>
        </div>

        <!-- Book Title & Author -->
        <h2 class="text-2xl font-bold text-gray-900 mb-2 text-center">${book.title}</h2>
        <p class="text-emerald-700 font-medium text-center mb-4">${book.author}</p>

        <!-- Rating -->
        <div class="flex items-center justify-center gap-1 mb-6">${stars}</div>

        <!-- Meta Tags -->
        <div class="flex flex-wrap justify-center gap-3 mb-8 text-sm">
          ${book.volumes ? `
            <span class="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              ${toKurdishNumber(book.volumes)} ${strings.volumes || 'بەرگ'}
            </span>
          ` : ''}
          <span class="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg">
            ${toKurdishNumber(book.pageCount)} ${strings.pages || 'پەڕە'}
          </span>
          <span class="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
            ${book.language}
          </span>
          ${book.publishYear ? `
            <span class="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg">
              ${book.publishYear}
            </span>
          ` : ''}
        </div>

        <!-- Highlights -->
        ${book.highlights?.length ? `
          <div class="mb-8">
            <h3 class="font-bold text-lg text-emerald-900 mb-4">${strings.highlights || 'تایبەتمەندییەکان'}</h3>
            <ul class="space-y-3">
              ${book.highlights.map(h => `
                <li class="flex items-start gap-3 text-gray-700">
                  <span class="w-2 h-2 bg-gold-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span class="leading-relaxed">${h}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}

        <!-- Full Description -->
        <div class="mb-8">
          <h3 class="font-bold text-lg text-emerald-900 mb-4">${strings.description || 'پێداچوونەوە'}</h3>
          <div class="prose text-gray-700 leading-relaxed" style="line-height: 2;">
            ${descriptionHtml}
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col gap-3 pb-4">
          ${book.telegramPostUrl ? `
            <a href="${book.telegramPostUrl}" target="_blank" rel="noopener noreferrer"
               class="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-600
                      text-white rounded-xl transition-colors font-medium">
              ${icon('telegram', 'w-5 h-5')}
              <span>${strings.viewOnTelegram || 'بینین لە تێلەگرام'}</span>
            </a>
          ` : ''}
        </div>
      </div>
    `;

    // Attach close handler to button
    const closeBtn = this.drawer.querySelector('.close-drawer');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
  },

  /**
   * Darken a hex color for book spine
   * @param {string} color - Hex color
   * @returns {string} Darkened hex color
   */
  _darkenColor(color) {
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 30);
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 30);
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 30);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  },

  /**
   * Unmount the drawer component
   */
  unmount() {
    this.close();

    // Remove event listener
    if (this.boundKeyHandler) {
      document.removeEventListener('keydown', this.boundKeyHandler);
      this.boundKeyHandler = null;
    }

    // Remove DOM elements
    this.overlay?.remove();
    this.drawer?.remove();
    this.overlay = null;
    this.drawer = null;
    this.container = null;
    this.currentBook = null;
  }
};

export default BookDrawer;
