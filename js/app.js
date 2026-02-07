/**
 * Main Application Entry Point
 * Initializes router, loads data, and mounts persistent components
 */

import State from './state.js';
import Router from './router.js';
import Header from './components/header.js';
import AudioPlayer from './components/audioPlayer.js';
import Footer from './components/footer.js';
import { AudioSync } from './utils/audio.js';

// Import pages
import HomePage from './pages/home.js';
import AudioLessonsPage from './pages/audioLessons.js';
import ReadingViewPage from './pages/readingView.js';
import PreamblePage from './pages/preamble.js';
import BooksPage from './pages/books.js';
import TafsirReviewsPage from './pages/tafsirReviews.js';

/**
 * Application initialization
 */
const App = {
  /**
   * Initialize the application
   */
  async init() {
    try {
      // Show loading state
      this._showLoading(true);

      // Load application data
      await State.loadData();

      // Get container elements
      const headerContainer = document.getElementById('header');
      const contentContainer = document.getElementById('app-content');
      const audioPlayerContainer = document.getElementById('audio-player');
      const footerContainer = document.getElementById('footer');

      // Mount persistent header
      if (headerContainer) {
        Header.mount(headerContainer);
      }

      // Mount persistent audio player
      if (audioPlayerContainer) {
        AudioPlayer.mount(audioPlayerContainer);
      }

      if (footerContainer) {
        Footer.mount(footerContainer);
      }

      // Initialize audio sync with audio element
      const audioElement = document.getElementById('audio-element');
      if (audioElement) {
        // Audio sync will be initialized when a surah is loaded
      }

      // Register routes
      this._registerRoutes();

      // Initialize router
      if (contentContainer) {
        Router.init(contentContainer);
      }

      // Hide loading state
      this._showLoading(false);

    } catch (error) {
      console.error('Failed to initialize application:', error);
      this._showError();
    }
  },

  /**
   * Register all application routes
   */
  _registerRoutes() {
    Router.register('/', HomePage);
    Router.register('/audio-lessons', AudioLessonsPage);
    Router.register('/surah/:id', ReadingViewPage);
    Router.register('/preamble/:id', PreamblePage);
    Router.register('/books', BooksPage);
    Router.register('/tafsir-reviews', TafsirReviewsPage);
  },

  /**
   * Show/hide loading overlay
   * @param {boolean} show - Whether to show loading
   */
  _showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      if (show) {
        overlay.style.opacity = '1';
        overlay.style.visibility = 'visible';
      } else {
        overlay.style.opacity = '0';
        setTimeout(() => {
          overlay.style.visibility = 'hidden';
          overlay.style.display = 'none';
        }, 500);
      }
    }
  },

  /**
   * Show error state
   */
  _showError() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.innerHTML = `
        <div class="text-center">
          <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <h2 class="text-white text-xl font-bold mb-2">هەڵەیەک ڕوویدا</h2>
          <p class="text-emerald-300 mb-4">ببورە، نەتوانرا داتاکان باربکرێن</p>
          <button onclick="location.reload()" class="px-6 py-2 bg-gold-500 text-emerald-900 rounded-lg font-medium hover:bg-gold-400 transition-colors">
            هەوڵی دووبارە
          </button>
        </div>
      `;
    }
  }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}

export default App;
