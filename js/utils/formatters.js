/**
 * Formatters and utility functions for Kurdish/Arabic text
 */

// Kurdish/Arabic numerals
const kurdishDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/**
 * Convert a number to Kurdish/Arabic numerals
 * @param {number|string} num - The number to convert
 * @returns {string} The number in Kurdish numerals
 */
export function toKurdishNumber(num) {
  return String(num).replace(/[0-9]/g, d => kurdishDigits[parseInt(d)]);
}

/**
 * Convert Kurdish/Arabic numerals back to standard numerals
 * @param {string} str - String with Kurdish numerals
 * @returns {string} String with standard numerals
 */
export function fromKurdishNumber(str) {
  return str.replace(/[٠-٩]/g, d => kurdishDigits.indexOf(d).toString());
}

/**
 * Format duration in seconds to MM:SS format with Kurdish numerals
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '٠٠:٠٠';

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return toKurdishNumber(formatted);
}

/**
 * Format duration in standard numerals
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
export function formatDurationStandard(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00';

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format duration in H:MM:SS or MM:SS format (smart)
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration with LTR wrapper
 */
export function formatSmartDuration(seconds) {
  const numeric = typeof seconds === 'string' ? Number(seconds) : seconds;
  if (!Number.isFinite(numeric)) {
    return '<span dir="ltr" class="duration-time">00:00</span>';
  }

  const normalized = Number.isInteger(numeric)
    ? (numeric < 120 ? numeric * 60 : numeric)
    : (() => {
        const minutes = Math.trunc(numeric);
        const secs = Math.round((numeric - minutes) * 100);
        return (minutes * 60) + secs;
      })();

  const hours = Math.floor(normalized / 3600);
  const mins = Math.floor((normalized % 3600) / 60);
  const secs = Math.floor(normalized % 60);

  let formatted;
  if (hours > 0) {
    formatted = `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  } else {
    formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return `<span dir="ltr" class="duration-time">${formatted}</span>`;
}

/**
 * Format playback speed for display
 * @param {number} speed - Playback speed (0.5 to 2)
 * @returns {string} Formatted speed string
 */
export function formatSpeed(speed) {
  return `${speed}x`;
}

/**
 * Get ordinal representation of a number in Kurdish
 * @param {number} num - The number
 * @returns {string} Ordinal string
 */
export function toKurdishOrdinal(num) {
  return toKurdishNumber(num) + 'ەم';
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Format verse reference
 * @param {number} surahNumber - Surah number
 * @param {number} verseNumber - Verse number
 * @returns {string} Formatted reference
 */
export function formatVerseRef(surahNumber, verseNumber) {
  return `${toKurdishNumber(surahNumber)}:${toKurdishNumber(verseNumber)}`;
}

/**
 * Format surah info for display
 * @param {Object} surah - Surah object
 * @returns {string} Formatted info
 */
export function formatSurahInfo(surah) {
  return `${surah.revelationType} • ${toKurdishNumber(surah.verseCount)} ئایەت`;
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit in ms
 * @returns {Function} Throttled function
 */
export function throttle(func, limit = 100) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
