/**
 * Live Scan Service - Manages live scanning functionality
 */
export class LiveScanService {
    constructor(controller) {
        this.controller = controller;
        this.liveScanInterval = null;
    }

    /**
     * Initializes live scanning settings from storage and UI state
     */
    async initLiveScanning() {
        try {
            // Get stored setting
            const result = await chrome.storage.local.get('liveScanningEnabled');
            const enabled = result.liveScanningEnabled || false;

            this.controller.isLiveScanning = enabled;
            console.log('Live scanning initialized:', enabled);
        } catch (error) {
            console.error('Failed to initialize live scanning:', error);
            this.controller.isLiveScanning = false; // Default to false on error
        }
    }

    /**
     * Binds the live scan toggle checkbox
     */
    bindLiveScanToggle() {
        const checkbox = document.getElementById('live-scan-checkbox');
        if (!checkbox) {
            console.warn('Live scan checkbox not found');
            return;
        }

        checkbox.addEventListener('change', (e) => {
            this.toggleLiveScanning(e.target.checked);
        });

        // Set initial state
        checkbox.checked = this.controller.isLiveScanning;
    }

    /**
     * Toggles live scanning on/off
     */
    async toggleLiveScanning(enabled) {
        try {
            this.controller.isLiveScanning = enabled;

            // Store in chrome storage
            await chrome.storage.local.set({ liveScanningEnabled: enabled });

            if (enabled) {
                this.startLiveScanning();
                this.controller.renderer.showMessage('Live scanning started - scanning every 1 second', 'success');
            } else {
                this.stopLiveScanning();
                this.controller.renderer.showMessage('Live scanning stopped', 'info');
            }

            console.log('Live scanning toggled:', enabled);
        } catch (error) {
            console.error('Failed to toggle live scanning:', error);
            this.controller.renderer.showMessage('Failed to toggle live scanning', 'error');
        }
    }

    /**
     * Starts the live scanning interval
     */
    startLiveScanning() {
        if (this.liveScanInterval) {
            clearInterval(this.liveScanInterval);
        }

        // Scan every 1 second
        this.liveScanInterval = setInterval(async () => {
            try {
                // Only scan if popup is still open
                if (!this.controller.container || !this.controller.container.isConnected) {
                    this.stopLiveScanning();
                    return;
                }

                // Perform silent capture
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
                const newEventsCount = data.events.length;
                const previousCount = this.controller.events.length;

                // Only update if we found new content or better content
                if (newEventsCount > previousCount || this.hasBetterContent(data.events, this.controller.events)) {
                    this.controller.events = data.events;
                    console.log('Live scan update:', newEventsCount, 'events detected');

                    // Refresh the display if we're in grid view
                    if (this.controller.container.querySelector('.events-grid')) {
                        this.controller.renderer.renderDataGrid(data);
                        this.controller.renderer.showMessage(`Live scan: ${newEventsCount} events found`, 'info');
                    }
                }
            } catch (error) {
                console.warn('Live scan failed:', error.message);
                // Don't show error messages for live scanning to avoid spam
            }
        }, 1000); // Every 1 second
    }

    /**
     * Stops the live scanning interval
     */
    stopLiveScanning() {
        if (this.liveScanInterval) {
            clearInterval(this.liveScanInterval);
            this.liveScanInterval = null;
            console.log('Live scanning stopped');
        }
    }

    /**
     * Checks if new data has better or more complete content than existing data
     */
    hasBetterContent(newEvents, oldEvents) {
        if (!newEvents || !oldEvents) return false;

        // Check if any event now has video sources that were previously detected
        return newEvents.some((newEvent, index) => {
            const oldEvent = oldEvents[index];
            if (!oldEvent) return false;

            // Check for video URL improvements
            if (newEvent.videoSrc && newEvent.videoSrc !== 'VIDEO DETECTED' &&
                oldEvent.videoSrc === 'VIDEO DETECTED') {
                return true;
            }

            // Check for new image sources
            if (newEvent.imageSrc && !oldEvent.imageSrc) {
                return true;
            }

            // Check for longer descriptions
            if (newEvent.description && oldEvent.description &&
                newEvent.description.length > oldEvent.description.length) {
                return true;
            }

            return false;
        });
    }
}
