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
                        this.columnDates = {};
                        this.platformDetector = new class PlatformDetector {
                            detectPlatforms(container) {
                                const platforms = [];

                                // Check ALL elements with platform-related classes
                                const allElements = container.querySelectorAll('*');
                                allElements.forEach(el => {
                                    const classes = el.className || '';
                                    if (typeof classes === 'string') {
                                        // Icon_platform classes
                                        if (classes.includes('Icon_facebook') || classes.includes('ChannelIcon_facebook')) {
                                            platforms.push('Facebook');
                                        }
                                        if (classes.includes('Icon_instagram') || classes.includes('ChannelIcon_instagram')) {
                                            platforms.push('Instagram');
                                        }
                                        if (classes.includes('Icon_youtube') || classes.includes('ChannelIcon_youtube')) {
                                            platforms.push('YouTube');
                                        }
                                        if (classes.includes('Icon_x__') || classes.includes('Icon_twitter') ||
                                            classes.includes('ChannelIcon_x__') || classes.includes('ChannelIcon_twitter')) {
                                            platforms.push('X');
                                        }
                                        if (classes.includes('Icon_linkedin') || classes.includes('ChannelIcon_linkedIn')) {
                                            platforms.push('LinkedIn');
                                        }
                                    }
                                });

                                // Check for Instagram by SVG gradient pattern (Instagram uses radial gradient with specific colors)
                                const svgs = container.querySelectorAll('svg');
                                for (const svg of svgs) {
                                    const svgHTML = svg.outerHTML || '';
                                    // Instagram gradient has these specific colors
                                    if (svgHTML.includes('#FFC800') && svgHTML.includes('#F51780') && svgHTML.includes('#8C3AAA')) {
                                        platforms.push('Instagram');
                                    }
                                    // YouTube red color and path
                                    if (svgHTML.includes('M23.498 6.186') || (svgHTML.includes('#FF0000') && svgHTML.includes('youtube'))) {
                                        platforms.push('YouTube');
                                    }
                                    // Facebook blue
                                    if (svgHTML.includes('#1877F2')) {
                                        platforms.push('Facebook');
                                    }
                                    // LinkedIn blue
                                    if (svgHTML.includes('#1275B1') || svgHTML.includes('#0A66C2')) {
                                        platforms.push('LinkedIn');
                                    }
                                }

                                const uniquePlatforms = [...new Set(platforms)];
                                console.log(`🔍 Detected platforms:`, uniquePlatforms);
                                return uniquePlatforms;
                            }

                            inferPlatformFromLabel(label) {
                                const lower = label.toLowerCase();
                                if (lower.includes('email') || lower.includes('mail')) return ['Email'];
                                if (lower.includes('blog')) return ['Blog'];
                                if (lower.includes('story')) return ['Instagram'];
                                if (lower.includes('reel')) return ['Instagram'];
                                if (lower.includes('post')) return []; // Generic, need icon detection
                                return [];
                            }
                        }();
                    }

                    async extractEventsPreview() {
                        // Get date headers and columns - they are siblings in the WeekView
                        const dateHeaders = Array.from(document.querySelectorAll('[class*="WeekViewV2_weekDayHeaderContainer"]'))
                            .map(h => h.textContent?.trim() || '');
                        const dayColumns = Array.from(document.querySelectorAll('[class*="WeekViewV2_weekDayColumn"]'));

                        console.log(`📅 Found ${dateHeaders.length} date headers:`, dateHeaders);
                        console.log(`📅 Found ${dayColumns.length} day columns`);

                        // Build a map of column index -> date
                        this.columnDates = {};
                        dayColumns.forEach((col, idx) => {
                            this.columnDates[idx] = dateHeaders[idx] || '';
                        });

                        // Scroll each column to load all cards
                        for (const column of dayColumns) {
                            column.scrollTop = column.scrollHeight;
                            await new Promise(resolve => setTimeout(resolve, 50));
                            column.scrollTop = 0;
                        }

                        // Get ALL event containers
                        const containers = Array.from(document.querySelectorAll('[class*="CalendarEventCard_eventContainer"]'));

                        console.log(`📊 Found ${containers.length} event containers in DOM`);

                        // Click all "more" buttons at once
                        let moreButtonCount = 0;
                        containers.forEach(container => {
                            const moreButton = container.querySelector('[class*="TruncatedText_moreButton"]');
                            if (moreButton) {
                                moreButton.click();
                                moreButtonCount++;
                            }
                        });

                        // Wait for text expansions if any buttons were clicked
                        if (moreButtonCount > 0) {
                            console.log(`📝 Clicked ${moreButtonCount} "more" buttons`);
                            await new Promise(resolve => setTimeout(resolve, 200));
                        }

                        // Now extract data from all containers
                        const events = [];
                        for (let index = 0; index < containers.length; index++) {
                            const container = containers[index];

                            const label = this.extractLabel(container);
                            const platforms = this.extractPlatforms(container, label);
                            const timestamp = this.extractTimestamp(container);
                            const date = this.extractDate(container);
                            const description = this.extractDescription(container);
                            const imageData = this.extractImage(container);
                            const videoData = this.extractVideo(container);
                            const url = this.extractUrl(container);
                            const metadata = this.extractMetadata(container, index);

                            events.push({
                                label,
                                platforms,
                                timestamp,
                                date,
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

                        console.log(`✅ Extracted ${events.length} events`);
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

                        // Search for text that looks like a time (e.g., "10:30 AM", "2:00 PM", "5:00pm")
                        // Support both "AM/PM" and "am/pm" with optional space
                        const timePattern = /^\d{1,2}:\d{2}\s*(am|pm)$/i;

                        if (spans) {
                            for (const span of spans) {
                                const text = span?.textContent?.trim();
                                if (text && timePattern.test(text)) {
                                    return text;
                                }
                            }
                        }

                        // Fallback: check all text content in header for time pattern
                        if (header) {
                            const headerText = header.textContent || '';
                            const timeMatch = headerText.match(/(\d{1,2}:\d{2}\s*(am|pm))/i);
                            if (timeMatch) {
                                return timeMatch[1];
                            }
                        }

                        return '';
                    }

                    extractDescription(container) {
                        // Try multiple selectors for content
                        const selectors = [
                            '[class*="TruncatedText_caption"]',
                            '[class*="TruncatedText_text"]',
                            '[class*="CalendarEventCard_content"]',
                            '[class*="CalendarEventCard_description"]',
                            '[class*="CalendarEventCard_captionContainer"]'
                        ];

                        for (const selector of selectors) {
                            const el = container.querySelector(selector);
                            const text = el?.textContent?.trim();
                            if (text && text.length > 10) {
                                // Remove "more" suffix if present
                                const cleanText = text.replace(/\s*more\s*$/i, '').trim();
                                if (cleanText.length > 10) {
                                    return cleanText;
                                }
                            }
                        }

                        // Fallback: look for any substantial text block in the container
                        const allText = container.querySelectorAll('span, p, div');
                        let longestText = '';
                        for (const el of allText) {
                            const text = el.textContent?.trim() || '';
                            // Skip short text (labels, timestamps) and filter out common non-content
                            if (text.length > longestText.length &&
                                text.length > 15 &&
                                !text.match(/^\d{1,2}:\d{2}/) &&
                                !text.match(/^(Post|Draft|Posted|Email|Story|Reel|more)$/i)) {
                                // Remove "more" suffix
                                longestText = text.replace(/\s*more\s*$/i, '').trim();
                            }
                        }

                        return longestText;
                    }

                    extractImage(container) {
                        // Find image with actual src (not data: URLs)
                        const img = container.querySelector('img[src]');
                        let src = null;
                        if (img && img.src && !img.src.startsWith('data:')) {
                            src = img.src;
                        }
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

                    extractDate(container) {
                        // Find which column this container is in
                        const dayColumn = container.closest('[class*="WeekViewV2_weekDayColumn"]');
                        if (dayColumn && this.columnDates) {
                            const allColumns = Array.from(document.querySelectorAll('[class*="WeekViewV2_weekDayColumn"]'));
                            const columnIndex = allColumns.indexOf(dayColumn);
                            if (columnIndex >= 0 && this.columnDates[columnIndex]) {
                                return this.columnDates[columnIndex];
                            }
                        }

                        // Fallback: try to find date header directly
                        const dateHeaders = document.querySelectorAll('[class*="WeekViewV2_weekDayHeaderContainer"]');
                        if (dateHeaders.length > 0) {
                            // Return first date as fallback
                            return dateHeaders[0]?.textContent?.trim() || '';
                        }

                        return '';
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
