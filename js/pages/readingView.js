/**
 * Reading View Page Component
 * Core feature: Audio-synced verse display
 */

import State from '../state.js';
import Router from '../router.js';
import AudioPlayer from '../components/audioPlayer.js';
import { AudioSync } from '../utils/audio.js';
import { icon, $, scrollIntoView } from '../utils/dom.js';
import { toKurdishNumber } from '../utils/formatters.js';

const ReadingViewPage = {
  container: null,
  surah: null,
  currentVerseIndex: -1,
  hasLectures: false,
  activeLectureId: null,
  activeLectureSurah: null,
  lectureVerseMap: {},
  lectureMetaMap: {},
  unsubscribers: [],

  /**
   * Mount reading view page
   * @param {Element} container - Container element
   * @param {Object} params - Route params (surahId)
   */
  async mount(container, params) {
    this.container = container;
    this.currentVerseIndex = -1;
    this.hasLectures = false;
    this.activeLectureId = null;
    this.activeLectureSurah = null;
    this.lectureVerseMap = {};
    this.lectureMetaMap = {};

    // Get surah data
    const surahId = parseInt(params.id);
    this.surah = State.getSurah(surahId);

    if (!this.surah || this.surah.verses.length === 0) {
      this._renderNotFound();
      return;
    }

    this.hasLectures = Array.isArray(this.surah.lectures) && this.surah.lectures.length > 0;

    // Set current surah in state
    State.set('currentSurah', this.surah);

    // Render page
    this.render();

    this.unsubscribers.push(
      State.subscribe('audioState', (state) => this._onAudioStateChange(state))
    );

    if (this.hasLectures) {
      this._setupLectureHandlers();
    } else {
      this._setupVerseClickHandlers();
      // Load audio and set up sync
      this._setupAudio();
    }
  },

  /**
   * Render reading view page HTML
   */
  render() {
    const appData = State.get('appData');
    const strings = appData?.uiStrings || {};
    const verseMarkup = this.hasLectures
      ? this._renderLectures()
      : this.surah.verses.map((verse, index) => this._renderVerse(verse, index)).join('');

    this.container.innerHTML = `
      <div class="min-h-screen bg-cream-50">
        <!-- Header -->
        <div class="bg-cream-50 text-emerald-900 py-6">
          <div class="max-w-4xl mx-auto px-4">
            <div class="flex items-center gap-4">
              <!-- Back Button -->
              <a href="#/audio-lessons"
                 class="w-10 h-10 bg-emerald-800 hover:bg-emerald-700 text-cream-50 rounded-lg
                        flex items-center justify-center transition-colors">
                ${icon('chevronRight', 'w-5 h-5')}
              </a>

              <div class="flex-1">
                <div class="flex flex-wrap items-center gap-2 text-emerald-700 text-sm md:text-base">
                  <span class="font-quran text-lg md:text-xl text-emerald-800">${this.surah.nameArabic}</span>
                  <span class="text-emerald-400">•</span>
                  <span class="font-medium">${this.surah.revelationType}</span>
                  <span class="text-emerald-400">•</span>
                  <span class="font-medium">${toKurdishNumber(this.surah.verseCount)} ${strings.verse || 'ئایەت'}</span>
                </div>
              </div>

              <!-- Surah Number Badge -->
              <div class="w-12 h-12 bg-gold-500 rounded-xl flex items-center justify-center">
                <span class="text-xl font-bold text-emerald-900">${toKurdishNumber(this.surah.number)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Verses Container -->
        <div class="max-w-4xl mx-auto px-4 py-8 ">
          <div class="verse-container rounded-2xl p-6 md:p-8 shadow-sm" id="verses-container">
            ${verseMarkup}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Render a single verse
   * @param {Object} verse - Verse object
   * @param {number} index - Verse index
   * @returns {string} HTML string
   */
  _renderVerse(verse, index) {
    return `
      <div class="verse-item p-4 md:p-6 rounded-xl cursor-pointer mb-4 last:mb-0"
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
            <p class="quran-text text-quran-lg md:text-quran-xl text-gray-900 mb-4 leading-loose">
              ${verse.textUthmani || verse.textArabic}
            </p>

            <!-- Tafsir -->
            <p class="text-gray-600 text-base md:text-lg leading-relaxed tafsir-text">
              ${verse.tafsirKurdish || verse.textKurdish || ''}
            </p>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Render lecture accordions for multi-lecture surahs
   * @returns {string} HTML string
   */
  _renderLectures() {
    const strings = State.get('appData')?.uiStrings || {};
    const verseLabel = strings.verse || 'ئایەت';
    const lectures = Array.isArray(this.surah.lectures) ? this.surah.lectures : [];

    this.lectureVerseMap = {};
    this.lectureMetaMap = {};

    return lectures.map((lecture, index) => {
      const lectureId = String(lecture.id ?? index + 1);
      const startVerse = Number(lecture.startVerse ?? lecture.start ?? 1);
      const endVerse = Number(lecture.endVerse ?? lecture.end ?? startVerse);
      const verses = this._getLectureVerses(startVerse, endVerse);

      this.lectureVerseMap[lectureId] = verses;
      this.lectureMetaMap[lectureId] = {
        ...lecture,
        _index: index,
        _startVerse: startVerse,
        _endVerse: endVerse
      };

      const title = lecture.title || `وانە ${toKurdishNumber(index + 1)}`;
      const rangeLabel = lecture.label || `${verseLabel} ${toKurdishNumber(startVerse)} - ${toKurdishNumber(endVerse)}`;

      return `
        <div class="lecture-accordion mb-4 last:mb-0" data-lecture-id="${lectureId}">
          <div class="lecture-header flex items-center justify-between gap-3 p-4 rounded-2xl w-full text-right"
               data-lecture-toggle="${lectureId}" aria-expanded="false">
            <div class="flex-1 min-w-0">
              <div class="lecture-title-row flex items-center justify-between gap-3">
                <span class="lecture-title text-emerald-900 font-bold">${title}</span>
              </div>
              <div class="lecture-meta mt-2">
                <span class="lecture-range">${rangeLabel}</span>
              </div>
            </div>
            <div class="lecture-actions flex items-center">
              <button class="lecture-play w-11 h-11 bg-gold-400 hover:bg-gold-300 rounded-full flex items-center justify-center transition-colors"
                      data-lecture-play="${lectureId}" title="${strings.listenNow || 'گوشبکە'}" aria-label="Play lecture" type="button">
                ${icon('play', 'w-5 h-5 text-emerald-900')}
              </button>
            </div>
          </div>
          <div class="lecture-body" data-lecture-body="${lectureId}">
            <div class="lecture-body-inner">
              ${verses.map((verse, verseIndex) => this._renderLectureVerse(verse, verseIndex, lectureId)).join('')}
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  _getLectureVerses(startVerse, endVerse) {
    const verseNumber = (verse) => Number(verse.numberInSurah ?? verse.number ?? 0);
    return this.surah.verses
      .filter((verse) => {
        const number = verseNumber(verse);
        return number >= startVerse && number <= endVerse;
      })
      .sort((a, b) => verseNumber(a) - verseNumber(b));
  },

  _renderLectureVerse(verse, index, lectureId) {
    return `
      <div class="verse-item verse-disabled p-4 md:p-6 rounded-xl mb-4 last:mb-0"
           data-lecture-id="${lectureId}"
           data-verse-index="${index}">
        <div class="flex items-start gap-4">
          <!-- Verse Number -->
          <div class="verse-number w-10 h-10 md:w-12 md:h-12 bg-emerald-100 text-emerald-800
                      rounded-full flex items-center justify-center font-bold text-lg
                      flex-shrink-0 transition-colors">
            ${toKurdishNumber(verse.numberInSurah ?? verse.number)}
          </div>

          <div class="flex-1 min-w-0">
            <!-- Arabic Text -->
            <p class="quran-text text-quran-lg md:text-quran-xl text-gray-900 mb-4 leading-loose">
              ${verse.textUthmani || verse.textArabic}
            </p>

            <!-- Tafsir -->
            <p class="text-gray-600 text-base md:text-lg leading-relaxed tafsir-text">
              ${verse.tafsirKurdish || verse.textKurdish || ''}
            </p>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Set up audio player and sync
   */
  _setupAudio() {
    if (!this.surah.audioUrl) return;

    // Load audio in player
    AudioPlayer.loadSurah(this.surah);

    // Set up audio sync
    const audioElement = document.getElementById('audio-element');
    if (audioElement) {
      AudioSync.init(audioElement, this.surah.verses, (verseIndex) => {
        this._onVerseChange(verseIndex);
      });
    }
  },

  /**
   * Set up click handlers for verses
   */
  _setupVerseClickHandlers() {
    const verses = this.container.querySelectorAll('.verse-item');
    verses.forEach(verse => {
      verse.addEventListener('click', (event) => {
        event.stopPropagation();
        if (verse.classList.contains('verse-disabled')) return;
        const index = parseInt(verse.dataset.verseIndex, 10);
        const lectureId = verse.dataset.lectureId || null;
        if (this.hasLectures && lectureId !== this.activeLectureId) return;
        this._seekToVerse(index);
      });
    });
  },

  _setupLectureHandlers() {
    const plays = this.container.querySelectorAll('[data-lecture-play]');
    plays.forEach(playButton => {
      playButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const lectureId = playButton.dataset.lecturePlay;
        this._playLecture(lectureId);
      });
    });

    const accordions = this.container.querySelectorAll('.lecture-accordion');
    accordions.forEach(accordion => {
      accordion.addEventListener('click', (event) => {
        if (event.target.closest('[data-lecture-play]')) return;
        const lectureId = accordion.dataset.lectureId;
        this._toggleLecture(lectureId);
      });
    });

    this.container.querySelectorAll('[data-lecture-body]').forEach((body) => {
      body.style.maxHeight = '0px';
    });

    this._setupVerseClickHandlers();
  },

  _toggleLecture(lectureId) {
    const accordion = this.container.querySelector(`.lecture-accordion[data-lecture-id="${lectureId}"]`);
    if (!accordion) return;
    const body = accordion.querySelector(`[data-lecture-body="${lectureId}"]`);
    const toggle = accordion.querySelector(`[data-lecture-toggle="${lectureId}"]`);
    const isOpen = accordion.classList.toggle('is-open');
    if (body) {
      if (isOpen) {
        body.style.maxHeight = `${body.scrollHeight}px`;
      } else {
        body.style.maxHeight = '0px';
      }
    }
    if (toggle) {
      toggle.setAttribute('aria-expanded', String(isOpen));
    }
  },

  _openLecture(lectureId) {
    const accordion = this.container.querySelector(`.lecture-accordion[data-lecture-id="${lectureId}"]`);
    if (!accordion) return;
    accordion.classList.add('is-open');
    const body = accordion.querySelector(`[data-lecture-body="${lectureId}"]`);
    const toggle = accordion.querySelector(`[data-lecture-toggle="${lectureId}"]`);
    if (body) {
      body.style.maxHeight = `${body.scrollHeight}px`;
    }
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
  },

  _setActiveLecture(lectureId) {
    this.activeLectureId = lectureId;
    this.container.querySelectorAll('.lecture-accordion').forEach(accordion => {
      const isActive = accordion.dataset.lectureId === lectureId;
      accordion.classList.toggle('is-active', isActive);
      accordion.querySelectorAll('.verse-item').forEach(verse => {
        verse.classList.toggle('verse-disabled', !isActive);
      });
    });
  },

  _playLecture(lectureId) {
    const lecture = this.lectureMetaMap[lectureId];
    if (!lecture) return;

    this._openLecture(lectureId);
    this._setActiveLecture(lectureId);

    const lectureSurah = this._buildLectureSurah(lectureId, lecture);
    this.activeLectureSurah = lectureSurah;

    AudioPlayer.loadSurah(lectureSurah);

    const audioElement = document.getElementById('audio-element');
    if (audioElement) {
      AudioSync.init(audioElement, lectureSurah.verses, (verseIndex) => {
        this._onVerseChange(verseIndex);
      });
    }

    AudioPlayer.play();
  },

  _buildLectureSurah(lectureId, lecture) {
    const verses = this.lectureVerseMap[lectureId] || [];
    return {
      ...this.surah,
      audioUrl: lecture.audioUrl || this.surah.audioUrl,
      audioDuration: lecture.audioDuration || 0,
      verses
    };
  },

  _onAudioStateChange(state) {
    if (!this.hasLectures) return;
    if (!state.loaded && !state.playing) {
      this._resetLectureState();
    }
  },

  _resetLectureState() {
    this.currentVerseIndex = -1;
    this.activeLectureSurah = null;
    this._setActiveLecture(null);
    this.container.querySelectorAll('.verse-item.highlighted').forEach((element) => {
      element.classList.remove('highlighted');
    });
  },

  /**
   * Handle verse change from audio sync
   * @param {number|number[]} verseIndex - New verse index or indices
   */
  _onVerseChange(verseIndex) {
    const indices = Array.isArray(verseIndex)
      ? verseIndex.filter((index) => Number.isInteger(index) && index >= 0)
      : (Number.isInteger(verseIndex) && verseIndex >= 0 ? [verseIndex] : []);
    const nextIndex = indices.length ? indices[0] : -1;

    if (this.hasLectures) {
      if (!this.activeLectureId || !this.activeLectureSurah) return;

      this.container.querySelectorAll('.verse-item.highlighted').forEach((element) => {
        element.classList.remove('highlighted');
      });

      let firstVerse = null;
      indices.forEach((index) => {
        const selector = `.verse-item[data-lecture-id="${this.activeLectureId}"][data-verse-index="${index}"]`;
        const newVerse = this.container.querySelector(selector);
        if (newVerse) {
          newVerse.classList.add('highlighted');
          if (!firstVerse) {
            firstVerse = newVerse;
          }
        }
      });

      if (firstVerse) {
        this._scrollToVerse(firstVerse);
      }

      this.currentVerseIndex = nextIndex;
      State.set('currentVerseIndex', nextIndex);
      if (nextIndex >= 0) {
        AudioPlayer.updateVerseInfo(nextIndex, this.activeLectureSurah);
      }
      return;
    }

    this.container.querySelectorAll('.verse-item.highlighted').forEach((element) => {
      element.classList.remove('highlighted');
    });

    let firstVerse = null;
    indices.forEach((index) => {
      const newVerse = $(`#verse-${index}`, this.container);
      if (newVerse) {
        newVerse.classList.add('highlighted');
        if (!firstVerse) {
          firstVerse = newVerse;
        }
      }
    });

    if (firstVerse) {
      this._scrollToVerse(firstVerse);
    }

    this.currentVerseIndex = nextIndex;
    State.set('currentVerseIndex', nextIndex);

    if (nextIndex >= 0) {
      AudioPlayer.updateVerseInfo(nextIndex, this.surah);
    }
  },

  /**
   * Seek audio to a specific verse
   * @param {number} verseIndex - Verse index to seek to
   */
  _seekToVerse(verseIndex) {
    if (this.hasLectures && !this.activeLectureId) return;
    AudioSync.seekToVerse(verseIndex);
    AudioPlayer.play();
  },

  /**
   * Scroll to a verse element
   * @param {Element} verseElement - Verse element to scroll to
   */
  _scrollToVerse(verseElement) {
    // Check if element is in viewport
    const rect = verseElement.getBoundingClientRect();
    const audioPlayerHeight = 100; // Approximate height of audio player
    const headerHeight = 80; // Approximate header height
    const viewportHeight = window.innerHeight - audioPlayerHeight - headerHeight;

    if (rect.top < headerHeight || rect.bottom > viewportHeight + headerHeight) {
      verseElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  },

  /**
   * Render not found state
   */
  _renderNotFound() {
    const strings = State.get('appData')?.uiStrings || {};

    this.container.innerHTML = `
      <div class="min-h-[60vh] flex items-center justify-center">
        <div class="text-center px-4">
          <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            ${icon('book', 'w-10 h-10 text-gray-400')}
          </div>
          <h2 class="text-2xl font-bold text-gray-800 mb-2">
            ${strings.noLessonsYet || 'هێشتا وانەی ئامادە نییە'}
          </h2>
          <p class="text-gray-500 mb-6">
            ئەم سورەیە هێشتا وانەی بۆ ئامادە نەکراوە
          </p>
          <a href="#/audio-lessons"
             class="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white">
            ${icon('chevronRight', 'w-5 h-5')}
            <span>${strings.back || 'گەڕانەوە'}</span>
          </a>
        </div>
      </div>
    `;
  },

  /**
   * Unmount component
   */
  unmount() {
    // Clean up audio sync
    AudioSync.destroy();

    // Unsubscribe from state changes
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];

    // Clear state
    State.set('currentSurah', null);
    State.set('currentVerseIndex', -1);

    this.container.innerHTML = '';
  }
};

export default ReadingViewPage;
