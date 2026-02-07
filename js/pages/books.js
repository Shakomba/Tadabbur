/**
 * Books Page Component (Coming Soon)
 */

import State from '../state.js';
import { icon } from '../utils/dom.js';

const BooksPage = {
  container: null,

  /**
   * Mount books page
   * @param {Element} container - Container element
   */
  mount(container) {
    this.container = container;
    this.render();
  },

  /**
   * Render books page HTML
   */
  render() {
    const appData = State.get('appData');
    const strings = appData?.uiStrings || {};
    const meta = appData?.meta || {};

    this.container.innerHTML = `
      <div class="min-h-screen bg-cream-50">
        <!-- Header -->
        <div class="bg-cream-50 text-white pt-6 pb-4 md:pt-8 md:pb-6">
          <div class="max-w-6xl mx-auto px-4">
            <h1 class="text-3xl md:text-4xl font-bold mb-4">
              کتێب
            </h1>
          </div>
        </div>

        <!-- Coming Soon Content -->
        <div class="max-w-4xl mx-auto px-4 pt-6 pb-12 md:pt-8 md:pb-16">
          <div class="text-center">
            <!-- Illustration -->
            <div class="relative w-48 h-48 mx-auto mb-8">
              <!-- Stacked Books Illustration -->
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="relative">
                  <!-- Book 3 (back) -->
                  <div class="absolute -top-4 -right-4 w-32 h-40 bg-emerald-700 rounded-lg shadow-lg transform rotate-6"></div>
                  <!-- Book 2 (middle) -->
                  <div class="absolute -top-2 -right-2 w-32 h-40 bg-emerald-800 rounded-lg shadow-lg transform rotate-3"></div>
                  <!-- Book 1 (front) -->
                  <div class="relative w-32 h-40 bg-cream-50 rounded-lg shadow-xl flex items-center justify-center">
                    ${icon('book', 'w-12 h-12 text-gold-400')}
                  </div>
                </div>
              </div>
            </div>

            <!-- Badge -->
            <div class="inline-flex items-center gap-2 text-emerald-700 text-xl md:text-2xl font-bold mb-8">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>${strings.comingSoon || 'بەم زووانە'}</span>
            </div>

            <!-- Description -->
            <p class="text-gray-600 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
              خەریکین کار لەسەر ئامادەکردنی کتێبەکانی تەفسیر و تەدەبور دەکەین.
              بەم زووانە بەردەست دەبێت.
            </p>

            <!-- CTA -->
            <div class="mt-12">
              <a href="#/audio-lessons"
                 class="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-emerald-900 bg-[#DDAC69] hover:bg-[#c99754] transition-colors">
                ${icon('headphones', 'w-5 h-5')}
                <span>گوێ لە وانەکان بگرە</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Unmount component
   */
  unmount() {
    this.container.innerHTML = '';
  }
};

export default BooksPage;
