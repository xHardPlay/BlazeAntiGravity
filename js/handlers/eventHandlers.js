/**
 * Event Handlers - Integrates all specialized handlers for event-related operations
 * Provides a unified interface combining Capture, Click, Video Scan, and Export handlers
 */
export class EventHandlers {
    constructor(controller) {
        this.controller = controller;

        // Initialize handlers as null - they'll be loaded on first use
        this.captureHandler = null;
        this.eventClickHandler = null;
        this.videoScanHandler = null;
        this.exportHandler = null;
        this.eventBinder = null;
    }

    /**
     * Lazy loads the capture handler
     */
    async getCaptureHandler() {
        if (!this.captureHandler) {
            const { CaptureHandler } = await import('./CaptureHandler.js');
            this.captureHandler = new CaptureHandler(this.controller);
        }
        return this.captureHandler;
    }

    /**
     * Lazy loads the event click handler
     */
    async getEventClickHandler() {
        if (!this.eventClickHandler) {
            const { EventClickHandler } = await import('./EventClickHandler.js');
            this.eventClickHandler = new EventClickHandler(this.controller);
        }
        return this.eventClickHandler;
    }

    /**
     * Lazy loads the video scan handler
     */
    async getVideoScanHandler() {
        if (!this.videoScanHandler) {
            const { VideoScanHandler } = await import('./VideoScanHandler.js');
            this.videoScanHandler = new VideoScanHandler(this.controller);
        }
        return this.videoScanHandler;
    }

    /**
     * Lazy loads the export handler
     */
    async getExportHandler() {
        if (!this.exportHandler) {
            const { ExportHandler } = await import('./ExportHandler.js');
            this.exportHandler = new ExportHandler(this.controller);
        }
        return this.exportHandler;
    }

    /**
     * Lazy loads the event binder
     */
    async getEventBinder() {
        if (!this.eventBinder) {
            const { EventBinder } = await import('./eventBinder.js');
            this.eventBinder = new EventBinder(this.controller);
        }
        return this.eventBinder;
    }

    // ========== CAPTURE HANDLER METHODS ==========
    /**
     * Handles data capture from the active tab
     */
    async handleCapture() {
        const handler = await this.getCaptureHandler();
        return handler.handleCapture();
    }

    // ========== EVENT CLICK HANDLER METHODS ==========
    /**
     * Handles event card click to show details
     */
    async handleEventClick(index) {
        const handler = await this.getEventClickHandler();
        return handler.handleEventClick(index);
    }

    /**
     * Handles back button to return to grid view
     */
    handleBack() {
        // For synchronous methods, we need to handle this differently
        // Since handleBack is synchronous, we'll assume the handler is already loaded
        // This is a bit of a design issue - ideally all handlers should be loaded upfront
        if (this.eventClickHandler) {
            return this.eventClickHandler.handleBack();
        }
        // Fallback - load and call synchronously (not ideal)
        console.warn('EventClickHandler not loaded, loading synchronously...');
        this.getEventClickHandler().then(handler => handler.handleBack());
    }

    /**
     * Handles back to main button to return to main screen
     */
    handleBackToMain() {
        if (this.eventClickHandler) {
            return this.eventClickHandler.handleBackToMain();
        }
        console.warn('EventClickHandler not loaded, loading synchronously...');
        this.getEventClickHandler().then(handler => handler.handleBackToMain());
    }

    /**
     * Handles opening event card in new tab
     */
    handleTestOpenCard(eventData) {
        if (this.eventClickHandler) {
            return this.eventClickHandler.handleTestOpenCard(eventData);
        }
        console.warn('EventClickHandler not loaded, loading synchronously...');
        this.getEventClickHandler().then(handler => handler.handleTestOpenCard(eventData));
    }

    // ========== VIDEO SCAN HANDLER METHODS ==========
    /**
     * Scans the page for video elements and captures their MP4 URLs
     */
    async handleScanVideos() {
        const handler = await this.getVideoScanHandler();
        return handler.handleScanVideos();
    }

    /**
     * Downloads all captured videos AND all media files (complete package)
     */
    async handleDownloadCapturedVideos() {
        const handler = await this.getVideoScanHandler();
        return handler.handleDownloadCapturedVideos();
    }

    /**
     * Handles capturing an item from inspector click
     */
    handleCaptureInfo(data) {
        if (this.videoScanHandler) {
            return this.videoScanHandler.handleCaptureInfo(data);
        }
        console.warn('VideoScanHandler not loaded, loading synchronously...');
        this.getVideoScanHandler().then(handler => handler.handleCaptureInfo(data));
    }

    /**
     * Clears captured items list
     */
    handleClearCaptured() {
        if (this.videoScanHandler) {
            return this.videoScanHandler.handleClearCaptured();
        }
        console.warn('VideoScanHandler not loaded, loading synchronously...');
        this.getVideoScanHandler().then(handler => handler.handleClearCaptured());
    }

    // ========== EXPORT HANDLER METHODS ==========
    /**
     * Handles downloading all media files, HTML index, and CSV data
     */
    async handleDownloadMedia() {
        const handler = await this.getExportHandler();
        return handler.handleDownloadMedia();
    }

    /**
     * Handles downloading all events as CSV
     */
    async handleDownloadAllCSV() {
        const handler = await this.getExportHandler();
        return handler.handleDownloadAllCSV();
    }

    /**
     * Handles downloading CSV data only (direct download without extra features)
     */
    async handleDownloadCSVOnly() {
        const handler = await this.getExportHandler();
        return handler.handleDownloadCSVOnly();
    }

    /**
     * Handles downloading CSV data formatted for Blaze software
     */
    async handleDownloadAllBlazeCSV() {
        const handler = await this.getExportHandler();
        return handler.handleDownloadAllBlazeCSV();
    }

    /**
     * Handles single media download
     */
    handleDownloadSingle(url) {
        if (this.exportHandler) {
            return this.exportHandler.handleDownloadSingle(url);
        }
        console.warn('ExportHandler not loaded, loading synchronously...');
        this.getExportHandler().then(handler => handler.handleDownloadSingle(url));
    }

    /**
     * Handles single event CSV download
     */
    async handleDownloadSingleCSV(eventData) {
        const handler = await this.getExportHandler();
        return handler.handleDownloadSingleCSV(eventData);
    }

    /**
     * Handles opening all Reel events in background tabs
     */
    handleOpenReels() {
        if (this.exportHandler) {
            return this.exportHandler.handleOpenReels();
        }
        console.warn('ExportHandler not loaded, loading synchronously...');
        this.getExportHandler().then(handler => handler.handleOpenReels());
    }

    /**
     * Captures the current page DOM and downloads it for debugging
     */
    async handleDebugDump() {
        const handler = await this.getExportHandler();
        return handler.handleDebugDump();
    }

    /**
     * Connects captured videos to events based on duration matching
     */
    connectVideosToEvents() {
        if (this.captureHandler) {
            return this.captureHandler.connectVideosToEvents();
        }
        console.warn('CaptureHandler not loaded, loading synchronously...');
        this.getCaptureHandler().then(handler => handler.connectVideosToEvents());
    }

    /**
     * Connects videos to events specifically for CSV generation
     */
    connectVideosToEventsForCSV(events, capturedVideos) {
        if (this.exportHandler) {
            return this.exportHandler.connectVideosToEventsForCSV(events, capturedVideos);
        }
        console.warn('ExportHandler not loaded, loading synchronously...');
        this.getExportHandler().then(handler => handler.connectVideosToEventsForCSV(events, capturedVideos));
    }

    /**
     * Generates CSV data from events and captured videos
     */
    generateCSVData(events, capturedVideos = []) {
        if (this.exportHandler) {
            return this.exportHandler.generateCSVData(events, capturedVideos);
        }
        console.warn('ExportHandler not loaded, returning empty CSV...');
        return '';
    }

    /**
     * Generates an organized filename for media downloads
     */
    generateMediaFilename(event, index) {
        // This method is used by the old code, but we need to provide it
        // For now, we'll implement a simple version
        const folderName = 'BlazeMedia';
        const timestamp = new Date().toISOString().slice(0, 10);
        const paddedIndex = String(index + 1).padStart(3, '0');
        const cleanLabel = (event.label || 'Unknown')
            .replace(/[^a-zA-Z0-9]/g, '_')
            .substring(0, 30);
        let extension = 'jpg';
        if (event.imageSrc) {
            const urlMatch = event.imageSrc.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
            if (urlMatch) extension = urlMatch[1].toLowerCase();
        } else if (event.videoSrc && event.videoSrc !== 'VIDEO DETECTADO') {
            const urlMatch = event.videoSrc.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
            if (urlMatch) extension = urlMatch[1].toLowerCase();
            else extension = 'mp4';
        }
        return `${folderName}/${timestamp}_${paddedIndex}_${cleanLabel}.${extension}`;
    }

    /**
     * Generates HTML index file content
     */
    generateHtmlIndex(mediaItems, timestamp) {
        // This method is used by the old code, but we'll implement it simply
        // In a full refactor, this would be moved to a utility
        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blaze Media Collection - ${new Date().toLocaleDateString()}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
        .header { text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; }
        .media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; }
        .media-item { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .media-item img { width: 100%; height: 180px; object-fit: cover; }
        .media-info { padding: 12px; }
        .media-label { font-weight: bold; font-size: 14px; margin-bottom: 4px; color: #333; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📸 Blaze Media Collection</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
    <div class="media-grid">`;

        mediaItems.forEach((item, index) => {
            const filename = item.filename.split('/').pop();
            const mediaElement = item.type === 'image'
                ? `<img src="${filename}" alt="${item.label}" loading="lazy">`
                : `<video controls preload="metadata" style="width: 100%; height: 180px; object-fit: cover;"><source src="${filename}" type="video/mp4"></video>`;

            html += `
        <div class="media-item">
            ${mediaElement}
            <div class="media-info">
                <div class="media-label">${item.label}</div>
            </div>
        </div>`;
        });

        html += `
    </div>
</body>
</html>`;

        return html;
    }

    /**
     * Converts a blob to a data URL
     */
    async blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
}
