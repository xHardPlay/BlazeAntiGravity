import { ErrorMessages } from '../constants/ErrorMessages.js';
import { DownloadManager } from '../utils/DownloadManager.js';

/**
 * ExportHandler - Handles all export operations (CSV, HTML, media downloads)
 * Manages different types of exports and download workflows
 */
export class ExportHandler {
    constructor(controller) {
        this.controller = controller;
        this.downloadManager = new DownloadManager();
    }

    /**
     * Handle downloading all events as CSV
     * @returns {Promise<void>}
     */
    async handleDownloadAllCSV() {
        try {
            const { CSVExporter } = await import('../utils/csvExporter.js');
            await CSVExporter.exportAllEvents(this.controller.events);
            this.controller.renderer.showMessage('CSV downloaded successfully!', 'success');
        } catch (error) {
            console.error('CSV export failed:', error);
            this.controller.renderer.showMessage(
                'Failed to export CSV: ' + error.message,
                'error'
            );
        }
    }

    /**
     * Handle downloading CSV data only (direct download without extra features)
     * @returns {Promise<void>}
     */
    async handleDownloadCSVOnly() {
        try {
            const events = this.controller.events;
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');

            // Group events by platform
            const platformGroups = this.groupEventsByPlatform(events);
            const platforms = Object.keys(platformGroups);

            if (platforms.length === 0) {
                this.controller.renderer.showMessage('No events to export', 'info');
                return;
            }

            // Download a CSV for each platform
            for (const platform of platforms) {
                const platformEvents = platformGroups[platform];
                await this.downloadPlatformCSV(platform, platformEvents, timestamp);
            }

            this.controller.renderer.showMessage(
                `${platforms.length} CSV file(s) downloaded: ${platforms.join(', ')}`,
                'success'
            );
        } catch (error) {
            console.error('CSV only download failed:', error);
            this.controller.renderer.showMessage(
                'Failed to download CSV: ' + error.message,
                'error'
            );
        }
    }

    /**
     * Handle downloading CSV data formatted for Blaze software
     * @returns {Promise<void>}
     */
    async handleDownloadAllBlazeCSV() {
        try {
            const events = this.controller.events;
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');

            // Group events by platform
            const platformGroups = this.groupEventsByPlatform(events);
            const platforms = Object.keys(platformGroups);

            if (platforms.length === 0) {
                this.controller.renderer.showMessage('No events to export', 'info');
                return;
            }

            // Download a CSV for each platform
            for (const platform of platforms) {
                const platformEvents = platformGroups[platform];
                await this.downloadPlatformCSV(platform, platformEvents, timestamp);
            }

            this.controller.renderer.showMessage(
                `${platforms.length} CSV file(s) downloaded: ${platforms.join(', ')}`,
                'success'
            );
        } catch (error) {
            console.error('Blaze CSV download failed:', error);
            this.controller.renderer.showMessage(
                'Failed to download CSV for Blaze: ' + error.message,
                'error'
            );
        }
    }

    /**
     * Converts a blob to a data URL
     * @param {Blob} blob - The blob to convert
     * @returns {Promise<string>} Data URL string
     */
    blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Group events by platform
     * Events with multiple platforms will appear in each platform's group
     * @param {Array} events - Array of event objects
     * @returns {Object} Object with platform names as keys and arrays of events as values
     */
    groupEventsByPlatform(events) {
        const platformGroups = {};

        events.forEach(event => {
            const platforms = event.platforms || [];

            // If no platforms detected, group under "Unknown"
            if (platforms.length === 0) {
                if (!platformGroups['Unknown']) {
                    platformGroups['Unknown'] = [];
                }
                platformGroups['Unknown'].push(event);
            } else {
                // Add event to each platform it belongs to
                platforms.forEach(platform => {
                    if (!platformGroups[platform]) {
                        platformGroups[platform] = [];
                    }
                    platformGroups[platform].push(event);
                });
            }
        });

        return platformGroups;
    }

    /**
     * Download a single CSV file for a specific platform
     * @param {string} platform - Platform name
     * @param {Array} events - Events for this platform
     * @param {string} timestamp - Timestamp string for filename
     * @returns {Promise<void>}
     */
    async downloadPlatformCSV(platform, events, timestamp) {
        const csvContent = this.generateCSVData(events, []);
        const csvBlob = new Blob([csvContent], { type: 'text/csv' });
        const csvDataUrl = await this.blobToDataURL(csvBlob);

        const safePlatformName = platform.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `Blaze_${safePlatformName}_${timestamp}.csv`;

        return new Promise((resolve) => {
            chrome.downloads.download({
                url: csvDataUrl,
                filename: filename,
                saveAs: false // Don't prompt for each file
            }, () => {
                resolve();
            });
        });
    }

    /**
     * Handle single event CSV download
     * @param {Object} eventData - Event data object
     * @returns {Promise<void>}
     */
    async handleDownloadSingleCSV(eventData) {
        try {
            const { CSVExporter } = await import('../utils/csvExporter.js');
            await CSVExporter.exportSingleEvent(eventData);
        } catch (error) {
            console.error('Single CSV export failed:', error);
            this.controller.renderer.showMessage(
                'Failed to export CSV: ' + error.message,
                'error'
            );
        }
    }

    /**
     * Handle downloading all media files, HTML index, and CSV data
     * @returns {Promise<void>}
     */
    async handleDownloadMedia() {
        await this.downloadManager.handleCompleteMediaDownload(
            this.controller.events,
            this.controller.capturedVideos || [],
            this.controller.renderer
        );
    }

    /**
     * Handle single media download
     * @param {string} url - Media URL to download
     */
    handleDownloadSingle(url) {
        this.downloadManager.handleSingleDownload(url, this.controller.renderer);
    }

    /**
     * Handle debug dump download
     * @returns {Promise<void>}
     */
    async handleDebugDump() {
        await this.downloadManager.handleDebugDump(this.controller.renderer);
    }

    /**
     * Handle opening all Reel events in background tabs
     */
    handleOpenReels() {
        const reelUrls = this.controller.events
            .filter(event => event.eventUrl)
            .map(event => event.eventUrl);

        this.downloadManager.handleOpenReels(reelUrls, this.controller.renderer);
    }

    /**
     * Connect videos to events for CSV generation
     * @param {Array} events - Events array
     * @param {Array} capturedVideos - Captured videos array
     */
    connectVideosToEventsForCSV(events, capturedVideos) {
        if (!events || !capturedVideos || capturedVideos.length === 0) return;

        console.log('📊 Connecting videos for CSV generation...');

        const eventsWithVideos = events.filter(event =>
            event.hasVideo && event.videoSrc === 'VIDEO DETECTADO'
        );
        const availableVideos = [...capturedVideos];
        let connectionsMade = 0;

        eventsWithVideos.forEach(event => {
            // Parse event duration
            let eventDurationSeconds = 0;
            if (event.videoDuration) {
                const durationMatch = event.videoDuration.match(/^(\d+):(\d+)$/);
                if (durationMatch) {
                    eventDurationSeconds = parseInt(durationMatch[1]) * 60 + parseInt(durationMatch[2]);
                } else {
                    eventDurationSeconds = parseInt(event.videoDuration) || 0;
                }
            }

            if (eventDurationSeconds === 0) return;

            // Find best video match
            let bestMatch = null;
            let bestMatchDiff = Infinity;

            availableVideos.forEach((video, index) => {
                const videoDuration = Math.round(video.duration || 0);
                const durationDiff = Math.abs(videoDuration - eventDurationSeconds);

                if (durationDiff <= 3 && durationDiff < bestMatchDiff) {
                    bestMatch = { video, index, durationDiff };
                    bestMatchDiff = durationDiff;
                }
            });

            if (bestMatch) {
                event.videoSrc = bestMatch.video.url;
                availableVideos.splice(bestMatch.index, 1);
                connectionsMade++;
            }
        });

        if (connectionsMade > 0) {
            console.log(`📊 CSV: Connected ${connectionsMade} videos to events`);
        }
    }

    /**
     * Generate CSV data from events and captured videos
     * @param {Array} events - Events array
     * @param {Array} capturedVideos - Captured videos array (optional)
     * @returns {string} CSV content
     */
    generateCSVData(events, capturedVideos = []) {
        // Ensure videos are connected before generating CSV
        if (capturedVideos && capturedVideos.length > 0) {
            this.connectVideosToEventsForCSV(events, capturedVideos);
        }

        // New CSV format with specific columns
        const headers = ['postAtSpecificTime (YYYY-MM-DD HH:mm:ss)', 'content', 'link (OGmetaUrl)', 'imageUrls', 'gifUrl', 'videoUrls'];
        const csvRows = [headers.join(',')];

        // Add event data in the new format
        events.forEach((event, index) => {
            const row = this.generateEventCSVRow(event, index);
            csvRows.push(row);
        });

        // Skip captured videos in the new format since user only wants event data for now
        // capturedVideos.forEach((video, index) => {
        //     const row = this.generateVideoCSVRow(video, index);
        //     if (row) csvRows.push(row); // Only add if not null
        // });

        return csvRows.join('\n');
    }

    /**
     * Generate CSV row for an event
     * @param {Object} event - Event object
     * @param {number} index - Event index
     * @returns {string} CSV row string
     */
    generateEventCSVRow(event, index) {
        // New format: postAtSpecificTime, content, link, imageUrls, gifUrl, videoUrls

        // Use both date and timestamp from the event card
        let postAtSpecificTime = this.formatTimestampForCSV(event.timestamp, event.date);

        // Use only description for content (full content, not label fallback)
        const content = event.description || '';

        const row = [
            postAtSpecificTime, // postAtSpecificTime (from event card)
            `"${this.escapeCsvField(content)}"`, // content
            '', // link (empty)
            `"${event.imageSrc || ''}"`, // imageUrls
            '', // gifUrl (empty)
            '' // videoUrls (empty)
        ];

        return row.join(',');
    }

    /**
     * Parse date string from calendar header (e.g., "Nov 2 Sun", "Nov 3 Mon")
     * @param {string} dateStr - Date string from calendar
     * @returns {Object} Object with year, month, day or null if parsing fails
     */
    parseDateFromCalendar(dateStr) {
        if (!dateStr) return null;

        // Match patterns like "Nov 2 Sun", "Nov 3 Mon", "November 2", etc.
        const monthNames = {
            'jan': '01', 'january': '01',
            'feb': '02', 'february': '02',
            'mar': '03', 'march': '03',
            'apr': '04', 'april': '04',
            'may': '05',
            'jun': '06', 'june': '06',
            'jul': '07', 'july': '07',
            'aug': '08', 'august': '08',
            'sep': '09', 'september': '09',
            'oct': '10', 'october': '10',
            'nov': '11', 'november': '11',
            'dec': '12', 'december': '12'
        };

        const match = dateStr.match(/([a-zA-Z]+)\s+(\d{1,2})/i);
        if (match) {
            const monthKey = match[1].toLowerCase().substring(0, 3);
            const month = monthNames[monthKey];
            const day = String(parseInt(match[2])).padStart(2, '0');

            if (month) {
                // Use current year (or next year if the date appears to be in the past)
                const now = new Date();
                const year = now.getFullYear();
                return { year, month, day };
            }
        }

        return null;
    }

    /**
     * Format timestamp from event card to CSV format
     * Converts timestamps like "10:30 AM" to "YYYY-MM-DD HH:mm:ss" using extracted date
     * @param {string} timestamp - Original timestamp string from event (e.g., "10:30 AM")
     * @param {string} dateStr - Date string from calendar header (e.g., "Nov 2 Sun")
     * @returns {string} Formatted timestamp
     */
    formatTimestampForCSV(timestamp, dateStr) {
        // Parse the date from calendar or use current date as fallback
        const parsedDate = this.parseDateFromCalendar(dateStr);
        const now = new Date();

        const year = parsedDate?.year || now.getFullYear();
        const month = parsedDate?.month || String(now.getMonth() + 1).padStart(2, '0');
        const day = parsedDate?.day || String(now.getDate()).padStart(2, '0');

        if (!timestamp) {
            // Fallback to current time if no timestamp
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }

        try {
            // Parse the time part (e.g., "10:30 AM" -> hours and minutes)
            const timeMatch = timestamp.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
            if (!timeMatch) {
                // If no AM/PM format, try 24-hour format or just use the timestamp as-is
                return `${year}-${month}-${day} ${timestamp}`;
            }

            let hours = parseInt(timeMatch[1]);
            const minutes = timeMatch[2];
            const ampm = timeMatch[3].toUpperCase();

            // Convert to 24-hour format
            if (ampm === 'PM' && hours !== 12) {
                hours += 12;
            } else if (ampm === 'AM' && hours === 12) {
                hours = 0;
            }

            const hours24 = String(hours).padStart(2, '0');

            return `${year}-${month}-${day} ${hours24}:${minutes}:00`;
        } catch (error) {
            console.error('Error formatting timestamp for CSV:', error);
            // Fallback to current time
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }
    }

    /**
     * Generate CSV row for a captured video
     * @param {Object} video - Video object
     * @param {number} index - Video index
     * @returns {string} CSV row string
     */
    generateVideoCSVRow(video, index) {
        // For captured videos, we skip them in the new format since user only wants event data
        // Return null to indicate this should be skipped
        return null;
    }

    /**
     * Escape CSV field by wrapping in quotes and escaping internal quotes
     * @param {string} field - Field value to escape
     * @returns {string} Escaped CSV field
     */
    escapeCsvField(field) {
        if (!field) return '';
        return field.replace(/"/g, '""');
    }
}
