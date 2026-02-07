/**
 * Audio Lessons Page Component
 */

import State from '../state.js';
import { icon } from '../utils/dom.js';
import { toKurdishNumber, formatSmartDuration } from '../utils/formatters.js';

const AudioLessonsPage = {
  container: null,
  unsubscribers: [],

  /**
   * Mount audio lessons page
   * @param {Element} container - Container element
   */
  mount(container) {
    this.container = container;
    this.render();

    this.unsubscribers.push(
      State.subscribe('audioState', (state) => this._syncPlayingCard(state))
    );
    this._syncPlayingCard(State.get('audioState'));
  },

  /**
   * Render audio lessons page HTML
   */
  render() {
    const appData = State.get('appData');
    const strings = appData?.uiStrings || {};
    const preambleEntries = appData?.preamble || [];

    // All surahs from the dataset
    const allSurahs = appData?.surahs || [];

    // Available lessons across the whole dataset (so scheduled lessons are shown)
    const availableLessons = allSurahs.filter(s => s.hasLessons && s.verses.length > 0).sort((a, b) => a.number - b.number);

    // Coming soon (surahs without lessons)
    const comingSoon = allSurahs.filter(s => !s.hasLessons || s.verses.length === 0).sort((a, b) => a.number - b.number);

    // Juz 'Amma window (81..114) for the specific section view
    const surahsRange = State.getSurahsRange ? State.getSurahsRange(81, 114) : allSurahs.filter(s => s.number >= 81 && s.number <= 114).sort((a, b) => a.number - b.number);
    const juzAmmaWithLessons = surahsRange.filter(s => s.hasLessons && s.verses.length > 0);

    this.container.innerHTML = `
      <div class="min-h-screen bg-cream-50">
        <div class="max-w-6xl mx-auto px-4 py-8 md:py-12 ">
          <!-- Available Lessons -->
          ${availableLessons.length > 0 ? `
          <section class="mb-12">
            <div class="flex items-center gap-3 mb-12">
              <div class="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                ${icon('headphones', 'w-5 h-5 text-emerald-700')}
              </div>
              <h3 class="text-xl font-bold text-emerald-900">
                ${strings.availableLessons || 'وانەی بەردەستە'}
                <span class="text-emerald-600 font-normal text-base mr-2">
                  (${toKurdishNumber(availableLessons.length + preambleEntries.length)})
                </span>
              </h3>
            </div>

            <!-- پێشەکی Section Label -->
            <div class="flex items-center justify-center mt-8 mb-16">
              <div class="flex-1 h-px bg-gradient-to-r from-transparent via-emerald-300 to-emerald-300 max-w-xs"></div>
              <h2 class="px-6 text-3xl md:text-4xl font-bold text-emerald-800" style="font-family: 'Vazirmatn', sans-serif;">
                پێشەکی
              </h2>
              <div class="flex-1 h-px bg-gradient-to-l from-transparent via-emerald-300 to-emerald-300 max-w-xs"></div>
            </div>

            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
              ${preambleEntries.map(entry => this._renderPreambleCard(entry)).join('')}
            </div>

            <!-- Juz Amma Section Label -->
            <div class="flex items-center justify-center mt-8 mb-16">
              <div class="flex-1 h-px bg-gradient-to-r from-transparent via-emerald-300 to-emerald-300 max-w-xs"></div>
              <h2 class="px-6 text-3xl md:text-4xl font-bold text-emerald-800" style="font-family: 'Vazirmatn', sans-serif;">
                جوزئی عم
              </h2>
              <div class="flex-1 h-px bg-gradient-to-l from-transparent via-emerald-300 to-emerald-300 max-w-xs"></div>
            </div>

            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              ${juzAmmaWithLessons.map(surah => this._renderSurahCard(surah, true)).join('')}
            </div>
          </section>
          ` : ''}

          <!-- Coming Soon -->
          ${comingSoon.length > 0 ? `
          <section>
            <div class="flex items-center gap-3 mb-6">
              <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-gray-500" fill="currentColor" aria-hidden="true" viewBox="0 0 640 640">
                  <path d="M216 64C229.3 64 240 74.7 240 88L240 128L400 128L400 88C400 74.7 410.7 64 424 64C437.3 64 448 74.7 448 88L448 128L480 128C515.3 128 544 156.7 544 192L544 480C544 515.3 515.3 544 480 544L160 544C124.7 544 96 515.3 96 480L96 192C96 156.7 124.7 128 160 128L192 128L192 88C192 74.7 202.7 64 216 64zM216 176L160 176C151.2 176 144 183.2 144 192L144 240L496 240L496 192C496 183.2 488.8 176 480 176L216 176zM144 288L144 480C144 488.8 151.2 496 160 496L480 496C488.8 496 496 488.8 496 480L496 288L144 288z"/>
                </svg>
              </div>
              <h2 class="text-xl font-bold text-gray-600">
                ${strings.comingSoon || 'بەم زووانە'}
                <span class="font-normal text-base mr-2">
                  (${toKurdishNumber(comingSoon.length)})
                </span>
              </h2>
            </div>

            <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              ${comingSoon.map(surah => this._renderSurahCard(surah, false)).join('')}
            </div>
          </section>
          ` : ''}
        </div>
      </div>
    `;
  },

  /**
   * Render a preamble card (پێشەکی entries)
   * @param {Object} entry - Preamble entry object
   * @returns {string} HTML string
   */
  _renderPreambleCard(entry) {
    const strings = State.get('appData')?.uiStrings || {};
    const audioState = State.get('audioState');
    const isPlaying = !!audioState?.playing && audioState?.surahId === entry.id;
    const hasLectures = entry.lectures && entry.lectures.length > 0;

    // Calculate total duration
    const totalDuration = hasLectures
      ? entry.lectures.reduce((total, lecture) => total + (lecture.audioDuration || 0), 0)
      : 0;
    const durationMarkup = totalDuration
      ? formatSmartDuration(totalDuration)
      : '<span class="duration-time text-gray-400" dir="ltr">--:--</span>';

    // Icon markup based on entry type
    let iconMarkup;
    if (entry.icon && entry.icon.endsWith('.png')) {
      iconMarkup = `<img src="assets/images/${entry.icon}" alt="${entry.nameArabic}" class="w-10 h-10 object-contain">`;
    } else {
      iconMarkup = `<span class="text-2xl font-bold text-white quran-text">${entry.nameArabic.substring(0, 2)}</span>`;
    }

    return `
      <a href="#/preamble/${entry.id}"
         class="surah-card bg-white rounded-xl overflow-hidden shadow-sm border border-cream-200 block group hover:shadow-md transition-shadow ${isPlaying ? 'is-playing' : ''}"
         data-preamble-id="${entry.id}">

        <!-- Header -->
        <div class="p-5 flex flex-col items-center text-center gap-3" dir="rtl">
          <div class="surah-number-badge w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0
                      shadow-lg relative overflow-hidden">
            <span class="surah-number-text flex items-center justify-center">
              ${iconMarkup}
            </span>
            <span class="surah-play-icon absolute inset-0 flex items-center justify-center">
              ${icon('play', 'w-6 h-6 text-emerald-900')}
            </span>
            <span class="surah-eq absolute inset-0 flex items-center justify-center">
              <div class="audio-visualizer text-emerald-900">
                <div class="bar"></div>
                <div class="bar"></div>
                <div class="bar"></div>
                <div class="bar"></div>
              </div>
            </span>
          </div>

          <h3 class="font-bold text-2xl text-gray-900 quran-text">
            ${entry.nameArabic}
          </h3>
        </div>

        <div class="h-px bg-gray-200"></div>

        <div class="p-4">
          <div class="surah-info-row flex items-center justify-center gap-4 text-sm" dir="rtl">
            <div class="surah-duration flex items-center gap-2 text-gray-600" dir="rtl">
              <svg class="surah-time-icon" fill="currentColor" aria-hidden="true" viewBox="0 0 640 640">
                <path d="M528 320C528 434.9 434.9 528 320 528C205.1 528 112 434.9 112 320C112 205.1 205.1 112 320 112C434.9 112 528 205.1 528 320zM64 320C64 461.4 178.6 576 320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320zM296 184L296 320C296 328 300 335.5 306.7 340L402.7 404C413.7 411.4 428.6 408.4 436 397.3C443.4 386.2 440.4 371.4 429.3 364L344 307.2L344 184C344 170.7 333.3 160 320 160C306.7 160 296 170.7 296 184z"/>
              </svg>
              ${durationMarkup}
            </div>
          </div>
        </div>
      </a>
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
    const audioState = State.get('audioState');
    const isPlaying = !!audioState?.playing && Number(audioState?.surahId) === Number(surah.id);

    if (hasLessons) {
      // Calculate total duration
      const totalDuration = this._calculateTotalDuration(surah);
      const durationMarkup = totalDuration
        ? formatSmartDuration(totalDuration)
        : '<span class="duration-time text-gray-400" dir="ltr">--:--</span>';

      return `
        <a href="#/surah/${surah.id}"
           class="surah-card bg-white rounded-xl overflow-hidden shadow-sm border border-cream-200 block group hover:shadow-md transition-shadow ${isPlaying ? 'is-playing' : ''}"
           data-surah-id="${surah.id}">

          <!-- Header -->
          <div class="p-5 flex flex-col items-center text-center gap-3" dir="rtl">
            <div class="surah-number-badge w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0
                        shadow-lg relative overflow-hidden">
              <span class="surah-number-text text-2xl font-bold text-white">
                ${toKurdishNumber(surah.number)}
              </span>
              <span class="surah-play-icon absolute inset-0 flex items-center justify-center">
                ${icon('play', 'w-6 h-6 text-emerald-900')}
              </span>
              <span class="surah-eq absolute inset-0 flex items-center justify-center">
                <div class="audio-visualizer text-emerald-900">
                  <div class="bar"></div>
                  <div class="bar"></div>
                  <div class="bar"></div>
                  <div class="bar"></div>
                </div>
              </span>
            </div>

            <h3 class="font-bold text-2xl text-gray-900 quran-text">
              ${surah.nameArabic}
            </h3>
          </div>

          <div class="h-px bg-gray-200"></div>

          <div class="p-4">
            <div class="surah-info-row flex items-center justify-center gap-4 text-sm" dir="rtl">
              <div class="ayah-badge" aria-label="${strings.verse || 'ئایەت'}">
                <img src="assets/img/Ayah.svg" alt="" class="ayah-icon" aria-hidden="true">
                <span class="ayah-count">${toKurdishNumber(surah.verseCount)}</span>
              </div>
              <span class="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                ${surah.revelationType}
              </span>
              <div class="surah-duration flex items-center gap-2 text-gray-600" dir="rtl">
                <svg class="surah-time-icon" fill="currentColor" aria-hidden="true" viewBox="0 0 640 640">
                  <path d="M528 320C528 434.9 434.9 528 320 528C205.1 528 112 434.9 112 320C112 205.1 205.1 112 320 112C434.9 112 528 205.1 528 320zM64 320C64 461.4 178.6 576 320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320zM296 184L296 320C296 328 300 335.5 306.7 340L402.7 404C413.7 411.4 428.6 408.4 436 397.3C443.4 386.2 440.4 371.4 429.3 364L344 307.2L344 184C344 170.7 333.3 160 320 160C306.7 160 296 170.7 296 184z"/>
                </svg>
                ${durationMarkup}
              </div>
            </div>
          </div>
        </a>
      `;
    } else {
      return `
        <div class="bg-gray-50 rounded-xl overflow-hidden p-4 border border-gray-200 opacity-60">
          <div class="p-4 flex flex-col items-center text-center gap-3" dir="rtl">
            <div class="surah-number-badge w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0">
              <span class="surah-number-text text-xl font-bold text-white">${toKurdishNumber(surah.number)}</span>
            </div>
            <h3 class="font-bold text-xl text-gray-700 quran-text">
              ${surah.nameArabic}
            </h3>
          </div>
          <div class="h-px bg-gray-200"></div>
          <div class="p-4">
            <div class="surah-info-row flex items-center justify-center gap-4 text-xs" dir="rtl">
              <div class="ayah-badge" aria-label="${strings.verse || 'ئایەت'}">
                <img src="assets/img/Ayah.svg" alt="" class="ayah-icon" aria-hidden="true">
                <span class="ayah-count">${toKurdishNumber(surah.verseCount)}</span>
              </div>
              <span class="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full font-medium">
                ${surah.revelationType}
              </span>
              <div class="surah-duration flex items-center gap-2 text-gray-500" dir="rtl">
                <svg class="surah-time-icon" fill="currentColor" aria-hidden="true" viewBox="0 0 640 640">
                  <path d="M528 320C528 434.9 434.9 528 320 528C205.1 528 112 434.9 112 320C112 205.1 205.1 112 320 112C434.9 112 528 205.1 528 320zM64 320C64 461.4 178.6 576 320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320zM296 184L296 320C296 328 300 335.5 306.7 340L402.7 404C413.7 411.4 428.6 408.4 436 397.3C443.4 386.2 440.4 371.4 429.3 364L344 307.2L344 184C344 170.7 333.3 160 320 160C306.7 160 296 170.7 296 184z"/>
                </svg>
                <span class="duration-time text-gray-400" dir="ltr">--:--</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  },

  _syncPlayingCard(state) {
    if (!this.container) return;
    const cards = this.container.querySelectorAll('.surah-card[data-surah-id]');
    const activeId = state?.playing ? Number(state.surahId) : null;

    cards.forEach((card) => {
      const cardId = Number(card.dataset.surahId);
      card.classList.toggle('is-playing', Number.isFinite(activeId) && cardId === activeId);
    });
  },

  /**
   * Calculate total duration for a surah
   * @param {Object} surah - Surah object
   * @returns {number} Total duration in seconds
   */
  _calculateTotalDuration(surah) {
    // If surah has lectures, sum their durations
    if (Array.isArray(surah.lectures) && surah.lectures.length > 0) {
      return surah.lectures.reduce((total, lecture) => {
        return total + (lecture.audioDuration || 0);
      }, 0);
    }
    // Otherwise return the surah's own duration
    return surah.audioDuration || 0;
  },

  /**
   * Unmount component
   */
  unmount() {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers = [];
    this.container.innerHTML = '';
  }
};

export default AudioLessonsPage;
