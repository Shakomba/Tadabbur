/**
 * Preamble Page Component
 * Handles پێشەکی, الاستعاذة, and البسملة entries
 */

import State from '../state.js';
import Router from '../router.js';
import AudioPlayer from '../components/audioPlayer.js';
import { icon, $ } from '../utils/dom.js';
import { toKurdishNumber } from '../utils/formatters.js';

const PreamblePage = {
  container: null,
  entry: null,
  unsubscribers: [],

  /**
   * Mount preamble page
   * @param {Element} container - Container element
   * @param {Object} params - Route params (id)
   */
  async mount(container, params) {
    this.container = container;

    // Get preamble entry
    const appData = State.get('appData');
    const preambleEntries = appData?.preamble || [];
    this.entry = preambleEntries.find(e => e.id === params.id);

    if (!this.entry) {
      this._renderNotFound();
      return;
    }

    // Render based on entry type
    if (this.entry.id === 'peshaki') {
      this._renderPeshakiView();
      this._setupPeshakiHandlers();
    } else {
      // For istiatha and basmalah - show text view
      this._renderTextView();
      this._setupTextViewHandlers();
    }

    this.unsubscribers.push(
      State.subscribe('audioState', (state) => this._onAudioStateChange(state))
    );
  },

  /**
   * Render پێشەکی view with simple lecture cards
   */
  _renderPeshakiView() {
    const appData = State.get('appData');
    const strings = appData?.uiStrings || {};
    const audioState = State.get('audioState');

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
                <div class="flex flex-wrap items-center gap-2 text-emerald-700 text-sm md:text-base" style="font-family: 'Vazirmatn', sans-serif;">
                  <span class="font-medium text-emerald-800">${this.entry.nameArabic}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Lectures Container -->
        <div class="max-w-4xl mx-auto px-4 py-8">
          <div class="space-y-4">
            ${this.entry.lectures.map((lecture, index) => {
              const isPlaying = audioState?.playing && audioState?.lectureId === lecture.id;

              return `
                <div class="bg-white rounded-2xl shadow-sm border border-cream-200 p-6 md:p-7 hover:shadow-md transition-shadow" data-lecture-id="${lecture.id}">
                  <div class="flex items-center justify-between gap-4">
                    <div class="flex-1 min-w-0">
                      <h3 class="text-xl md:text-2xl font-bold text-emerald-900 mb-2">${lecture.title}</h3>
                    </div>
                    <div class="flex items-center gap-3">
                      <button class="lecture-play w-14 h-14 bg-gold-400 hover:bg-gold-300 rounded-full flex items-center justify-center transition-colors shadow-lg"
                              data-lecture-play="${lecture.id}" title="${strings.listenNow || 'گوشبکە'}" aria-label="Play lecture" type="button">
                        <span class="play-icon ${isPlaying ? 'hidden' : ''}">${icon('play', 'w-6 h-6 text-emerald-900')}</span>
                        <span class="loading-icon hidden">
                          <svg class="animate-spin w-6 h-6 text-emerald-900" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </span>
                        <span class="visualizer-icon ${isPlaying ? '' : 'hidden'}">
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
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Render text view for istiatha and basmalah (enhanced design)
   */
  _renderTextView() {
    const appData = State.get('appData');
    const strings = appData?.uiStrings || {};
    const audioState = State.get('audioState');
    const lecture = this.entry.lectures[0];
    const isPlaying = audioState?.playing && audioState?.lectureId === lecture?.id;

    // Get text based on entry type
    let arabicText = '';
    let kurdishText = '';

    if (this.entry.id === 'istiatha') {
      arabicText = 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ';
      kurdishText = 'پەنا دەگرم بە خوای گەورە لە شەیتانی نەفرەت لێکراو';
    } else if (this.entry.id === 'basmalah') {
      arabicText = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
      kurdishText = 'بە ناوی خودای بەخشندە و میهرەبان';
    }

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
                <div class="flex flex-wrap items-center gap-2 text-emerald-700 text-sm md:text-base" style="font-family: 'Vazirmatn', sans-serif;">
                  <span class="font-medium text-emerald-800">${this.entry.nameArabic}</span>
                </div>
              </div>

              <!-- Play Button -->
              <button id="text-play-button"
                 class="w-14 h-14 bg-gold-500 hover:bg-gold-400 text-emerald-900 rounded-full
                        flex items-center justify-center transition-colors shadow-lg">
                <span class="play-icon ${isPlaying ? 'hidden' : ''}">${icon('play', 'w-7 h-7')}</span>
                <span class="loading-icon hidden">
                  <svg class="animate-spin w-7 h-7 text-emerald-900" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
                <span class="visualizer-icon ${isPlaying ? '' : 'hidden'}">
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

        <!-- Content Container -->
        <div class="max-w-4xl mx-auto px-4 py-12 md:py-16">
          <div class="bg-white rounded-2xl shadow-lg border border-cream-200 overflow-hidden">
            <!-- Content -->
            <div class="p-8 md:p-12">
              <div class="text-center space-y-8">
                <!-- Arabic Text -->
                <div class="relative">
                  <p class="quran-text text-4xl md:text-5xl lg:text-6xl text-emerald-900 leading-loose font-bold" style="pointer-events: none; user-select: none;">
                    ${arabicText}
                  </p>
                </div>

                <!-- Divider -->
                <div class="flex items-center justify-center py-4">
                  <div class="h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent w-full max-w-md"></div>
                </div>

                <!-- Kurdish Translation -->
                <div class="relative">
                  <p class="text-xl md:text-2xl text-gray-700 leading-relaxed font-medium" style="pointer-events: none; user-select: none;">
                    ${kurdishText}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Setup پێشەکی lecture button handlers
   */
  _setupPeshakiHandlers() {
    const playButtons = this.container.querySelectorAll('[data-lecture-play]');
    playButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const lectureId = button.dataset.lecturePlay;
        const lectureIndex = this.entry.lectures.findIndex(l => l.id === lectureId);
        const lecture = this.entry.lectures[lectureIndex];

        const audioState = State.get('audioState');
        const isPlaying = audioState?.playing && audioState?.lectureId === lectureId;

        if (isPlaying) {
          AudioPlayer.pause();
        } else {
          this._playLecture(lecture, lectureIndex);
        }
      });
    });
  },

  /**
   * Setup text view play button handler
   */
  _setupTextViewHandlers() {
    const playButton = $('#text-play-button', this.container);
    if (playButton && this.entry.lectures.length > 0) {
      playButton.addEventListener('click', () => {
        const lecture = this.entry.lectures[0];
        const audioState = State.get('audioState');
        const isPlaying = audioState?.playing && audioState?.lectureId === lecture.id;

        if (isPlaying) {
          AudioPlayer.pause();
        } else {
          this._playLecture(lecture, 0);
        }
      });
    }
  },

  /**
   * Play a lecture
   * @param {Object} lecture - Lecture object
   * @param {number} index - Lecture index
   */
  _playLecture(lecture, index) {
    if (!lecture.audioUrl) {
      console.warn('No audio URL for lecture:', lecture.title);
      return;
    }

    // Create a surah-like object for the audio player
    const preambleSurah = {
      id: this.entry.id,
      nameKurdish: this.entry.nameArabic,
      nameArabic: this.entry.nameArabic,
      audioUrl: lecture.audioUrl,
      audioDuration: lecture.audioDuration || 0,
      verses: [] // No verses for preamble
    };

    AudioPlayer.loadSurah(preambleSurah);

    // Update state to track which lecture is playing
    State.updateAudioState({
      lectureId: lecture.id
    });

    AudioPlayer.play();
  },

  /**
   * Handle audio state changes
   * @param {Object} state - Audio state
   */
  _onAudioStateChange(state) {
    // Update play button icons without full re-render
    if (this.entry.id === 'peshaki') {
      this._updatePeshakiPlayButtons(state);
    } else {
      this._updateTextPlayButton(state);
    }
  },

  /**
   * Update play button icons for پێشەکی lectures
   * @param {Object} state - Audio state
   */
  _updatePeshakiPlayButtons(state) {
    const playButtons = this.container.querySelectorAll('[data-lecture-play]');
    playButtons.forEach(button => {
      const lectureId = button.dataset.lecturePlay;
      const isPlaying = state?.playing && state?.lectureId === lectureId;
      const isLoading = state?.loading && state?.lectureId === lectureId;

      const playIcon = button.querySelector('.play-icon');
      const loadingIcon = button.querySelector('.loading-icon');
      const visualizerIcon = button.querySelector('.visualizer-icon');

      if (playIcon && loadingIcon && visualizerIcon) {
        if (isLoading) {
          // Show loading spinner
          playIcon.classList.add('hidden');
          loadingIcon.classList.remove('hidden');
          visualizerIcon.classList.add('hidden');
        } else if (isPlaying) {
          // Show visualizer
          playIcon.classList.add('hidden');
          loadingIcon.classList.add('hidden');
          visualizerIcon.classList.remove('hidden');
        } else {
          // Show play icon
          playIcon.classList.remove('hidden');
          loadingIcon.classList.add('hidden');
          visualizerIcon.classList.add('hidden');
        }
      }
    });
  },

  /**
   * Update play button for text view
   * @param {Object} state - Audio state
   */
  _updateTextPlayButton(state) {
    const playButton = this.container.querySelector('#text-play-button');
    if (!playButton || !this.entry.lectures[0]) return;

    const lecture = this.entry.lectures[0];
    const isPlaying = state?.playing && state?.lectureId === lecture.id;
    const isLoading = state?.loading && state?.lectureId === lecture.id;

    const playIcon = playButton.querySelector('.play-icon');
    const loadingIcon = playButton.querySelector('.loading-icon');
    const visualizerIcon = playButton.querySelector('.visualizer-icon');

    if (playIcon && loadingIcon && visualizerIcon) {
      if (isLoading) {
        // Show loading spinner
        playIcon.classList.add('hidden');
        loadingIcon.classList.remove('hidden');
        visualizerIcon.classList.add('hidden');
      } else if (isPlaying) {
        // Show visualizer
        playIcon.classList.add('hidden');
        loadingIcon.classList.add('hidden');
        visualizerIcon.classList.remove('hidden');
      } else {
        // Show play icon
        playIcon.classList.remove('hidden');
        loadingIcon.classList.add('hidden');
        visualizerIcon.classList.add('hidden');
      }
    }
  },

  /**
   * Render not found message
   */
  _renderNotFound() {
    this.container.innerHTML = `
      <div class="min-h-[60vh] flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-6xl font-bold text-emerald-900 mb-4">٤٠٤</h1>
          <p class="text-xl text-gray-600 mb-6">ناوەڕۆکەکە نەدۆزرایەوە</p>
          <a href="#/audio-lessons" class="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            گەڕانەوە بۆ وانەکان
          </a>
        </div>
      </div>
    `;
  },

  /**
   * Unmount component
   */
  unmount() {
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
      this.scrollHandler = null;
    }
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers = [];
    this.container.innerHTML = '';
  }
};

export default PreamblePage;
