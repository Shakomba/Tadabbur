/**
 * Audio Lessons Page Component
 */

import State from '../state.js';
import { icon } from '../utils/dom.js';
import { toKurdishNumber, formatDuration } from '../utils/formatters.js';

const AudioLessonsPage = {
  container: null,

  /**
   * Mount audio lessons page
   * @param {Element} container - Container element
   */
  mount(container) {
    this.container = container;
    this.render();
  },

  /**
   * Render audio lessons page HTML
   */
  render() {
    const appData = State.get('appData');
    const strings = appData?.uiStrings || {};
    const surahs = appData?.surahs || [];

    // Separate surahs with and without lessons
    const withLessons = surahs.filter(s => s.hasLessons && s.verses.length > 0);
    const withoutLessons = surahs.filter(s => !s.hasLessons || s.verses.length === 0);

    this.container.innerHTML = `
      <div class="min-h-screen bg-cream-50">
        <div class="max-w-6xl mx-auto px-4 py-8 md:py-12 ">
          <div class="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full bg-emerald-50 text-emerald-800 font-medium">
            جوزئی ٣٠ (عم)
          </div>
          <!-- Available Lessons -->
          ${withLessons.length > 0 ? `
          <section class="mb-12">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                ${icon('headphones', 'w-5 h-5 text-emerald-700')}
              </div>
              <h2 class="text-xl font-bold text-emerald-900">
                ${strings.availableLessons || 'وانەی بەردەستە'}
                <span class="text-emerald-600 font-normal text-base mr-2">
                  (${toKurdishNumber(withLessons.length)})
                </span>
              </h2>
            </div>

            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              ${withLessons.map(surah => this._renderSurahCard(surah, true)).join('')}
            </div>
          </section>
          ` : ''}

          <!-- Coming Soon -->
          ${withoutLessons.length > 0 ? `
          <section>
            <div class="flex items-center gap-3 mb-6">
              <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                ${icon('book', 'w-5 h-5 text-gray-500')}
              </div>
              <h2 class="text-xl font-bold text-gray-600">
                ${strings.comingSoon || 'بەم زووانە'}
                <span class="font-normal text-base mr-2">
                  (${toKurdishNumber(withoutLessons.length)})
                </span>
              </h2>
            </div>

            <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              ${withoutLessons.map(surah => this._renderSurahCard(surah, false)).join('')}
            </div>
          </section>
          ` : ''}
        </div>
      </div>
    `;
  },

  /**
   * Render a surah card
   * @param {Object} surah - Surah object
   * @param {boolean} hasLessons - Whether surah has lessons
   * @returns {string} HTML string
   */
  _renderSurahCard(surah, hasLessons) {
    const strings = State.get('appData')?.uiStrings || {};

    if (hasLessons) {
      return `
        <a href="#/surah/${surah.id}"
           class="surah-card bg-white rounded-xl p-6 shadow-sm border border-cream-200 block group">
          <div class="flex items-start gap-4">
            <!-- Surah Number -->
            <div class="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl
                        flex items-center justify-center flex-shrink-0 shadow-lg
                        group-hover:scale-105 transition-transform">
              <span class="text-xl font-bold text-white">${toKurdishNumber(surah.number)}</span>
            </div>

            <div class="flex-1 min-w-0">
              <!-- Names -->
              <h3 class="font-bold text-lg text-gray-900 mb-1">${surah.nameKurdish}</h3>
              <p class="text-gray-500 font-quran text-xl mb-2">${surah.nameArabic}</p>

              <!-- Info -->
              <div class="flex flex-wrap items-center gap-2 text-sm">
                <span class="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg">
                  ${surah.revelationType}
                </span>
                <span class="text-gray-400">•</span>
                <span class="text-gray-500">
                  ${toKurdishNumber(surah.verseCount)} ${strings.verse || 'ئایەت'}
                </span>
                ${surah.audioDuration ? `
                  <span class="text-gray-400">•</span>
                  <span class="text-gray-500">
                    ${formatDuration(surah.audioDuration)}
                  </span>
                ` : ''}
              </div>
            </div>

            <!-- Play Icon -->
            <div class="w-10 h-10 bg-gold-400 rounded-full flex items-center justify-center
                        opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              ${icon('play', 'w-5 h-5 text-emerald-900')}
            </div>
          </div>
        </a>
      `;
    } else {
      return `
        <div class="bg-gray-50 rounded-xl p-4 border border-gray-200 opacity-60">
          <div class="flex items-center gap-3">
            <!-- Surah Number -->
            <div class="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
              <span class="text-sm font-medium text-gray-500">${toKurdishNumber(surah.number)}</span>
            </div>

            <div class="min-w-0">
              <h3 class="font-medium text-gray-600 truncate">${surah.nameKurdish}</h3>
              <p class="text-xs text-gray-400 font-quran">${surah.nameArabic}</p>
            </div>
          </div>
        </div>
      `;
    }
  },

  /**
   * Unmount component
   */
  unmount() {
    this.container.innerHTML = '';
  }
};

export default AudioLessonsPage;
