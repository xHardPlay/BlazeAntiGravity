import { WorkflowConfig } from '../constants/WorkflowConfig.js';

/**
 * FileGenerator - Handles generation of HTML galleries, CSV data files, and blob creation
 * Centralizes all file generation and download preparation logic
 */
export class FileGenerator {

    /**
     * Generate HTML index file content for media gallery
     * @param {Array} mediaItems - Array of media items to include
     * @param {string} timestamp - Timestamp string for the gallery
     * @returns {string} HTML content as string
     */
    generateHtmlIndex(mediaItems, timestamp) {
        const totalFiles = mediaItems.length;
        const totalImages = mediaItems.filter(m => m.type === 'image').length;
        const totalVideos = mediaItems.filter(m => m.type === 'video').length;

        let html = this.generateHtmlHeader(timestamp);

        // Stats section
        html += this.generateStatsSection(totalFiles, totalImages, totalVideos);

        // Media grid
        html += this.generateMediaGrid(mediaItems);

        html += this.generateHtmlFooter();

        return html;
    }

    /**
     * Generate HTML header with styles
     * @param {string} timestamp - Timestamp for the gallery
     * @returns {string} HTML header content
     */
    generateHtmlHeader(timestamp) {
        const dateStr = new Date().toLocaleDateString();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blaze Media Collection - ${dateStr}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
        }
        .stats {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-bottom: 20px;
        }
        .stat {
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        .media-grid {
            display: grid;
            grid-template-columns: ${WorkflowConfig.UI.GRID_COLUMNS};
            gap: 15px;
        }
        .media-item {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }
        .media-item:hover {
            transform: translateY(-2px);
        }
        .media-item img, .media-item video {
            width: 100%;
            height: 180px;
            object-fit: cover;
        }
        .media-info {
            padding: 12px;
        }
        .media-label {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 4px;
            color: #333;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .media-meta {
            font-size: 11px;
            color: #666;
            margin-bottom: 8px;
        }
        .filename {
            font-family: monospace;
            font-size: 10px;
            color: #888;
            background: #f8f9fa;
            padding: 4px;
            border-radius: 3px;
            word-break: break-all;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📸 Blaze Media Collection</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
    </div>`;
    }

    /**
     * Generate statistics section
     * @param {number} totalFiles - Total number of files
     * @param {number} totalImages - Number of images
     * @param {number} totalVideos - Number of videos
     * @returns {string} Stats section HTML
     */
    generateStatsSection(totalFiles, totalImages, totalVideos) {
        return `
    <div class="stats">
        <div class="stat">
            <div style="font-size: 24px; font-weight: bold; color: #667eea;">${totalFiles}</div>
            <div>Total Files</div>
        </div>
        <div class="stat">
            <div style="font-size: 24px; font-weight: bold; color: #764ba2;">${totalImages}</div>
            <div>Images</div>
        </div>
        <div class="stat">
            <div style="font-size: 24px; font-weight: bold; color: #f093fb;">${totalVideos}</div>
            <div>Videos</div>
        </div>
    </div>`;
    }

    /**
     * Generate media grid section
     * @param {Array} mediaItems - Array of media items
     * @returns {string} Media grid HTML
     */
    generateMediaGrid(mediaItems) {
        let html = `
    <div class="media-grid">`;

        mediaItems.forEach((item, index) => {
            html += this.generateMediaItem(item, index);
        });

        html += `
    </div>`;

        return html;
    }

    /**
     * Generate individual media item HTML
     * @param {Object} item - Media item object
     * @param {number} index - Item index
     * @returns {string} Media item HTML
     */
    generateMediaItem(item, index) {
        const filename = item.filename.split('/').pop();
        const mediaElement = this.generateMediaElement(item, filename);

        return `
        <div class="media-item">
            ${mediaElement}
            <div class="media-info">
                <div class="media-label">${this.escapeHtml(item.label)}</div>
                <div class="media-meta">#${String(index + 1).padStart(3, '0')} • ${item.type}</div>
                <div class="filename">${filename}</div>
            </div>
        </div>`;
    }

    /**
     * Generate media element (image or video)
     * @param {Object} item - Media item object
     * @param {string} filename - Filename for the media
     * @returns {string} Media element HTML
     */
    generateMediaElement(item, filename) {
        if (item.type === 'image') {
            return `<img src="${filename}" alt="${this.escapeHtml(item.label)}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
        } else {
            return `<video controls preload="metadata" style="width: 100%; height: 180px; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <source src="${filename}" type="video/mp4">
            </video>`;
        }
    }

    /**
     * Generate HTML footer
     * @returns {string} HTML footer content
     */
    generateHtmlFooter() {
        return `
</body>
</html>`;
    }

    /**
     * Generate CSV data from events
     * @param {Array} events - Array of event objects
     * @param {Array} capturedVideos - Array of captured video objects
     * @returns {string} CSV content as string
     */
    generateCSVData(events, capturedVideos = []) {
        const headers = ['Index', 'Event URL', 'Label', 'Platforms', 'Description', 'Image URL', 'Has Video', 'Duration', 'Video URL', 'Video Source', 'Timestamp'];
        const csvRows = [headers.join(',')];

        // Add event data
        events.forEach((event, index) => {
            const row = this.generateEventCSVRow(event, index);
            csvRows.push(row);
        });

        // Add captured videos data
        capturedVideos.forEach((video, index) => {
            const row = this.generateVideoCSVRow(video, index, events.length);
            csvRows.push(row);
        });

        return csvRows.join('\n');
    }

    /**
     * Generate CSV row for an event
     * @param {Object} event - Event object
     * @param {number} index - Event index
     * @returns {string} CSV row string
     */
    generateEventCSVRow(event, index) {
        // Convert platforms array to string for CSV
        let platformsString = '';
        if (Array.isArray(event.platforms)) {
            platformsString = event.platforms.join(', ');
        } else if (event.platforms) {
            platformsString = event.platforms;
        }

        // Duration only for events with video
        const duration = event.hasVideo && event.videoDuration ? event.videoDuration : '';

        const row = [
            index + 1,
            `"${event.eventUrl || ''}"`,
            `"${this.escapeCsvField(event.label || '')}"`,
            `"${this.escapeCsvField(platformsString)}"`,
            `"${this.escapeCsvField(event.description || '').replace(/\n/g, ' ')}"`,
            `"${event.imageSrc || ''}"`,
            event.hasVideo ? 'Yes' : 'No',
            `"${duration}"`,
            `"${event.videoSrc || ''}"`,
            'Event Data',
            `"${this.escapeCsvField(event.timestamp || '')}"`
        ];

        return row.join(',');
    }

    /**
     * Generate CSV row for a captured video
     * @param {Object} video - Video object
     * @param {number} index - Video index
     * @param {number} eventCount - Number of events (for indexing)
     * @returns {string} CSV row string
     */
    generateVideoCSVRow(video, index, eventCount) {
        const row = [
            `V${index + 1}`,
            `"Captured Video ${index + 1}"`,
            '',
            '',
            `"Duration: ${Math.round(video.duration || 0)}s"`,
            '',
            `"${video.url}"`,
            '',
            'Yes',
            `"${video.type} (Captured)"`,
            ''
        ];

        return row.join(',');
    }

    /**
     * Generate organized filename for media downloads
     * @param {Object} event - Event object
     * @param {number} index - Event index
     * @returns {string} Generated filename
     */
    generateMediaFilename(event, index) {
        const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const paddedIndex = String(index + 1).padStart(3, '0');

        // Clean the label for filename
        const cleanLabel = (event.label || 'Unknown')
            .replace(/[^a-zA-Z0-9]/g, '_')
            .substring(0, WorkflowConfig.LIMITS.MAX_FILENAME_LENGTH);

        // Determine file extension
        let extension = WorkflowConfig.FILENAME_PATTERNS.IMAGE_EXTENSION; // default
        if (event.imageSrc) {
            // Try to get extension from URL
            const urlMatch = event.imageSrc.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
            if (urlMatch) {
                extension = urlMatch[1].toLowerCase();
            }
        } else if (event.videoSrc && event.videoSrc !== WorkflowConfig.VIDEO_DETECTION.DETECTED_PLACEHOLDER) {
            // For videos
            const urlMatch = event.videoSrc.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
            if (urlMatch) {
                extension = urlMatch[1].toLowerCase();
            } else {
                extension = WorkflowConfig.FILENAME_PATTERNS.VIDEO_EXTENSION; // default video extension
            }
        }

        return `${WorkflowConfig.FILENAME_PATTERNS.FOLDER_NAME}/${timestamp}_${paddedIndex}_${cleanLabel}.${extension}`;
    }

    /**
     * Create media items array from events
     * @param {Array} events - Array of event objects
     * @returns {Array} Array of media item objects
     */
    createMediaItems(events) {
        return events
            .map((event, index) => ({
                url: event.imageSrc || event.videoSrc,
                filename: this.generateMediaFilename(event, index),
                type: event.imageSrc ? 'image' : 'video',
                label: event.label || 'Unknown',
                description: event.description || '',
                platforms: event.platforms || '',
                timestamp: event.timestamp || ''
            }))
            .filter(item => item.url && item.url !== WorkflowConfig.VIDEO_DETECTION.DETECTED_PLACEHOLDER);
    }

    /**
     * Create captured video items array
     * @param {Array} capturedVideos - Array of captured video objects
     * @param {string} timestamp - Timestamp string
     * @returns {Array} Array of captured video item objects
     */
    createCapturedVideoItems(capturedVideos, timestamp) {
        return capturedVideos.map((video, index) => {
            const filename = `${WorkflowConfig.FILENAME_PATTERNS.FOLDER_NAME}/captured_video_${index + 1}_${timestamp}.mp4`;
            return {
                url: video.url,
                filename: filename,
                type: 'video',
                label: `Captured Video ${index + 1}`,
                description: `Duration: ${Math.round(video.duration || 0)}s`,
                platforms: '',
                timestamp: new Date().toLocaleString()
            };
        });
    }

    /**
     * Convert a blob to a data URL
     * @param {Blob} blob - Blob to convert
     * @returns {Promise<string>} Promise resolving to data URL
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
     * Escape HTML special characters
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
