/**
 * DOM Helper Utilities
 */

/**
 * Create an element with attributes and children
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Attributes object
 * @param {...(string|Node)} children - Child elements or text
 * @returns {HTMLElement} Created element
 */
export function createElement(tag, attrs = {}, ...children) {
  const element = document.createElement(tag);

  // Set attributes
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      const event = key.slice(2).toLowerCase();
      element.addEventListener(event, value);
    } else if (key === 'dataset' && typeof value === 'object') {
      Object.assign(element.dataset, value);
    } else if (value !== undefined && value !== null && value !== false) {
      element.setAttribute(key, value);
    }
  }

  // Append children
  for (const child of children) {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    } else if (Array.isArray(child)) {
      child.forEach(c => {
        if (c instanceof Node) element.appendChild(c);
      });
    }
  }

  return element;
}

/**
 * Shorthand for createElement
 */
export const el = createElement;

/**
 * Query selector shorthand
 * @param {string} selector - CSS selector
 * @param {Element} parent - Parent element (default: document)
 * @returns {Element|null} Found element
 */
export function $(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * Query selector all shorthand
 * @param {string} selector - CSS selector
 * @param {Element} parent - Parent element (default: document)
 * @returns {NodeList} Found elements
 */
export function $$(selector, parent = document) {
  return parent.querySelectorAll(selector);
}

/**
 * Clear all children from an element
 * @param {Element} element - Element to clear
 */
export function clearChildren(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Set HTML content safely
 * @param {Element} element - Target element
 * @param {string} html - HTML content
 */
export function setHTML(element, html) {
  element.innerHTML = html;
}

/**
 * Add class to element
 * @param {Element} element - Target element
 * @param {...string} classes - Classes to add
 */
export function addClass(element, ...classes) {
  element.classList.add(...classes);
}

/**
 * Remove class from element
 * @param {Element} element - Target element
 * @param {...string} classes - Classes to remove
 */
export function removeClass(element, ...classes) {
  element.classList.remove(...classes);
}

/**
 * Toggle class on element
 * @param {Element} element - Target element
 * @param {string} className - Class to toggle
 * @param {boolean} force - Force add/remove
 */
export function toggleClass(element, className, force) {
  element.classList.toggle(className, force);
}

/**
 * Check if element has class
 * @param {Element} element - Target element
 * @param {string} className - Class to check
 * @returns {boolean}
 */
export function hasClass(element, className) {
  return element.classList.contains(className);
}

/**
 * Scroll element into view smoothly
 * @param {Element} element - Element to scroll to
 * @param {Object} options - Scroll options
 */
export function scrollIntoView(element, options = {}) {
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    ...options
  });
}

/**
 * Show element
 * @param {Element} element - Element to show
 */
export function show(element) {
  element.style.display = '';
  element.removeAttribute('hidden');
}

/**
 * Hide element
 * @param {Element} element - Element to hide
 */
export function hide(element) {
  element.style.display = 'none';
}

/**
 * Check if element is visible
 * @param {Element} element - Element to check
 * @returns {boolean}
 */
export function isVisible(element) {
  return element.offsetParent !== null;
}

/**
 * Wait for animation/transition to complete
 * @param {Element} element - Element to watch
 * @param {string} type - 'animation' or 'transition'
 * @returns {Promise}
 */
export function waitForAnimation(element, type = 'transition') {
  return new Promise(resolve => {
    const eventName = type === 'animation' ? 'animationend' : 'transitionend';
    const handler = () => {
      element.removeEventListener(eventName, handler);
      resolve();
    };
    element.addEventListener(eventName, handler);
  });
}

/**
 * Create SVG icon element
 * @param {string} name - Icon name
 * @param {string} className - Additional classes
 * @returns {string} SVG HTML string
 */
export function icon(name, className = 'w-5 h-5') {
  const icons = {
    home: `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>`,
    headphones: `<svg class="${className}" fill="currentColor" viewBox="0 0 640 640"><path d="M160 288C160 199.6 231.6 128 320 128C408.4 128 480 199.6 480 288L480 325.5C470 322 459.2 320 448 320L432 320C405.5 320 384 341.5 384 368L384 496C384 522.5 405.5 544 432 544L448 544C501 544 544 501 544 448L544 288C544 164.3 443.7 64 320 64C196.3 64 96 164.3 96 288L96 448C96 501 139 544 192 544L208 544C234.5 544 256 522.5 256 496L256 368C256 341.5 234.5 320 208 320L192 320C180.8 320 170 321.9 160 325.5L160 288z"/></svg>`,
    book: `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>`,
    star: `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>`,
    info: `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
    search: `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>`,
    play: `<svg class="${className}" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>`,
    pause: `<svg class="${className}" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"></path></svg>`,
    skipForward: `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>`,
    skipBackward: `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>`,
    menu: `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>`,
    close: `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`,
    chevronLeft: `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>`,
    chevronRight: `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>`,
    telegram: `<svg class="${className}" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.88.03-.24.37-.49 1.02-.74 3.99-1.74 6.65-2.89 7.99-3.45 3.8-1.6 4.59-1.88 5.1-1.89.11 0 .37.03.54.17.14.12.18.28.2.45-.01.06.01.24 0 .38z"></path></svg>`,
    youtube: `<svg class="${className}" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"></path></svg>`,
    volume: `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.414a5 5 0 01-1.414-1.414M12 18.5V5.5L7 9H4a1 1 0 00-1 1v4a1 1 0 001 1h3l5 3.5z"></path></svg>`,
    volumeMute: `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15.414a5 5 0 01-1.414-1.414M12 18.5V5.5L7 9H4a1 1 0 00-1 1v4a1 1 0 001 1h3l5 3.5z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l6 6m0-6l-6 6"></path></svg>`,
    speed: `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>`,
    user: `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>`
  };

  return icons[name] || '';
}
