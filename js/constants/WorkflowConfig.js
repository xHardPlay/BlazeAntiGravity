/**
 * Configuration constants for workflow timing, limits, and behavior
 * Centralizes all magic numbers and timing values used in the application
 */
export const WorkflowConfig = {
    // Timing delays (in milliseconds)
    DELAYS: {
        TEXT_EXPANSION: 800,
        CHECKBOX_CLICK: 150,
        SCROLL_AND_CLICK: 300,
        CLICK_STRATEGY_DELAY: 100,
        DOWNLOAD_SEQUENCE: 500,
        VIDEO_LOAD_CHECK: 100
    },

    // Retry and timeout settings
    RETRY: {
        MAX_ATTEMPTS: 3,
        TIMEOUT_MS: 10000
    },

    // Data processing limits
    LIMITS: {
        MAX_FILENAME_LENGTH: 30,
        MAX_URL_DISPLAY_LENGTH: 80,
        DURATION_MATCH_TOLERANCE_SECONDS: 3,
        MAX_CSV_ROWS: 10000
    },

    // File naming patterns
    FILENAME_PATTERNS: {
        FOLDER_NAME: 'BlazeMedia',
        TIMESTAMP_FORMAT: 'YYYY-MM-DDTHH-mm-ss',
        IMAGE_EXTENSION: 'jpg',
        VIDEO_EXTENSION: 'mp4',
        HTML_INDEX: 'index_{timestamp}.html',
        CSV_DATA: 'data_{timestamp}.csv',
        CAPTURED_VIDEO: 'captured_video_{index}_{timestamp}.mp4',
        MEDIA_FILE: '{timestamp}_{index}_{label}.{extension}'
    },

    // Platform inference rules
    PLATFORM_INFERENCE: {
        EMAIL_KEYWORDS: ['email', 'mail'],
        BLOG_KEYWORDS: ['blog'],
        STORY_KEYWORDS: ['story']
    },

    // Video detection settings
    VIDEO_DETECTION: {
        REQUIRED_OVERLAYS: ['playButtonOverlay', 'videoContainer', 'videoTag'],
        DETECTED_PLACEHOLDER: 'VIDEO DETECTADO'
    },

    // UI update settings
    UI: {
        MAX_VIDEOS_DISPLAY_HEIGHT: 200,
        MAX_MISSING_VIDEOS_HEIGHT: 150,
        VIDEO_THUMBNAIL_SIZE: { width: 60, height: 40 },
        GRID_COLUMNS: 'repeat(auto-fill, minmax(250px, 1fr))'
    },

    // Download settings
    DOWNLOAD: {
        CHUNK_SIZE: 10,
        CONCURRENT_DOWNLOADS: 3,
        RETRY_FAILED_DOWNLOADS: true
    },

    // Error handling
    ERROR: {
        LOG_LEVEL: 'error', // 'debug', 'info', 'warn', 'error'
        MAX_ERROR_MESSAGES: 5
    }
};
