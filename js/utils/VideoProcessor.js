import { WorkflowConfig } from '../constants/WorkflowConfig.js';

/**
 * VideoProcessor - Handles video-related operations including URL extraction and duration matching
 * Manages the connection between captured videos and events based on duration
 */
export class VideoProcessor {

    /**
     * Connect captured videos to events based on duration matching
     * @param {Array} events - Array of event objects
     * @param {Array} capturedVideos - Array of captured video objects
     * @returns {number} Number of connections made
     */
    connectVideosToEvents(events, capturedVideos = []) {
        if (!events || !capturedVideos || capturedVideos.length === 0) {
            console.log('No videos to connect');
            return 0;
        }

        console.log('🔗 Attempting to connect videos to events by duration matching...');

        const eventsWithVideos = events.filter(event => event.hasVideo);
        const availableVideos = [...capturedVideos];
        let connectionsMade = 0;

        console.log(`📊 Found ${eventsWithVideos.length} events with videos and ${availableVideos.length} captured videos`);

        eventsWithVideos.forEach(event => {
            if (event.videoSrc !== WorkflowConfig.VIDEO_DETECTION.DETECTED_PLACEHOLDER) {
                // Event already has a real video URL
                return;
            }

            const matchingVideo = this.findBestVideoMatch(event, availableVideos);
            if (matchingVideo) {
                this.connectVideoToEvent(event, matchingVideo.video, matchingVideo.diff);
                availableVideos.splice(matchingVideo.index, 1);
                connectionsMade++;
            } else {
                console.log(`❌ No match found for: Event "${event.label}" (${this.parseDuration(event.videoDuration)}s)`);
            }
        });

        console.log(`🎉 Video-Event connections completed: ${connectionsMade} connections made`);
        return connectionsMade;
    }

    /**
     * Find the best video match for an event based on duration
     * @param {Object} event - Event object
     * @param {Array} availableVideos - Array of available video objects
     * @returns {Object|null} Best matching video with index and duration difference
     */
    findBestVideoMatch(event, availableVideos) {
        const eventDuration = this.parseDuration(event.videoDuration);
        if (eventDuration === 0) {
            console.log(`⏰ Event "${event.label}" has no valid duration (${event.videoDuration})`);
            return null;
        }

        let bestMatch = null;
        let bestMatchDiff = Infinity;

        availableVideos.forEach((video, index) => {
            const videoDuration = Math.round(video.duration || 0);
            const durationDiff = Math.abs(videoDuration - eventDuration);

            // Only consider matches within tolerance
            if (durationDiff <= WorkflowConfig.LIMITS.DURATION_MATCH_TOLERANCE_SECONDS &&
                durationDiff < bestMatchDiff) {
                bestMatch = { video, index, diff: durationDiff };
                bestMatchDiff = durationDiff;
            }
        });

        return bestMatch;
    }

    /**
     * Connect a video to an event
     * @param {Object} event - Event object
     * @param {Object} video - Video object
     * @param {number} durationDiff - Duration difference in seconds
     */
    connectVideoToEvent(event, video, durationDiff) {
        event.videoSrc = video.url;
        console.log(`✅ Connected: Event "${event.label}" (${this.parseDuration(event.videoDuration)}s) → Video ${video.index || 0 + 1} (${Math.round(video.duration)}s, diff: ${durationDiff}s)`);
    }

    /**
     * Parse duration string to seconds
     * @param {string} durationStr - Duration string (e.g., "1:30" or "90")
     * @returns {number} Duration in seconds
     */
    parseDuration(durationStr) {
        if (!durationStr) return 0;

        const durationMatch = durationStr.match(/^(\d+):(\d+)$/);
        if (durationMatch) {
            return parseInt(durationMatch[1]) * 60 + parseInt(durationMatch[2]);
        }

        // Try as seconds only
        const seconds = parseInt(durationStr);
        return isNaN(seconds) ? 0 : seconds;
    }

    /**
     * Scan the page for video elements and extract their sources
     * @param {Array} capturedEvents - Array of already captured events
     * @returns {Object} Scan results containing video sources and event status
     */
    scanForVideos(capturedEvents = []) {
        // Scan for all video elements and their sources
        const videoSources = this.extractVideoSources();

        // Check which events have videos loaded
        const eventStatus = this.checkEventVideoStatus(capturedEvents);

        return {
            videoSources,
            eventsWithVideos: eventStatus.withVideos,
            eventsWithoutVideos: eventStatus.withoutVideos
        };
    }

    /**
     * Extract video sources from all video elements on the page
     * @returns {Array} Array of video source objects
     */
    extractVideoSources() {
        const videos = Array.from(document.querySelectorAll('video'));
        const videoSources = [];

        videos.forEach((video, index) => {
            // Get direct src attribute
            if (video.src && video.src.includes('.mp4')) {
                videoSources.push(this.createVideoSourceObject(video, 'direct', index));
            }

            // Get sources from <source> elements
            const sources = video.querySelectorAll('source');
            sources.forEach((source, sourceIndex) => {
                if (source.src && source.src.includes('.mp4')) {
                    videoSources.push(this.createVideoSourceObject(video, 'source', index, sourceIndex));
                }
            });
        });

        return videoSources;
    }

    /**
     * Create a standardized video source object
     * @param {Element} videoElement - Video element
     * @param {string} type - Source type ('direct' or 'source')
     * @param {number} elementIndex - Index of video element
     * @param {number} sourceIndex - Index of source element (for type 'source')
     * @returns {Object} Video source object
     */
    createVideoSourceObject(videoElement, type, elementIndex, sourceIndex = null) {
        const src = type === 'direct' ? videoElement.src :
                   videoElement.querySelectorAll('source')[sourceIndex]?.src;

        return {
            url: src,
            type: type,
            elementIndex: elementIndex,
            sourceIndex: sourceIndex,
            duration: videoElement.duration || 0,
            currentTime: videoElement.currentTime || 0
        };
    }

    /**
     * Check which events have videos loaded and which don't
     * @param {Array} capturedEvents - Array of captured events
     * @returns {Object} Object with events with/without videos
     */
    checkEventVideoStatus(capturedEvents) {
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
            const hasVideoDetected = matchingEvent && (matchingEvent.hasVideo || matchingEvent.videoSrc === WorkflowConfig.VIDEO_DETECTION.DETECTED_PLACEHOLDER);

            const hasVideo = hasVideoElement || hasVideoDetected;

            if (hasVideo) {
                eventsWithVideos.push({
                    index: index + 1,
                    label: label,
                    hasVideo: true,
                    source: hasVideoElement ? 'loaded' : 'detected'
                });
                // Restore original content if it was hidden
                this.restoreHiddenContent(container);
            } else {
                eventsWithoutVideos.push({
                    index: index + 1,
                    label: label,
                    hasVideo: false
                });
                // Hide content for events without videos
                this.hideEventContent(container);
            }
        });

        return {
            withVideos: eventsWithVideos,
            withoutVideos: eventsWithoutVideos
        };
    }

    /**
     * Restore original content for events that were previously hidden
     * @param {Element} container - Event container element
     */
    restoreHiddenContent(container) {
        if (container.dataset.wasHidden === 'true') {
            delete container.dataset.wasHidden;
            // Note: We can't restore original content, but at least we mark it as visible
        }
    }

    /**
     * Hide content for events without videos
     * @param {Element} container - Event container element
     */
    hideEventContent(container) {
        if (!container.dataset.wasHidden) {
            container.dataset.wasHidden = 'true';
            container.dataset.originalContent = container.innerHTML;
            container.innerHTML = '<div style="display: none;"></div>';
        }
    }

    /**
     * Filter out duplicate videos from captured videos list
     * @param {Array} capturedVideos - Array of captured video objects
     * @returns {Array} Array with duplicates removed
     */
    removeDuplicateVideos(capturedVideos) {
        const uniqueVideos = [];
        const seenUrls = new Set();

        capturedVideos.forEach(video => {
            if (!seenUrls.has(video.url)) {
                seenUrls.add(video.url);
                uniqueVideos.push(video);
            }
        });

        return uniqueVideos;
    }

    /**
     * Generate filename for captured video
     * @param {number} index - Video index
     * @param {string} timestamp - Timestamp string
     * @returns {string} Generated filename
     */
    generateCapturedVideoFilename(index, timestamp) {
        return `${WorkflowConfig.FILENAME_PATTERNS.FOLDER_NAME}/captured_video_${index + 1}_${timestamp}.mp4`;
    }

    /**
     * Format video duration for display
     * @param {number} durationSeconds - Duration in seconds
     * @returns {string} Formatted duration string
     */
    formatDuration(durationSeconds) {
        if (!durationSeconds || durationSeconds === 0) return '';

        const minutes = Math.floor(durationSeconds / 60);
        const seconds = Math.floor(durationSeconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}
