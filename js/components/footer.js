/**
 * Footer Component
 */

import State from '../state.js';
import { icon } from '../utils/dom.js';

const Footer = {
  container: null,
  unsubscribe: null,

  mount(container) {
    this.container = container;
    this.render();
    this.unsubscribe = State.subscribe('currentRoute', () => this.render());
  },

  render() {
    if (!this.container) return;

    const route = State.get('currentRoute') || '/';
    const hideFooter = route.startsWith('/surah/');

    if (hideFooter) {
      this.container.style.display = 'none';
      this.container.innerHTML = '';
      return;
    }

    const appData = State.get('appData') || {};
    const meta = appData.meta || {};
    const socialLinks = appData.socialLinks || {};
    const strings = appData.uiStrings || {};
    const navLinks = (appData.navigation || []).filter(item =>
      !item?.comingSoon && item?.route && !item.route.startsWith('/surah/')
    );
    const quickLinksTitle = 'بەستەری خێرا';
    const followTitle = 'پەیوەندیمان پێوە بکەن';
    const footerLinks = [...navLinks];
    const booksLink = { route: '/books', label: 'کتێب' };
    if (!footerLinks.some(item => item?.route === booksLink.route)) {
      footerLinks.push(booksLink);
    }

    this.container.style.display = 'block';
    this.container.innerHTML = `
      <footer class="bg-emerald-950 text-white py-8">
        <div class="max-w-7xl mx-auto px-4">
          <div class="flex flex-col lg:flex-row-reverse w-full items-center lg:items-start gap-6 mb-6">

            <div class="flex-1 flex flex-col items-center lg:items-end text-center lg:text-right order-3 lg:order-1">
              <h3 class="text-gold-400 font-bold mb-6">${followTitle}</h3>
              <div class="flex gap-2.5 items-center justify-center lg:justify-end mb-5 w-full">
                <a href="${socialLinks.telegram || '#'}" class="w-8 h-8 bg-cream-100/10 rounded-lg flex items-center justify-center hover:bg-cream-100/20 transition-colors">
                  <img src="assets/images/telegram.png" alt="Telegram" class="w-4 h-4" />
                </a>
                <a href="${socialLinks.youtube || '#'}" class="w-8 h-8 bg-cream-100/10 rounded-lg flex items-center justify-center hover:bg-cream-100/20 transition-colors">
                  ${icon('youtube', 'w-4 h-4 text-cream-200')}
                </a>
              </div>
              <a href="mailto:tadabbur@bnkayhalabjaytaza.org" class="text-cream-200 text-sm hover:text-gold-300 transition-colors">
                tadabbur@bnkayhalabjaytaza.org
              </a>
            </div>

            <div class="flex-1 flex flex-col items-center text-center order-2 md:order-2">
              <h3 class="text-gold-400 font-bold mb-3">${quickLinksTitle}</h3>
              <nav class="flex flex-col gap-1.5 items-center w-full">
                ${footerLinks.map(item => `
                  <a href="#${item.route}" class="text-cream-200 hover:text-gold-300 transition-colors text-sm">
                    ${item.label}
                  </a>
                `).join('')}
              </nav>
            </div>

            <div class="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left order-1 lg:order-3">
              <img src="assets/images/TadabburLogo.png" alt="${meta.appName || ''}" class="w-14 h-14 mb-3 opacity-90">
              <p class="text-cream-200 text-sm leading-relaxed max-w-[280px] text-center lg:text-right" dir="rtl">
                ${meta.tagline || ''}
              </p>
            </div>

          </div>

          <div class="border-t border-cream-100/20 pt-4 text-center">
            <p class="text-cream-200 text-sm" dir="rtl">
              ئەم پرۆژەیە بەشێکە لە <a href="https://newhalabja.org" target="_blank" rel="noopener noreferrer" class="text-gold-300 hover:text-gold-200 transition-colors">بنکەی هەڵەبجەی تازە</a>
            </p>
            <p class="text-cream-200 text-xs mt-2" dir="rtl">
              هەموو مافەکان پارێزراون © ${new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    `;
  },

  unmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
  }
};

export default Footer;
