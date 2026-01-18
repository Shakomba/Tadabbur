/**
 * Audio Synchronization Utilities
 */

const parseStartTime = (value) => {
  if (!Number.isFinite(value)) return null;
  if (value === 0) return 0;
  const minutes = Math.trunc(value);
  const fractional = value - minutes;
  const seconds = Math.round(fractional * 100);
  return (minutes * 60) + seconds;
};

const getValidTimings = (verses) => {
  const starts = verses.map((verse) => parseStartTime(verse.startTime));
  const hasPositiveStart = starts.some((start) => Number.isFinite(start) && start > 0);
  if (!hasPositiveStart) return [];

  const allowZeroStart = starts[0] === 0 && starts.slice(1).some((start) => Number.isFinite(start) && start > 0);

  const timings = [];
  starts.forEach((start, index) => {
    if (!Number.isFinite(start)) return;
    if (start === 0 && !(allowZeroStart && index === 0)) return;
    timings.push({ index, start });
  });

  return timings;
};

/**
 * Audio sync manager for verse highlighting
 */
export const AudioSync = {
  _audioElement: null,
  _verses: [],
  _onVerseChange: null,
  _animationFrame: null,
  _lastVerseKey: '',

  /**
   * Initialize audio sync with verses
   * @param {HTMLAudioElement} audioElement - The audio element
   * @param {Array} verses - Array of verse objects with timestamps
   * @param {Function} onVerseChange - Callback when active verse changes
   */
  init(audioElement, verses, onVerseChange) {
    this._audioElement = audioElement;
    this._verses = verses;
    this._onVerseChange = onVerseChange;
    this._lastVerseKey = '';

    // Set up event listeners
    this._setupListeners();
  },

  /**
   * Set up audio element event listeners
   */
  _setupListeners() {
    if (!this._audioElement) return;

    this._audioElement.addEventListener('play', () => this._startSync());
    this._audioElement.addEventListener('pause', () => this._stopSync());
    this._audioElement.addEventListener('ended', () => this._stopSync());
    this._audioElement.addEventListener('seeked', () => this._checkSync());
  },

  /**
   * Find active verse indices based on current time
   * @param {number} currentTime - Current playback time in seconds
   * @returns {number[]} Active verse indices
   */
  findActiveVerseIndices(currentTime) {
    const timings = getValidTimings(this._verses);
    if (!timings.length) return [];

    const starts = timings
      .map((timing) => timing.start)
      .sort((a, b) => a - b);

    const uniqueStarts = [];
    starts.forEach((start) => {
      if (uniqueStarts[uniqueStarts.length - 1] !== start) {
        uniqueStarts.push(start);
      }
    });

    if (!uniqueStarts.length || currentTime < uniqueStarts[0]) return [];

    let activeStart = uniqueStarts[0];
    uniqueStarts.forEach((start) => {
      if (currentTime >= start) {
        activeStart = start;
      }
    });

    return timings
      .filter((timing) => timing.start === activeStart)
      .map((timing) => timing.index);
  },

  /**
   * Find the active verse index based on current time
   * @param {number} currentTime - Current playback time in seconds
   * @returns {number} Index of active verse, or -1 if none
   */
  findActiveVerseIndex(currentTime) {
    const indices = this.findActiveVerseIndices(currentTime);
    return indices.length ? indices[0] : -1;
  },

  /**
   * Check sync and notify if verse changed
   */
  _checkSync() {
    if (!this._audioElement || !this._verses.length) return;

    const currentIndices = this.findActiveVerseIndices(this._audioElement.currentTime);
    const currentKey = currentIndices.length ? currentIndices.join(',') : '';

    if (currentKey !== this._lastVerseKey) {
      this._lastVerseKey = currentKey;
      if (this._onVerseChange) {
        this._onVerseChange(currentIndices);
      }
    }
  },

  /**
   * Start sync loop using requestAnimationFrame
   */
  _startSync() {
    const sync = () => {
      this._checkSync();
      if (this._audioElement && !this._audioElement.paused) {
        this._animationFrame = requestAnimationFrame(sync);
      }
    };
    this._animationFrame = requestAnimationFrame(sync);
  },

  /**
   * Stop sync loop
   */
  _stopSync() {
    if (this._animationFrame) {
      cancelAnimationFrame(this._animationFrame);
      this._animationFrame = null;
    }
  },

  /**
   * Seek to a specific verse
   * @param {number} verseIndex - Index of verse to seek to
   */
  seekToVerse(verseIndex) {
    if (!this._audioElement || verseIndex < 0 || verseIndex >= this._verses.length) {
      return;
    }

    const timing = getValidTimings(this._verses).find((entry) => entry.index === verseIndex);
    if (!timing) return;
    this._audioElement.currentTime = timing.start;
  },

  /**
   * Get timestamp for a verse
   * @param {number} verseIndex - Index of verse
   * @returns {number} Timestamp in seconds
   */
  getVerseTimestamp(verseIndex) {
    if (verseIndex < 0 || verseIndex >= this._verses.length) {
      return 0;
    }
    const timing = getValidTimings(this._verses).find((entry) => entry.index === verseIndex);
    return timing ? timing.start : NaN;
  },

  /**
   * Update verses (when surah changes)
   * @param {Array} verses - New array of verses
   */
  updateVerses(verses) {
    this._verses = verses;
    this._lastVerseKey = '';
  },

  /**
   * Cleanup
   */
  destroy() {
    this._stopSync();
    this._audioElement = null;
    this._verses = [];
    this._onVerseChange = null;
    this._lastVerseKey = '';
  }
};

/**
 * Format timestamp markers for progress bar
 * @param {Array} verses - Array of verse objects
 * @param {number} totalDuration - Total audio duration
 * @returns {Array} Array of marker positions (0-100%)
 */
export function getVerseMarkers(verses, totalDuration) {
  if (!verses || !totalDuration) return [];

  const timings = getValidTimings(verses);
  if (!timings.length) return [];

  return timings.map((timing) => ({
    index: timing.index,
    position: (timing.start / totalDuration) * 100,
    verseNumber: verses[timing.index].number ?? verses[timing.index].numberInSurah ?? timing.index + 1
  }));
}

/**
 * Calculate progress percentage
 * @param {number} currentTime - Current time in seconds
 * @param {number} duration - Total duration in seconds
 * @returns {number} Progress percentage (0-100)
 */
export function calculateProgress(currentTime, duration) {
  if (!duration) return 0;
  return Math.min((currentTime / duration) * 100, 100);
}

/**
 * Calculate time from progress percentage
 * @param {number} percentage - Progress percentage (0-100)
 * @param {number} duration - Total duration in seconds
 * @returns {number} Time in seconds
 */
export function calculateTimeFromProgress(percentage, duration) {
  return (percentage / 100) * duration;
}

export default AudioSync;
