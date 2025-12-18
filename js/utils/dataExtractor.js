import { SelectorConstants } from '../constants/SelectorConstants.js';
import { WorkflowConfig } from '../constants/WorkflowConfig.js';
import { PlatformDetector } from './PlatformDetector.js';

/**
 * DataExtractor - Handles DOM scraping and data extraction from Blaze event cards
 * Separates data extraction concerns from event handling logic
 */
export class DataExtractor {
    constructor() {
        this.platformDetector = new PlatformDetector();
    }

    /**
     * Extract events data from the current page
     * @returns {Promise<Array>} Array of extracted event data
     */
    async extractEventsData() {
        const eventContainers = this.findVisibleEventContainers();
        const events = [];

        console.log(`Found ${eventContainers.length} visible event containers`);

        // Process each event container
        for (let index = 0; index < eventContainers.length; index++) {
            const container = eventContainers[index];
            const eventData = await this.extractSingleEventData(container, index);
            events.push(eventData);
        }

        return events;
    }

    /**
     * Find all visible event containers on the page
     * @returns {Array<Element>} Array of visible event container elements
     */
    findVisibleEventContainers() {
        const containers = Array.from(
            document.querySelectorAll(SelectorConstants.EVENT_CONTAINER)
        );

        return containers.filter(container =>
            container.offsetWidth > 0 && container.offsetHeight > 0
        );
    }

    /**
     * Extract data from a single event container
     * @param {Element} container - The event container element
     * @param {number} index - The index of this container
     * @returns {Object} Extracted event data
     */
    async extractSingleEventData(container, index) {
        // Expand text content first
        await this.expandEventText(container);

        // Extract basic information
        const label = this.extractEventLabel(container);
        const platforms = this.extractPlatforms(container, label);
        const timestamp = this.extractTimestamp(container);
        const description = this.extractDescription(container);

        // Extract media information
        const imageData = this.extractImageData(container);
        const videoData = this.extractVideoData(container);

        // Extract additional metadata
        const url = this.extractEventUrl(container);
        const metadata = this.extractMetadata(container, index);

        return {
            label,
            platforms,
            timestamp,
            description,
            imageSrc: imageData.src,
            videoSrc: videoData.src,
            hasVideo: videoData.hasVideo,
            videoDuration: videoData.duration,
            isNew: metadata.isNew,
            cardIndex: metadata.cardIndex,
            eventUrl: url,
            cardClasses: metadata.cardClasses
        };
    }

    /**
     * Expand truncated text content by clicking "more" button
     * @param {Element} container - Event container element
     */
    async expandEventText(container) {
        const moreButton = container.querySelector(SelectorConstants.TRUNCATED_TEXT_MORE_BUTTON);
        if (moreButton) {
            moreButton.click();
            await this.delay(WorkflowConfig.DELAYS.TEXT_EXPANSION);
        }
    }

    /**
     * Extract event label from container
     * @param {Element} container - Event container element
     * @returns {string} Event label or default value
     */
    extractEventLabel(container) {
        const channelContainer = container.querySelector(SelectorConstants.CHANNEL_CONTAINER);
        const labelSpan = channelContainer?.querySelector(SelectorConstants.TEXT_ROOT) ||
                         container.querySelector(SelectorConstants.TEXT_ROOT);

        return labelSpan?.textContent?.trim() || 'No Label';
    }

    /**
     * Extract platform information from container
     * @param {Element} container - Event container element
     * @param {string} label - Event label for fallback inference
     * @returns {Array<string>} Array of platform names
     */
    extractPlatforms(container, label) {
        let platforms = this.platformDetector.detectPlatforms(container);

        // If no platforms detected, try to infer from label
        if (platforms.length === 0) {
            platforms = this.platformDetector.inferPlatformFromLabel(label);
        }

        return platforms;
    }

    /**
     * Extract timestamp from event header
     * @param {Element} container - Event container element
     * @returns {string} Timestamp string or empty string
     */
    extractTimestamp(container) {
        const eventHeader = container.querySelector(SelectorConstants.EVENT_HEADER);
        const timeSpans = eventHeader?.querySelectorAll(SelectorConstants.TEXT_ROOT);

        return timeSpans && timeSpans.length > 1 ?
               timeSpans[1]?.textContent?.trim() || '' : '';
    }

    /**
     * Extract description text from container
     * @param {Element} container - Event container element
     * @returns {string} Description text or empty string
     */
    extractDescription(container) {
        const descDiv = container.querySelector(SelectorConstants.TRUNCATED_TEXT);
        return descDiv?.textContent?.trim() || '';
    }

    /**
     * Extract image data from container
     * @param {Element} container - Event container element
     * @returns {Object} Image data object
     */
    extractImageData(container) {
        const img = container.querySelector('img');
        const src = img && !img.src.startsWith('data:') && img.offsetWidth > 0 ? img.src : null;

        return { src };
    }

    /**
     * Extract video data from container
     * @param {Element} container - Event container element
     * @returns {Object} Video data object
     */
    extractVideoData(container) {
        const hasPlayOverlay = !!container.querySelector(SelectorConstants.PLAY_BUTTON_OVERLAY);
        const hasVideoContainer = !!container.querySelector(SelectorConstants.VIDEO_CONTAINER);
        const hasVideoTag = !!container.querySelector(SelectorConstants.VIDEO_ELEMENT);

        const hasVideo = hasPlayOverlay || hasVideoContainer || hasVideoTag;
        let videoSrc = null;
        let duration = '';

        if (hasVideo) {
            // Try to get video source
            videoSrc = this.extractVideoSource(container);

            // Try to get duration
            duration = this.extractVideoDuration(container);

            // Mark as detected if no URL found
            if (!videoSrc) {
                videoSrc = WorkflowConfig.VIDEO_DETECTION.DETECTED_PLACEHOLDER;
            }
        }

        return { src: videoSrc, hasVideo, duration };
    }

    /**
     * Extract video source URL from container
     * @param {Element} container - Event container element
     * @returns {string|null} Video source URL or null
     */
    extractVideoSource(container) {
        // Check for direct video src
        const videoEl = container.querySelector(SelectorConstants.VIDEO_ELEMENT);
        if (videoEl && videoEl.src && videoEl.src !== 'about:blank') {
            return videoEl.src;
        }

        // Check for video source in data attributes
        const videoContainer = container.querySelector(SelectorConstants.VIDEO_CONTAINER);
        if (videoContainer) {
            const dataSrc = videoContainer.getAttribute('data-src') ||
                           videoContainer.getAttribute('data-video-src');
            if (dataSrc) {
                return dataSrc;
            }
        }

        return null;
    }

    /**
     * Extract video duration from container
     * @param {Element} container - Event container element
     * @returns {string} Duration string or empty string
     */
    extractVideoDuration(container) {
        // Method 1: Check for visible duration element
        const durationEl = container.querySelector(SelectorConstants.VIDEO_DURATION);
        if (durationEl?.textContent?.trim()) {
            return durationEl.textContent.trim();
        }

        // Method 2: Check video element duration
        const videoEl = container.querySelector(SelectorConstants.VIDEO_ELEMENT);
        if (videoEl && videoEl.duration && !isNaN(videoEl.duration)) {
            const minutes = Math.floor(videoEl.duration / 60);
            const seconds = Math.floor(videoEl.duration % 60);
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        return '';
    }

    /**
     * Extract event URL from container
     * @param {Element} container - Event container element
     * @returns {string|null} Event URL or null
     */
    extractEventUrl(container) {
        const linkEl = container.closest('a') || container.querySelector('a');
        return linkEl?.href || null;
    }

    /**
     * Extract metadata from container
     * @param {Element} container - Event container element
     * @param {number} index - Container index
     * @returns {Object} Metadata object
     */
    extractMetadata(container, index) {
        const cardClasses = container.className || '';
        const isNew = cardClasses.includes('CalendarEventCard_new__335fa');

        return {
            cardIndex: index + 1,
            isNew,
            cardClasses
        };
    }

    /**
     * Check and select checkbox for event
     * @param {Element} container - Event container element
     */
    async checkEventCheckbox(container) {
        const checkbox = container.querySelector(SelectorConstants.CHECKBOX);
        const labelElement = container.querySelector(SelectorConstants.CHECKBOX_LABEL);

        if (checkbox && !checkbox.checked && labelElement) {
            labelElement.click();
            await this.delay(WorkflowConfig.DELAYS.CHECKBOX_CLICK);
        }
    }

    /**
     * Uncheck all event checkboxes on the page
     */
    async uncheckAllCheckboxes() {
        const allCheckboxes = document.querySelectorAll(SelectorConstants.CHECKBOX);

        for (const checkbox of allCheckboxes) {
            if (checkbox.checked) {
                const label = checkbox.closest(SelectorConstants.CHECKBOX_LABEL) ||
                             document.querySelector(`label[for="${checkbox.id}"]`);
                if (label) {
                    label.click();
                    await this.delay(WorkflowConfig.DELAYS.VIDEO_LOAD_CHECK);
                }
            }
        }
    }

    /**
     * Utility method for delays
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Promise that resolves after delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
