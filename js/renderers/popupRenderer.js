import { getColors, setOverlayStyles, getThemeColors } from '../styles/theme.js';
import { TIMEOUTS } from '../constants.js';
import { StyleManager } from '../styles/styleManager.js';
import { EventBinder } from '../handlers/eventBinder.js';
import {
  POPUP_WRAPPER, POPUP_HEADER, POPUP_FOOTER, MAIN_CONTENT,
  LOADING_SECTION, LOADING_SPINNER, UNAVAILABLE_SECTION,
  ERROR_STATE, RETRY_BUTTON, RESULTS_CONTENT, RESULTS_HEADER,
  RESULTS_TITLE, HEADER_BUTTONS, LIVE_SCAN_TOGGLE, INSPECTOR_RESULTS, CAPTURED_ITEMS_CONTAINER,
  NO_RESULTS, EVENTS_GRID, EVENT_CARD, EVENT_IMAGE, EVENT_NO_IMAGE,
  ACTION_BUTTONS, ACTION_BUTTON, EVENT_DETAIL_BACK_BUTTON,
  EVENT_DETAIL_CONTENT, EVENT_DETAIL_ACTIONS, DETAIL_BUTTON,
  DOWNLOAD_CSV_BUTTON, VIDEO_ELEMENT, IMAGE_ELEMENT, CAPTURED_ITEM
} from '../styles/templates.js';

/**
 * Popup UI Renderer - Handles rendering and event binding for the popup
 */
export class PopupRenderer {
  constructor(container, tabId) {
    this.container = container;
    this.tabId = tabId;
    this.currentData = null;
    this.events = [];
    this.onToggleInspector = null;
    this.onClearCaptured = null;
    this.styleManager = new StyleManager();
    this.eventBinder = new EventBinder(container, this.getCallbacks());
    this.footerVersion = 'v1.8';

    // Make toggle function globally available
    if (typeof window !== 'undefined') {
      window.toggleEventsList = () => this.toggleEventsList();
    }
  }

  /**
   * Toggles the events list visibility
   */
  toggleEventsList() {
    const header = this.container.querySelector('.events-count');
    const cardsContainer = this.container.querySelector('#events-cards-container');

    if (header && cardsContainer) {
      const isCollapsed = header.classList.contains('collapsed');

      if (isCollapsed) {
        header.classList.remove('collapsed');
        cardsContainer.classList.remove('collapsed');
      } else {
        header.classList.add('collapsed');
        cardsContainer.classList.add('collapsed');
      }
    }
  }

  /**
   * Get callback methods for event binder
   */
  getCallbacks() {
    return {
      onAutoPilot: () => this.onAutoPilot?.(),
      onBackToMain: () => this.onBackToMain?.(),
      onCapture: () => this.onCapture?.(),
      onDebugDump: () => this.onDebugDump?.(),
      onToggleInspector: () => this.onToggleInspector?.(),
      onClearCaptured: () => this.onClearCaptured?.(),
      onEventClick: (index) => this.onEventClick?.(index),
      onDownloadMedia: () => this.onDownloadMedia?.(),
      onOpenReels: () => this.onOpenReels?.(),
      onDownloadAllCSV: () => this.onDownloadAllCSV?.(),
      onExtractAllVideos: () => this.onExtractAllVideos?.(),
      onExtractAllDetails: () => this.onExtractAllDetails?.(),
      onScanVideos: () => this.onScanVideos?.(),
      onBack: () => this.onBack?.(),
      onTestOpenCard: (eventData) => this.onTestOpenCard?.(eventData),
      onExtractVideo: (eventIndex) => this.onExtractVideo?.(eventIndex),
      onDownloadSingleCSV: (eventData) => this.onDownloadSingleCSV?.(eventData),
      onDownloadSingle: (url) => this.onDownloadSingle?.(url),
      events: this.events
    };
  }

  /**
   * Renders the initial loading state with spinner
   */
  renderInitialLoadingState() {
    this.addCustomStyles();
    this.addLoadingStyles();

    const content = POPUP_HEADER('AgencySMM', 'Checking service status...') +
                   MAIN_CONTENT(LOADING_SECTION(LOADING_SPINNER, 'Cargando...')) +
                   POPUP_FOOTER(this.footerVersion);

    this.container.innerHTML = POPUP_WRAPPER(content);
  }

  /**
   * Renders service unavailable screen
   */
  renderServiceUnavailable() {
    this.addCustomStyles();
    this.addUnavailableStyles();

    const content = POPUP_HEADER('AgencySMM', 'Service Status') +
                   MAIN_CONTENT(UNAVAILABLE_SECTION) +
                   POPUP_FOOTER(this.footerVersion);

    this.container.innerHTML = POPUP_WRAPPER(content);
  }

  /**
   * Renders the main application state
   */
  renderLoadingState() {
    this.addCustomStyles();
    this.addLoadingStyles();

    const content = POPUP_HEADER('AgencySMM', 'Auto-Scanning Active Page...') +
                   MAIN_CONTENT(LOADING_SECTION(LOADING_SPINNER, 'Analyzing page content...')) +
                   POPUP_FOOTER(this.footerVersion);

    this.container.innerHTML = POPUP_WRAPPER(content);
  }

  /**
   * Binds auto pilot button
   */
  bindAutoPilot(callback) {
    this.eventBinder.bindAutoPilot();
  }

  /**
   * Adds loading spinner styles
   */
  addLoadingStyles() {
    this.styleManager.addLoadingStyles();
  }

  /**
   * Adds service unavailable styles
   */
  addUnavailableStyles() {
    this.styleManager.addUnavailableStyles();
  }

  /**
   * Adds custom CSS styles for professional UI
   */
  addCustomStyles() {
    this.styleManager.addCustomStyles();
  }

  /**
   * Renders error state
   */
  renderErrorState(message, onRetry) {
    const { btnBg, btnColor } = getColors();
    this.container.innerHTML = ERROR_STATE(message, RETRY_BUTTON(btnBg, btnColor));
    this.eventBinder.bindRetry(onRetry);
  }

  /**
   * Renders the main popup content with extracted data
   */
  renderDataGrid(data) {
    this.currentData = data;
    this.events = data.events;
    this.eventBinder.callbacks.events = this.events; // Update reference

    this.addCustomStyles();
    this.addResultsStyles();

    const header = RESULTS_HEADER(RESULTS_TITLE, HEADER_BUTTONS);
    const content = (data.events && data.events.length > 0)
      ? LIVE_SCAN_TOGGLE + this.renderEventsGrid(data.events) + this.renderEventActions(data.events)
      : NO_RESULTS;

    const html = POPUP_WRAPPER(
      POPUP_HEADER('🎯AgencySMM', 'Professional Content Extractor Demo Version') +
      RESULTS_CONTENT(header, INSPECTOR_RESULTS, CAPTURED_ITEMS_CONTAINER, content) +
      POPUP_FOOTER(this.footerVersion)
    );

    this.container.innerHTML = html;
    this.eventBinder.bindEventHandlers();

    // Add collapsible functionality globally
    if (typeof window !== 'undefined') {
      window.toggleEventsList = () => {
        const header = document.querySelector('.events-count');
        const cardsContainer = document.getElementById('events-cards-container');

        if (header && cardsContainer) {
          const isCollapsed = header.classList.contains('collapsed');

          if (isCollapsed) {
            header.classList.remove('collapsed');
            cardsContainer.classList.remove('collapsed');
          } else {
            header.classList.add('collapsed');
            cardsContainer.classList.add('collapsed');
          }
        }
      };
    }
  }

  /**
   * Adds custom CSS for results view
   */
  addResultsStyles() {
    this.styleManager.addResultsStyles();
  }

  /**
   * Renders the events grid
   */
  renderEventsGrid(events) {
    const cards = events.map((event, index) => this.renderEventCard(event, index)).join('');
    return EVENTS_GRID(events.length, cards);
  }

  /**
   * Renders a single event card
   */
  renderEventCard(event, index) {
    const descTruncated = event.description || '';
    const label = event.label || 'Unknown Type';

    // Process platforms - handle both array and string formats
    let platformsArray = [];
    if (Array.isArray(event.platforms)) {
      platformsArray = event.platforms.filter(p => p && p.trim());
    } else if (typeof event.platforms === 'string') {
      platformsArray = event.platforms.split(',').map(p => p.trim()).filter(p => p);
    }

    const platformsHtml = platformsArray.length > 0
      ? platformsArray.map(platform => {
          const icon = this.getPlatformIcon(platform);
          return `<span class="platform-tag">${icon} ${platform}</span>`;
        }).join('')
      : '';

    // Determine icon based on label/type if possible
    let typeIcon = '📄';
    if (label.includes('Video') || label.includes('Reel')) typeIcon = '🎥';
    if (label.includes('Image') || label.includes('Post')) typeIcon = '🖼️';
    if (label.includes('Story')) typeIcon = '⭕';
    if (label.includes('Email')) typeIcon = '📧';

    const imageHtml = event.imageSrc ? EVENT_IMAGE(event.imageSrc) : EVENT_NO_IMAGE(typeIcon);
    return EVENT_CARD(index, imageHtml, label, platformsHtml, descTruncated, event.videoDuration, event.timestamp, event.hasVideo, event.eventUrl);
  }

  /**
   * Renders action buttons for events
   */
  renderEventActions(events) {
    const reelEvents = events.filter(e => e.label === 'Reel' && e.eventUrl);
    const videoEvents = events.filter(e => e.hasVideo && e.eventUrl);

    let buttons = [];

    // Removed individual download buttons - now using the complete download in captured videos section

    if (reelEvents.length > 0) {
      buttons.push(ACTION_BUTTON('open-reels-btn', 'accent', '🎬', `Open Reels (${reelEvents.length})`));
    }

    if (videoEvents.length > 0) {
      buttons.push(ACTION_BUTTON('extract-all-videos-btn', 'danger', '🎥', `Extract Full Videos (${videoEvents.length})`));
    }

    // Add extract details button if there are events that might need detailed extraction
    const needsDetailEvents = events.filter(e => e.eventUrl && (e.hasVideo || !e.imageSrc || e.description?.length < 50));
    if (needsDetailEvents.length > 0) {
      buttons.push(ACTION_BUTTON('extract-all-details-btn', '', '🔍', `Extract Full Details (${needsDetailEvents.length})`));
    }

    return buttons.length > 0 ? ACTION_BUTTONS(buttons.join('')) : '';
  }

  /**
   * Renders detailed view of a single event
   */
  renderEventDetail(eventIndex) {
    const eventData = this.events[eventIndex];
    if (!eventData) return;

    const { btnBg, btnColor } = getColors();

    const backButton = EVENT_DETAIL_BACK_BUTTON(btnBg, btnColor);
    const mediaDiv = '<div id="media-loading">Loading media...</div>';
    const actions = this.renderEventDetailActions(eventData, btnBg, btnColor);

    this.container.innerHTML = backButton + EVENT_DETAIL_CONTENT(
      mediaDiv,
      eventData.label || 'No Label',
      eventData.platforms,
      eventData.timestamp,
      eventData.description || '',
      actions
    );

    this.applyTheme();
    this.eventBinder.bindDetailEventHandlers(eventIndex);
    this.updateMediaDisplay(eventData);
  }

  /**
   * Renders action buttons for event detail view
   */
  renderEventDetailActions(eventData, btnBg, btnColor) {
    const testBtn = eventData.eventUrl ? DETAIL_BUTTON('test-open-card-btn', 'Test Open Card', '#17a2b8') : '';
    const extractBtn = eventData.hasVideo ? DETAIL_BUTTON('extract-full-data-btn', 'Extract Video', '#28a745') : '';
    const downloadBtn = DOWNLOAD_CSV_BUTTON(btnBg, btnColor);

    return EVENT_DETAIL_ACTIONS(testBtn, extractBtn, downloadBtn);
  }

  /**
   * Updates the media display area
   */
  updateMediaDisplay(eventData) {
    const mediaDiv = this.container.querySelector('#media-loading');
    if (!mediaDiv) return;

    if (eventData.videoSrc && eventData.videoSrc !== '[VIDEO_CONTENT]') {
      mediaDiv.innerHTML = VIDEO_ELEMENT(eventData.videoSrc);
    } else if (eventData.imageSrc) {
      mediaDiv.innerHTML = IMAGE_ELEMENT(eventData.imageSrc);
    } else {
      mediaDiv.innerHTML = '<div>No media available</div>';
    }

    this.eventBinder.bindMediaDownload(eventData);
  }

  /**
   * Applies current theme to container
   */
  applyTheme() {
    const { currentTextColor, currentBgColor } = getColors();
    this.container.style.color = currentTextColor;
    this.container.style.background = currentBgColor;
    this.container.style.padding = '15px';
    this.container.style.fontFamily = 'Segoe UI, Arial, sans-serif';
    this.container.style.borderRadius = '10px';
  }



  /**
   * Updates the hover inspector info
   */
  updateHoverInfo(data) {
    const resultsDiv = document.getElementById('inspector-results');
    const tagEl = document.getElementById('insp-tag');
    const selectorEl = document.getElementById('insp-selector');
    const xpathEl = document.getElementById('insp-xpath');

    if (!resultsDiv) return; // Not in results view

    if (data) {
      resultsDiv.style.display = 'block';
      if (tagEl) tagEl.textContent = data.tagName;
      if (selectorEl) selectorEl.textContent = data.selector;
      if (xpathEl) xpathEl.textContent = data.xpath;
    } else {
      resultsDiv.style.display = 'none';
      if (tagEl) tagEl.textContent = '-';
      if (selectorEl) selectorEl.textContent = '-';
      if (xpathEl) xpathEl.textContent = '-';
    }
  }

  /**
```
   * Updates the inspector button state
   */
  updateInspectorButtonState(isActive) {
    const btn = document.getElementById('inspector-btn');
    if (!btn) return;

    if (isActive) {
      btn.innerHTML = '<span class="refresh-icon">⏹️</span><span class="refresh-text">Stop</span>';
      btn.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
      const resultsDiv = document.getElementById('inspector-results');
      const listDiv = document.getElementById('captured-items-container');
      if (resultsDiv) resultsDiv.style.display = 'block';
      if (listDiv) listDiv.style.display = 'block';
    } else {
      btn.innerHTML = '<span class="refresh-icon">🔍</span><span class="refresh-text">Inspector</span>';
      btn.style.background = 'linear-gradient(135deg, #f39c12 0%, #d35400 100%)';
      const resultsDiv = document.getElementById('inspector-results');
      if (resultsDiv) resultsDiv.style.display = 'none';
      // Keep captured list visible even if stopped, if it has items? 
      // For now, let's keep it visible if it has items, but check in render method
    }
  }

  /**
   * Renders the list of captured items
   */
  renderCapturedItems(items) {
    const container = document.getElementById('captured-items-container');
    const list = document.getElementById('captured-list');
    const count = document.getElementById('captured-count');

    if (!container || !list || !count) return;

    if (items.length > 0) {
      container.style.display = 'block';
    }

    count.textContent = items.length;

    if (items.length === 0) {
      list.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.4); font-size: 11px; padding: 10px;">Click elements to capture them</div>';
    } else {
      list.innerHTML = items.map((item, index) => CAPTURED_ITEM(item.tagName, index, item.selector, item.text)).join('');
    }
  }

  // Event handler callbacks (to be set by controller)
  onCapture() { }
  onToggleMode() { }
  onEventClick(index) { }
  onBack() { }
  onBackToMain() { }
  onDownloadMedia() { }
  onOpenReels() { }
  onDownloadAllCSV() { }
  onExtractAllVideos() { }
  onExtractAllDetails() { }
  onDownloadSingle(url) { }
  onTestOpenCard(eventData) { }
  onExtractVideo(eventIndex) { }
  onDownloadSingleCSV(eventData) { }
  onVideoScan() { }

  /**
   * Shows a temporary notification message in the UI
   * @param {string} message - The message to show
   * @param {string} type - Message type: 'success', 'error', 'info'
   */
  showMessage(message, type = 'info') {
    // Remove any existing notification
    this.removeExistingNotification();

    // Get theme colors
    const colors = getThemeColors();

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';

    // Set type-specific styling using theme colors
    let bgColor, borderColor;
    if (type === 'success') {
      bgColor = colors.success;
      borderColor = colors.success;
    } else if (type === 'error') {
      bgColor = colors.error;
      borderColor = colors.error;
    } else {
      bgColor = colors.info;
      borderColor = colors.info;
    }

    notification.innerHTML = `
      <span class="notification-message">${message}</span>
      <span class="notification-close" onclick="this.parentElement.remove()">✕</span>
    `;

    // Style the notification with tech design
    Object.assign(notification.style, {
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '14px 24px',
      borderRadius: '12px',
      background: `linear-gradient(135deg, ${bgColor}20 0%, ${bgColor}10 100%)`,
      border: `1px solid ${borderColor}40`,
      color: colors.textPrimary,
      fontSize: '13px',
      fontWeight: '500',
      fontFamily: 'Inter, sans-serif',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
      backdropFilter: 'blur(10px)',
      zIndex: '10000',
      maxWidth: '420px',
      cursor: 'default',
      opacity: '0',
      transform: 'translateX(-50%) translateY(20px)',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
    });

    // Style the close button
    const closeBtn = notification.querySelector('.notification-close');
    Object.assign(closeBtn.style, {
      marginLeft: '12px',
      opacity: '0.7',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '300',
      transition: 'opacity 0.2s ease',
      userSelect: 'none'
    });

    closeBtn.onmouseover = () => closeBtn.style.opacity = '1';
    closeBtn.onmouseout = () => closeBtn.style.opacity = '0.7';

    // Add to page
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);

    // Auto hide after 4 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => notification.remove(), 400);
      }
    }, 4000);
  }

  /**
   * Removes any existing notification
   */
  removeExistingNotification() {
    const existing = document.querySelector('.notification');
    if (existing) {
      existing.remove();
    }
  }

  /**
   * Returns the appropriate icon for each platform (minimalist - no icons, just text)
   */
  getPlatformIcon(platform) {
    // Return empty string for minimalist design - no icons, just text
    return '';
  }
}
