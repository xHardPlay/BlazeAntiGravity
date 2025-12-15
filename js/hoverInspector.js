/**
 * Hover Inspector Module
 * Injected into the page to track mouse movements and identify elements.
 */

(function () {
    // Prevent multiple injections
    if (window.AgencySMMHoverInspector) {
        return;
    }

    const Inspector = {
        isActive: false,
        highlightedElement: null,
        overlay: null,
        lastEventTime: 0,
        THROTTLE_MS: 100,

        init() {
            this.createOverlay();
            this.bindEvents();
            window.AgencySMMHoverInspector = this;
            console.log('AgencySMM Hover Inspector Initialized');
        },

        createOverlay() {
            this.overlay = document.createElement('div');
            this.overlay.style.position = 'fixed';
            this.overlay.style.pointerEvents = 'none';
            this.overlay.style.background = 'rgba(52, 152, 219, 0.3)';
            this.overlay.style.border = '2px solid #3498db';
            this.overlay.style.zIndex = '999999';
            this.overlay.style.display = 'none';
            this.overlay.style.transition = 'all 0.1s ease';
            document.body.appendChild(this.overlay);
        },

        bindEvents() {
            document.addEventListener('mousemove', (e) => this.handleMouseMove(e), true);
            document.addEventListener('click', (e) => this.handleClick(e), true);

            // Listen for toggle messages
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                if (request.action === 'toggleInspector') {
                    this.toggle(request.state);
                }
            });
        },

        toggle(state) {
            this.isActive = state;
            if (!state) {
                this.overlay.style.display = 'none';
                this.highlightedElement = null;
            }
            console.log('Hover Inspector Active:', this.isActive);
        },

        handleMouseMove(e) {
            if (!this.isActive) return;

            const now = Date.now();
            if (now - this.lastEventTime < this.THROTTLE_MS) return;
            this.lastEventTime = now;

            const target = document.elementFromPoint(e.clientX, e.clientY);

            if (target && target !== this.highlightedElement && target !== this.overlay) {
                this.highlightedElement = target;
                this.highlightElement(target);
                this.sendElementInfo(target, 'hoverInfo');
            }
        },

        handleClick(e) {
            if (!this.isActive) return;

            e.preventDefault();
            e.stopPropagation();

            const target = document.elementFromPoint(e.clientX, e.clientY);
            if (target) {
                this.sendElementInfo(target, 'captureInfo');
                this.flashOverlay();
            }
        },

        flashOverlay() {
            const originalBg = this.overlay.style.background;
            this.overlay.style.background = 'rgba(46, 204, 113, 0.5)'; // Green flash
            setTimeout(() => {
                this.overlay.style.background = originalBg;
            }, 200);
        },

        highlightElement(el) {
            const rect = el.getBoundingClientRect();
            this.overlay.style.top = rect.top + 'px';
            this.overlay.style.left = rect.left + 'px';
            this.overlay.style.width = rect.width + 'px';
            this.overlay.style.height = rect.height + 'px';
            this.overlay.style.display = 'block';
        },

        sendElementInfo(el, action = 'hoverInfo') {
            const selector = this.getUniqueSelector(el);
            const xpath = this.getXPath(el);

            chrome.runtime.sendMessage({
                action: action,
                data: {
                    tagName: el.tagName.toLowerCase(),
                    selector: selector,
                    xpath: xpath,
                    text: (el.textContent || '').substring(0, 50).trim()
                }
            }).catch(err => {
                // Ignore "Extension context invalidated" errors that happen during reload
                // console.log('Error sending hover info:', err);
            });
        },

        /**
         * Generates a unique CSS selector for the element
         */
        getUniqueSelector(el) {
            if (!el || el.tagName.toLowerCase() === 'html') return 'html';
            if (el.tagName.toLowerCase() === 'body') return 'body';

            // 1. ID
            if (el.id) {
                return `#${CSS.escape(el.id)}`;
            }

            // 2. Class (if unique)
            let path = [];
            while (el.nodeType === Node.ELEMENT_NODE) {
                let selector = el.tagName.toLowerCase();

                if (el.id) {
                    selector = `#${CSS.escape(el.id)}`;
                    path.unshift(selector);
                    break;
                }

                // Try classes
                // if (el.className && typeof el.className === 'string' && el.className.trim() !== '') {
                //   selector += '.' + el.className.trim().split(/\s+/).join('.');
                // }

                let sibling = el;
                let nth = 1;
                while (sibling = sibling.previousElementSibling) {
                    if (sibling.tagName.toLowerCase() === selector) nth++;
                }

                if (nth !== 1) selector += `:nth-of-type(${nth})`;

                path.unshift(selector);
                el = el.parentNode;
            }
            return path.join(' > ');
        },

        /**
         * Generates a full XPath for the element
         */
        getXPath(element) {
            if (element.id !== '') {
                return `id("${element.id}")`;
            }
            if (element === document.body) {
                return element.tagName.toLowerCase();
            }

            let ix = 0;
            let siblings = element.parentNode.childNodes;

            for (let i = 0; i < siblings.length; i++) {
                let sibling = siblings[i];

                if (sibling === element) {
                    return this.getXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
                }

                if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
                    ix++;
                }
            }
            return '';
        }
    };

    Inspector.init();
})();
