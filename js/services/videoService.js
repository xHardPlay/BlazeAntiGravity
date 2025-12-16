/**
 * Video Service - Manages video scanning, rendering, and downloads
 */
export class VideoService {
    constructor(controller) {
        this.controller = controller;
    }

    /**
     * Handles video scanning on the current tab
     */
    async handleVideoScan() {
        try {
            await this.controller.updateActiveTab();

            // Check if we're on a Blaze site
            let tab;
            try {
                tab = await chrome.tabs.get(this.controller.tabId);
            } catch (tabError) {
                console.error('Failed to get tab info:', tabError);
                this.controller.renderer.showMessage('Failed to access current tab', 'error');
                return;
            }

            const isBlazeSite = tab.url && tab.url.includes('blaze.ai');

            if (!isBlazeSite) {
                this.controller.renderer.showMessage('Video scanning is only available on Blaze sites', 'error');
                return;
            }

            this.controller.renderer.showMessage('Scanning for videos...', 'info');

            // Inject the VideoCapture class and get video URLs
            const results = await chrome.scripting.executeScript({
                target: { tabId: this.controller.tabId },
                files: ['js/services/video_capture_module.js'],
                world: 'MAIN'
            });

            // Now execute the video scanning
            const videoResults = await chrome.scripting.executeScript({
                target: { tabId: this.controller.tabId },
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
                this.controller.renderer.showMessage('No videos found on this page', 'info');
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

            this.controller.renderer.showMessage(`Found ${videoUrls.length} videos!`, 'success');

        } catch (error) {
            console.error('Video scan failed:', error);
            this.controller.renderer.showMessage('Video scan failed: ' + error.message, 'error');
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
     * Helper to get filename from URL
     */
    getFilenameFromUrl(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
            return filename || 'video';
        } catch {
            return 'video';
        }
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

        this.controller.container.innerHTML = html;
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
        const backBtn = this.controller.container.querySelector('#video-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.controller.renderer.renderLoadingState();
            });
        }

        // Individual download buttons
        const downloadButtons = this.controller.container.querySelectorAll('.download-video-btn');
        downloadButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const url = e.target.getAttribute('data-url');
                const filename = e.target.getAttribute('data-filename');
                this.downloadVideo(url, filename);
            });
        });

        // Open video buttons
        const openButtons = this.controller.container.querySelectorAll('.open-video-btn');
        openButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const url = e.target.getAttribute('data-url');
                chrome.tabs.create({ url, active: false });
            });
        });

        // Bulk download button
        const bulkBtn = this.controller.container.querySelector('#download-all-videos-btn');
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
        urls.forEach((url, index) => {
            setTimeout(() => {
                chrome.downloads.download({ url });
            }, index * 500);
        });
        this.controller.renderer.showMessage(`Downloading ${urls.length} videos...`, 'info');
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
     * Handles extracting full content from event detail view
     */
    async handleExtractVideo(eventIndex) {
        try {
            const event = this.controller.events[eventIndex];
            if (!event) {
                this.controller.renderer.showMessage('Event not found', 'error');
                return;
            }

            if (!event.eventUrl) {
                this.controller.renderer.showMessage('No URL found for this event', 'error');
                return;
            }

            await this.controller.updateActiveTab();
            this.controller.renderer.showMessage('Extracting full content...', 'info');

            // Execute script to navigate and extract
            const results = await chrome.scripting.executeScript({
                target: { tabId: this.controller.tabId },
                func: async (eventUrl, cardIndex) => {
                    // Helper to wait
                    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

                    // Find and click the event card
                    const eventContainers = Array.from(document.querySelectorAll('[class*="CalendarEventCard_eventContainer"]'))
                        .filter(el => el.offsetWidth > 0 && el.offsetHeight > 0);

                    const targetContainer = eventContainers[cardIndex - 1];
                    if (!targetContainer) {
                        throw new Error('Event card not found');
                    }

                    const linkEl = targetContainer.closest('a') || targetContainer.querySelector('a');
                    if (linkEl) {
                        linkEl.click();
                    } else {
                        targetContainer.click();
                    }

                    // Wait for detail view to load
                    await wait(2000);

                    // Extract video from detail view
                    const videoEl = document.querySelector('video');
                    const videoSrc = videoEl?.src || videoEl?.querySelector('source')?.src || null;

                    // Extract image if no video
                    const imgEl = document.querySelector('[class*="DetailView"] img, [class*="Modal"] img');
                    const imageSrc = imgEl?.src || null;

                    // Extract full description
                    const descEl = document.querySelector('[class*="DetailView"] [class*="description"], [class*="Modal"] [class*="description"]');
                    const fullDescription = descEl?.textContent?.trim() || '';

                    return {
                        videoSrc,
                        imageSrc,
                        fullDescription,
                        extracted: true
                    };
                },
                args: [event.eventUrl, event.cardIndex],
                world: 'MAIN'
            });

            const extractedData = results[0].result;

            // Update event with extracted data
            if (extractedData.videoSrc) {
                this.controller.events[eventIndex].videoSrc = extractedData.videoSrc;
            }
            if (extractedData.imageSrc) {
                this.controller.events[eventIndex].imageSrc = extractedData.imageSrc;
            }
            if (extractedData.fullDescription) {
                this.controller.events[eventIndex].fullDescription = extractedData.fullDescription;
            }

            // Re-render detail view with updated data
            this.controller.renderer.renderEventDetail(eventIndex);
            this.controller.renderer.showMessage('Content extracted successfully!', 'success');

        } catch (error) {
            console.error('Extract video failed:', error);
            this.controller.renderer.showMessage('Failed to extract content: ' + error.message, 'error');
        }
    }

    /**
     * Handles extracting all detailed content from video events
     */
    handleExtractAllVideos() {
        // Delegate to auto pilot
        this.controller.autoPilotService.handleAutoPilot();
    }
}
