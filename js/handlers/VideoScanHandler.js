import { ErrorMessages } from '../constants/ErrorMessages.js';
import { WorkflowConfig } from '../constants/WorkflowConfig.js';
import { VideoProcessor } from '../utils/VideoProcessor.js';

/**
 * VideoScanHandler - Handles video scanning, UI updates for captured/missing videos
 * Manages the video scanning workflow and related UI components
 */
export class VideoScanHandler {
    constructor(controller) {
        this.controller = controller;
        this.videoProcessor = new VideoProcessor();
    }

    /**
     * Scan the page for video elements and update UI accordingly
     * @returns {Promise<void>}
     */
    async handleScanVideos() {
        try {
            await this.controller.updateActiveTab();

            this.controller.renderer.showMessage(
                ErrorMessages.SCANNING_VIDEOS,
                'info'
            );

            // Execute video scanning script
            const scanResults = await this.scanForVideos();
            const { videoSources, eventsWithVideos, eventsWithoutVideos } = scanResults;

            // Add found videos to captured videos list
            this.addVideosToCapturedList(videoSources);

            // Update UI components
            this.updateCapturedVideosUI();
            this.updateMissingVideosUI(eventsWithoutVideos);

            // Show results message
            const message = `Found ${videoSources.length} new videos. ${eventsWithoutVideos.length} events need manual opening.`;
            this.controller.renderer.showMessage(
                message,
                eventsWithoutVideos.length > 0 ? 'info' : 'success'
            );

        } catch (error) {
            console.error('Video scan failed:', error);
            this.controller.renderer.showMessage(
                ErrorMessages.VIDEO_SCAN_FAILED + ': ' + error.message,
                'error'
            );
        }
    }

    /**
     * Scan for videos on the current page
     * @returns {Promise<Object>} Scan results with video sources and event status
     */
    async scanForVideos() {
        const results = await chrome.scripting.executeScript({
            target: { tabId: this.controller.tabId },
            func: (capturedEvents) => {
                // Scan for all video elements and their sources
                const videos = Array.from(document.querySelectorAll('video'));
                const videoSources = [];

                videos.forEach((video, index) => {
                    // Get direct src attribute
                    if (video.src && video.src.includes('.mp4')) {
                        videoSources.push({
                            url: video.src,
                            type: 'direct',
                            elementIndex: index,
                            duration: video.duration || 0,
                            currentTime: video.currentTime || 0
                        });
                    }

                    // Get sources from <source> elements
                    const sources = video.querySelectorAll('source');
                    sources.forEach((source, sourceIndex) => {
                        if (source.src && source.src.includes('.mp4')) {
                            videoSources.push({
                                url: source.src,
                                type: 'source',
                                elementIndex: index,
                                sourceIndex: sourceIndex,
                                duration: video.duration || 0,
                                currentTime: video.currentTime || 0
                            });
                        }
                    });
                });

                // Check which events have videos loaded
                const containers = Array.from(document.querySelectorAll('[class*="CalendarEventCard_eventContainer"]'))
                    .filter(el => el.offsetWidth > 0 && el.offsetHeight > 0);

                const eventsWithVideos = [];
                const eventsWithoutVideos = [];

                containers.forEach((container, index) => {
                    const hasVideoElement = !!container.querySelector('video');
                    const label = container.querySelector('span[class*="Text_root_"]')?.textContent?.trim() ||
                                 `Event ${index + 1}`;

                    // Check if this event was marked as having video in captured data
                    const matchingEvent = capturedEvents.find(event => event.cardIndex === index + 1);
                    const hasVideoDetected = matchingEvent && (matchingEvent.hasVideo || matchingEvent.videoSrc === 'VIDEO DETECTADO');

                    const hasVideo = hasVideoElement || hasVideoDetected;

                    if (hasVideo) {
                        eventsWithVideos.push({
                            index: index + 1,
                            label: label,
                            hasVideo: true,
                            source: hasVideoElement ? 'loaded' : 'detected'
                        });
                        // Restore original content if it was hidden
                        if (container.dataset.wasHidden === 'true') {
                            delete container.dataset.wasHidden;
                        }
                    } else {
                        eventsWithoutVideos.push({
                            index: index + 1,
                            label: label,
                            hasVideo: false
                        });
                        // Hide content for events without videos
                        if (!container.dataset.wasHidden) {
                            container.dataset.wasHidden = 'true';
                            container.dataset.originalContent = container.innerHTML;
                            container.innerHTML = '<div style="display: none;"></div>';
                        }
                    }
                });

                return {
                    videoSources,
                    eventsWithVideos,
                    eventsWithoutVideos
                };
            },
            args: [this.controller.events || []],
            world: 'MAIN'
        });

        return results[0].result;
    }

    /**
     * Add found videos to the captured videos list
     * @param {Array} videoSources - Array of video source objects
     */
    addVideosToCapturedList(videoSources) {
        if (!this.controller.capturedVideos) {
            this.controller.capturedVideos = [];
        }

        // Filter out duplicates
        const newVideos = videoSources.filter(video =>
            !this.controller.capturedVideos.some(existing =>
                existing.url === video.url
            )
        );

        this.controller.capturedVideos.push(...newVideos);
    }

    /**
     * Update the UI to display captured videos
     */
    updateCapturedVideosUI() {
        // Create or update the videos container
        let videosContainer = document.getElementById('captured-videos-container');
        if (!videosContainer) {
            videosContainer = this.createVideosContainer();
            this.insertVideosContainer(videosContainer);
        }

        // Update the videos list
        this.updateVideosList(videosContainer);

        // Bind download button
        this.bindVideosDownloadButton();
    }

    /**
     * Create the videos container element
     * @returns {Element} The videos container element
     */
    createVideosContainer() {
        const container = document.createElement('div');
        container.id = 'captured-videos-container';
        container.style.cssText = `
            margin-bottom: 20px;
            background: rgba(0,0,0,0.1);
            border-radius: 8px;
            padding: 16px;
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            font-weight: bold;
            color: #fff;
        `;
        header.innerHTML = `
            <span>Captured Videos (<span id="videos-count">0</span>)</span>
            <button id="download-videos-btn" style="background: linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%); border: none; padding: 6px 12px; font-size: 11px; color: white; cursor: pointer; border-radius: 4px;">Download All</button>
        `;

        const videosList = document.createElement('div');
        videosList.id = 'videos-list';
        videosList.style.cssText = `
            max-height: ${WorkflowConfig.UI.MAX_VIDEOS_DISPLAY_HEIGHT}px;
            overflow-y: auto;
            background: rgba(0,0,0,0.1);
            border-radius: 8px;
            padding: 8px;
        `;

        container.appendChild(header);
        container.appendChild(videosList);

        return container;
    }

    /**
     * Insert the videos container into the DOM
     * @param {Element} container - The videos container element
     */
    insertVideosContainer(container) {
        const capturedItems = document.getElementById('captured-items-container');
        const resultsContent = document.querySelector('.results-content');

        if (capturedItems && capturedItems.nextSibling) {
            resultsContent.insertBefore(container, capturedItems.nextSibling);
        } else if (resultsContent) {
            resultsContent.appendChild(container);
        }
    }

    /**
     * Update the videos list display
     * @param {Element} container - The videos container element
     */
    updateVideosList(container) {
        const videosList = container.querySelector('#videos-list');
        const videosCount = container.querySelector('#videos-count');

        if (videosCount) {
            videosCount.textContent = this.controller.capturedVideos.length;
        }

        if (!videosList) return;

        if (this.controller.capturedVideos.length === 0) {
            videosList.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.4); font-size: 11px; padding: 10px;">No videos captured yet</div>';
        } else {
            videosList.innerHTML = this.controller.capturedVideos.map((video, index) =>
                this.createVideoListItem(video, index)
            ).join('');

            // Start playing videos when they're loaded
            this.startVideoPlayback();
        }
    }

    /**
     * Create HTML for a single video list item
     * @param {Object} video - Video object
     * @param {number} index - Video index
     * @returns {string} HTML string for the video item
     */
    createVideoListItem(video, index) {
        // Truncate long URLs for display
        const displayUrl = video.url.length > WorkflowConfig.LIMITS.MAX_URL_DISPLAY_LENGTH ?
                          video.url.substring(0, WorkflowConfig.LIMITS.MAX_URL_DISPLAY_LENGTH) + '...' :
                          video.url;

        const videoId = `captured-video-${index}`;

        return `
        <div style="background: rgba(255,255,255,0.05); border-radius: 4px; padding: 8px; margin-bottom: 6px; font-size: 11px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                <div style="flex: 1;">
                    <span style="font-weight: bold; color: #4ecdc4;">🎥 Video #${index + 1}</span>
                    <span style="color: #666; font-size: 10px; margin-left: 8px;">${video.type}</span>
                </div>
                <video id="${videoId}" style="width: ${WorkflowConfig.UI.VIDEO_THUMBNAIL_SIZE.width}px; height: ${WorkflowConfig.UI.VIDEO_THUMBNAIL_SIZE.height}px; object-fit: cover; border-radius: 2px; background: #000;" muted loop playsinline>
                    <source src="${video.url}" type="video/mp4">
                </video>
            </div>
            <div style="color: #ccc; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 4px; font-family: monospace; font-size: 10px;" title="${video.url}">${displayUrl}</div>
            ${video.duration ? `<div style="color: #888; font-size: 10px;">Duration: ${Math.round(video.duration)}s</div>` : ''}
        </div>
        `;
    }

    /**
     * Start playback for loaded videos
     */
    startVideoPlayback() {
        this.controller.capturedVideos.forEach((video, index) => {
            const videoElement = document.getElementById(`captured-video-${index}`);
            if (videoElement) {
                videoElement.addEventListener('loadeddata', () => {
                    videoElement.play().catch(e => {
                        // Autoplay might be blocked, that's ok
                        console.log('Autoplay blocked for video', index);
                    });
                });
            }
        });
    }

    /**
     * Bind the download videos button
     */
    bindVideosDownloadButton() {
        const downloadBtn = document.getElementById('download-videos-btn');
        if (downloadBtn) {
            downloadBtn.onclick = () => this.handleDownloadCapturedVideos();
        }
    }

    /**
     * Update the UI to display events that don't have videos loaded
     * @param {Array} eventsWithoutVideos - Array of events without videos
     */
    updateMissingVideosUI(eventsWithoutVideos) {
        // Create or update the missing videos container
        let missingVideosContainer = document.getElementById('missing-videos-container');
        if (!missingVideosContainer) {
            missingVideosContainer = this.createMissingVideosContainer();
            this.insertMissingVideosContainer(missingVideosContainer);
        }

        // Update the missing videos list
        this.updateMissingVideosList(missingVideosContainer, eventsWithoutVideos);
    }

    /**
     * Create the missing videos container element
     * @returns {Element} The missing videos container element
     */
    createMissingVideosContainer() {
        const container = document.createElement('div');
        container.id = 'missing-videos-container';
        container.style.cssText = `
            margin-bottom: 20px;
            background: rgba(255,59,48,0.1);
            border: 1px solid rgba(255,59,48,0.3);
            border-radius: 8px;
            padding: 16px;
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            font-weight: bold;
            color: #fff;
        `;
        header.innerHTML = `
            <span>⚠️ Events Without Videos (<span id="missing-count">0</span>)</span>
            <div style="font-size: 11px; color: #ff9f43;">Click to open manually</div>
        `;

        const missingList = document.createElement('div');
        missingList.id = 'missing-videos-list';
        missingList.style.cssText = `
            max-height: ${WorkflowConfig.UI.MAX_MISSING_VIDEOS_HEIGHT}px;
            overflow-y: auto;
            background: rgba(0,0,0,0.1);
            border-radius: 8px;
            padding: 8px;
        `;

        container.appendChild(header);
        container.appendChild(missingList);

        return container;
    }

    /**
     * Insert the missing videos container into the DOM
     * @param {Element} container - The missing videos container element
     */
    insertMissingVideosContainer(container) {
        const capturedVideos = document.getElementById('captured-videos-container');
        const resultsContent = document.querySelector('.results-content');

        if (capturedVideos && capturedVideos.nextSibling) {
            resultsContent.insertBefore(container, capturedVideos.nextSibling);
        } else if (resultsContent) {
            resultsContent.appendChild(container);
        }
    }

    /**
     * Update the missing videos list display
     * @param {Element} container - The missing videos container element
     * @param {Array} eventsWithoutVideos - Array of events without videos
     */
    updateMissingVideosList(container, eventsWithoutVideos) {
        const missingList = container.querySelector('#missing-videos-list');
        const missingCount = container.querySelector('#missing-count');

        if (missingCount) {
            missingCount.textContent = eventsWithoutVideos.length;
        }

        if (!missingList) return;

        if (eventsWithoutVideos.length === 0) {
            missingList.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.4); font-size: 11px; padding: 10px;">All events have videos loaded! 🎉</div>';
            // Hide the container if no missing videos
            container.style.display = 'none';
        } else {
            container.style.display = 'block';
            missingList.innerHTML = eventsWithoutVideos.map(event =>
                this.createMissingVideoItem(event)
            ).join('');
        }
    }

    /**
     * Create HTML for a single missing video item
     * @param {Object} event - Event object
     * @returns {string} HTML string for the missing video item
     */
    createMissingVideoItem(event) {
        return `
        <div style="background: rgba(255,59,48,0.1); border: 1px solid rgba(255,59,48,0.2); border-radius: 4px; padding: 8px; margin-bottom: 6px; font-size: 11px; cursor: pointer;" onclick="this.style.background='rgba(255,59,48,0.2)'; setTimeout(() => this.style.background='rgba(255,59,48,0.1)', 200)">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-weight: bold; color: #ff6b6b;">📂 Event #${event.index}</span>
                <span style="color: #666; font-size: 10px;">No video loaded</span>
            </div>
            <div style="color: #ccc; word-break: break-all;">${event.label}</div>
        </div>
        `;
    }

    /**
     * Handle downloading all captured videos
     * @returns {Promise<void>}
     */
    async handleDownloadCapturedVideos() {
        const { DownloadManager } = await import('../utils/DownloadManager.js');
        const downloadManager = new DownloadManager();

        await downloadManager.handleCapturedVideosDownload(
            this.controller.capturedVideos,
            this.controller.renderer
        );
    }

    /**
     * Clear captured items list
     */
    handleClearCaptured() {
        this.controller.capturedItems = [];
        this.controller.renderer.renderCapturedItems(this.controller.capturedItems);
    }

    /**
     * Handle capturing an item from inspector click
     * @param {Object} data - Captured item data
     */
    handleCaptureInfo(data) {
        if (!data) return;

        // Add to list
        this.controller.capturedItems.push(data);

        // Update UI
        this.controller.renderer.renderCapturedItems(this.controller.capturedItems);
    }
}
