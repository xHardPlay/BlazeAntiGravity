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
            const csvContent = this.generateCSVData(this.controller.events, this.controller.capturedVideos || []);
            const csvBlob = new Blob([csvContent], { type: 'text/csv' });
            const csvDataUrl = await this.blobToDataURL(csvBlob);

            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
            const filename = `BlazeEvents_${timestamp}.csv`;

            chrome.downloads.download({
                url: csvDataUrl,
                filename: filename,
                saveAs: true
            });

            this.controller.renderer.showMessage('CSV file downloaded successfully!', 'success');
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
            const csvContent = this.generateCSVData(this.controller.events, this.controller.capturedVideos || []);
            const csvBlob = new Blob([csvContent], { type: 'text/csv' });
            const csvDataUrl = await this.blobToDataURL(csvBlob);

            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
            const filename = `BlazeData_${timestamp}.csv`;

            chrome.downloads.download({
                url: csvDataUrl,
                filename: filename,
                saveAs: true
            });

            this.controller.renderer.showMessage('CSV data downloaded for Blaze!', 'success');
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
        // Only filling content and imageUrls as requested

        // Use description if available, otherwise use label
        const content = event.description || event.label || '';

        const row = [
            '', // postAtSpecificTime (empty)
            `"${this.escapeCsvField(content)}"`, // content
            '', // link (empty)
            `"${event.imageSrc || ''}"`, // imageUrls
            '', // gifUrl (empty)
            '' // videoUrls (empty)
        ];

        return row.join(',');
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
