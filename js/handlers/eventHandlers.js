/**
 * Event Handlers - Manages event-related operations
 */
export class EventHandlers {
    constructor(controller) {
        this.controller = controller;
    }

    /**
     * Handles data capture from the active tab
     */
    async handleCapture() {
        try {
            await this.controller.updateActiveTab();
            this.controller.renderer.showMessage('Capturing data...', 'info');

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
                this.controller.renderer.showMessage('This extension only works on Blaze sites', 'error');
                return;
            }

            // Execute the extraction script
            const results = await chrome.scripting.executeScript({
                target: { tabId: this.controller.tabId },
                func: () => {
                    // Inline data extraction function
                    const extractEvents = () => {
                        const eventContainers = Array.from(document.querySelectorAll('[class*="CalendarEventCard_eventContainer"]'))
                            .filter(el => el.offsetWidth > 0 && el.offsetHeight > 0);

                        return eventContainers.map((container, index) => {
                            // Extract label
                            const channelContainer = container.querySelector('[class*="CalendarEventCard_channelContainer"]');
                            const labelSpan = channelContainer?.querySelector('span[class*="Text_root_"]') ||
                                container.querySelector('span[class*="Text_root_"]');
                            const label = labelSpan?.textContent?.trim() || 'No Label';

                            // Extract platforms
                            const platformIcons = container.querySelectorAll('.Icon_platformIcon__d7da4');
                            const platforms = Array.from(platformIcons).map(icon => {
                                const classes = icon.className;
                                if (classes.includes('facebookIcon')) return 'Facebook';
                                if (classes.includes('linkedinIcon')) return 'LinkedIn';
                                if (classes.includes('instagramIcon')) return 'Instagram';
                                if (classes.includes('youtubeIcon')) return 'YouTube';
                                if (classes.includes('xIcon')) return 'X';
                                return '';
                            }).filter(p => p).join(', ');

                            // Extract timestamp
                            const eventHeader = container.querySelector('[class*="CalendarEventCard_eventHeader"]');
                            const timeSpans = eventHeader?.querySelectorAll('span[class*="Text_root_"]');
                            const timestamp = timeSpans && timeSpans.length > 1 ? timeSpans[1]?.textContent?.trim() : '';

                            // Extract description
                            const descDiv = container.querySelector('[class*="TruncatedText_caption"]');
                            const description = descDiv?.textContent?.trim() || '';

                            // Extract image
                            const img = container.querySelector('img');
                            const imageSrc = (img && !img.src.startsWith('data:') && img.offsetWidth > 50) ? img.src : null;

                            // Extract video info
                            const hasPlayOverlay = !!container.querySelector('.CalendarEventCard_playButtonOverlay__335fa');
                            const hasVideoContainer = !!container.querySelector('[class*="VideoPlayer_videoContainer"]');
                            const hasVideoTag = !!container.querySelector('video');
                            const hasVideo = hasPlayOverlay || hasVideoContainer || hasVideoTag;
                            const videoSrc = hasVideo ? 'VIDEO DETECTADO' : null;

                            // Extract video duration
                            const durationEl = container.querySelector('[data-testid="video-duration"]');
                            const videoDuration = durationEl?.textContent?.trim() || '';

                            // Extract URL
                            const linkEl = container.closest('a') || container.querySelector('a');
                            const eventUrl = linkEl?.href || null;

                            // Extract metadata
                            const cardClasses = container.className || '';
                            const cardIndex = index + 1;
                            const isNew = cardClasses.includes('CalendarEventCard_new__335fa');

                            return {
                                label,
                                platforms,
                                timestamp,
                                description,
                                imageSrc,
                                videoSrc,
                                hasVideo,
                                isNew,
                                cardIndex,
                                eventUrl,
                                cardClasses
                            };
                        });
                    };

                    return { events: extractEvents() };
                },
                world: 'MAIN'
            });

            const data = results[0].result;

            if (!data || !data.events || data.events.length === 0) {
                this.controller.renderer.showMessage('No events found on this page', 'info');
                return;
            }

            // Store events
            this.controller.events = data.events;

            // Render the data
            this.controller.renderer.renderDataGrid(data);

            // Bind live scan toggle after rendering
            this.controller.liveScanService.bindLiveScanToggle();

            this.controller.renderer.showMessage(`Captured ${data.events.length} events!`, 'success');

        } catch (error) {
            console.error('Capture failed:', error);
            this.controller.renderer.showMessage('Capture failed: ' + error.message, 'error');
        }
    }

    /**
     * Handles event card click to show details
     */
    async handleEventClick(index) {
        try {
            const event = this.controller.events[index];
            if (!event) {
                this.controller.renderer.showMessage('Event not found', 'error');
                return;
            }

            await this.controller.updateActiveTab();

            // Always try to click the corresponding web element
            const clickResult = await chrome.scripting.executeScript({
                target: { tabId: this.controller.tabId },
                func: (cardIndex) => {
                    // Find the event card by index
                    const eventContainers = Array.from(document.querySelectorAll('[class*="CalendarEventCard_eventContainer"]'))
                        .filter(el => el.offsetWidth > 0 && el.offsetHeight > 0);

                    const targetContainer = eventContainers[cardIndex - 1];
                    if (targetContainer) {
                        // Scroll element into view first
                        targetContainer.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center',
                            inline: 'center'
                        });

                        // Wait a bit for scroll to complete
                        setTimeout(() => {
                            // Try multiple click strategies
                            let clicked = false;

                            // First, try to find and click a link
                            const linkEl = targetContainer.closest('a') || targetContainer.querySelector('a');
                            if (linkEl) {
                                linkEl.click();
                                clicked = true;
                            }

                            // If no link found, try clicking the container directly
                            if (!clicked) {
                                targetContainer.click();
                                clicked = true;
                            }

                            // As a fallback, try dispatching a click event with more options
                            if (!clicked) {
                                const clickEvent = new MouseEvent('click', {
                                    bubbles: true,
                                    cancelable: true,
                                    view: window,
                                    clientX: targetContainer.getBoundingClientRect().left + targetContainer.offsetWidth / 2,
                                    clientY: targetContainer.getBoundingClientRect().top + targetContainer.offsetHeight / 2
                                });
                                targetContainer.dispatchEvent(clickEvent);
                                clicked = true;
                            }

                            // Additional fallback: try mousedown + mouseup events
                            if (!clicked) {
                                const mousedownEvent = new MouseEvent('mousedown', {
                                    bubbles: true,
                                    cancelable: true,
                                    view: window
                                });
                                const mouseupEvent = new MouseEvent('mouseup', {
                                    bubbles: true,
                                    cancelable: true,
                                    view: window
                                });
                                targetContainer.dispatchEvent(mousedownEvent);
                                targetContainer.dispatchEvent(mouseupEvent);
                                clicked = true;
                            }
                        }, 300);

                        return { success: true };
                    }
                    return { success: false, error: 'Card not found at index ' + cardIndex };
                },
                args: [event.cardIndex],
                world: 'MAIN'
            });

            if (clickResult[0].result.success) {
                this.controller.renderer.showMessage('Opening event in web...', 'info');
            } else {
                console.warn('Failed to click web element:', clickResult[0].result.error);
                // Still show detail view even if web click failed
            }

            // Show detail view in popup
            this.controller.renderer.renderEventDetail(index);

        } catch (error) {
            console.error('Event click failed:', error);
            this.controller.renderer.showMessage('Failed to open event: ' + error.message, 'error');
        }
    }

    /**
     * Handles back button to return to grid view
     */
    handleBack() {
        const data = { events: this.controller.events };
        this.controller.renderer.renderDataGrid(data);
    }

    /**
     * Handles back to main button to return to main screen
     */
    handleBackToMain() {
        this.controller.renderer.renderLoadingState();
    }

    /**
     * Handles downloading all media files, HTML index, and CSV data
     */
    async handleDownloadMedia() {
        const mediaItems = this.controller.events
            .map((event, index) => ({
                url: event.imageSrc || event.videoSrc,
                filename: this.generateMediaFilename(event, index),
                type: event.imageSrc ? 'image' : 'video',
                label: event.label || 'Unknown',
                description: event.description || '',
                platforms: event.platforms || '',
                timestamp: event.timestamp || ''
            }))
            .filter(item => item.url && item.url !== 'VIDEO DETECTADO');

        if (mediaItems.length === 0) {
            this.controller.renderer.showMessage('No media to download', 'info');
            return;
        }

        this.controller.renderer.showMessage(`Creating complete package: HTML index, CSV data, and ${mediaItems.length} media files...`, 'info');

        try {
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');

            // Generate HTML index file content
            const htmlContent = this.generateHtmlIndex(mediaItems, timestamp);
            const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
            const htmlDataUrl = await this.blobToDataURL(htmlBlob);

            // Generate CSV data
            const csvContent = this.generateCSVData(this.controller.events);
            const csvBlob = new Blob([csvContent], { type: 'text/csv' });
            const csvDataUrl = await this.blobToDataURL(csvBlob);

            // Download sequence: HTML first, then CSV, then all media files
            let downloadIndex = 0;

            // Download HTML index
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
            }, 500);

            // Download all media files
            mediaItems.forEach((item, index) => {
                setTimeout(() => {
                    chrome.downloads.download({
                        url: item.url,
                        filename: item.filename
                    });
                }, (index + 2) * 500); // Start after HTML and CSV downloads
            });

            this.controller.renderer.showMessage(`Downloading complete package: HTML gallery, CSV data, and ${mediaItems.length} media files!`, 'success');

        } catch (error) {
            console.error('Download preparation failed:', error);
            this.controller.renderer.showMessage('Failed to prepare downloads: ' + error.message, 'error');
        }
    }

    /**
     * Generates HTML index file content
     */
    generateHtmlIndex(mediaItems, timestamp) {
        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blaze Media Collection - ${new Date().toLocaleDateString()}</title>
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
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
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
        .media-item img {
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
    </div>

    <div class="stats">
        <div class="stat">
            <div style="font-size: 24px; font-weight: bold; color: #667eea;">${mediaItems.length}</div>
            <div>Total Files</div>
        </div>
        <div class="stat">
            <div style="font-size: 24px; font-weight: bold; color: #764ba2;">${mediaItems.filter(m => m.type === 'image').length}</div>
            <div>Images</div>
        </div>
        <div class="stat">
            <div style="font-size: 24px; font-weight: bold; color: #f093fb;">${mediaItems.filter(m => m.type === 'video').length}</div>
            <div>Videos</div>
        </div>
    </div>

    <div class="media-grid">`;

        mediaItems.forEach((item, index) => {
            const filename = item.filename.split('/').pop();
            const mediaElement = item.type === 'image'
                ? `<img src="${filename}" alt="${item.label}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
                : `<video controls preload="metadata" style="width: 100%; height: 180px; object-fit: cover;"><source src="${filename}" type="video/mp4"></video>`;

            html += `
        <div class="media-item">
            ${mediaElement}
            <div style="width: 100%; height: 180px; background: linear-gradient(45deg, #f0f0f0, #e0e0e0); display: none; align-items: center; justify-content: center; color: #666; font-size: 12px; position: absolute; top: 0; left: 0;">
                ${item.type === 'image' ? '🖼️' : '🎥'}<br>${item.type.toUpperCase()}
            </div>
            <div class="media-info">
                <div class="media-label">${item.label}</div>
                <div class="media-meta">#${String(index + 1).padStart(3, '0')} • ${item.type}</div>
                <div class="filename">${filename}</div>
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
    blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Generates CSV data from events
     */
    generateCSVData(events) {
        const headers = ['Index', 'Label', 'Platforms', 'Timestamp', 'Description', 'Image URL', 'Video URL', 'Event URL', 'Has Video'];
        const csvRows = [headers.join(',')];

        events.forEach((event, index) => {
            const row = [
                index + 1,
                `"${(event.label || '').replace(/"/g, '""')}"`,
                `"${(event.platforms || '').replace(/"/g, '""')}"`,
                `"${(event.timestamp || '').replace(/"/g, '""')}"`,
                `"${(event.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
                `"${event.imageSrc || ''}"`,
                `"${event.videoSrc || ''}"`,
                `"${event.eventUrl || ''}"`,
                event.hasVideo ? 'Yes' : 'No'
            ];
            csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
    }

    /**
     * Generates an organized filename for media downloads
     */
    generateMediaFilename(event, index) {
        const folderName = 'BlazeMedia';
        const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const paddedIndex = String(index + 1).padStart(3, '0');

        // Clean the label for filename
        const cleanLabel = (event.label || 'Unknown')
            .replace(/[^a-zA-Z0-9]/g, '_')
            .substring(0, 30);

        // Determine file extension
        let extension = 'jpg'; // default
        if (event.imageSrc) {
            // Try to get extension from URL
            const urlMatch = event.imageSrc.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
            if (urlMatch) {
                extension = urlMatch[1].toLowerCase();
            }
        } else if (event.videoSrc && event.videoSrc !== 'VIDEO DETECTADO') {
            // For videos
            const urlMatch = event.videoSrc.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
            if (urlMatch) {
                extension = urlMatch[1].toLowerCase();
            } else {
                extension = 'mp4'; // default video extension
            }
        }

        return `${folderName}/${timestamp}_${paddedIndex}_${cleanLabel}.${extension}`;
    }

    /**
     * Handles opening all Reel events in background tabs
     */
    handleOpenReels() {
        const reelUrls = this.controller.events
            .filter(event => event.eventUrl)
            .map(event => event.eventUrl);

        reelUrls.forEach(url => {
            chrome.tabs.create({ url, active: false });
        });

        this.controller.renderer.showMessage(`Opened ${reelUrls.length} events in background tabs`, 'success');
    }

    /**
     * Handles downloading all events as CSV
     */
    async handleDownloadAllCSV() {
        try {
            const { CSVExporter } = await import('../utils/csvExporter.js');
            CSVExporter.exportAllEvents(this.controller.events);
            this.controller.renderer.showMessage('CSV downloaded successfully!', 'success');
        } catch (error) {
            console.error('CSV export failed:', error);
            this.controller.renderer.showMessage('Failed to export CSV: ' + error.message, 'error');
        }
    }

    /**
     * Handles single media download
     */
    handleDownloadSingle(url) {
        if (!url) {
            this.controller.renderer.showMessage('No URL provided', 'error');
            return;
        }

        try {
            chrome.downloads.download({
                url: url,
                saveAs: true
            });
            this.controller.renderer.showMessage('Download started!', 'success');
        } catch (error) {
            console.error('Download failed:', error);
            this.controller.renderer.showMessage('Download failed: ' + error.message, 'error');
        }
    }

    /**
     * Handles opening event card in new tab
     */
    handleTestOpenCard(eventData) {
        if (eventData && eventData.eventUrl) {
            chrome.tabs.create({ url: eventData.eventUrl });
        }
    }

    /**
     * Handles single event CSV download
     */
    async handleDownloadSingleCSV(eventData) {
        try {
            const { CSVExporter } = await import('../utils/csvExporter.js');
            CSVExporter.exportSingleEvent(eventData);
        } catch (error) {
            console.error('Single CSV export failed:', error);
            this.controller.renderer.showMessage('Failed to export CSV: ' + error.message);
        }
    }

    /**
     * Captures the current page DOM and downloads it for debugging
     */
    async handleDebugDump() {
        try {
            await this.controller.updateActiveTab();
            this.controller.renderer.showMessage('Downloading page copy for debugging...', 'info');

            // Execute script to get full HTML
            const results = await chrome.scripting.executeScript({
                target: { tabId: this.controller.tabId },
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

            const { html, css, url } = results[0].result;

            // Combine into a single file
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `blaze-debug-dump-${timestamp}.html`;

            const fileContent = `<!-- URL: ${url} -->\n<style>\n${css}\n</style>\n${html}`;

            // Download
            const blob = new Blob([fileContent], { type: 'text/html' });
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result;
                chrome.downloads.download({
                    url: dataUrl,
                    filename: filename,
                    saveAs: true
                });
            };
            reader.readAsDataURL(blob);

            this.controller.renderer.showMessage('Debug file downloaded! Please send this to support.', 'success');
        } catch (error) {
            console.error('Debug dump failed:', error);
            this.controller.renderer.showMessage('Failed to download debug file: ' + error.message, 'error');
        }
    }

    /**
     * Handles capturing an item from inspector click
     */
    handleCaptureInfo(data) {
        if (!data) return;

        // Add to list
        this.controller.capturedItems.push(data);

        // Update UI
        this.controller.renderer.renderCapturedItems(this.controller.capturedItems);
    }

    /**
     * Clears captured items list
     */
    handleClearCaptured() {
        this.controller.capturedItems = [];
        this.controller.renderer.renderCapturedItems(this.controller.capturedItems);
    }
}
