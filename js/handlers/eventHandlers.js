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

            // Execute the extraction script with the new workflow
            const results = await chrome.scripting.executeScript({
                target: { tabId: this.controller.tabId },
                func: () => {
                    // New extraction workflow: expand text, extract data, check boxes, then uncheck all
                    const extractEventsPreview = async () => {
                        const eventContainers = Array.from(document.querySelectorAll('[class*="CalendarEventCard_eventContainer"]'))
                            .filter(el => el.offsetWidth > 0 && el.offsetHeight > 0);

                        const events = [];

                        // Step 1-5: Process each event (expand text, extract data, check checkbox)
                        for (let index = 0; index < eventContainers.length; index++) {
                            const container = eventContainers[index];

                            // Step 2: Click "more" button to expand full text if exists
                            const moreButton = container.querySelector('[class*="TruncatedText_moreButton"]');
                            if (moreButton) {
                                moreButton.click();
                                // Wait for text to expand
                                await new Promise(resolve => setTimeout(resolve, 300));
                            }

                            // Step 3: Save all important data (titles, texts, dates, etc.)
                            // Extract label
                            const channelContainer = container.querySelector('[class*="CalendarEventCard_channelContainer"]');
                            const labelSpan = channelContainer?.querySelector('span[class*="Text_root_"]') ||
                                container.querySelector('span[class*="Text_root_"]');
                            const label = labelSpan?.textContent?.trim() || 'No Label';

                            // Extract platforms
                            const platformIcons = container.querySelectorAll('[class*="Icon_platformIcon"]');
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

                            // Extract full description (after expanding)
                            const descDiv = container.querySelector('[class*="TruncatedText_caption"]');
                            const description = descDiv?.textContent?.trim() || '';

                            // Extract image
                            const img = container.querySelector('img');
                            const imageSrc = (img && !img.src.startsWith('data:') && img.offsetWidth > 0) ? img.src : null;

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

                            // Step 4: Check the checkbox for this event
                            const checkbox = container.querySelector('input[type="checkbox"]');
                            const labelElement = container.querySelector('label');
                            if (checkbox && !checkbox.checked && labelElement) {
                                labelElement.click();
                                // Small delay after checking
                                await new Promise(resolve => setTimeout(resolve, 150));
                            }

                            events.push({
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
                            });
                        }

                        // Step 6: After processing all events, uncheck all checkboxes
                        const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
                        for (const checkbox of allCheckboxes) {
                            if (checkbox.checked) {
                                const label = checkbox.closest('label') || document.querySelector(`label[for="${checkbox.id}"]`);
                                if (label) {
                                    label.click();
                                    await new Promise(resolve => setTimeout(resolve, 100));
                                }
                            }
                        }

                        return events;
                    };

                    // Execute the workflow and return results
                    return extractEventsPreview().then(events => ({ events }));
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

                        // First, check the checkbox for this event on the web page
                        const checkbox = targetContainer.querySelector('input[type="checkbox"]');
                        const labelElement = targetContainer.querySelector('label');
                        if (checkbox && !checkbox.checked && labelElement) {
                            labelElement.click();
                        }

                        // Wait a bit for scroll and checkbox interaction to complete
                        setTimeout(() => {
                            // Try ALL interaction strategies sequentially - one of them will work!
                            const strategies = [];

                            // Strategy 1: Click the play button overlay directly
                            const playButton = targetContainer.querySelector('.CalendarEventCard_playButtonOverlay__335fa');
                            if (playButton) {
                                strategies.push(() => playButton.click());
                            }

                            // Strategy 2: Click the image container
                            const imageContainer = targetContainer.querySelector('.CalendarEventCard_eventImage__335fa');
                            if (imageContainer) {
                                strategies.push(() => imageContainer.click());
                            }

                            // Strategy 3: Click the actual img element
                            const imgElement = targetContainer.querySelector('img');
                            if (imgElement) {
                                strategies.push(() => imgElement.click());
                            }

                            // Strategy 4: React internal handlers on the play button
                            if (playButton && playButton._reactInternalInstance) {
                                strategies.push(() => {
                                    try {
                                        const internalInstance = playButton._reactInternalInstance;
                                        if (internalInstance && internalInstance.pendingProps && internalInstance.pendingProps.onClick) {
                                            internalInstance.pendingProps.onClick();
                                            return true;
                                        }
                                    } catch (e) {
                                        // React internal access failed
                                    }
                                    return false;
                                });
                            }

                            // Strategy 5: React internal handlers on the image container
                            if (imageContainer && imageContainer._reactInternalInstance) {
                                strategies.push(() => {
                                    try {
                                        const internalInstance = imageContainer._reactInternalInstance;
                                        if (internalInstance && internalInstance.pendingProps && internalInstance.pendingProps.onClick) {
                                            internalInstance.pendingProps.onClick();
                                            return true;
                                        }
                                    } catch (e) {
                                        // React internal access failed
                                    }
                                    return false;
                                });
                            }

                            // Strategy 6: Click checkbox label (React aria pattern) - TEMPORARILY DISABLED
                            // const label = targetContainer.querySelector('label');
                            // if (label) {
                            //     strategies.push(() => label.click());
                            // }

                            // Strategy 7: Call onclick handlers directly
                            const linkEl = targetContainer.closest('a') || targetContainer.querySelector('a');
                            if (linkEl && linkEl.onclick) {
                                strategies.push(() => linkEl.onclick());
                            } else if (targetContainer.onclick) {
                                strategies.push(() => targetContainer.onclick());
                            }

                            // Strategy 8: Programmatic navigation
                            if (linkEl?.href) {
                                strategies.push(() => {
                                    window.location.href = linkEl.href;
                                    return true;
                                });
                            }

                            // Strategy 9: Mouse event sequence (mousedown -> mouseup -> click)
                            strategies.push(() => {
                                const mouseDownEvent = new MouseEvent('mousedown', {
                                    bubbles: true, cancelable: true, view: window,
                                    clientX: targetContainer.getBoundingClientRect().left + targetContainer.offsetWidth / 2,
                                    clientY: targetContainer.getBoundingClientRect().top + targetContainer.offsetHeight / 2,
                                    button: 0, buttons: 1
                                });
                                const mouseUpEvent = new MouseEvent('mouseup', {
                                    bubbles: true, cancelable: true, view: window,
                                    clientX: targetContainer.getBoundingClientRect().left + targetContainer.offsetWidth / 2,
                                    clientY: targetContainer.getBoundingClientRect().top + targetContainer.offsetHeight / 2,
                                    button: 0, buttons: 1
                                });
                                const clickEvent = new MouseEvent('click', {
                                    bubbles: true, cancelable: true, view: window,
                                    clientX: targetContainer.getBoundingClientRect().left + targetContainer.offsetWidth / 2,
                                    clientY: targetContainer.getBoundingClientRect().top + targetContainer.offsetHeight / 2,
                                    button: 0, buttons: 1
                                });
                                targetContainer.dispatchEvent(mouseDownEvent);
                                targetContainer.dispatchEvent(mouseUpEvent);
                                targetContainer.dispatchEvent(clickEvent);
                                return true;
                            });

                            // Strategy 10: Keyboard Enter
                            strategies.push(() => {
                                targetContainer.focus();
                                targetContainer.dispatchEvent(new KeyboardEvent('keydown', {
                                    key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, cancelable: true
                                }));
                                return true;
                            });

                            // Strategy 11: Double click
                            strategies.push(() => {
                                targetContainer.dispatchEvent(new MouseEvent('dblclick', {
                                    bubbles: true, cancelable: true, view: window
                                }));
                                return true;
                            });

                            // Strategy 12: Space key
                            strategies.push(() => {
                                targetContainer.dispatchEvent(new KeyboardEvent('keydown', {
                                    key: ' ', code: 'Space', keyCode: 32, bubbles: true, cancelable: true
                                }));
                                return true;
                            });

                            // Strategy 13: Basic click as final fallback
                            strategies.push(() => {
                                targetContainer.click();
                                return true;
                            });

                            // Execute all strategies with small delays between them
                            strategies.forEach((strategy, index) => {
                                setTimeout(() => {
                                    try {
                                        strategy();
                                    } catch (error) {
                                        console.warn(`Strategy ${index + 1} failed:`, error);
                                    }
                                }, index * 100); // 100ms delay between each strategy
                            });

                        }, 300); // Initial delay for scroll

                        return { success: true };
                    }
                    return { success: false, error: 'Card not found at index ' + cardIndex };
                },
                args: [event.cardIndex],
                world: 'MAIN'
            });

            if (clickResult[0].result.success) {
                this.controller.renderer.showMessage('Event selected in web...', 'info');
            } else {
                console.warn('Failed to click web element:', clickResult[0].result.error);
            }

            // Note: Detail view opening disabled - only checkbox selection and web interaction

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
     * Scans the page for video elements and captures their MP4 URLs
     * Also identifies events that don't have videos loaded yet
     */
    async handleScanVideos() {
        try {
            await this.controller.updateActiveTab();
            this.controller.renderer.showMessage('Scanning for videos and checking events...', 'info');

            // Execute script to scan for videos and check event status
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

                    // Check which events have videos loaded (cross-reference with captured events)
                    const eventContainers = Array.from(document.querySelectorAll('[class*="CalendarEventCard_eventContainer"]'))
                        .filter(el => el.offsetWidth > 0 && el.offsetHeight > 0);

                    const eventsWithVideos = [];
                    const eventsWithoutVideos = [];

                    eventContainers.forEach((container, index) => {
                        const hasVideoElement = !!container.querySelector('video');
                        const label = container.querySelector('span[class*="Text_root_"]')?.textContent?.trim() || `Event ${index + 1}`;

                        // Check if this event was marked as having video in our captured data
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
                            // Restore original content if it was hidden before
                            if (container.dataset.wasHidden === 'true') {
                                delete container.dataset.wasHidden;
                                // Note: We can't restore original content, but at least we mark it as visible
                            }
                        } else {
                            eventsWithoutVideos.push({
                                index: index + 1,
                                label: label,
                                hasVideo: false
                            });
                            // Force replace HTML content with empty div
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

            const { videoSources, eventsWithVideos, eventsWithoutVideos } = results[0].result;

            // Add found videos to captured videos list
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

            // Update UI to show captured videos and missing videos
            this.updateCapturedVideosUI();
            this.updateMissingVideosUI(eventsWithoutVideos);

            const message = `Found ${newVideos.length} new videos. ${eventsWithoutVideos.length} events need manual opening.`;
            this.controller.renderer.showMessage(message, eventsWithoutVideos.length > 0 ? 'info' : 'success');

        } catch (error) {
            console.error('Video scan failed:', error);
            this.controller.renderer.showMessage('Video scan failed: ' + error.message, 'error');
        }
    }

    /**
     * Updates the UI to display captured videos
     */
    updateCapturedVideosUI() {
        // Create or update the videos container
        let videosContainer = document.getElementById('captured-videos-container');
        if (!videosContainer) {
            videosContainer = document.createElement('div');
            videosContainer.id = 'captured-videos-container';
            videosContainer.style.cssText = `
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
                max-height: 200px;
                overflow-y: auto;
                background: rgba(0,0,0,0.1);
                border-radius: 8px;
                padding: 8px;
            `;

            videosContainer.appendChild(header);
            videosContainer.appendChild(videosList);

            // Insert after captured items container or at the end
            const capturedItems = document.getElementById('captured-items-container');
            const resultsContent = document.querySelector('.results-content');
            if (capturedItems && capturedItems.nextSibling) {
                resultsContent.insertBefore(videosContainer, capturedItems.nextSibling);
            } else if (resultsContent) {
                resultsContent.appendChild(videosContainer);
            }
        }

        // Update the videos list
        const videosList = document.getElementById('videos-list');
        const videosCount = document.getElementById('videos-count');

        if (videosCount) {
            videosCount.textContent = this.controller.capturedVideos.length;
        }

        if (videosList && this.controller.capturedVideos.length === 0) {
            videosList.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.4); font-size: 11px; padding: 10px;">No videos captured yet</div>';
        } else if (videosList) {
            videosList.innerHTML = this.controller.capturedVideos.map((video, index) => {
                // Truncate long URLs for display
                const displayUrl = video.url.length > 80 ? video.url.substring(0, 80) + '...' : video.url;
                const videoId = `captured-video-${index}`;

                return `
                <div style="background: rgba(255,255,255,0.05); border-radius: 4px; padding: 8px; margin-bottom: 6px; font-size: 11px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                        <div style="flex: 1;">
                            <span style="font-weight: bold; color: #4ecdc4;">🎥 Video #${index + 1}</span>
                            <span style="color: #666; font-size: 10px; margin-left: 8px;">${video.type}</span>
                        </div>
                        <video id="${videoId}" style="width: 60px; height: 40px; object-fit: cover; border-radius: 2px; background: #000;" muted loop playsinline>
                            <source src="${video.url}" type="video/mp4">
                        </video>
                    </div>
                    <div style="color: #ccc; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 4px; font-family: monospace; font-size: 10px;" title="${video.url}">${displayUrl}</div>
                    ${video.duration ? `<div style="color: #888; font-size: 10px;">Duration: ${Math.round(video.duration)}s</div>` : ''}
                </div>
                `;
            }).join('');

            // Start playing videos when they're loaded
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

        // Bind download button
        const downloadBtn = document.getElementById('download-videos-btn');
        if (downloadBtn) {
            downloadBtn.onclick = () => this.handleDownloadCapturedVideos();
        }
    }

    /**
     * Updates the UI to display events that don't have videos loaded
     */
    updateMissingVideosUI(eventsWithoutVideos) {
        // Create or update the missing videos container
        let missingVideosContainer = document.getElementById('missing-videos-container');
        if (!missingVideosContainer) {
            missingVideosContainer = document.createElement('div');
            missingVideosContainer.id = 'missing-videos-container';
            missingVideosContainer.style.cssText = `
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
                max-height: 150px;
                overflow-y: auto;
                background: rgba(0,0,0,0.1);
                border-radius: 8px;
                padding: 8px;
            `;

            missingVideosContainer.appendChild(header);
            missingVideosContainer.appendChild(missingList);

            // Insert after captured videos container
            const capturedVideos = document.getElementById('captured-videos-container');
            const resultsContent = document.querySelector('.results-content');
            if (capturedVideos && capturedVideos.nextSibling) {
                resultsContent.insertBefore(missingVideosContainer, capturedVideos.nextSibling);
            } else if (resultsContent) {
                resultsContent.appendChild(missingVideosContainer);
            }
        }

        // Update the missing videos list
        const missingList = document.getElementById('missing-videos-list');
        const missingCount = document.getElementById('missing-count');

        if (missingCount) {
            missingCount.textContent = eventsWithoutVideos.length;
        }

        if (missingList) {
            if (eventsWithoutVideos.length === 0) {
                missingList.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.4); font-size: 11px; padding: 10px;">All events have videos loaded! 🎉</div>';
                // Hide the container if no missing videos
                missingVideosContainer.style.display = 'none';
            } else {
                missingVideosContainer.style.display = 'block';
                missingList.innerHTML = eventsWithoutVideos.map((event, index) => `
                    <div style="background: rgba(255,59,48,0.1); border: 1px solid rgba(255,59,48,0.2); border-radius: 4px; padding: 8px; margin-bottom: 6px; font-size: 11px; cursor: pointer;" onclick="this.style.background='rgba(255,59,48,0.2)'; setTimeout(() => this.style.background='rgba(255,59,48,0.1)', 200)">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <span style="font-weight: bold; color: #ff6b6b;">📂 Event #${event.index}</span>
                            <span style="color: #666; font-size: 10px;">No video loaded</span>
                        </div>
                        <div style="color: #ccc; word-break: break-all;">${event.label}</div>
                    </div>
                `).join('');
            }
        }
    }

    /**
     * Downloads all captured videos AND all media files (complete package)
     */
    async handleDownloadCapturedVideos() {
        const capturedVideos = this.controller.capturedVideos || [];
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

        const totalVideos = capturedVideos.length + mediaItems.filter(item => item.type === 'video').length;
        const totalImages = mediaItems.filter(item => item.type === 'image').length;
        const totalFiles = capturedVideos.length + mediaItems.length;

        if (totalFiles === 0) {
            this.controller.renderer.showMessage('No videos or media to download', 'info');
            return;
        }

        this.controller.renderer.showMessage(`Downloading complete package: ${capturedVideos.length} captured videos + ${mediaItems.length} media files...`, 'info');

        try {
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');

            // Generate HTML index file content (same as handleDownloadMedia)
            const htmlContent = this.generateHtmlIndex(mediaItems, timestamp);
            const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
            const htmlDataUrl = await this.blobToDataURL(htmlBlob);

            // Generate CSV data
            const csvContent = this.generateCSVData(this.controller.events);
            const csvBlob = new Blob([csvContent], { type: 'text/csv' });
            const csvDataUrl = await this.blobToDataURL(csvBlob);

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
            }, 500);

            // Download all captured videos
            capturedVideos.forEach((video, index) => {
                setTimeout(() => {
                    const filename = `BlazeMedia/captured_video_${index + 1}_${Date.now()}.mp4`;
                    chrome.downloads.download({
                        url: video.url,
                        filename: filename,
                        saveAs: false
                    });
                }, (downloadIndex + 2) * 500);
                downloadIndex++;
            });

            // Download all media files (images and videos from events)
            mediaItems.forEach((item) => {
                setTimeout(() => {
                    chrome.downloads.download({
                        url: item.url,
                        filename: item.filename
                    });
                }, (downloadIndex + 2) * 500);
                downloadIndex++;
            });

            this.controller.renderer.showMessage(`Complete package downloaded: HTML gallery, CSV data, ${capturedVideos.length} captured videos, and ${mediaItems.length} media files!`, 'success');

        } catch (error) {
            console.error('Complete download failed:', error);
            this.controller.renderer.showMessage('Download failed: ' + error.message, 'error');
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
