/**
 * Centralized constants for DOM selectors and CSS class names
 * Used throughout the event handling system for consistent element selection
 */
export const SelectorConstants = {
    // Event card selectors
    EVENT_CONTAINER: '[class*="CalendarEventCard_eventContainer"]',
    EVENT_HEADER: '[class*="CalendarEventCard_eventHeader"]',
    EVENT_IMAGE: '.CalendarEventCard_eventImage__335fa',
    PLAY_BUTTON_OVERLAY: '.CalendarEventCard_playButtonOverlay__335fa',

    // Text and content selectors
    TRUNCATED_TEXT: '[class*="TruncatedText_caption"]',
    TRUNCATED_TEXT_MORE_BUTTON: '[class*="TruncatedText_moreButton"]',
    TEXT_ROOT: 'span[class*="Text_root_"]',

    // Channel and platform selectors
    CHANNEL_CONTAINER: '[class*="CalendarEventCard_channelContainer"]',
    PLATFORM_ICON: '[class*="Icon_platform"]',
    PLATFORM_ICON_CONTAINER: '.Icon_platformIconsContainer__d7da4',

    // Form elements
    CHECKBOX: 'input[type="checkbox"]',
    CHECKBOX_LABEL: 'label',

    // Video elements
    VIDEO_ELEMENT: 'video',
    VIDEO_CONTAINER: '[class*="VideoPlayer_videoContainer"]',
    VIDEO_SOURCE: 'source',
    VIDEO_DURATION: '[data-testid="video-duration"]',

    // UI containers
    RESULTS_CONTENT: '.results-content',
    CAPTURED_ITEMS_CONTAINER: 'captured-items-container',
    CAPTURED_VIDEOS_CONTAINER: 'captured-videos-container',
    MISSING_VIDEOS_CONTAINER: 'missing-videos-container',

    // UI elements
    VIDEOS_LIST: 'videos-list',
    VIDEOS_COUNT: 'videos-count',
    DOWNLOAD_VIDEOS_BTN: 'download-videos-btn',
    MISSING_VIDEOS_LIST: 'missing-videos-list',
    MISSING_COUNT: 'missing-count',

    // Platform detection patterns
    PLATFORM_PATTERNS: {
        FACEBOOK: {
            CLASSES: ['Icon_facebook__d7da4'],
            SVG_PATTERNS: ['M14.3921 4.77426']
        },
        INSTAGRAM: {
            CLASSES: ['Icon_instagram__d7da4'],
            SVG_PATTERNS: ['M12.0833 1H3.91667C2.30608 1 1 2.30608 1 3.91667V12.0833C1 13.6939 2.30608 15 3.91667 15H12.0833']
        },
        YOUTUBE: {
            CLASSES: ['Icon_youtube__d7da4'],
            SVG_PATTERNS: ['M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z']
        },
        X_TWITTER: {
            CLASSES: ['Icon_x__d7da4', 'Icon_twitter__d7da4'],
            SVG_PATTERNS: ['M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z']
        },
        LINKEDIN: {
            CLASSES: ['Icon_linkedin__d7da4'],
            SVG_PATTERNS: ['M14.3921 4.77426', 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z']
        }
    }
};
