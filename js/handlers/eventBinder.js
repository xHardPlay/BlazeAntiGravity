/**
 * Event Binder - Handles event binding for popup components
 */
export class EventBinder {
  constructor(container, callbacks) {
    this.container = container;
    this.callbacks = callbacks;
  }

  /**
   * Binds auto pilot button
   */
  bindAutoPilot() {
    this.bindButton('autopilot-btn', () => this.callbacks.onAutoPilot?.());
  }

  /**
   * Binds all event handlers for the grid view
   */
  bindEventHandlers() {
    // Core buttons
    this.bindButton('back-to-main-btn', () => this.callbacks.onBackToMain?.());
    this.bindButton('capture-btn', () => this.callbacks.onCapture?.());
    this.bindButton('debug-dump-btn', () => this.callbacks.onDebugDump?.());
    this.bindButton('inspector-btn', () => this.callbacks.onToggleInspector?.());
    this.bindButton('scan-videos-btn', () => this.callbacks.onScanVideos?.());
    this.bindButton('clear-captured-btn', () => this.callbacks.onClearCaptured?.());

    // Event cards
    this.bindEventCards();

    // Action buttons
    this.bindActionButtons();
  }

  /**
   * Binds event card click handlers
   */
  bindEventCards() {
    const eventCards = this.container.querySelectorAll('.event-card');
    eventCards.forEach(card => {
      card.addEventListener('click', () => {
        const index = parseInt(card.dataset.index);
        this.callbacks.onEventClick?.(index);
      });
    });
  }

  /**
   * Binds all action buttons
   */
  bindActionButtons() {
    this.bindButton('download-media-btn', () => this.callbacks.onDownloadMedia?.());
    this.bindButton('open-reels-btn', () => this.callbacks.onOpenReels?.());
    this.bindButton('download-all-csv-btn', () => this.callbacks.onDownloadAllCSV?.());
    this.bindButton('extract-all-videos-btn', () => this.callbacks.onExtractAllVideos?.());
    this.bindButton('extract-all-details-btn', () => this.callbacks.onExtractAllDetails?.());
  }

  /**
   * Binds event handlers for detail view
   */
  bindDetailEventHandlers(eventIndex) {
    this.bindButton('back-btn', () => this.callbacks.onBack?.());

    // Action buttons
    this.bindButton('test-open-card-btn', () => this.callbacks.onTestOpenCard?.(this.callbacks.events?.[eventIndex]));
    this.bindButton('extract-full-data-btn', () => this.callbacks.onExtractVideo?.(eventIndex));
    this.bindButton('download-csv-btn', () => this.callbacks.onDownloadSingleCSV?.(this.callbacks.events?.[eventIndex]));
  }

  /**
   * Binds download button for media elements
   */
  bindMediaDownload(eventData) {
    const downloadBtn = this.container.querySelector('#download-single-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        // Prioritize video if it is currently displayed
        let url = null;
        if (eventData.videoSrc && eventData.videoSrc !== '[VIDEO_CONTENT]') {
          url = eventData.videoSrc;
        } else {
          url = eventData.imageSrc;
        }

        if (url) this.callbacks.onDownloadSingle?.(url);
      });
    }
  }

  /**
   * Binds retry button
   */
  bindRetry(onRetry) {
    this.bindButton('retry-btn', onRetry);
  }

  /**
   * Helper to bind button click handlers
   */
  bindButton(id, handler) {
    const button = this.container.querySelector(`#${id}`);
    if (button && handler) {
      button.addEventListener('click', handler);
    }
  }

  /**
   * Updates event binding after DOM changes
   */
  refreshBindings() {
    // Re-bind event cards if they were re-rendered
    this.bindEventCards();
  }
}
