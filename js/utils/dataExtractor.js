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

        // Process each event: expand text, then extract data
        for (let index = 0; index < eventContainers.length; index++) {
            const container = eventContainers[index];

            // Step 1: Click "more" button to expand full text if exists
            const moreButton = container.querySelector(SelectorConstants.TRUNCATED_TEXT_MORE_BUTTON);
            if (moreButton) {
                console.log(`📝 Clicking "more" button for event ${index + 1}`);
                moreButton.click();
                // Wait for text to expand
                await this.delay(300);
            }

            // Step 2: Extract all data now that text is expanded
            const eventData = this.extractSingleEventDataSync(container, index);
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
     * Expand all truncated text across all event containers
     * @param {Array<Element>} eventContainers - Array of event container elements
     */
    async expandAllEventTexts(eventContainers) {
        console.log('📝 Expanding all truncated text across all events...');

        // Click all "more" buttons at once
        const clickPromises = eventContainers.map(async (container, index) => {
            const moreButton = container.querySelector(SelectorConstants.TRUNCATED_TEXT_MORE_BUTTON);
            if (moreButton && moreButton.offsetWidth > 0 && moreButton.offsetHeight > 0) {
                console.log(`📝 Clicking "more" button for event ${index + 1}`);
                moreButton.click();
                return true;
            }
            return false;
        });

        // Wait for all clicks to complete
        const clickResults = await Promise.all(clickPromises);
        const clickedCount = clickResults.filter(result => result).length;

        if (clickedCount > 0) {
            console.log(`📝 Clicked ${clickedCount} "more" buttons, waiting for expansion...`);

            // Wait for all expansions to complete
            await this.delay(WorkflowConfig.DELAYS.TEXT_EXPANSION);

            // Additional wait to ensure all text is loaded
            await this.delay(500);

            console.log('📝 All text expansions should now be complete');
        } else {
            console.log('📝 No "more" buttons found to click');
        }
    }

    /**
     * Extract data from a single event container (synchronous, after expansion)
     * @param {Element} container - The event container element
     * @param {number} index - The index of this container
     * @returns {Object} Extracted event data
     */
    extractSingleEventDataSync(container, index) {
        // Extract basic information (text should already be expanded)
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
        if (moreButton && moreButton.offsetWidth > 0 && moreButton.offsetHeight > 0) {
            moreButton.click();

            // Wait for expansion and check if it actually expanded
            await this.delay(WorkflowConfig.DELAYS.TEXT_EXPANSION);

            // Sometimes the expansion is asynchronous, wait a bit more
            let attempts = 0;
            const maxAttempts = 5;
            while (attempts < maxAttempts) {
                const stillTruncated = container.querySelector(SelectorConstants.TRUNCATED_TEXT_MORE_BUTTON);
                if (!stillTruncated || stillTruncated.offsetWidth === 0 || stillTruncated.offsetHeight === 0) {
                    // Text appears to be expanded
                    break;
                }
                await this.delay(100);
                attempts++;
            }
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

        // Search for text that looks like a time (e.g., "10:30 AM", "2:00 PM")
        const timePattern = /^\d{1,2}:\d{2}\s*(AM|PM)$/i;

        if (timeSpans) {
            for (const span of timeSpans) {
                const text = span?.textContent?.trim();
                if (text && timePattern.test(text)) {
                    return text;
                }
            }
        }

        // Fallback: check all text content in header for time pattern
        if (eventHeader) {
            const headerText = eventHeader.textContent || '';
            const timeMatch = headerText.match(/(\d{1,2}:\d{2}\s*(AM|PM))/i);
            if (timeMatch) {
                return timeMatch[1];
            }
        }

        return '';
    }

    /**
     * Extract description text from container
     * @param {Element} container - Event container element
     * @returns {string} Description text or empty string
     */
    extractDescription(container) {
        // First try the truncated text element (after expansion)
        const descDiv = container.querySelector(SelectorConstants.TRUNCATED_TEXT);
        if (descDiv?.textContent?.trim()) {
            const text = descDiv.textContent.trim();
            console.log('📝 Truncated text element found:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
            // If the text doesn't end with "..." it might be fully expanded
            if (!text.endsWith('...')) {
                console.log('📝 Using expanded text from truncated element');
                return text;
            }
        }

        // Fallback: try to find the longest text content in the event container
        // Look for text spans and other elements that might contain the full content
        const allTextElements = container.querySelectorAll(`${SelectorConstants.TEXT_ROOT}, p, div, span`);
        let longestText = '';
        let longestLength = 0;

        for (const element of allTextElements) {
            const text = element.textContent?.trim();
            if (text && text.length > longestLength) {
                // Skip very short texts (likely labels or timestamps) and platform names
                if (text.length > 10 && !text.includes('@') && !/^\d{1,2}:\d{2}/.test(text) && !text.match(/^\d+\s+(min|hour|day)/)) {
                    longestText = text;
                    longestLength = text.length;
                }
            }
        }

        // If we found a long text, use it
        if (longestText.length > 20) {
            console.log('📝 Using longest text from container elements:', longestText.substring(0, 100) + (longestText.length > 100 ? '...' : ''));
            return longestText;
        }

        // Last resort: get all text content from the container
        const allText = container.textContent || '';
        const lines = allText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        console.log('📝 All text lines in container:', lines);

        // Find the longest line that looks like content
        for (const line of lines) {
            if (line.length > 20 && !line.includes('@') && !/^\d{1,2}:\d{2}/.test(line) && !line.match(/^\d+\s+(min|hour|day)/)) {
                console.log('📝 Using longest line from all text:', line.substring(0, 100) + (line.length > 100 ? '...' : ''));
                return line;
            }
        }

        console.log('📝 No suitable description text found');
        return '';
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
