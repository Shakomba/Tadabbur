/**
 * Persistent Audio Player Component
 */

import State from '../state.js';
import { AudioSync, calculateProgress, getVerseMarkers } from '../utils/audio.js';
import { icon, $ } from '../utils/dom.js';
import { formatDuration, toKurdishNumber } from '../utils/formatters.js';

const AudioPlayer = {
  container: null,
  audioElement: null,
  currentSurah: null,
  isVisible: false,
  isMinimized: false,
  isSeeking: false,
  isSwiping: false,
  swipeStartX: 0,
  swipeStartY: 0,
  swipeCurrentY: 0,
  lastSnapIndex: null,
  markers: [],
  markerElements: new Map(),
  activeMarkerIndex: null,
  markerTooltipTimeout: null,
  lastVolume: 1,
  _blobUrl: null,
  _sourceToken: 0,
  _sourcePromise: null,
  _githubRepoMeta: null,
  _githubBranchPromise: null,
  _routeUnsubscribe: null,
  speedOptions: [0.5, 0.75, 1, 1.25, 1.5, 2],
  currentSpeed: 1,

  /**
   * Mount audio player component
   * @param {Element} container - Container element
   */
  mount(container) {
    this.container = container;
    this.audioElement = document.getElementById('audio-element');
    this.render();
    this._setupEventListeners();

    // Subscribe to audio state changes
    State.subscribe('audioState', (state) => this._onAudioStateChange(state));

    // Keep bottom spacing synced with route context (footer-visible vs reading pages).
    this._routeUnsubscribe = State.subscribe('currentRoute', () => {
      this._setContentPadding(this.isVisible);
    });
  },

  /**
   * Render audio player HTML
   */
  render() {
    const strings = State.get('appData')?.uiStrings || {};

    this.container.innerHTML = `
      <div class="audio-bar py-2 px-4">
        <div class="audio-bar-inner relative w-full">
          <div class="max-w-7xl mx-auto">
          <!-- Top Row: Progress Bar with Times -->
          <div class="audio-progress-row flex items-center gap-3 mb-2" dir="ltr">
            <!-- Duration (Left) -->
            <span class="audio-time text-emerald-300 text-sm tabular-nums shrink-0" id="duration">٠٠:٠٠</span>

            <!-- Progress Bar (Center - draggable) -->
            <div class="flex-1 progress-track h-1 bg-emerald-800 rounded-full relative cursor-pointer" id="progress-track" dir="ltr">
              <div class="progress-fill h-full bg-gold-400 rounded-full pointer-events-none" id="progress-fill" style="width: 0%"></div>
              <div class="progress-handle absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-gold-400 rounded-full shadow-md cursor-pointer"
                   id="progress-handle" style="left: 0%; transform: translate(-50%, -50%)"></div>
              <!-- Verse Markers -->
              <div id="verse-markers" class="absolute inset-0 pointer-events-none"></div>
            </div>

            <!-- Current Time (Right) -->
            <span class="audio-time text-white text-sm tabular-nums shrink-0" id="current-time">٠٠:٠٠</span>

            <!-- Desktop Window Controls (Top Row) -->
            <div class="audio-window-controls hidden lg:flex items-center gap-1 shrink-0" dir="ltr">
              <button id="minimize-btn" class="w-8 h-8 flex items-center justify-center text-gold-400
                                              hover:text-gold-300 transition-colors group"
                      title="Minimize" aria-label="Minimize player">
                <span class="block w-4 h-0.5 bg-gold-400 group-hover:bg-gold-300" aria-hidden="true"></span>
              </button>
              <button id="close-btn" class="w-8 h-8 flex items-center justify-center text-gold-400
                                           hover:text-gold-300 transition-colors"
                      title="Close" aria-label="Close player">
                ${icon('close', 'w-4 h-4')}
              </button>
            </div>
          </div>

          <!-- Bottom Row: Controls & Info -->
          <div class="flex items-center justify-between gap-4">
            <!-- Left: Surah Info -->
            <div class="audio-left-controls flex items-center gap-3 flex-1">
              <div class="audio-left-slot">
                <button id="close-btn-mobile" class="w-8 h-8 bg-emerald-800 rounded-lg flex items-center
                                                     justify-center shrink-0 text-gold-400 hover:bg-emerald-700
                                                     transition-colors md:hidden"
                        title="Close" aria-label="Close player">
                  ${icon('close', 'w-4 h-4')}
                </button>
                <div class="volume-control hidden md:flex items-center relative shrink-0">
                  <button id="volume-btn" class="w-8 h-8 bg-emerald-800 rounded-lg flex items-center justify-center text-gold-400 hover:bg-emerald-700 transition-colors"
                          title="Mute" aria-label="Mute audio" type="button">
                    <span class="volume-icon">${icon('volume', 'w-4 h-4')}</span>
                    <span class="volume-mute-icon hidden">${icon('volumeMute', 'w-4 h-4')}</span>
                  </button>
                  <div class="volume-panel" aria-hidden="true">
                    <input id="volume-range" class="volume-slider" type="range" min="0" max="1" step="0.01" value="1" aria-label="Volume" />
                  </div>
                </div>
              </div>
              <div class="audio-track-meta hidden xl:block min-w-0 max-w-[200px]">
                <div class="text-white text-sm font-medium truncate" id="surah-name">-</div>
                <div class="text-emerald-300 text-xs truncate" id="verse-info">-</div>
              </div>
            </div>

            <!-- Center: Playback Controls -->
            <div class="flex items-center gap-4 justify-center">
              <!-- Skip Forward -->
              <button id="skip-forward" class="p-2 text-white hover:text-gold-400 transition-colors"
                      title="١٠ چرکە بۆ پێش">
                <div class="relative">
                  ${icon('skipForward', 'w-6 h-6')}
                  <span class="absolute -bottom-1 -left-1 text-[11px] text-gold-400">١٠</span>
                </div>
              </button>

              <!-- Play/Pause -->
              <button id="play-pause" class="w-12 h-12 bg-gold-500 hover:bg-gold-400 rounded-full
                                              flex items-center justify-center transition-colors">
                <span id="play-icon">${icon('play', 'w-6 h-6 text-emerald-900')}</span>
                <span id="pause-icon" class="hidden">${icon('pause', 'w-6 h-6 text-emerald-900')}</span>
              </button>

              <!-- Skip Backward -->
              <button id="skip-backward" class="p-2 text-white hover:text-gold-400 transition-colors"
                      title="١٠ چرکە بۆ پاش">
                <div class="relative">
                  ${icon('skipBackward', 'w-6 h-6')}
                  <span class="absolute -bottom-1 -right-1 text-[11px] text-gold-400">١٠</span>
                </div>
              </button>

            </div>

            <!-- Right: Speed Control -->
            <div class="audio-right-controls flex items-center flex-1 justify-end gap-2">
              <div class="audio-right-slot">
                <div class="speed-dropdown relative">
                  <button id="speed-btn" class="w-8 h-8 bg-emerald-800 rounded-lg text-gold-400
                                                hover:bg-emerald-700 transition-colors text-xs font-medium
                                                flex items-center justify-center">
                    <span id="speed-value">١x</span>
                  </button>
                  <div class="speed-options" id="speed-options">
                    ${this.speedOptions.map(speed => `
                      <div class="speed-option ${speed === 1 ? 'active' : ''}" data-speed="${speed}">
                        ${speed}x
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      <div id="audio-fab" class="audio-fab hidden group">
        <button id="fab-btn" class="relative w-14 h-14 bg-emerald-800 text-gold-400 rounded-full
                                     shadow-lg flex items-center justify-center hover:bg-emerald-700 transition-colors"
                title="Open player" aria-label="Open player">
          <span class="fab-ring absolute inset-0 rounded-full border border-gold-400/40 pointer-events-none"></span>
          <span id="fab-play-icon" class="relative">${icon('play', 'w-5 h-5')}</span>
          <span id="fab-pause-icon" class="relative hidden">${icon('pause', 'w-5 h-5')}</span>
        </button>
        <div class="fab-tooltip absolute bottom-full mb-2 right-0 bg-emerald-900 text-white text-xs
                    px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100
                    transition-opacity pointer-events-none">
          <div id="fab-surah-name">—</div>
          <div id="fab-verse-info" class="text-emerald-300">—</div>
        </div>
      </div>
    `;
  },

  /**
   * Set up event listeners
   */
  _setupEventListeners() {
    if (!this.audioElement) return;

    // Audio element events
    this.audioElement.addEventListener('loadedmetadata', () => {
      this._updateDuration();
    });

    this.audioElement.addEventListener('timeupdate', () => {
      this._updateProgress();
    });

    this.audioElement.addEventListener('play', () => {
      this._updatePlayState(true);
    });

    this.audioElement.addEventListener('pause', () => {
      this._updatePlayState(false);
    });

    this.audioElement.addEventListener('ended', () => {
      this._updatePlayState(false);
    });

    // Loading state events
    this.audioElement.addEventListener('waiting', () => {
      this._updateLoadingState(true);
    });

    this.audioElement.addEventListener('playing', () => {
      this._updateLoadingState(false);
    });

    this.audioElement.addEventListener('canplay', () => {
      this._updateLoadingState(false);
    });

    // Play/Pause button
    const playPauseBtn = $('#play-pause', this.container);
    if (playPauseBtn) {
      playPauseBtn.addEventListener('click', () => {
        if (window.matchMedia('(max-width: 768px)').matches) {
          this._hapticTick(6);
        }
        this.togglePlay();
      });
    }

    // Skip buttons
    const skipForward = $('#skip-forward', this.container);
    const skipBackward = $('#skip-backward', this.container);

    if (skipForward) {
      skipForward.addEventListener('click', () => this.skip(10));
    }
    if (skipBackward) {
      skipBackward.addEventListener('click', () => this.skip(-10));
    }

    const volumeBtn = $('#volume-btn', this.container);
    const volumeRange = $('#volume-range', this.container);
    if (volumeRange) {
      const initialVolume = Number.isFinite(this.audioElement?.volume) ? this.audioElement.volume : 1;
      volumeRange.value = String(initialVolume);
      this.lastVolume = initialVolume || this.lastVolume || 1;
      volumeRange.addEventListener('input', () => {
        if (!this.audioElement) return;
        const nextVolume = Math.max(0, Math.min(1, parseFloat(volumeRange.value)));
        this.audioElement.volume = nextVolume;
        this.audioElement.muted = nextVolume === 0;
        if (nextVolume > 0) {
          this.lastVolume = nextVolume;
        }
        this._updateVolumeUI();
      });
    }

    const volumePanel = this.container.querySelector('.volume-panel');
    const adjustVolume = (delta) => {
      if (!this.audioElement || !volumeRange) return;
      const current = Number.isFinite(this.audioElement.volume) ? this.audioElement.volume : 0;
      const nextVolume = Math.max(0, Math.min(1, current + delta));
      this.audioElement.volume = nextVolume;
      this.audioElement.muted = nextVolume === 0;
      if (nextVolume > 0) {
        this.lastVolume = nextVolume;
      }
      volumeRange.value = String(nextVolume);
      this._updateVolumeUI();
    };

    const handleVolumeWheel = (e) => {
      e.preventDefault();
      const step = 0.05;
      const delta = e.deltaY < 0 ? step : -step;
      adjustVolume(delta);
    };

    if (volumePanel) {
      volumePanel.addEventListener('wheel', handleVolumeWheel, { passive: false });
    }
    if (volumeRange) {
      volumeRange.addEventListener('wheel', handleVolumeWheel, { passive: false });
    }

    if (volumeBtn) {
      volumeBtn.addEventListener('click', () => {
        if (!this.audioElement) return;
        const isMuted = this.audioElement.muted || this.audioElement.volume === 0;
        if (isMuted) {
          const restoreVolume = this.lastVolume || 1;
          this.audioElement.muted = false;
          this.audioElement.volume = restoreVolume;
          if (volumeRange) volumeRange.value = String(restoreVolume);
        } else {
          this.lastVolume = this.audioElement.volume || this.lastVolume || 1;
          this.audioElement.muted = true;
          this.audioElement.volume = 0;
          if (volumeRange) volumeRange.value = '0';
        }
        this._updateVolumeUI();
      });
    }
    this._updateVolumeUI();

    // Progress bar seeking (drag anywhere)
    const progressTrack = $('#progress-track', this.container);
    if (progressTrack) {
      const startSeek = (e) => {
        if (e.button !== undefined && e.button !== 0) return;
        this.isSeeking = true;
        this.lastSnapIndex = null;
        this._setActiveMarker(null);
        if (this.markerTooltipTimeout) {
          clearTimeout(this.markerTooltipTimeout);
          this.markerTooltipTimeout = null;
        }
        progressTrack.classList.add('is-dragging');
        document.body.style.userSelect = 'none';
        if (progressTrack.setPointerCapture) {
          progressTrack.setPointerCapture(e.pointerId);
        }
        this._seekFromClick(e);
      };

      const moveSeek = (e) => {
        if (!this.isSeeking) return;
        this._seekFromClick(e);
      };

      const endSeek = (e) => {
        if (!this.isSeeking) return;
        this.isSeeking = false;
        progressTrack.classList.remove('is-dragging');
        progressTrack.classList.remove('snap-active');
        this._setActiveMarker(null);
        document.body.style.userSelect = '';
        if (progressTrack.hasPointerCapture &&
            progressTrack.hasPointerCapture(e.pointerId) &&
            progressTrack.releasePointerCapture) {
          progressTrack.releasePointerCapture(e.pointerId);
        }
      };

      progressTrack.addEventListener('pointerdown', startSeek);
      progressTrack.addEventListener('pointermove', moveSeek);
      progressTrack.addEventListener('pointerup', endSeek);
      progressTrack.addEventListener('pointercancel', endSeek);
    }

    // Speed control
    const speedBtn = $('#speed-btn', this.container);
    const speedOptionsEl = $('#speed-options', this.container);
    const speedOptions = this.container.querySelectorAll('.speed-option');
    speedOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        const speed = parseFloat(e.target.dataset.speed);
        this.setSpeed(speed);
        if (speedOptionsEl) {
          speedOptionsEl.classList.remove('speed-options-visible');
        }
      });
    });
    if (speedBtn && speedOptionsEl) {
      speedBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        speedOptionsEl.classList.toggle('speed-options-visible');
      });
      document.addEventListener('click', () => {
        speedOptionsEl.classList.remove('speed-options-visible');
      });
    }

    const minimizeBtn = $('#minimize-btn', this.container);
    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', () => this.minimize());
    }

    const closeBtn = $('#close-btn', this.container);
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    const closeBtnMobile = $('#close-btn-mobile', this.container);
    if (closeBtnMobile) {
      closeBtnMobile.addEventListener('click', () => this.close());
    }

    const fabBtn = $('#fab-btn', this.container);
    if (fabBtn) {
      fabBtn.addEventListener('click', () => this.restore());
    }

    const audioBar = this.container.querySelector('.audio-bar');
    if (audioBar) {
      this._setupSwipeToClose(audioBar);
    }
  },

  /**
   * Load audio for a surah
   * @param {Object} surah - Surah object with audioUrl
   */
  loadSurah(surah) {
    if (!this.audioElement || !surah.audioUrl) return;

    this.currentSurah = surah;
    this._sourcePromise = this._setAudioSource(surah.audioUrl);

    // Update UI
    const surahName = $('#surah-name', this.container);
    if (surahName) {
      surahName.textContent = `سورەتی ${surah.nameKurdish}`;
    }
    const fabSurahName = $('#fab-surah-name', this.container);
    if (fabSurahName) {
      fabSurahName.textContent = `سورەتی ${surah.nameKurdish}`;
    }

    // Update state
    State.updateAudioState({
      surahId: surah.id,
      loaded: true,
      playing: false,
      currentTime: 0,
      duration: surah.audioDuration || 0
    });

    // Set up verse markers
    this._renderVerseMarkers(surah.verses, surah.audioDuration);

    // Initialize audio sync with audio element and verses
    AudioSync.init(
      this.audioElement,
      surah.verses,
      (verseIndex) => this.updateVerseInfo(verseIndex, surah)
    );

    // Show player
    this.show();
  },

  /**
   * Render verse markers on progress bar
   * @param {Array} verses - Verses with timestamps
   * @param {number} duration - Total duration
   */
  _renderVerseMarkers(verses, duration) {
    const container = $('#verse-markers', this.container);
    if (!container || !verses || !duration) return;

    const verseLabel = 'ئایەتی';
    const formatVerseNumbers = (numbers = []) => {
      const unique = [...new Set(numbers.map((num) => Number(num)).filter((num) => Number.isFinite(num)))];
      const localized = unique.map((num) => toKurdishNumber(num));
      if (localized.length <= 1) return localized[0] || '';
      if (localized.length === 2) return `${localized[0]} و ${localized[1]}`;
      return `${localized.slice(0, -1).join('، ')} و ${localized[localized.length - 1]}`;
    };

    const markers = getVerseMarkers(verses, duration);
    this.markers = markers;
    this.lastSnapIndex = null;
    this.markerElements = new Map();
    this.activeMarkerIndex = null;

    container.innerHTML = markers.map(marker => `
      <div class="verse-marker"
           style="left: ${marker.position}%"
           data-verse="${marker.index}">
        <div class="verse-marker-line"></div>
        <div class="verse-marker-tooltip">
          ${verseLabel} ${formatVerseNumbers(marker.verseNumbers || [marker.verseNumber])}
        </div>
      </div>
    `).join('');

    // Add click handlers for markers
    container.querySelectorAll('[data-verse]').forEach(marker => {
      marker.addEventListener('click', (e) => {
        e.stopPropagation();
        const verseIndex = parseInt(marker.dataset.verse, 10);
        if (!Number.isInteger(verseIndex)) return;
        this._setActiveMarker(verseIndex);
        const verseTime = AudioSync.getVerseTimestamp(verseIndex);
        if (!Number.isFinite(verseTime)) return;
        this.seekTo(verseTime);
        this._hapticTick(8);
        this.play();
        if (this.markerTooltipTimeout) {
          clearTimeout(this.markerTooltipTimeout);
        }
        this.markerTooltipTimeout = setTimeout(() => {
          if (!this.isSeeking) {
            this._setActiveMarker(null);
          }
        }, 1200);
      });
      const verseIndex = parseInt(marker.dataset.verse, 10);
      const markerData = markers.find((item) => item.index === verseIndex);
      const verseIndices = Array.isArray(markerData?.verseIndices) && markerData.verseIndices.length
        ? markerData.verseIndices
        : [verseIndex];
      verseIndices.forEach((idx) => {
        if (Number.isInteger(idx)) {
          this.markerElements.set(idx, marker);
        }
      });
    });
  },

  /**
   * Toggle play/pause
   */
  togglePlay() {
    if (!this.audioElement) return;

    if (this.audioElement.paused) {
      this.play();
    } else {
      this.pause();
    }
  },

  /**
   * Play audio
   */
  play() {
    if (!this.audioElement) return;
    if (!this.isVisible && !this.isMinimized) {
      this.restore();
    }
    Promise.resolve(this._sourcePromise)
      .catch(() => {})
      .finally(() => {
        this.audioElement.play().catch(err => {
          console.error('Error playing audio:', err);
        });
      });
  },

  /**
   * Pause audio
   */
  pause() {
    if (!this.audioElement) return;
    this.audioElement.pause();
  },

  /**
   * Skip forward/backward
   * @param {number} seconds - Seconds to skip (positive or negative)
   */
  skip(seconds) {
    if (!this.audioElement) return;
    const duration = this._getSeekDuration();
    this.audioElement.currentTime = Math.max(0,
      Math.min(duration, this.audioElement.currentTime + seconds)
    );
  },

  /**
   * Set playback speed
   * @param {number} speed - Playback speed (0.5 to 2)
   */
  setSpeed(speed) {
    if (!this.audioElement) return;
    this.audioElement.playbackRate = speed;
    this.currentSpeed = speed;

    // Update UI
    const speedValue = $('#speed-value', this.container);
    if (speedValue) {
      speedValue.textContent = `${speed}x`;
    }

    // Update active state
    this.container.querySelectorAll('.speed-option').forEach(option => {
      option.classList.toggle('active', parseFloat(option.dataset.speed) === speed);
    });

    State.updateAudioState({ speed });
  },

  _setupSwipeToClose(audioBar) {
    const isMobile = () => window.matchMedia('(max-width: 768px)').matches;
    const shouldIgnoreSwipe = (target) =>
      target.closest('#progress-track') ||
      target.closest('button') ||
      target.closest('.speed-dropdown');

    const start = (e) => {
      if (!this.isVisible || !isMobile()) return;
      if (shouldIgnoreSwipe(e.target)) return;
      if (e.touches.length > 1) return;
      const touch = e.touches[0];
      this.isSwiping = true;
      this.swipeStartX = touch.clientX;
      this.swipeStartY = touch.clientY;
      this.swipeCurrentY = touch.clientY;
      audioBar.classList.add('is-swiping');
    };

    const move = (e) => {
      if (!this.isSwiping || !isMobile()) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - this.swipeStartX;
      const deltaY = touch.clientY - this.swipeStartY;
      if (Math.abs(deltaX) > Math.abs(deltaY)) return;
      if (deltaY < 0) return;
      this.swipeCurrentY = touch.clientY;
      audioBar.style.transform = `translateY(${deltaY}px)`;
      e.preventDefault();
    };

    const end = () => {
      if (!this.isSwiping) return;
      const deltaY = this.swipeCurrentY - this.swipeStartY;
      this.isSwiping = false;
      audioBar.classList.remove('is-swiping');
      audioBar.style.transform = '';
      if (deltaY > 60) {
        this.close();
        this._hapticTick(15);
      }
    };

    audioBar.addEventListener('touchstart', start, { passive: true });
    audioBar.addEventListener('touchmove', move, { passive: false });
    audioBar.addEventListener('touchend', end);
    audioBar.addEventListener('touchcancel', end);
  },

  _hapticTick(duration = 8) {
    if (navigator.vibrate) {
      navigator.vibrate(duration);
    }
  },

  _updateVolumeUI() {
    if (!this.container || !this.audioElement) return;
    const volumeControl = this.container.querySelector('.volume-control');
    if (!volumeControl) return;
    const isMuted = this.audioElement.muted || this.audioElement.volume === 0;
    volumeControl.classList.toggle('is-muted', isMuted);

    // Toggle volume icons
    const volumeIcon = this.container.querySelector('.volume-icon');
    const volumeMuteIcon = this.container.querySelector('.volume-mute-icon');
    if (volumeIcon && volumeMuteIcon) {
      volumeIcon.classList.toggle('hidden', isMuted);
      volumeMuteIcon.classList.toggle('hidden', !isMuted);
    }

    const volumeBtn = $('#volume-btn', this.container);
    if (volumeBtn) {
      volumeBtn.setAttribute('aria-label', isMuted ? 'Unmute audio' : 'Mute audio');
      volumeBtn.setAttribute('title', isMuted ? 'Unmute' : 'Mute');
    }

    const volumeRange = $('#volume-range', this.container);
    if (volumeRange) {
      const volumeValue = isMuted ? 0 : this.audioElement.volume;
      volumeRange.style.setProperty('--volume-fill', `${Math.round(volumeValue * 100)}%`);
    }
  },

  _setActiveMarker(index) {
    if (this.activeMarkerIndex !== null) {
      const prev = this.markerElements.get(this.activeMarkerIndex);
      if (prev) prev.classList.remove('is-snap');
    }
    if (Number.isInteger(index)) {
      const next = this.markerElements.get(index);
      if (next) next.classList.add('is-snap');
      this.activeMarkerIndex = index;
    } else {
      this.activeMarkerIndex = null;
    }
  },

  _getSnap(positionPx, trackWidth, duration) {
    if (!this.markers.length || !trackWidth || !duration) return null;

    const isDesktop = !window.matchMedia('(max-width: 768px)').matches;
    let closest = null;
    for (const marker of this.markers) {
      const markerTime = AudioSync.getVerseTimestamp(marker.index);
      if (!Number.isFinite(markerTime)) {
        continue;
      }
      const markerPx = (marker.position / 100) * trackWidth;
      const distance = Math.abs(positionPx - markerPx);
      if (!closest || distance < closest.distance) {
        closest = { marker, distance, time: markerTime };
      }
    }

    const thresholdPx = isDesktop
      ? Math.max(3, trackWidth * 0.003)
      : Math.max(1.5, trackWidth * 0.0015);
    if (!closest || closest.distance > thresholdPx) return null;

    const time = Math.max(0, Math.min(duration, closest.time));
    const progress = Math.max(0, Math.min(100, closest.marker.position));
    return { time, progress, index: closest.marker.index, distance: closest.distance };
  },

  /**
   * Seek audio from pointer position on progress bar
   * @param {PointerEvent|MouseEvent|TouchEvent} e - Pointer event
   */
  _seekFromClick(e) {
    if (!this.audioElement) return;

    const track = $('#progress-track', this.container);
    if (!track) return;

    const rect = track.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches ? e.touches[0].clientX : null);
    if (clientX === null) return;

    // LTR: calculate from left side (progress bar fills left to right)
    const position = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const duration = this._getSeekDuration();
    if (!duration) return;
    const ratio = rect.width ? position / rect.width : 0;
    let newTime = ratio * duration;
    let progress = ratio * 100;

    const snap = this._getSnap(position, rect.width, duration);
    if (snap) {
      track.classList.toggle('snap-active', true);
      newTime = snap.time;
      progress = snap.progress;
      this._setActiveMarker(snap.index);
      const hapticThreshold = Math.max(1, rect.width * 0.001);
      if (snap.index !== this.lastSnapIndex && snap.distance <= hapticThreshold) {
        this._hapticTick(6);
        this.lastSnapIndex = snap.index;
      } else if (snap.distance > hapticThreshold) {
        this.lastSnapIndex = null;
      }
    } else {
      track.classList.toggle('snap-active', false);
      this.lastSnapIndex = null;
      this._setActiveMarker(null);
    }

    this.audioElement.currentTime = Math.max(0, Math.min(duration, newTime));
    this._updateProgressUI(progress, this.audioElement.currentTime);
    State.updateAudioState({ currentTime: this.audioElement.currentTime });
  },

  /**
   * Update progress UI elements
   * @param {number} progress - Progress percentage (0-100)
   * @param {number} currentTime - Current time in seconds
   */
  _updateProgressUI(progress, currentTime) {
    const progressFill = $('#progress-fill', this.container);
    const progressHandle = $('#progress-handle', this.container);
    const currentTimeEl = $('#current-time', this.container);

    if (progressFill) {
      progressFill.style.width = `${progress}%`;
    }
    if (progressHandle) {
      progressHandle.style.left = `${progress}%`;
    }
    if (currentTimeEl) {
      currentTimeEl.textContent = formatDuration(currentTime);
    }
    this._syncTimeWidths();
  },

  _syncTimeWidths() {
    const durationEl = $('#duration', this.container);
    const currentTimeEl = $('#current-time', this.container);
    if (!durationEl || !currentTimeEl) return;

    durationEl.style.minWidth = '';
    currentTimeEl.style.minWidth = '';

    // Keep enough room for window controls on smaller desktop sizes.
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const isSmallDesktop = !isMobile && viewportWidth > 0 && viewportWidth <= 1400;
    const baseWidth = isMobile ? 44 : (isSmallDesktop ? 56 : 72);
    const maxWidth = Math.max(durationEl.offsetWidth, currentTimeEl.offsetWidth, baseWidth);
    if (!maxWidth) return;

    durationEl.style.minWidth = `${maxWidth}px`;
    currentTimeEl.style.minWidth = `${maxWidth}px`;
  },

  /**
   * Seek to a specific time
   * @param {number} time - Time in seconds
   */
  seekTo(time) {
    if (!this.audioElement) return;
    const duration = this._getSeekDuration();
    const clamped = Math.max(0, Math.min(duration, time));
    this.audioElement.currentTime = clamped;
    const progress = duration ? (clamped / duration) * 100 : 0;
    this._updateProgressUI(progress, clamped);
    State.updateAudioState({ currentTime: clamped });
  },

  /**
   * Update progress bar
   */
  _updateProgress() {
    if (!this.audioElement || this.isSeeking) return;

    const duration = this._getSeekDuration();
    const progress = calculateProgress(this.audioElement.currentTime, duration);
    this._updateProgressUI(progress, this.audioElement.currentTime);

    State.updateAudioState({
      currentTime: this.audioElement.currentTime
    });
  },

  /**
   * Update duration display
   */
  _updateDuration() {
    if (!this.audioElement) return;

    const durationEl = $('#duration', this.container);
    const duration = this._getSeekDuration();
    if (durationEl) {
      durationEl.textContent = formatDuration(duration);
    }
    this._syncTimeWidths();


    if (this.currentSurah?.verses?.length) {
      this._renderVerseMarkers(this.currentSurah.verses, duration);
    }

    State.updateAudioState({
      duration
    });
  },

  _getSeekDuration() {
    if (!this.audioElement) return 0;
    const duration = this.audioElement.duration;
    if (Number.isFinite(duration) && duration > 0) return duration;
    const seekable = this.audioElement.seekable;
    if (seekable && seekable.length) {
      const end = seekable.end(seekable.length - 1);
      if (Number.isFinite(end) && end > 0) return end;
    }
    const buffered = this.audioElement.buffered;
    if (buffered && buffered.length) {
      const end = buffered.end(buffered.length - 1);
      if (Number.isFinite(end) && end > 0) return end;
    }
    const stateDuration = State.get('audioState')?.duration;
    if (Number.isFinite(stateDuration) && stateDuration > 0) return stateDuration;
    return 0;
  },

  /**
   * Update play/pause button state
   * @param {boolean} playing - Whether audio is playing
   */
  _updatePlayState(playing) {
    const playIcon = $('#play-icon', this.container);
    const pauseIcon = $('#pause-icon', this.container);

    if (playIcon && pauseIcon) {
      playIcon.classList.toggle('hidden', playing);
      pauseIcon.classList.toggle('hidden', !playing);
    }

    const fab = $('#audio-fab', this.container);
    if (fab) {
      fab.classList.toggle('fab-playing', playing);
    }
    const fabPlayIcon = $('#fab-play-icon', this.container);
    const fabPauseIcon = $('#fab-pause-icon', this.container);
    if (fabPlayIcon && fabPauseIcon) {
      fabPlayIcon.classList.toggle('hidden', playing);
      fabPauseIcon.classList.toggle('hidden', !playing);
    }

    State.updateAudioState({ playing });
  },

  /**
   * Update loading state
   * @param {boolean} loading - Whether audio is loading
   */
  _updateLoadingState(loading) {
    State.updateAudioState({ loading });
  },

  /**
   * Update verse info display
   * @param {number|number[]} verseIndex - Current verse index or indices
   * @param {Object} surah - Current surah
   */
  updateVerseInfo(verseIndex, surah) {
    const verseInfo = $('#verse-info', this.container);
    if (!surah) return;

    const index = Array.isArray(verseIndex)
      ? (verseIndex.length ? verseIndex[0] : -1)
      : verseIndex;
    if (index < 0) return;

    const verse = surah.verses[index];
    if (verse) {
      const verseText = `ئایەتی ${toKurdishNumber(verse.number)} لە ${toKurdishNumber(surah.verseCount)}`;
      if (verseInfo) {
        verseInfo.textContent = verseText;
      }
      const fabVerseInfo = $('#fab-verse-info', this.container);
      if (fabVerseInfo) {
        fabVerseInfo.textContent = verseText;
      }
    }
  },

  /**
   * Show audio player
   */
  show() {
    this.restore();
  },

  /**
   * Hide audio player
   */
  hide() {
    if (!this.isVisible) return;
    this._setBarVisible(false);
    this.isVisible = false;
    this._setContentPadding(false);
  },

  /**
   * Minimize audio player to FAB
   */
  minimize() {
    if (!this.isVisible) return;
    this._setBarVisible(false);
    this._setFabVisible(true);
    this.isVisible = false;
    this.isMinimized = true;
    this._setContentPadding(false);
  },

  /**
   * Restore audio player from FAB
   */
  restore() {
    this._setBarVisible(true);
    this._setFabVisible(false);
    this.isVisible = true;
    this.isMinimized = false;
    this._setContentPadding(true);
  },

  /**
   * Close and stop audio playback
   */
  close() {
    if (this.audioElement) {
      this.audioElement.pause();
    }
    AudioSync.updateVerses([]);
    if (this.audioElement) {
      this.audioElement.currentTime = 0;
    }
    this._revokeBlobUrl();
    this.currentSurah = null;

    this._setBarVisible(false);
    this._setFabVisible(false);
    this.isVisible = false;
    this.isMinimized = false;
    this._setContentPadding(false);

    document.querySelectorAll('.verse-item.highlighted, .active-ayah').forEach((element) => {
      element.classList.remove('highlighted', 'active-ayah');
    });
    State.set('currentVerseIndex', -1);

    State.updateAudioState({
      playing: false,
      currentTime: 0,
      loaded: false,
      surahId: null
    });
  },

  async _setAudioSource(audioUrl) {
    if (!this.audioElement) return;
    const token = ++this._sourceToken;
    this._revokeBlobUrl();
    const resolvedAudioUrl = await this._resolveAudioUrl(audioUrl);

    const isLocal = this._isLocalAudio(resolvedAudioUrl);
    this.audioElement.preload = isLocal ? 'auto' : 'metadata';

    const setSource = (src) => {
      if (token !== this._sourceToken) return;
      this.audioElement.src = src;
      this.audioElement.load();
    };

    if (isLocal) {
      try {
        const response = await fetch(encodeURI(resolvedAudioUrl));
        if (!response.ok) {
          throw new Error(`Failed to load audio: ${response.status}`);
        }
        const buffer = await response.arrayBuffer();
        if (token !== this._sourceToken) return;
        const blob = new Blob([buffer], { type: 'audio/mpeg' });
        this._blobUrl = URL.createObjectURL(blob);
        setSource(this._blobUrl);
      } catch (error) {
        console.warn('Falling back to direct audio src:', error);
        setSource(resolvedAudioUrl);
      }
    } else {
      setSource(resolvedAudioUrl);
    }

    await this._waitForMetadata();
  },

  _waitForMetadata() {
    return new Promise((resolve) => {
      if (!this.audioElement) return resolve();
      const duration = this.audioElement.duration;
      if (Number.isFinite(duration) && duration > 0) return resolve();
      const onLoaded = () => resolve();
      this.audioElement.addEventListener('loadedmetadata', onLoaded, { once: true });
    });
  },

  _revokeBlobUrl() {
    if (this._blobUrl) {
      URL.revokeObjectURL(this._blobUrl);
      this._blobUrl = null;
    }
  },

  _isLocalAudio(audioUrl) {
    return !/^(?:https?:|blob:|data:)/i.test(audioUrl);
  },

  async _resolveAudioUrl(audioUrl) {
    if (!audioUrl || typeof audioUrl !== 'string') return audioUrl;

    const trimmed = audioUrl.trim();
    if (!this._isLocalAudio(trimmed)) {
      return trimmed;
    }

    const normalizedPath = trimmed.replace(/^\.?\//, '');
    const mediaUrl = await this._buildGitHubPagesMediaUrl(normalizedPath);
    return mediaUrl || encodeURI(normalizedPath);
  },

  async _buildGitHubPagesMediaUrl(relativePath) {
    if (!relativePath || !relativePath.startsWith('assets/audio/')) {
      return null;
    }

    const repoMeta = this._getGitHubRepoMeta();
    if (!repoMeta) return null;

    const branch = await this._getGitHubDefaultBranch(repoMeta);
    const encodedBranch = encodeURIComponent(branch || 'main');
    const encodedPath = relativePath
      .split('/')
      .map((segment) => {
        try {
          return encodeURIComponent(decodeURIComponent(segment));
        } catch (error) {
          return encodeURIComponent(segment);
        }
      })
      .join('/');

    return `https://media.githubusercontent.com/media/${repoMeta.owner}/${repoMeta.repo}/${encodedBranch}/${encodedPath}`;
  },

  _getGitHubRepoMeta() {
    if (this._githubRepoMeta) {
      return this._githubRepoMeta;
    }

    if (typeof window === 'undefined') return null;

    const metaRepo = document.querySelector('meta[name="github-repo"]')?.getAttribute('content')?.trim();
    const globalRepo = window.__TADABUR_GITHUB_REPO__?.trim?.();
    const configuredRepo = metaRepo || globalRepo || '';
    if (configuredRepo && configuredRepo.includes('/')) {
      const [owner, repo] = configuredRepo.split('/').map((value) => value.trim()).filter(Boolean);
      if (owner && repo) {
        this._githubRepoMeta = { owner, repo };
        return this._githubRepoMeta;
      }
    }

    const host = window.location.hostname || '';
    if (!host.endsWith('.github.io')) {
      return null;
    }

    const owner = host.split('.')[0];
    if (!owner) return null;

    const segments = window.location.pathname.split('/').filter(Boolean);
    const repo = segments[0] || `${owner}.github.io`;
    this._githubRepoMeta = { owner, repo };
    return this._githubRepoMeta;
  },

  async _getGitHubDefaultBranch(repoMeta) {
    if (!repoMeta) return 'main';

    const metaBranch = document.querySelector('meta[name="github-branch"]')?.getAttribute('content')?.trim();
    const globalBranch = window.__TADABUR_GITHUB_BRANCH__?.trim?.();
    const configuredBranch = metaBranch || globalBranch || '';
    if (configuredBranch) {
      return configuredBranch;
    }

    if (!this._githubBranchPromise) {
      this._githubBranchPromise = (async () => {
        try {
          const response = await fetch(`https://api.github.com/repos/${repoMeta.owner}/${repoMeta.repo}`);
          if (!response.ok) return 'main';
          const payload = await response.json();
          const branch = payload?.default_branch;
          return typeof branch === 'string' && branch.trim() ? branch.trim() : 'main';
        } catch (error) {
          return 'main';
        }
      })();
    }

    return this._githubBranchPromise;
  },

  _setBarVisible(visible) {
    const audioBar = this.container?.querySelector('.audio-bar');
    if (audioBar) {
      audioBar.classList.toggle('visible', visible);
    }
  },

  _setFabVisible(visible) {
    const fab = $('#audio-fab', this.container);
    if (fab) {
      fab.classList.toggle('hidden', !visible);
    }
  },

  _setContentPadding(enabled) {
    const spacing = enabled ? '120px' : '';
    const mainContent = document.getElementById('app-content');
    const footerMount = document.getElementById('footer');
    const currentRoute = State.get('currentRoute') || '';
    const isReadingRoute = typeof currentRoute === 'string' && currentRoute.startsWith('/surah/');
    const footerInner = footerMount?.querySelector('footer') || null;

    // Reading pages hide the footer, so reserve space in main content only there.
    // On other pages, apply spacing inside the rendered footer element (not the mount wrapper)
    // to avoid transparent white gaps between content and footer.
    if (mainContent) {
      mainContent.style.paddingBottom = isReadingRoute ? spacing : '';
    }
    if (footerMount) {
      footerMount.style.paddingBottom = '';
    }
    if (footerInner) {
      footerInner.style.paddingBottom = isReadingRoute ? '' : spacing;
    } else if (!isReadingRoute && enabled && footerMount && typeof window !== 'undefined') {
      // Footer may render slightly after route change; apply spacing once it's mounted.
      window.setTimeout(() => {
        const retryFooterInner = footerMount.querySelector('footer');
        if (retryFooterInner) {
          retryFooterInner.style.paddingBottom = spacing;
        }
      }, 0);
    }
  },

  /**
   * Handle audio state changes
   * @param {Object} state - New audio state
   */
  _onAudioStateChange(state) {
    // Handle state updates from other components
  },

  /**
   * Unmount component
   */
  unmount() {
    if (this._routeUnsubscribe) {
      this._routeUnsubscribe();
      this._routeUnsubscribe = null;
    }
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
    }
    AudioSync.destroy();
    this.isVisible = false;
    this.isMinimized = false;
    this.container.innerHTML = '';
  }
};

export default AudioPlayer;
