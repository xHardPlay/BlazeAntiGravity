import { PopupRenderer } from './popupRenderer.js';
import { CSVExporter } from './csvExporter.js';
import { TIMEOUTS, SELECTORS } from './constants.js';

/**
 * Popup Controller - Orchestrates popup interactions and data flow
 */
export class PopupController {
  constructor() {
    this.container = document.getElementById('popup-container');
    this.tabId = null; // Will be set dynamically
    this.renderer = new PopupRenderer(this.container, this.tabId);
    this.events = [];
    this.liveScanInterval = null;
    this.isLiveScanning = false;
    this.isHoverInspectorActive = false;
    this.capturedItems = [];

    this.bindRendererCallbacks();
    this.setupMessageListener();
  }

  /**
   * Updates the current active tab ID
   */
  async updateActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    this.tabId = tab?.id;
    // Update renderer if it needs it (it generally doesn't, but good practice)
    this.renderer.tabId = this.tabId;
    return this.tabId;
  }

  /**
   * Binds renderer callback functions
   */
  bindRendererCallbacks() {
    this.renderer.onCapture = () => this.handleCapture();
    this.renderer.onEventClick = (index) => this.handleEventClick(index);
    this.renderer.onBack = () => this.handleBack();
    this.renderer.onBackToMain = () => this.handleBackToMain();
    this.renderer.onDownloadMedia = () => this.handleDownloadMedia();
    this.renderer.onOpenReels = () => this.handleOpenReels();
    this.renderer.onDownloadAllCSV = () => this.handleDownloadAllCSV();
    this.renderer.onExtractAllVideos = () => this.handleExtractAllVideos();
    this.renderer.onExtractAllDetails = () => this.handleExtractAllDetails();
    this.renderer.onDownloadSingle = (url) => this.handleDownloadSingle(url);
    this.renderer.onTestOpenCard = (eventData) => this.handleTestOpenCard(eventData);
    this.renderer.onExtractVideo = (eventIndex) => this.handleExtractVideo(eventIndex);
    this.renderer.onDownloadSingleCSV = (eventData) => this.handleDownloadSingleCSV(eventData);
    this.renderer.onVideoScan = () => this.handleVideoScan();
    this.renderer.onAutoPilot = () => this.handleAutoPilot();
    this.renderer.onDebugDump = () => this.handleDebugDump();
    this.renderer.onToggleInspector = () => this.handleToggleInspector();
    this.renderer.onClearCaptured = () => this.handleClearCaptured();
  }

  /**
   * Initializes the popup
   */
  async init() {
    // First show loading spinner while checking service status
    this.renderer.renderInitialLoadingState();

    try {
      // Check service status
      const isServiceAvailable = await this.checkServiceStatus();

      if (isServiceAvailable) {
        // Service is available, show unavailable screen
        this.renderer.renderServiceUnavailable();
      } else {
        // Service is not available (normal operation), show main screen
        await this.initMainApplication();
      }
    } catch (error) {
      console.error('Error checking service status:', error);
      // On error, default to showing main screen
      await this.initMainApplication();
    }
  }

  /**
   * Checks service status from the API endpoint
   */
  async checkServiceStatus() {
    try {
      const response = await fetch('https://zona-virtual-cloud-backend.carlos-mdtz9.workers.dev/api/micro/daris');
      const data = await response.json();

      console.log('Service status response:', data);

      // Check if status is false (service unavailable) or true (service available)
      return data.status === false;
    } catch (error) {
      console.error('Error checking service status:', error);
      // On error, assume service is available (return false)
      return false;
    }
  }

  /**
   * Initializes the main application after service check
   */
  async initMainApplication() {
    // Initialize live scanning settings first
    await this.initLiveScanning();

    // Auto-capture immediately for "One Click" experience
    this.handleCapture();
  }

  /**
   * Handles data capture from the active tab
   */
  async handleCapture() {
    try {
      await this.updateActiveTab();
      if (!this.tabId) throw new Error('No active window found');

      // Inject the data collection script and extract data
      const results = await chrome.scripting.executeScript({
        target: { tabId: this.tabId },
        func: EventExtractor.getContentScriptFunction(),
        world: 'MAIN'
      });

      const data = results[0].result;
      this.events = data.events;

      this.renderer.renderDataGrid(data);

      // Show success message if we found data
      if (this.events.length > 0) {
        this.renderer.showMessage(`Successfully extracted ${this.events.length} events!`, 'success');
      }

    } catch (error) {
      console.error('Capture failed:', error);
      this.renderer.renderErrorState(
        error.message || 'Failed to capture data',
        () => this.handleCapture()
      );
    }
  }

  /**
   * Returns the function to be executed in the content script context
   * This function contains all the data extraction logic inline
   */




  /**
   * Handles event card click to show details
   */
  /**
   * Handles event card click to show details
   */
  async handleEventClick(index) {
    this.renderer.renderEventDetail(index);

    // Also try to click the element on the page
    try {
      const eventData = this.events[index];
      if (eventData) {
        await chrome.scripting.executeScript({
          target: { tabId: this.tabId },
          func: (eventUrl, cardIndex) => {
            // Try by URL first
            let card = null;
            if (eventUrl && eventUrl !== '#' && !eventUrl.includes('undefined')) {
              card = document.querySelector(`a[href="${eventUrl}"]`);
            }
            // Fallback by Index
            if (!card) {
              const containers = Array.from(document.querySelectorAll('[class*="CalendarEventCard_eventContainer"]'));
              // cardIndex is 1-based usually if we look at previous logic, but let's check. 
              // The index passed here is 0-based from the array.
              if (containers[cardIndex]) {
                const container = containers[cardIndex];
                card = container.closest('a') || container.querySelector('a') || container;
              }
            }

            if (card) {
              const clickOpts = { bubbles: true, cancelable: true, view: window };
              card.dispatchEvent(new MouseEvent('mousedown', clickOpts));
              card.dispatchEvent(new MouseEvent('mouseup', clickOpts));
              card.click();

              // Scroll into view
              card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          },
          args: [eventData.eventUrl, index],
          world: 'MAIN'
        });
      }
    } catch (e) {
      console.warn('Failed to sync click to page:', e);
    }
  }

  /**
   * Handles back button to return to grid view
   */
  handleBack() {
    // Re-render with current data
    this.renderer.renderDataGrid({ events: this.events });
  }

  /**
   * Handles back to main button to return to main screen
   */
  handleBackToMain() {
    // Return to main screen
    this.renderer.renderLoadingState();
  }

  /**
   * Handles downloading all media files
   */
  handleDownloadMedia() {
    const mediaUrls = this.events
      .filter(e => e.imageSrc || (e.videoSrc && e.videoSrc !== 'VIDEO DETECTED'))
      .map(e => e.imageSrc || e.videoSrc);

    if (mediaUrls.length === 0) {
      return;
    }

    chrome.runtime.sendMessage({
      action: 'downloadImages',
      urls: mediaUrls
    });
  }

  /**
   * Handles opening all Reel events in background tabs
   */
  handleOpenReels() {
    const reelUrls = this.events
      .filter(e => e.label === 'Reel' && e.eventUrl)
      .map(e => e.eventUrl);

    reelUrls.forEach(url => {
      chrome.tabs.create({ url, active: false });
    });
  }

  /**
   * Handles downloading all events as CSV
   */
  handleDownloadAllCSV() {
    try {
      CSVExporter.exportAllEvents(this.events);
      this.renderer.showMessage('CSV export completed successfully!', 'success');
    } catch (error) {
      console.error('CSV export failed:', error);
      this.renderer.showMessage('Failed to export CSV: ' + error.message, 'error');
    }
  }

  /**
   * Handles single media download
   */
  handleDownloadSingle(url) {
    if (!url) return;

    // Check if video
    const isVideo = url.includes('.mp4') || url.includes('.webm') || url.includes('.mkv') || url.includes('blob:');

    if (isVideo) {
      const filename = this.videoService.getFilenameFromUrl(url);
      this.videoService.downloadVideo(url, filename);
    } else {
      chrome.runtime.sendMessage({
        action: 'downloadImages',
        urls: [url]
      });
    }
  }

  /**
   * Handles opening event card in new tab
   */
  handleTestOpenCard(eventData) {
    if (eventData.eventUrl) {
      chrome.tabs.create({ url: eventData.eventUrl, active: false });
    }
  }

  /**
   * Handles extracting full content from event detail view
   */
  async handleExtractVideo(eventIndex) {
    await this.updateActiveTab();
    const eventData = this.events[eventIndex];
    if (!eventData || !eventData.hasVideo) {
      this.renderer.showMessage('No video detected for this event', 'error');
      return;
    }

    try {
      this.renderer.showMessage('Extracting video... please wait', 'info');

      const results = await chrome.scripting.executeScript({
        target: { tabId: this.tabId },
        func: async (eventUrl, cardIndex) => {
          // Helper to wait
          const wait = (ms) => new Promise(r => setTimeout(r, ms));

          console.log(`Trying to open card. Index: ${cardIndex}, Url: ${eventUrl}`);

          // 1. Find the card
          let card = null;
          // Try by specific URL first if valid
          if (eventUrl && eventUrl !== '#' && !eventUrl.includes('undefined')) {
            card = document.querySelector(`a[href="${eventUrl}"]`);
          }

          // Fallback to index-based selection
          if (!card) {
            const containers = Array.from(document.querySelectorAll('[class*="CalendarEventCard_eventContainer"]'));
            // cardIndex is 1-based from extraction, so subtract 1
            if (containers[cardIndex - 1]) {
              // The clickable part is usually an anchor or the container itself has a click handler (if preview)
              const container = containers[cardIndex - 1];
              card = container.closest('a') || container.querySelector('a') || container;
            }
          }

          if (!card) throw new Error('Could not find event card to click');

          // 2. Click to open
          // Simulate full click sequence
          const clickOpts = { bubbles: true, cancelable: true, view: window };
          card.dispatchEvent(new MouseEvent('mousedown', clickOpts));
          card.dispatchEvent(new MouseEvent('mouseup', clickOpts));
          card.click();

          // 3. Wait for Modal/Preview
          // Wait up to 5 seconds for video tag
          let videoSrc = null;
          let attempts = 0;
          while (attempts < 25) {
            await wait(200);
            const video = document.querySelector('video');
            if (video && (video.src || video.currentSrc)) {
              videoSrc = video.src || video.currentSrc;
              if (!videoSrc.startsWith('blob:')) break;
            }
            attempts++;
          }

          // Also try to get image/description while we are here
          let imageSrc = null;
          const img = document.querySelector('img[src*="cloudinary"]'); // typical high res
          if (img) imageSrc = img.src;

          let fullDescription = null;
          const caption = document.querySelector('[class*="caption"]');
          if (caption) fullDescription = caption.textContent;


          // 4. Close Modal
          // Try escape key first
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
          await wait(100);
          // Try button
          const closeBtn = document.querySelector('[aria-label="Close"]');
          if (closeBtn) closeBtn.click();

          return { videoSrc, imageSrc, fullDescription };
        },
        args: [eventData.eventUrl, eventData.cardIndex]
      });

      const result = results[0]?.result;

      if (result && result.videoSrc) {
        console.log('Video extracted:', result.videoSrc);
        this.events[eventIndex].videoSrc = result.videoSrc;
        if (result.imageSrc) this.events[eventIndex].imageSrc = result.imageSrc;
        if (result.fullDescription) this.events[eventIndex].description = result.fullDescription;

        this.renderer.updateMediaDisplay(this.events[eventIndex]);
        this.renderer.showMessage('Video extracted successfully!', 'success');
      } else {
        this.renderer.showMessage('Could not find video URL after opening card.', 'error');
      }

    } catch (error) {
      console.error('Detailed content extraction failed:', error);
      this.renderer.showMessage('Failed to extract: ' + error.message, 'error');
    }
  }

  /**
   * Handles extracting all detailed content from video events
   */
  handleExtractAllVideos() {
    this.handleAutoPilot();
  }

  /**
   * Auto Pilot: Automatically crawls all items to extract full details
   */
  async handleAutoPilot() {
    await this.updateActiveTab();

    // Filter for events that might have more details to extract
    // e.g. they have a video but no videoSrc, or just an image but we want high-res/full text
    const targetEvents = this.events.filter(e =>
      e.eventUrl && (
        (e.hasVideo && e.videoSrc === 'VIDEO DETECTADO') || // Video not yet extracted
        !e.imageSrc || // No image yet
        (e.description && e.description.length < 50) || // Short description (maybe truncated)
        e.isNew // Always check new items
      )
    );

    if (targetEvents.length === 0) {
      this.renderer.showMessage('All items appear to be fully extracted already.', 'info');
      return;
    }

    this.renderer.showMessage(`Auto Pilot engaged! ✈️ processing ${targetEvents.length} items...`, 'info');

    let processed = 0;
    const total = targetEvents.length;
    let successful = 0;

    // Disable buttons during operation
    // this.renderer.setButtonsDisabled(true); 

    const processNext = async () => {
      if (processed >= total) {
        this.handleBack(); // Refresh view
        const successMsg = `Auto Pilot finished! processed ${successful}/${total} items.`;
        this.renderer.showMessage(successMsg, 'success');
        return;
      }

      // Find first unprocessed item from our original target list
      // We check the master this.events list to see if they are still needing update
      const eventIndex = this.events.findIndex(e =>
        e.eventUrl && targetEvents.includes(e) &&
        // Double check it still needs processing (in case of duplicate runs?) via matching URL
        e.eventUrl === targetEvents[processed].eventUrl
      );

      if (eventIndex === -1) {
        processed++;
        setTimeout(processNext, 100);
        return;
      }

      try {
        const eventData = this.events[eventIndex];
        const progressMsg = `Auto Pilot ✈️: Processing ${processed + 1}/${total} - ${eventData.label || 'Item'}`;
        this.renderer.showMessage(progressMsg, 'info');

        // Execute extraction script
        const results = await chrome.scripting.executeScript({
          target: { tabId: this.tabId },
          func: async (eventUrl) => {
            // Helper to wait
            const wait = (ms) => new Promise(r => setTimeout(r, ms));

            // FIND CARD
            // Try by URL first
            let card = null;
            if (eventUrl && eventUrl !== '#' && !eventUrl.includes('undefined')) {
              card = document.querySelector(`a[href="${eventUrl}"]`);
            }
            // Fallback by Index
            if (!card) {
              const containers = Array.from(document.querySelectorAll('[class*="CalendarEventCard_eventContainer"]'));
              // cardIndex passed from outside is 1-based
              if (containers[cardIndex - 1]) {
                const container = containers[cardIndex - 1];
                card = container.closest('a') || container.querySelector('a') || container;
              }
            }

            if (!card) throw new Error('Card not found');

            // CLICK CARD
            // Simulate full click sequence for React apps
            const clickOpts = { bubbles: true, cancelable: true, view: window };
            card.dispatchEvent(new MouseEvent('mousedown', clickOpts));
            card.dispatchEvent(new MouseEvent('mouseup', clickOpts));
            card.click();

            // WAIT FOR MODAL
            // Dynamic wait for modal container
            let attempts = 0;
            let modalOpen = false;
            while (attempts < 20) { // Max 4 seconds
              if (document.querySelector('[aria-label="Close"]') || document.querySelector('.modal-close') || document.querySelector('video') || document.querySelector('img[src*="full"]')) {
                modalOpen = true;
                break;
              }
              await wait(200);
              attempts++;
            }
            if (!modalOpen) await wait(2000); // Fallback wait

            // EXTRACT DATA
            let videoSrc = null;
            let imageSrc = null;
            let fullDescription = null;

            // Video Strategies
            const videoSelectors = [
              'video[src*=".mp4"]', 'video[src*="cloudinary.com"]', 'video',
              '[class*="VideoPlayer_videoContainer"] video', // Wildcard for dynamic hash classes
              '.VideoPlayer_videoContainer video', // Specific fallback
              '.video-player video', 'iframe[src*="video"]'
            ];

            for (const selector of videoSelectors) {
              const els = document.querySelectorAll(selector);
              for (const el of els) {
                const src = el.src || el.currentSrc;
                if (src && (src.includes('.mp4') || src.includes('blob:'))) {
                  videoSrc = src;
                  // Prioritize MP4 over blob if possible
                  if (src.includes('.mp4')) break;
                }
              }
              if (videoSrc && videoSrc.includes('.mp4')) break;
            }

            // Image Strategies (High Res)
            const imgs = Array.from(document.querySelectorAll('img'));
            const highResImg = imgs.find(img =>
              !img.src.startsWith('data:') &&
              (img.naturalWidth > 600 || img.width > 600) &&
              img.closest('.modal-content, [role="dialog"], .post-detail')
            );
            if (highResImg) imageSrc = highResImg.src;

            // Description Strategies
            const potentialDescs = Array.from(document.querySelectorAll('p, .caption, .description, [class*="text"]'));
            // Find the longest text block in the modal
            let longestText = '';
            potentialDescs.forEach(el => {
              const txt = el.textContent.trim();
              if (txt.length > longestText.length && txt.length > 20) {
                // Ensure it's inside a modal-like structure if possible
                if (el.closest('[role="dialog"]') || window.getComputedStyle(el).position === 'relative') {
                  longestText = txt;
                }
              }
            });
            if (longestText) fullDescription = longestText;


            // CLOSE MODAL
            const closeBtn = document.querySelector('[aria-label="Close"]') || document.querySelector('.close-button');
            if (closeBtn) {
              closeBtn.click();
            } else {
              document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            }

            await wait(500); // Wait for close animation

            return { videoSrc, imageSrc, fullDescription };
          },
          args: [eventData.eventUrl, eventData.cardIndex],
          world: 'MAIN'
        });

        const { videoSrc, imageSrc, fullDescription } = results[0].result;

        // MERGE DATA
        let updated = false;
        if (videoSrc && !videoSrc.startsWith('blob:') && (!eventData.videoSrc || eventData.videoSrc === 'VIDEO DETECTADO')) {
          this.events[eventIndex].videoSrc = videoSrc;
          updated = true;
        }
        if (imageSrc && imageSrc !== eventData.imageSrc) {
          this.events[eventIndex].imageSrc = imageSrc;
          updated = true;
        }
        if (fullDescription && (!eventData.description || fullDescription.length > eventData.description.length)) {
          this.events[eventIndex].description = fullDescription;
          updated = true;
        }

        if (updated) {
          successful++;
          // Optional: Save to storage incrementally?
        }

      } catch (err) {
        console.warn(`Failed item ${processed}:`, err);
      }

      processed++;
      setTimeout(processNext, 1500); // Wait between items to be nice to the specific server
    };

    processNext();
  }

  /**
   * Legacy alias
   */
  handleExtractAllDetails() {
    this.handleAutoPilot();
  }

  /**
   * Handles video scanning on the current tab
   */
  async handleVideoScan() {
    try {
      await this.updateActiveTab();

      // Check if we're on a Blaze site
      let tab;
      try {
        tab = await chrome.tabs.get(this.tabId);
      } catch (tabError) {
        console.error('Failed to get tab info:', tabError);
        this.renderer.showMessage('Failed to access current tab', 'error');
        return;
      }

      const isBlazeSite = tab.url && tab.url.includes('blaze.ai');

      if (!isBlazeSite) {
        this.renderer.showMessage('Video scanning is only available on Blaze sites', 'error');
        return;
      }

      this.renderer.showMessage('Scanning for videos...', 'info');

      // Inject the VideoCapture class and get video URLs
      const results = await chrome.scripting.executeScript({
        target: { tabId: this.tabId },
        files: ['js/video_capture_module.js'],
        world: 'MAIN'
      });

      // Now execute the video scanning
      const videoResults = await chrome.scripting.executeScript({
        target: { tabId: this.tabId },
        func: () => {
          if (!window.VideoCapture) {
            throw new Error('VideoCapture module failed to load');
          }
          return window.VideoCapture.getVideoUrls();
        },
        world: 'MAIN'
      });

      const videoUrls = videoResults[0].result;

      if (videoUrls.length === 0) {
        this.renderer.showMessage('No videos found on this page', 'info');
        return;
      }

      // Create video data for display
      const videoData = videoUrls.map((url, index) => ({
        url,
        index: index + 1,
        type: this.getVideoType(url),
        filename: this.getFilenameFromUrl(url)
      }));

      // Render videos in popup
      this.renderVideoResults(videoData);

      this.renderer.showMessage(`Found ${videoUrls.length} videos!`, 'success');

    } catch (error) {
      console.error('Video scan failed:', error);
      this.renderer.showMessage('Video scan failed: ' + error.message, 'error');
    }
  }

  /**
   * Helper to determine video type
   */
  getVideoType(url) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    if (url.includes('vimeo.com')) return 'Vimeo';
    if (url.includes('twitch.tv')) return 'Twitch';
    if (url.includes('dailymotion.com')) return 'Dailymotion';
    if (url.includes('.mp4')) return 'MP4';
    if (url.includes('.webm')) return 'WebM';
    if (url.includes('.avi')) return 'AVI';
    if (url.includes('.mkv')) return 'MKV';
    return 'Video';
  }

  /**
   * Renders video scan results in the popup
   */
  renderVideoResults(videoData) {
    let html = `
      <div class="extension-popup">
        <div class="popup-header">
          <div class="logo-section">
            <div class="logo-icon">🎥</div>
            <div class="logo-text">Video Scan Results</div>
          </div>
          <div class="subtitle">Found ${videoData.length} videos on the current page</div>
        </div>

        <div class="video-results-content">
          <div class="videos-header">
            <button id="video-back-btn" class="back-button">← Back to Main</button>
          </div>

          <div class="videos-list">
    `;

    videoData.forEach(video => {
      const isEmbedded = ['YouTube', 'Vimeo', 'Twitch', 'Dailymotion'].includes(video.type);
      const isDirectVideo = ['MP4', 'WebM', 'AVI', 'MKV'].includes(video.type);

      if (isEmbedded) {
        // For embedded videos, show thumbnail or just info
        const thumbnail = this.getThumbnailUrl(video.url, video.type);
        html += `
          <div class="video-item embedded">
            <div class="video-header">
              <span class="video-number">${video.index}</span>
              <span class="video-type">${video.type}</span>
            </div>
            ${thumbnail ? `<div class="video-preview"><img src="${thumbnail}" alt="Video thumbnail" onerror="this.style.display='none'"></div>` : ''}
            <div class="video-info">
              <div class="video-url">${video.url.length > 40 ? video.url.substring(0, 40) + '...' : video.url}</div>
            </div>
            <div class="video-actions">
              <button class="open-video-btn" data-url="${video.url}">🔗 Open</button>
            </div>
          </div>
        `;
      } else if (isDirectVideo) {
        // For direct video files, show small video preview
        html += `
          <div class="video-item downloadable">
            <div class="video-header">
              <span class="video-number">${video.index}</span>
              <span class="video-type">${video.type}</span>
            </div>
            <div class="video-preview">
              <video controls muted preload="metadata" style="width: 120px; height: 68px; object-fit: cover; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);">
                <source src="${video.url}" type="video/${video.type.toLowerCase()}">
                Preview not available
              </video>
            </div>
            <div class="video-info">
              <div class="video-filename">${video.filename}</div>
            </div>
            <div class="video-actions">
              <button class="download-video-btn" data-url="${video.url}" data-filename="${video.filename}">⬇️ Download</button>
            </div>
          </div>
        `;
      } else {
        // For other video types (links, etc.)
        html += `
          <div class="video-item downloadable">
            <div class="video-header">
              <span class="video-number">${video.index}</span>
              <span class="video-type">${video.type}</span>
            </div>
            <div class="video-info">
              <div class="video-url">${video.filename}</div>
            </div>
            <div class="video-actions">
              <button class="download-video-btn" data-url="${video.url}" data-filename="${video.filename}">⬇️ Download</button>
            </div>
          </div>
        `;
      }
    });

    html += `
          </div>

          <div class="bulk-actions" id="bulk-actions">
            <button id="download-all-videos-btn" class="bulk-action-btn">📥 Download All Videos</button>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.addVideoResultsStyles();
    this.bindVideoResultEvents();
  }

  /**
   * Adds CSS for video results view
   */
  addVideoResultsStyles() {
    if (document.getElementById('video-results-styles')) return;

    const style = document.createElement('style');
    style.id = 'video-results-styles';
    style.textContent = `
      .video-results-content {
        padding: 20px;
      }

      .videos-header {
        margin-bottom: 20px;
      }

      .back-button {
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 8px;
        padding: 8px 16px;
        cursor: pointer;
        color: white;
        display: flex;
        align-items: center;
        transition: all 0.3s ease;
      }

      .back-button:hover {
        background: rgba(255,255,255,0.2);
      }

      .videos-list {
        margin-bottom: 20px;
      }

      .video-item {
        background: rgba(255,255,255,0.05);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 8px;
        border: 1px solid rgba(255,255,255,0.1);
      }

      .video-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .video-number {
        font-weight: 600;
        color: #4CAF50;
      }

      .video-type {
        font-size: 12px;
        opacity: 0.8;
        background: rgba(255,255,255,0.1);
        padding: 2px 8px;
        border-radius: 4px;
      }

      .video-preview {
        margin-bottom: 8px;
        text-align: center;
      }

      .video-preview img {
        width: 120px;
        height: 68px;
        object-fit: cover;
        border-radius: 4px;
        border: 1px solid rgba(255,255,255,0.1);
      }

      .video-info {
        flex: 1;
      }

      .video-url, .video-filename {
        font-family: monospace;
        font-size: 12px;
        margin-bottom: 8px;
        word-break: break-all;
        color: rgba(255,255,255,0.9);
      }

      .video-actions {
        display: flex;
        gap: 8px;
      }

      .open-video-btn {
        background: #007bff;
        border: none;
        border-radius: 4px;
        padding: 6px 12px;
        cursor: pointer;
        color: white;
        font-size: 12px;
        transition: background 0.3s ease;
      }

      .open-video-btn:hover {
        background: #0056b3;
      }

      .download-video-btn {
        background: #28a745;
        border: none;
        border-radius: 4px;
        padding: 6px 12px;
        cursor: pointer;
        color: white;
        font-size: 12px;
        transition: background 0.3s ease;
      }

      .download-video-btn:hover {
        background: #1e7e34;
      }

      .bulk-actions {
        text-align: center;
      }

      .bulk-action-btn {
        background: linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%);
        border: none;
        border-radius: 8px;
        padding: 12px 24px;
        cursor: pointer;
        color: white;
        font-weight: 600;
        font-size: 14px;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      }

      .bulk-action-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      }

      .embedded .video-type {
        background: rgba(255,198,0,0.2);
        color: #ffc600;
      }

      .downloadable .video-type {
        background: rgba(40,167,69,0.2);
        color: #28a745;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Binds events for video results view
   */
  bindVideoResultEvents() {
    // Back button
    const backBtn = this.container.querySelector('#video-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.renderer.renderLoadingState();
      });
    }

    // Individual download buttons
    const downloadButtons = this.container.querySelectorAll('.download-video-btn');
    downloadButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const url = e.target.getAttribute('data-url');
        const filename = e.target.getAttribute('data-filename');
        this.downloadVideo(url, filename);
      });
    });

    // Open video buttons
    const openButtons = this.container.querySelectorAll('.open-video-btn');
    openButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const url = e.target.getAttribute('data-url');
        chrome.tabs.create({ url, active: false });
      });
    });

    // Bulk download button
    const bulkBtn = this.container.querySelector('#download-all-videos-btn');
    if (bulkBtn) {
      bulkBtn.addEventListener('click', () => {
        const videoUrls = Array.from(downloadButtons).map(btn => btn.getAttribute('data-url'));
        this.downloadAllVideos(videoUrls.filter(url => url)); // Filter out any null values
      });
    }
  }

  /**
   * Downloads a single video
   */
  downloadVideo(url, filename) {
    chrome.runtime.sendMessage({
      action: 'downloadVideo',
      url: url,
      filename: filename
    });
  }

  /**
   * Downloads all videos with delay
   */
  downloadAllVideos(urls) {
    this.videoService.downloadAllVideos(urls, (msg) => this.renderer.showMessage(msg, 'info'));
  }

  /**
   * Captures the current page DOM and downloads it for debugging
   */
  async handleDebugDump() {
    try {
      await this.updateActiveTab();
      this.renderer.showMessage('Downloading page copy for debugging...', 'info');

      // Execute script to get full HTML
      const results = await chrome.scripting.executeScript({
        target: { tabId: this.tabId },
        func: () => {
          // Inline all styles to make it easier to view
          const css = Array.from(document.styleSheets)
            .flatMap(sheet => {
              try {
                return Array.from(sheet.cssRules).map(rule => rule.cssText);
              } catch (e) {
                return [];
              }
            })
            .join('\n');

          return {
            html: document.documentElement.outerHTML,
            css: css,
            url: window.location.href
          };
        },
        world: 'MAIN'
      });

      const { html, css, url } = results[0].result;

      // Combine into a single file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `blaze-debug-dump-${timestamp}.html`;

      const fileContent = `<!-- URL: ${url} -->\n<style>\n${css}\n</style>\n${html}`;

      // Download
      const blob = new Blob([fileContent], { type: 'text/html' });
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result;
        chrome.downloads.download({
          url: dataUrl,
          filename: filename,
          saveAs: true
        });
      };
      reader.readAsDataURL(blob);

      this.renderer.showMessage('Debug file downloaded! Please send this to support.', 'success');
    } catch (error) {
      console.error('Debug dump failed:', error);
      this.renderer.showMessage('Failed to download debug file: ' + error.message, 'error');
    }
  }



  /**
   * Get thumbnail URL for embedded videos
   */
  getThumbnailUrl(url, type) {
    try {
      if (type === 'YouTube') {
        // Extract video ID from YouTube URL
        const patterns = [
          /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
          /youtube\.com\/embed\/([^&\n?#]+)/,
          /youtube\.com\/v\/([^&\n?#]+)/
        ];

        for (const pattern of patterns) {
          const match = url.match(pattern);
          if (match && match[1]) {
            return `https://img.youtube.com/vi/${match[1]}/default.jpg`;
          }
        }
      } else if (type === 'Vimeo') {
        // For Vimeo, we'd need an API call, so return null for now
        // Thumbnail extraction would require additional API calls
        return null;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Handles single event CSV download
   */
  handleDownloadSingleCSV(eventData) {
    try {
      CSVExporter.exportSingleEvent(eventData);
    } catch (error) {
      console.error('Single CSV export failed:', error);
      this.renderer.showMessage('Failed to export CSV: ' + error.message);
    }
  }

  /**
   * Initializes live scanning settings from storage and UI state
   */
  async initLiveScanning() {
    try {
      // Get stored setting
      const result = await chrome.storage.local.get('liveScanningEnabled');
      const enabled = result.liveScanningEnabled || false;

      this.isLiveScanning = enabled;
      console.log('Live scanning initialized:', enabled);
    } catch (error) {
      console.error('Failed to initialize live scanning:', error);
      this.isLiveScanning = false; // Default to false on error
    }
  }

  /**
   * Binds the live scan toggle checkbox
   */
  bindLiveScanToggle() {
    const checkbox = document.getElementById('live-scan-checkbox');
    if (!checkbox) {
      console.warn('Live scan checkbox not found');
      return;
    }

    checkbox.addEventListener('change', (e) => {
      this.toggleLiveScanning(e.target.checked);
    });

    // Set initial state
    checkbox.checked = this.isLiveScanning;
  }

  /**
   * Toggles live scanning on/off
   */
  async toggleLiveScanning(enabled) {
    try {
      this.isLiveScanning = enabled;

      // Store in chrome storage
      await chrome.storage.local.set({ liveScanningEnabled: enabled });

      if (enabled) {
        this.startLiveScanning();
        this.renderer.showMessage('Live scanning started - scanning every 1 second', 'success');
      } else {
        this.stopLiveScanning();
        this.renderer.showMessage('Live scanning stopped', 'info');
      }

      console.log('Live scanning toggled:', enabled);
    } catch (error) {
      console.error('Failed to toggle live scanning:', error);
      this.renderer.showMessage('Failed to toggle live scanning', 'error');
    }
  }

  /**
   * Starts the live scanning interval
   */
  startLiveScanning() {
    if (this.liveScanInterval) {
      clearInterval(this.liveScanInterval);
    }

    // Scan every 1 second
    this.liveScanInterval = setInterval(async () => {
      try {
        // Only scan if popup is still open
        if (!this.container || !this.container.isConnected) {
          this.stopLiveScanning();
          return;
        }

        // Perform silent capture
        const results = await chrome.scripting.executeScript({
          target: { tabId: this.tabId },
          func: EventExtractor.getContentScriptFunction(),
          world: 'MAIN'
        });

        const data = results[0].result;
        const newEventsCount = data.events.length;
        const previousCount = this.events.length;

        // Only update if we found new content or better content
        if (newEventsCount > previousCount || this.hasBetterContent(data.events, this.events)) {
          this.events = data.events;
          console.log('Live scan update:', newEventsCount, 'events detected');

          // Refresh the display if we're in grid view
          if (this.container.querySelector('.events-grid')) {
            this.renderer.renderDataGrid(data);
            this.renderer.showMessage(`Live scan: ${newEventsCount} events found`, 'info');
          }
        }
      } catch (error) {
        console.warn('Live scan failed:', error.message);
        // Don't show error messages for live scanning to avoid spam
      }
    }, 1000); // Every 1 second
  }

  /**
   * Stops the live scanning interval
   */
  stopLiveScanning() {
    if (this.liveScanInterval) {
      clearInterval(this.liveScanInterval);
      this.liveScanInterval = null;
      console.log('Live scanning stopped');
    }
  }

  /**
   * Checks if new data has better or more complete content than existing data
   */
  hasBetterContent(newEvents, oldEvents) {
    if (!newEvents || !oldEvents) return false;

    // Check if any event now has video sources that were previously detected
    return newEvents.some((newEvent, index) => {
      const oldEvent = oldEvents[index];
      if (!oldEvent) return false;

      // Check for video URL improvements
      if (newEvent.videoSrc && newEvent.videoSrc !== 'VIDEO DETECTED' &&
        oldEvent.videoSrc === 'VIDEO DETECTED') {
        return true;
      }

      // Check for new image sources
      if (newEvent.imageSrc && !oldEvent.imageSrc) {
        return true;
      }

      // Check for longer descriptions
      if (newEvent.description && oldEvent.description &&
        newEvent.description.length > oldEvent.description.length) {
        return true;
      }

      return false;
    });
  }

  /**
   * Sets up runtime message listeners
   */
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'hoverInfo') {
        this.renderer.updateHoverInfo(message.data);
      } else if (message.action === 'captureInfo') {
        this.handleCaptureInfo(message.data);
      }
    });
  }

  /**
   * Handles capturing an item from inspector click
   */
  handleCaptureInfo(data) {
    if (!data) return;

    // Add to list
    this.capturedItems.push(data);

    // Update UI
    this.renderer.renderCapturedItems(this.capturedItems);

    // Optional: Show quick success toast?
    // this.renderer.showMessage('Item Captured!', 'success');
  }

  /**
   * Clears captured items list
   */
  handleClearCaptured() {
    this.capturedItems = [];
    this.renderer.renderCapturedItems(this.capturedItems);
  }

  /**
   * Handles toggling the hover inspector
   */
  async handleToggleInspector() {
    try {
      await this.updateActiveTab();
      this.isHoverInspectorActive = !this.isHoverInspectorActive;

      // Update UI state
      this.renderer.updateInspectorButtonState(this.isHoverInspectorActive);

      if (this.isHoverInspectorActive) {
        // Inject script if needed (it handles its own singleton state)
        await chrome.scripting.executeScript({
          target: { tabId: this.tabId },
          files: ['js/hoverInspector.js']
        });
      }

      // Send toggle message to content script
      await chrome.tabs.sendMessage(this.tabId, {
        action: 'toggleInspector',
        state: this.isHoverInspectorActive
      });

      if (this.isHoverInspectorActive) {
        this.renderer.showMessage('Hover Inspector Active - Move mouse over elements', 'info');
      } else {
        this.renderer.showMessage('Hover Inspector Disabled', 'info');
      }

    } catch (error) {
      console.error('Failed to toggle inspector:', error);
      this.renderer.showMessage('Failed to toggle inspector: ' + error.message, 'error');
      // Revert state on error
      this.isHoverInspectorActive = !this.isHoverInspectorActive;
      this.renderer.updateInspectorButtonState(this.isHoverInspectorActive);
    }
  }
}

export default PopupController;
