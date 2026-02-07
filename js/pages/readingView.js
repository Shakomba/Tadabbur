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
  autoCenterEnabled: true,
  isAutoScrolling: false,
  autoScrollTimeout: null,
  scrollHandler: null,
  basmalaRegex: /^\s*بِسْمِ\s+(?:ٱللَّهِ|اللَّهِ)\s+(?:ٱل|ال)رَّحْمَٰنِ\s+(?:ٱل|ال)رَّحِيمِ\s*/u,

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
    this.autoCenterEnabled = true;
    this.isAutoScrolling = false;
    if (this.autoScrollTimeout) {
      clearTimeout(this.autoScrollTimeout);
      this.autoScrollTimeout = null;
    }

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

    this.scrollHandler = () => this._handleUserScroll();
    window.addEventListener('scroll', this.scrollHandler, { passive: true });

    this.unsubscribers.push(
      State.subscribe('audioState', (state) => this._onAudioStateChange(state))
    );
    this.unsubscribers.push(
      State.subscribe('searchTarget', () => this._focusSearchTarget())
    );

    if (this.hasLectures) {
      this._setupLectureHandlers();
    } else {
      // For single-lecture surahs, set up play button handler
      const playButton = this.container.querySelector('#single-surah-play');
      if (playButton) {
        playButton.addEventListener('click', () => {
          const audioState = State.get('audioState');
          const isSameSurah = audioState?.loaded && Number(audioState.surahId) === Number(this.surah.id);
          // Toggle play/pause
          if (isSameSurah && audioState?.playing) {
            AudioPlayer.pause();
          } else {
            this._playSingleSurah();
          }
        });
      }
      this._setupVerseClickHandlers();
      // Don't load audio immediately - wait for user to click play button
    }

    this._focusSearchTarget();
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
            <div class="flex items-center gap-4 surah-header">
              <!-- Back Button -->
              <a href="#/audio-lessons"
                 class="w-10 h-10 bg-emerald-800 hover:bg-emerald-700 text-cream-50 rounded-lg
                        flex items-center justify-center transition-colors">
                ${icon('chevronRight', 'w-5 h-5')}
              </a>

              <div class="flex-1">
                <div class="flex flex-wrap items-center gap-2 text-emerald-700 text-sm md:text-base" style="font-family: 'Vazirmatn', sans-serif;">
                  <span class="font-medium text-emerald-800">${toKurdishNumber(this.surah.number)}</span>
                  <span class="text-emerald-400">•</span>
                  <span class="font-medium text-emerald-800">${this.surah.nameArabic}</span>
                  <span class="text-emerald-400">•</span>
                  <span class="font-medium">${this.surah.revelationType}</span>
                  <span class="text-emerald-400">•</span>
                  <span class="font-medium">${toKurdishNumber(this.surah.verseCount)} ${strings.verse || 'ئایەت'}</span>
                </div>
              </div>

              ${!this.hasLectures ? `
              <!-- Play Button (for single-lecture surahs) -->
              <button id="single-surah-play"
                 class="w-14 h-14 bg-gold-500 hover:bg-gold-400 text-emerald-900 rounded-full
                        flex items-center justify-center transition-colors shadow-lg">
                <span class="play-icon">${icon('play', 'w-7 h-7')}</span>
                <span class="loading-icon hidden">
                  <svg class="animate-spin w-7 h-7 text-emerald-900" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
                <span class="visualizer-icon hidden">
                  <div class="audio-visualizer text-emerald-900">
                    <div class="bar"></div>
                    <div class="bar"></div>
                    <div class="bar"></div>
                    <div class="bar"></div>
                  </div>
                </span>
              </button>
              ` : ''}
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
    const verseText = this._getVerseText(verse);
    return `
      <div class="verse-item verse-disabled p-6 md:p-8 rounded-xl mb-5 last:mb-0 border border-cream-100 hover:border-cream-200 transition-all"
           data-verse-index="${index}"
           id="verse-${index}"
           style="cursor: default;">
        <div class="flex items-start gap-5 md:gap-6">
          <!-- Verse Number -->
          <div class="verse-number w-11 h-11 md:w-14 md:h-14 bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-800
                      rounded-xl flex items-center justify-center font-bold text-lg md:text-xl
                      flex-shrink-0 transition-all shadow-sm">
            ${toKurdishNumber(verse.number)}
          </div>

          <div class="flex-1 min-w-0" style="transform: translateY(-14px);">
            <!-- Arabic Text -->
            <p class="quran-text text-2xl md:text-3xl lg:text-4xl text-emerald-900 mt-0 mb-4 leading-loose font-medium">
              ${verseText}
            </p>

            <!-- Tafsir -->
            <p class="text-gray-700 text-lg md:text-xl leading-relaxed tafsir-text font-normal">
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
        <div class="lecture-accordion mb-5 last:mb-0" data-lecture-id="${lectureId}">
          <div class="lecture-header-card bg-white rounded-2xl shadow-sm border border-cream-200 hover:shadow-md transition-all cursor-pointer"
               data-lecture-toggle="${lectureId}" aria-expanded="false">
            <div class="flex items-center justify-between gap-4 p-6 md:p-7">
              <div class="flex-1 min-w-0">
                <h3 class="lecture-title text-xl md:text-2xl font-bold text-emerald-900 mb-2">${title}</h3>
                <p class="lecture-range text-sm text-gray-600">${rangeLabel}</p>
              </div>
              <div class="flex items-center gap-3">
                <button class="lecture-play w-14 h-14 bg-gold-400 hover:bg-gold-300 rounded-full flex items-center justify-center transition-colors shadow-lg"
                        data-lecture-play="${lectureId}" title="${strings.listenNow || 'گوشبکە'}" aria-label="Play lecture" type="button">
                  <span class="play-icon">${icon('play', 'w-6 h-6 text-emerald-900')}</span>
                  <span class="loading-icon hidden">
                    <svg class="animate-spin w-6 h-6 text-emerald-900" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                  <span class="visualizer-icon hidden">
                    <div class="audio-visualizer text-emerald-900">
                      <div class="bar"></div>
                      <div class="bar"></div>
                      <div class="bar"></div>
                      <div class="bar"></div>
                    </div>
                  </span>
                </button>
              </div>
            </div>
          </div>
          <div class="lecture-body" data-lecture-body="${lectureId}">
            <div class="lecture-body-inner pt-2">
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
    const verseText = this._getVerseText(verse);
    return `
      <div class="verse-item verse-disabled p-6 md:p-8 rounded-xl mb-5 last:mb-0 border border-cream-100 hover:border-cream-200 transition-all"
           data-lecture-id="${lectureId}"
           data-verse-index="${index}">
        <div class="flex items-start gap-5 md:gap-6">
          <!-- Verse Number -->
          <div class="verse-number w-11 h-11 md:w-14 md:h-14 bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-800
                      rounded-xl flex items-center justify-center font-bold text-lg md:text-xl
                      flex-shrink-0 transition-all shadow-sm">
            ${toKurdishNumber(verse.numberInSurah ?? verse.number)}
          </div>

          <div class="flex-1 min-w-0" style="transform: translateY(-14px);">
            <!-- Arabic Text -->
            <p class="quran-text text-2xl md:text-3xl lg:text-4xl text-emerald-900 mt-0 mb-4 leading-loose font-medium">
              ${verseText}
            </p>

            <!-- Tafsir -->
            <p class="text-gray-700 text-lg md:text-xl leading-relaxed tafsir-text font-normal">
              ${verse.tafsirKurdish || verse.textKurdish || ''}
            </p>
          </div>
        </div>
      </div>
    `;
  },

  _focusSearchTarget() {
    const target = State.get('searchTarget');
    if (!target || Number(target.surahId) !== Number(this.surah?.id)) return;

    if (target.type === 'surah') {
      const header = this.container.querySelector('.surah-header');
      if (header) {
        this._pulseElement(header, 'search-highlight');
        header.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      State.set('searchTarget', null);
      return;
    }

    if (target.type !== 'verse') return;
    let verseElement = null;
    if (this.hasLectures) {
      const verse = this.surah.verses?.[target.verseIndex];
      const verseNumber = Number(verse?.numberInSurah ?? verse?.number ?? 0);
      if (verseNumber) {
        const lectureEntries = Object.entries(this.lectureVerseMap || {});
        for (const [lectureId, verses] of lectureEntries) {
          const index = verses.findIndex(item =>
            Number(item.numberInSurah ?? item.number ?? 0) === verseNumber
          );
          if (index !== -1) {
            this._openLecture(lectureId);
            window.setTimeout(() => {
              const targetElement = this.container.querySelector(
                `.verse-item[data-lecture-id="${lectureId}"][data-verse-index="${index}"]`
              );
              if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                this._pulseElement(targetElement, 'search-highlight');
              }
            }, 200);
            State.set('searchTarget', null);
            return;
          }
        }
      }
    } else {
      verseElement = this.container.querySelector(`#verse-${target.verseIndex}`);
    }

    if (verseElement) {
      requestAnimationFrame(() => {
        verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this._pulseElement(verseElement, 'search-highlight');
      });
    }

    State.set('searchTarget', null);
  },

  _pulseElement(element, className) {
    if (!element) return;
    element.classList.add(className);
    window.setTimeout(() => {
      element.classList.remove(className);
    }, 1800);
  },

  _getVerseText(verse) {
    const rawText = verse.textUthmani || verse.textArabic || '';
    const verseNumber = Number(verse.numberInSurah ?? verse.number ?? 0);
    if (verseNumber !== 1) {
      return rawText;
    }
    const stripped = rawText.replace(this.basmalaRegex, '').trim();
    return stripped || rawText;
  },

  /**
   * Play single-lecture surah (no lecture divisions)
   */
  _playSingleSurah() {
    if (!this.surah.audioUrl) return;

    const audioState = State.get('audioState');
    const isSameSurah = audioState?.loaded && Number(audioState.surahId) === Number(this.surah.id);

    // Set up audio and sync
    if (!isSameSurah) {
      this._setupAudio();
    }

    // Play audio
    AudioPlayer.play();

    // Enable verse clicks
    this._enableVerseClicks();
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
   * Enable verse clicks and update cursor
   */
  _enableVerseClicks() {
    const verses = this.container.querySelectorAll('.verse-item');
    verses.forEach(verse => {
      verse.classList.remove('verse-disabled');
      verse.style.cursor = 'pointer';
    });
  },

  /**
   * Disable verse clicks and update cursor
   */
  _disableVerseClicks() {
    const verses = this.container.querySelectorAll('.verse-item');
    verses.forEach(verse => {
      verse.classList.add('verse-disabled');
      verse.style.cursor = 'default';
    });
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
        const audioState = State.get('audioState');
        const isSameSurah = audioState?.loaded && Number(audioState.surahId) === Number(this.surah.id);
        const isActiveLecture = this.activeLectureId === lectureId;

        // If clicking the currently playing lecture, pause it
        if (isActiveLecture && audioState?.playing && isSameSurah) {
          AudioPlayer.pause();
          return;
        }

        if (isActiveLecture && isSameSurah && audioState?.loaded && !audioState.playing) {
          AudioPlayer.play();
          return;
        } else {
          // Otherwise play the lecture
          this._playLecture(lectureId);
        }
      });
    });

    const accordions = this.container.querySelectorAll('.lecture-accordion');
    accordions.forEach(accordion => {
      accordion.addEventListener('click', (event) => {
        // Ignore if clicking play button
        if (event.target.closest('[data-lecture-play]')) return;

        // Ignore if clicking a verse item (whether enabled or disabled)
        if (event.target.closest('.verse-item')) return;

        // Ignore clicks inside the lecture body
        if (event.target.closest('.lecture-body')) return;

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

    // If switching to a different lecture, pause current audio and reset highlights
    if (this.activeLectureId && this.activeLectureId !== lectureId) {
      AudioPlayer.pause();
      // Clear highlights
      this.container.querySelectorAll('.verse-item.highlighted').forEach((element) => {
        element.classList.remove('highlighted');
      });
      this.currentVerseIndex = -1;
    }

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

    // Update play button appearance for all lectures
    this._updateLecturePlayButtons();
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
    if (this.hasLectures) {
      this._updateLecturePlayButtons(state);
      if (!state.loaded && !state.playing) {
        this._resetLectureState();
      }
    } else {
      // For single-lecture surahs
      this._updateSingleSurahPlayButton(state);

      // Disable clicks when audio stops
      if (!state.loaded && !state.playing) {
        this._disableVerseClicks();
      }
    }
  },

  _resetLectureState() {
    this.currentVerseIndex = -1;
    this.activeLectureSurah = null;
    this._setActiveLecture(null);
    this.container.querySelectorAll('.verse-item.highlighted').forEach((element) => {
      element.classList.remove('highlighted');
    });
    this._updateLecturePlayButtons();
  },

  _updateLecturePlayButtons(state = State.get('audioState')) {
    const isSameSurah = state?.loaded && Number(state.surahId) === Number(this.surah?.id);
    const isPlaying = !!state?.playing && isSameSurah;
    const isLoading = !!state?.loading && isSameSurah;

    // Reset all buttons to show play icon
    this.container.querySelectorAll('.lecture-play').forEach(btn => {
      btn.classList.remove('is-playing');
      const playIcon = btn.querySelector('.play-icon');
      const loadingIcon = btn.querySelector('.loading-icon');
      const visualizerIcon = btn.querySelector('.visualizer-icon');
      if (playIcon) playIcon.classList.remove('hidden');
      if (loadingIcon) loadingIcon.classList.add('hidden');
      if (visualizerIcon) visualizerIcon.classList.add('hidden');
    });

    // Show appropriate icon for active lecture button
    if (this.activeLectureId) {
      const activeButton = this.container.querySelector(`[data-lecture-play="${this.activeLectureId}"]`);
      if (activeButton) {
        const playIcon = activeButton.querySelector('.play-icon');
        const loadingIcon = activeButton.querySelector('.loading-icon');
        const visualizerIcon = activeButton.querySelector('.visualizer-icon');

        if (isLoading) {
          // Show loading spinner
          activeButton.classList.add('is-playing');
          if (playIcon) playIcon.classList.add('hidden');
          if (loadingIcon) loadingIcon.classList.remove('hidden');
          if (visualizerIcon) visualizerIcon.classList.add('hidden');
        } else if (isPlaying) {
          // Show visualizer
          activeButton.classList.add('is-playing');
          if (playIcon) playIcon.classList.add('hidden');
          if (loadingIcon) loadingIcon.classList.add('hidden');
          if (visualizerIcon) visualizerIcon.classList.remove('hidden');
        }
      }
    }
  },

  _updateSingleSurahPlayButton(state) {
    const playButton = this.container.querySelector('#single-surah-play');
    if (!playButton) return;

    const playIcon = playButton.querySelector('.play-icon');
    const loadingIcon = playButton.querySelector('.loading-icon');
    const visualizerIcon = playButton.querySelector('.visualizer-icon');
    const isSameSurah = state?.loaded && Number(state.surahId) === Number(this.surah?.id);
    const isPlaying = !!state?.playing && isSameSurah;
    const isLoading = !!state?.loading && isSameSurah;

    if (isLoading) {
      // Show loading spinner
      if (playIcon) playIcon.classList.add('hidden');
      if (loadingIcon) loadingIcon.classList.remove('hidden');
      if (visualizerIcon) visualizerIcon.classList.add('hidden');
    } else if (isPlaying) {
      // Show visualizer
      if (playIcon) playIcon.classList.add('hidden');
      if (loadingIcon) loadingIcon.classList.add('hidden');
      if (visualizerIcon) visualizerIcon.classList.remove('hidden');
    } else {
      // Show play icon
      if (playIcon) playIcon.classList.remove('hidden');
      if (loadingIcon) loadingIcon.classList.add('hidden');
      if (visualizerIcon) visualizerIcon.classList.add('hidden');
    }
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

  _handleUserScroll() {
    if (this.isAutoScrolling) return;
    const highlighted = this.container?.querySelector('.verse-item.highlighted');
    if (!highlighted) return;
    const isVisible = this._isVerseVisible(highlighted);
    if (!isVisible) {
      this.autoCenterEnabled = false;
    } else if (!this.autoCenterEnabled) {
      this.autoCenterEnabled = true;
    }
  },

  _isVerseVisible(verseElement) {
    if (!verseElement) return false;
    const rect = verseElement.getBoundingClientRect();
    const audioPlayerHeight = 100;
    const headerHeight = 80;
    const viewportTop = headerHeight;
    const viewportBottom = window.innerHeight - audioPlayerHeight;
    return rect.bottom > viewportTop && rect.top < viewportBottom;
  },

  /**
   * Scroll to a verse element
   * @param {Element} verseElement - Verse element to scroll to
   */
  _scrollToVerse(verseElement) {
    if (!this.autoCenterEnabled || !verseElement) return;
    this.isAutoScrolling = true;
    if (this.autoScrollTimeout) {
      clearTimeout(this.autoScrollTimeout);
    }
    verseElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
    this.autoScrollTimeout = setTimeout(() => {
      this.isAutoScrolling = false;
    }, 350);
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

    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
      this.scrollHandler = null;
    }
    if (this.autoScrollTimeout) {
      clearTimeout(this.autoScrollTimeout);
      this.autoScrollTimeout = null;
    }

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
