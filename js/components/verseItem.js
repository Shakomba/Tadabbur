/**
 * Verse Item Component
 */

import { toKurdishNumber } from '../utils/formatters.js';

const VerseItem = {
  /**
   * Create a verse item element
   * @param {Object} verse - Verse object
   * @param {number} index - Verse index
   * @param {boolean} isHighlighted - Whether verse is highlighted
   * @returns {HTMLElement} Verse element
   */
  create(verse, index, isHighlighted = false) {
    const element = document.createElement('div');
    element.className = `verse-item p-5 md:p-7 rounded-xl cursor-pointer mb-4 last:mb-0 ${isHighlighted ? 'highlighted' : ''}`;
    element.dataset.verseIndex = index;
    element.id = `verse-${index}`;

    element.innerHTML = `
      <div class="flex items-start gap-4">
        <!-- Verse Number -->
        <div class="verse-number w-10 h-10 md:w-12 md:h-12 bg-emerald-100 text-emerald-800
                    rounded-full flex items-center justify-center font-bold text-lg
                    flex-shrink-0 transition-colors">
          ${toKurdishNumber(verse.number)}
        </div>

        <div class="flex-1 min-w-0">
          <!-- Arabic Text -->
          <p class="quran-text text-quran-lg md:text-quran-xl text-gray-900 mt-1 mb-6 leading-loose">
            ${verse.textUthmani || verse.textArabic}
          </p>

          <!-- Tafsir -->
          <p class="text-gray-600 text-base md:text-lg leading-relaxed tafsir-text">
            ${verse.tafsirKurdish}
          </p>
        </div>
      </div>
    `;

    return element;
  },

  /**
   * Create verse item HTML string
   * @param {Object} verse - Verse object
   * @param {number} index - Verse index
   * @param {boolean} isHighlighted - Whether verse is highlighted
   * @returns {string} HTML string
   */
  createHTML(verse, index, isHighlighted = false) {
    return `
      <div class="verse-item p-5 md:p-7 rounded-xl cursor-pointer mb-4 last:mb-0 ${isHighlighted ? 'highlighted' : ''}"
           data-verse-index="${index}"
           id="verse-${index}">
        <div class="flex items-start gap-4">
          <!-- Verse Number -->
          <div class="verse-number w-10 h-10 md:w-12 md:h-12 bg-emerald-100 text-emerald-800
                      rounded-full flex items-center justify-center font-bold text-lg
                      flex-shrink-0 transition-colors">
            ${toKurdishNumber(verse.number)}
          </div>

          <div class="flex-1 min-w-0">
            <!-- Arabic Text -->
            <p class="quran-text text-quran-lg md:text-quran-xl text-gray-900 mt-1 mb-6 leading-loose">
              ${verse.textUthmani || verse.textArabic}
            </p>

            <!-- Tafsir -->
            <p class="text-gray-600 text-base md:text-lg leading-relaxed tafsir-text">
              ${verse.tafsirKurdish}
            </p>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Highlight a verse element
   * @param {HTMLElement} element - Verse element
   */
  highlight(element) {
    if (!element) return;
    element.classList.add('highlighted');
  },

  /**
   * Remove highlight from a verse element
   * @param {HTMLElement} element - Verse element
   */
  unhighlight(element) {
    if (!element) return;
    element.classList.remove('highlighted');
  },

  /**
   * Toggle highlight on a verse element
   * @param {HTMLElement} element - Verse element
   * @param {boolean} force - Force highlight state
   */
  toggleHighlight(element, force) {
    if (!element) return;
    element.classList.toggle('highlighted', force);
  }
};

export default VerseItem;
