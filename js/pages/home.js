/**
 * Home Page Component
 */

import State from '../state.js';
import { icon } from '../utils/dom.js';
import { toKurdishNumber } from '../utils/formatters.js';
import BookCard from '../components/bookCard.js';

const HomePage = {
  container: null,
  hasRendered: false,

  mount(container) {
    this.container = container;

    // Only render if not already rendered or if container is empty
    if (!this.hasRendered || !this.container.innerHTML.trim()) {
      this.render();
      this._setupFeaturedBookLinks();
      this.hasRendered = true;
    }
  },

  render() {
    const appData = State.get('appData');
    const meta = appData?.meta || {};
    const teacher = appData?.teacher || {};
    const teacherImage = teacher?.image || '';
    const socialLinks = appData?.socialLinks || {};
    const strings = appData?.uiStrings || {};
    const tafsirBooks = appData?.tafsirBooks || [];

    const featuredIds = ['tafsir-002', 'tafsir-004', 'tafsir-005'];
    const featuredBooks = featuredIds
      .map(id => tafsirBooks.find(book => book.id === id))
      .filter(Boolean);

    // Lesson style uses simple bullet points

    this.container.innerHTML = `
      <!-- Hero Section -->
      <section class="hero-section min-h-[75vh] flex items-center justify-center relative overflow-hidden">
        <div class="relative z-10 text-center px-4 py-16 hero-content-fade">
          <!-- Logo with Glow -->
          <div class="mb-8 relative inline-block">
            <img src="assets/images/TadabburLogo.png" alt="${meta.appName}"
                 class="w-48 h-48 md:w-56 md:h-56 drop-shadow-[0_0_60px_rgba(212,175,55,0.15)]">
          </div>

          <!-- Title -->
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            ${meta.appName || 'تەدەبوری قورئان'}
          </h1>

          <!-- Tagline -->
          <p class="text-lg md:text-xl text-cream-200 max-w-2xl mx-auto mb-12 leading-relaxed">
            ${meta.tagline || ''}
          </p>

          <!-- Arrow pointing DOWN to button -->
          <div class="mb-4">
            <svg class="w-12 h-12 mx-auto text-gold-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
          </div>

          <!-- CTA Button -->
          <div class="mb-12">
            <a href="#/audio-lessons"
               class="inline-flex items-center gap-3 px-8 py-4 rounded-xl text-lg font-medium text-emerald-900 transition-all hover:-translate-y-1 shadow-lg" style="background-color: #DDAC69;" onmouseover="this.style.backgroundColor='#caa060'" onmouseout="this.style.backgroundColor='#DDAC69'">
              ${icon('headphones', 'w-6 h-6')}
              <span>${strings.toTheLessons || 'بۆ وانەکان'}</span>
            </a>
          </div>

          <!-- Social Links -->
          <div>
            <h2 class="text-lg font-medium text-emerald-200 mb-4">${strings.followUs || 'لەگەڵمان بە'}</h2>
            <div class="flex justify-center gap-4">
              <!-- Telegram -->
              <a href="${socialLinks.telegram || '#'}" target="_blank" rel="noopener noreferrer"
                 class="social-btn telegram flex items-center gap-3 px-6 py-3 rounded-xl text-white bg-blue-500 hover:bg-blue-600 transition-colors">
                <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <img src="assets/images/telegram.png" alt="Telegram" class="w-5 h-5" />
                </div>
                <span class="font-medium">تێلێگرام</span>
              </a>

              <!-- YouTube -->
              <a href="${socialLinks.youtube || '#'}" target="_blank" rel="noopener noreferrer"
                 class="social-btn youtube flex items-center gap-3 px-6 py-3 rounded-xl text-white bg-red-600 hover:bg-red-700 transition-colors">
                ${icon('youtube', 'w-6 h-6')}
                <span class="font-medium">یوتیوب</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Methodology Section -->
      <section class="py-16 md:py-24 bg-white">
        <div class="max-w-6xl mx-auto px-4">
          <div class="grid md:grid-cols-2 gap-12 justify-items-center">
            <!-- Methodology -->
            <div class="bg-emerald-50 rounded-2xl p-8 md:p-10 w-full max-w-md md:max-w-none">
              <div class="w-14 h-14 bg-emerald-900 rounded-xl flex items-center justify-center mb-6 mx-auto md:mx-0">
                ${icon('book', 'w-7 h-7 text-gold-400')}
              </div>
              <h2 class="text-2xl font-bold text-emerald-900 mb-4 text-center md:text-right">
                ${strings.methodology || 'مەنهەجمان'}
              </h2>
              <p class="text-gray-700 leading-relaxed text-lg">
                ${teacher.methodology || ''}
              </p>
            </div>

            <!-- Lesson Style with Icons -->
            <div class="bg-amber-50 rounded-2xl p-8 md:p-10 w-full max-w-md md:max-w-none">
              <div class="w-14 h-14 bg-gold-500 rounded-xl flex items-center justify-center mb-6 mx-auto md:mx-0">
                ${icon('star', 'w-7 h-7 text-emerald-900')}
              </div>
              <h2 class="text-2xl font-bold text-emerald-900 mb-4 text-center md:text-right">
                ${strings.lessonStyle || 'شێوازی وانەکان'}
              </h2>
              <ul class="space-y-4 text-gray-700">
                ${(teacher.lessonStyle || []).map(item => `
                  <li class="flex items-start gap-3">
                    <div class="w-2 h-2 bg-gold-500 rounded-full flex-shrink-0 mt-2.5"></div>
                    <span class="leading-relaxed">${item}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- Teacher Profile Card -->
      <section class="py-20 bg-white">
        <div class="max-w-4xl mx-auto px-4">
          <div class="text-center mb-12">
            <div class="inline-block">
              <h2 class="text-3xl md:text-4xl font-bold text-emerald-900 mb-3">
                دەربارەی مامۆستا
              </h2>
              <div class="h-1 bg-gold-400 rounded-full"></div>
            </div>
          </div>

          <div class="teacher-card bg-cream-50 rounded-3xl p-8 md:p-12 shadow-lg border border-cream-200">
            <div class="flex flex-col items-center text-center">
              <!-- Teacher Image -->
              <div class="mb-8">
                <div class="relative">
                  <!-- Circular frame with border -->
                  <div class="w-48 h-48 rounded-full bg-gold-500 p-1.5 shadow-xl">
                    <div class="w-full h-full rounded-full bg-cream-100 flex items-center justify-center overflow-hidden">
                      ${teacherImage ? `
                        <img src="${teacherImage}" alt="${teacher.name || ''}" class="w-full h-full object-cover rounded-full" loading="lazy">
                      ` : `
                        <div class="w-36 h-36 rounded-full bg-emerald-900/10 flex items-center justify-center">
                          ${icon('user', 'w-20 h-20 text-emerald-700')}
                        </div>
                      `}
                    </div>
                  </div>
                  <!-- Decorative ring -->
                  <div class="absolute -inset-2 rounded-full border-2 border-gold-400/20"></div>
                </div>
              </div>

              <!-- Teacher Info -->
              <h3 class="text-3xl md:text-4xl font-bold text-emerald-900 mb-4">
                ${teacher.name || ''}
              </h3>

              <p class="text-gray-600 text-lg leading-relaxed max-w-2xl">
                ${teacher.bio || ''}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Featured Tafsir Books Teaser -->
      <section class="py-20 bg-emerald-900">
        <div class="max-w-6xl mx-auto px-4">
          <div class="text-center mb-16">
            <div class="inline-block">
              <h2 class="text-3xl md:text-4xl font-bold text-white mb-3">
                ناساندنی تەفسیرەکان
              </h2>
              <div class="h-1 bg-gold-400 rounded-full"></div>
            </div>
          </div>

          <div class="grid md:grid-cols-3 gap-12 mb-12">
            ${featuredBooks.map((book, index) => {
              const coverImage = book.coverImage ? encodeURI(book.coverImage).replace(/'/g, '%27') : '';
              const heightClass = index === 1 ? 'h-72' : 'h-72';
              return `
                <a href="#/tafsir-reviews" class="group block featured-tafsir-card" data-featured-book="${book.id}">
                  <div class="relative">
                    <div class="${heightClass} rounded-xl overflow-hidden bg-emerald-950 shadow-xl transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-3 flex items-center justify-center p-6">
                      ${coverImage ? `<img src="${coverImage}" alt="${book.title}" class="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" loading="lazy">` : ''}
                    </div>

                    <div class="mt-5 text-center">
                      <h3 class="text-xl font-bold text-white mb-1 group-hover:text-gold-300 transition-colors">
                        ${book.title}
                      </h3>
                      <p class="text-emerald-200 text-sm">${book.author}</p>
                    </div>
                  </div>
                </a>
              `;
            }).join('')}
          </div>

          <div class="text-center">
            <a href="#/tafsir-reviews"
               class="inline-flex items-center gap-3 px-8 py-4 text-emerald-900 rounded-xl font-bold transition-all hover:-translate-y-1 shadow-xl text-lg" style="background-color: #d4a956;" onmouseover="this.style.backgroundColor='#c49a4b'" onmouseout="this.style.backgroundColor='#d4a956'">
              <span>بینینی زیاتر</span>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </a>
          </div>
        </div>
      </section>

    `;
  },

  unmount() {
    this.container.innerHTML = '';
  },

  _setupFeaturedBookLinks() {
    this.container.querySelectorAll('[data-featured-book]').forEach(link => {
      link.addEventListener('click', () => {
        const bookId = link.dataset.featuredBook;
        if (bookId) {
          State.set('tafsirScrollTo', bookId);
        }
      });
    });
  },

  /**
   * Darken a hex color for book spine
   * @param {string} color - Hex color
   * @returns {string} Darkened hex color
   */
  _darkenColor(color) {
    if (!color || !color.startsWith('#')) return '#333333';

    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 30);
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 30);
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 30);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  },

  /**
   * Unmount component
   */
  unmount() {
    // Don't reset hasRendered - keep the content for when we return
    // this.container.innerHTML = '';
  }
};

export default HomePage;
