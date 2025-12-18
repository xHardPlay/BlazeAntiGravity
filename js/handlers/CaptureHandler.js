import { ErrorMessages } from '../constants/ErrorMessages.js';
import { WorkflowConfig } from '../constants/WorkflowConfig.js';
import { DataExtractor } from '../utils/DataExtractor.js';
import { VideoProcessor } from '../utils/VideoProcessor.js';

/**
 * CaptureHandler - Handles the data capture workflow from Blaze pages
 * Orchestrates data extraction, video processing, and UI updates
 */
export class CaptureHandler {
    constructor(controller) {
        this.controller = controller;
        this.dataExtractor = new DataExtractor();
        this.videoProcessor = new VideoProcessor();
    }

    /**
     * Main capture workflow - extracts data from the current Blaze page
     * @returns {Promise<void>}
     */
    async handleCapture() {
        try {
            await this.controller.updateActiveTab();

            // Show loading state
            this.controller.renderer.renderLoadingState();

            // Validate we're on a Blaze site
            if (!await this.validateBlazeSite()) {
                return;
            }

            // Extract events data
            const events = await this.extractEventsData();
            if (!events || events.length === 0) {
                this.controller.renderer.showMessage(ErrorMessages.NO_EVENTS_FOUND, 'info');
                return;
            }

            // Store events and connect videos
            this.controller.events = events;
            this.connectVideosToEvents();

            // Render data and bind UI
            this.controller.renderer.renderDataGrid({ events });
            this.controller.liveScanService.bindLiveScanToggle();

            this.controller.renderer.showMessage(
                ErrorMessages.CAPTURE_SUCCESS(events.length),
                'success'
            );

        } catch (error) {
            console.error('Capture failed:', error);
            this.controller.renderer.showMessage(
                ErrorMessages.CAPTURE_FAILED + ': ' + error.message,
                'error'
            );
        }
    }

    /**
     * Validate that we're on a Blaze site
     * @returns {Promise<boolean>} True if valid Blaze site
     */
    async validateBlazeSite() {
        try {
            const tab = await chrome.tabs.get(this.controller.tabId);
            const isBlazeSite = tab.url && tab.url.includes('blaze.ai');

            if (!isBlazeSite) {
                this.controller.renderer.showMessage(ErrorMessages.INVALID_SITE, 'error');
                return false;
            }

            return true;
        } catch (tabError) {
            console.error('Failed to get tab info:', tabError);
            this.controller.renderer.showMessage(ErrorMessages.TAB_ACCESS_FAILED, 'error');
            return false;
        }
    }

    /**
     * Extract events data using DataExtractor
     * @returns {Promise<Array>} Array of extracted event data
     */
    async extractEventsData() {
        // Execute the extraction script
        const results = await chrome.scripting.executeScript({
            target: { tabId: this.controller.tabId },
            func: () => {
                // Create data extractor instance in page context
                class PageDataExtractor {
                    constructor() {
                        this.platformDetector = new class PlatformDetector {
                            detectPlatforms(container) {
                                const platforms = [];
                                const icons = container.querySelectorAll('[class*="Icon_platform"]');
                                icons.forEach(icon => {
                                    const classes = icon.className;
                                    if (classes.includes('Icon_facebook__d7da4')) platforms.push('Facebook');
                                    if (classes.includes('Icon_instagram__d7da4')) platforms.push('Instagram');
                                    if (classes.includes('Icon_youtube__d7da4')) platforms.push('YouTube');
                                    if (classes.includes('Icon_x__d7da4') || classes.includes('Icon_twitter__d7da4')) platforms.push('X');
                                    if (classes.includes('Icon_linkedin__d7da4')) platforms.push('LinkedIn');
                                });
                                return [...new Set(platforms)];
                            }

                            inferPlatformFromLabel(label) {
                                const lower = label.toLowerCase();
                                if (lower.includes('email') || lower.includes('mail')) return ['Email'];
                                if (lower.includes('blog')) return ['Blog'];
                                if (lower.includes('story')) return ['Instagram'];
                                return [];
                            }
                        }();
                    }

                    async extractEventsPreview() {
                        const containers = Array.from(document.querySelectorAll('[class*="CalendarEventCard_eventContainer"]'))
                            .filter(el => el.offsetWidth > 0 && el.offsetHeight > 0);

                        const events = [];

                        for (let index = 0; index < containers.length; index++) {
                            const container = containers[index];

                            // Expand text
                            const moreButton = container.querySelector('[class*="TruncatedText_moreButton"]');
                            if (moreButton) {
                                moreButton.click();
                                // Wait for text to expand
                                await new Promise(resolve => setTimeout(resolve, 300));
                            }

                            // Extract data
                            const label = this.extractLabel(container);
                            const platforms = this.extractPlatforms(container, label);
                            const timestamp = this.extractTimestamp(container);
                            const description = this.extractDescription(container);
                            const imageData = this.extractImage(container);
                            const videoData = this.extractVideo(container);
                            const url = this.extractUrl(container);
                            const metadata = this.extractMetadata(container, index);

                            events.push({
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
                            });
                        }

                        return events;
                    }

                    extractLabel(container) {
                        const channelContainer = container.querySelector('[class*="CalendarEventCard_channelContainer"]');
                        const span = channelContainer?.querySelector('span[class*="Text_root_"]') ||
                                   container.querySelector('span[class*="Text_root_"]');
                        return span?.textContent?.trim() || 'No Label';
                    }

                    extractPlatforms(container, label) {
                        let platforms = this.platformDetector.detectPlatforms(container);
                        if (platforms.length === 0) {
                            platforms = this.platformDetector.inferPlatformFromLabel(label);
                        }
                        return platforms;
                    }

                    extractTimestamp(container) {
                        const header = container.querySelector('[class*="CalendarEventCard_eventHeader"]');
                        const spans = header?.querySelectorAll('span[class*="Text_root_"]');
                        return spans && spans.length > 1 ? spans[1]?.textContent?.trim() || '' : '';
                    }

                    extractDescription(container) {
                        const desc = container.querySelector('[class*="TruncatedText_caption"]');
                        return desc?.textContent?.trim() || '';
                    }

                    extractImage(container) {
                        const img = container.querySelector('img');
                        const src = img && !img.src.startsWith('data:') && img.offsetWidth > 0 ? img.src : null;
                        return { src };
                    }

                    extractVideo(container) {
                        const hasOverlay = !!container.querySelector('.CalendarEventCard_playButtonOverlay__335fa');
                        const hasContainer = !!container.querySelector('[class*="VideoPlayer_videoContainer"]');
                        const hasTag = !!container.querySelector('video');
                        const hasVideo = hasOverlay || hasContainer || hasTag;

                        let src = null;
                        let duration = '';

                        if (hasVideo) {
                            const videoEl = container.querySelector('video');
                            if (videoEl && videoEl.src && videoEl.src !== 'about:blank') {
                                src = videoEl.src;
                            }

                            const durationEl = container.querySelector('[data-testid="video-duration"]');
                            if (durationEl?.textContent?.trim()) {
                                duration = durationEl.textContent.trim();
                            } else if (videoEl && videoEl.duration && !isNaN(videoEl.duration)) {
                                const mins = Math.floor(videoEl.duration / 60);
                                const secs = Math.floor(videoEl.duration % 60);
                                duration = `${mins}:${secs.toString().padStart(2, '0')}`;
                            }

                            if (!src) {
                                src = 'VIDEO DETECTADO';
                            }
                        }

                        return { src, hasVideo, duration };
                    }

                    extractUrl(container) {
                        const link = container.closest('a') || container.querySelector('a');
                        return link?.href || null;
                    }

                    extractMetadata(container, index) {
                        const classes = container.className || '';
                        const isNew = classes.includes('CalendarEventCard_new__335fa');
                        return {
                            cardIndex: index + 1,
                            isNew,
                            cardClasses: classes
                        };
                    }
                }

                const extractor = new PageDataExtractor();
                return extractor.extractEventsPreview();
            },
            world: 'MAIN'
        });

        return results[0].result;
    }

    /**
     * Connect captured videos to events based on duration matching
     */
    connectVideosToEvents() {
        if (!this.controller.events || !this.controller.capturedVideos) return;

        const connectionsMade = this.videoProcessor.connectVideosToEvents(
            this.controller.events,
            this.controller.capturedVideos
        );

        if (connectionsMade > 0) {
            this.controller.renderer.showMessage(
                ErrorMessages.VIDEO_CONNECTION_SUCCESS(connectionsMade),
                'success'
            );
        }
    }
}
