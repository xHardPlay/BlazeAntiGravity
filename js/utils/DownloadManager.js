import { WorkflowConfig } from '../constants/WorkflowConfig.js';
import { FileGenerator } from './FileGenerator.js';

/**
 * DownloadManager - Handles all download operations and sequencing
 * Manages the complex workflow of downloading multiple files with proper timing
 */
export class DownloadManager {
    constructor() {
        this.fileGenerator = new FileGenerator();
    }

    /**
     * Handle complete media download (HTML gallery + CSV + all media files)
     * @param {Array} events - Array of event objects
     * @param {Array} capturedVideos - Array of captured video objects
     * @param {Object} renderer - Renderer instance for UI updates
     * @returns {Promise<boolean>} Success status
     */
    async handleCompleteMediaDownload(events, capturedVideos, renderer) {
        try {
            // Prepare data
            const mediaItems = this.fileGenerator.createMediaItems(events);
            const uniqueCapturedVideos = this.removeDuplicateVideos(capturedVideos);
            const capturedVideoItems = this.fileGenerator.createCapturedVideoItems(uniqueCapturedVideos, this.generateTimestamp());

            // Combine all items for HTML gallery
            const allItems = [...capturedVideoItems, ...mediaItems];

            const totalVideos = uniqueCapturedVideos.length + mediaItems.filter(item => item.type === 'video').length;
            const totalFiles = uniqueCapturedVideos.length + mediaItems.length;

            if (totalFiles === 0) {
                renderer.showMessage('No videos or media to download', 'info');
                return false;
            }

            renderer.showMessage(`Downloading complete package: ${uniqueCapturedVideos.length} captured videos + ${mediaItems.length} media files...`, 'info');

            // Generate and download files
            await this.downloadCompletePackage(allItems, events, uniqueCapturedVideos, renderer);

            renderer.showMessage(`Complete package downloaded: HTML gallery, CSV data, ${uniqueCapturedVideos.length} captured videos, and ${mediaItems.length} media files!`, 'success');
            return true;

        } catch (error) {
            console.error('Complete download failed:', error);
            renderer.showMessage('Download failed: ' + error.message, 'error');
            return false;
        }
    }

    /**
     * Download complete package (HTML + CSV + media files)
     * @param {Array} allItems - All media items for HTML gallery
     * @param {Array} events - Event objects for CSV
     * @param {Array} uniqueCapturedVideos - Unique captured videos
     * @param {Object} renderer - Renderer instance
     */
    async downloadCompletePackage(allItems, events, uniqueCapturedVideos, renderer) {
        const timestamp = this.generateTimestamp();

        // Generate HTML index file
        const htmlContent = this.fileGenerator.generateHtmlIndex(allItems, timestamp);
        const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
        const htmlDataUrl = await this.fileGenerator.blobToDataURL(htmlBlob);

        // Generate CSV data
        const csvContent = this.fileGenerator.generateCSVData(events, uniqueCapturedVideos);
        const csvBlob = new Blob([csvContent], { type: 'text/csv' });
        const csvDataUrl = await this.fileGenerator.blobToDataURL(csvBlob);

        let downloadIndex = 0;

        // Download HTML index first
        chrome.downloads.download({
            url: htmlDataUrl,
            filename: `BlazeMedia/index_${timestamp}.html`
        });

        // Download CSV data
        setTimeout(() => {
            chrome.downloads.download({
                url: csvDataUrl,
                filename: `BlazeMedia/data_${timestamp}.csv`
            });
        }, WorkflowConfig.DELAYS.DOWNLOAD_SEQUENCE);

        // Download captured videos
        uniqueCapturedVideos.forEach((video, index) => {
            setTimeout(() => {
                const filename = `BlazeMedia/captured_video_${index + 1}_${timestamp}.mp4`;
                chrome.downloads.download({
                    url: video.url,
                    filename: filename,
                    saveAs: false
                });
            }, (downloadIndex + 2) * WorkflowConfig.DELAYS.DOWNLOAD_SEQUENCE);
            downloadIndex++;
        });

        // Download media files from events
        allItems.filter(item => !item.filename.includes('captured_video')).forEach((item) => {
            setTimeout(() => {
                chrome.downloads.download({
                    url: item.url,
                    filename: item.filename
                });
            }, (downloadIndex + 2) * WorkflowConfig.DELAYS.DOWNLOAD_SEQUENCE);
            downloadIndex++;
        });
    }

    /**
     * Handle single media download
     * @param {string} url - Media URL to download
     * @param {Object} renderer - Renderer instance
     * @returns {boolean} Success status
     */
    handleSingleDownload(url, renderer) {
        if (!url) {
            renderer.showMessage('No URL provided', 'error');
            return false;
        }

        try {
            chrome.downloads.download({
                url: url,
                saveAs: true
            });
            renderer.showMessage('Download started!', 'success');
            return true;
        } catch (error) {
            console.error('Download failed:', error);
            renderer.showMessage('Download failed: ' + error.message, 'error');
            return false;
        }
    }

    /**
     * Handle captured videos download only
     * @param {Array} capturedVideos - Array of captured video objects
     * @param {Object} renderer - Renderer instance
     * @returns {Promise<boolean>} Success status
     */
    async handleCapturedVideosDownload(capturedVideos, renderer) {
        const uniqueCapturedVideos = this.removeDuplicateVideos(capturedVideos);
        const timestamp = this.generateTimestamp();

        if (uniqueCapturedVideos.length === 0) {
            renderer.showMessage('No captured videos to download', 'info');
            return false;
        }

        renderer.showMessage(`Downloading ${uniqueCapturedVideos.length} captured videos...`, 'info');

        try {
            // Generate HTML gallery for captured videos
            const capturedVideoItems = this.fileGenerator.createCapturedVideoItems(uniqueCapturedVideos, timestamp);
            const htmlContent = this.fileGenerator.generateHtmlIndex(capturedVideoItems, timestamp);
            const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
            const htmlDataUrl = await this.fileGenerator.blobToDataURL(htmlBlob);

            let downloadIndex = 0;

            // Download HTML index
            chrome.downloads.download({
                url: htmlDataUrl,
                filename: `BlazeMedia/captured_videos_index_${timestamp}.html`
            });

            // Download all captured videos
            uniqueCapturedVideos.forEach((video, index) => {
                setTimeout(() => {
                    const filename = `BlazeMedia/captured_video_${index + 1}_${timestamp}.mp4`;
                    chrome.downloads.download({
                        url: video.url,
                        filename: filename,
                        saveAs: false
                    });
                }, (downloadIndex + 1) * WorkflowConfig.DELAYS.DOWNLOAD_SEQUENCE);
                downloadIndex++;
            });

            renderer.showMessage(`Downloaded HTML gallery and ${uniqueCapturedVideos.length} captured videos!`, 'success');
            return true;

        } catch (error) {
            console.error('Captured videos download failed:', error);
            renderer.showMessage('Download failed: ' + error.message, 'error');
            return false;
        }
    }

    /**
     * Download debug dump of current page
     * @param {Object} renderer - Renderer instance
     * @returns {Promise<boolean>} Success status
     */
    async handleDebugDump(renderer) {
        try {
            renderer.showMessage('Downloading page copy for debugging...', 'info');

            // Get full HTML and CSS
            const debugData = await this.capturePageContent();

            // Create debug file
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `blaze-debug-dump-${timestamp}.html`;
            const fileContent = this.createDebugFileContent(debugData);

            // Download file
            await this.downloadBlobAsFile(fileContent, filename, 'text/html');

            renderer.showMessage('Debug file downloaded! Please send this to support.', 'success');
            return true;

        } catch (error) {
            console.error('Debug dump failed:', error);
            renderer.showMessage('Failed to download debug file: ' + error.message, 'error');
            return false;
        }
    }

    /**
     * Capture current page content for debugging
     * @returns {Promise<Object>} Debug data object
     */
    async capturePageContent() {
        // Execute script to get full HTML and inline CSS
        const results = await chrome.scripting.executeScript({
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

        return results[0].result;
    }

    /**
     * Create debug file content
     * @param {Object} debugData - HTML, CSS, and URL data
     * @returns {string} Complete HTML file content
     */
    createDebugFileContent(debugData) {
        return `<!-- URL: ${debugData.url} -->\n<style>\n${debugData.css}\n</style>\n${debugData.html}`;
    }

    /**
     * Download blob as file using FileReader
     * @param {string} content - File content
     * @param {string} filename - Filename for download
     * @param {string} mimeType - MIME type
     */
    async downloadBlobAsFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const reader = new FileReader();

        return new Promise((resolve, reject) => {
            reader.onloadend = () => {
                chrome.downloads.download({
                    url: reader.result,
                    filename: filename,
                    saveAs: true
                });
                resolve();
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Open multiple event URLs in background tabs
     * @param {Array} eventUrls - Array of event URLs to open
     * @param {Object} renderer - Renderer instance
     */
    handleOpenReels(eventUrls, renderer) {
        const validUrls = eventUrls.filter(url => url);

        validUrls.forEach(url => {
            chrome.tabs.create({ url, active: false });
        });

        renderer.showMessage(`Opened ${validUrls.length} events in background tabs`, 'success');
    }

    /**
     * Generate timestamp string for filenames
     * @returns {string} Formatted timestamp
     */
    generateTimestamp() {
        return new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    }

    /**
     * Remove duplicate videos from captured videos list
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
     * Check if download quota would be exceeded
     * @param {number} fileCount - Number of files to download
     * @returns {boolean} True if quota would be exceeded
     */
    checkDownloadQuota(fileCount) {
        // Chrome has limits on concurrent downloads
        return fileCount > WorkflowConfig.DOWNLOAD.CONCURRENT_DOWNLOADS;
    }
}
