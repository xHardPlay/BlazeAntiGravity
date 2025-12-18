/**
 * Centralized error messages and user-facing strings
 * Ensures consistent messaging throughout the application
 */
export const ErrorMessages = {
    // General errors
    GENERIC_ERROR: 'An unexpected error occurred',
    NETWORK_ERROR: 'Network connection failed',
    TIMEOUT_ERROR: 'Operation timed out',

    // Tab and page errors
    TAB_ACCESS_FAILED: 'Failed to access current tab',
    INVALID_SITE: 'This extension only works on Blaze sites',
    PAGE_LOAD_ERROR: 'Failed to load page content',

    // Capture errors
    CAPTURE_FAILED: 'Capture failed',
    NO_EVENTS_FOUND: 'No events found on this page',
    EXTRACTION_FAILED: 'Failed to extract event data',

    // Video errors
    VIDEO_SCAN_FAILED: 'Video scan failed',
    VIDEO_CONNECTION_FAILED: 'Failed to connect videos to events',
    VIDEO_DOWNLOAD_FAILED: 'Video download failed',

    // Download errors
    DOWNLOAD_FAILED: 'Download failed',
    FILE_GENERATION_FAILED: 'Failed to generate file',
    BLOB_CREATION_FAILED: 'Failed to create download file',

    // UI errors
    RENDER_FAILED: 'Failed to update interface',
    EVENT_CLICK_FAILED: 'Failed to open event',

    // Data errors
    INVALID_DATA: 'Invalid data received',
    MISSING_DATA: 'Required data is missing',
    CORRUPTED_DATA: 'Data appears to be corrupted',

    // Success messages
    CAPTURE_SUCCESS: (count) => `Captured ${count} events!`,
    DOWNLOAD_SUCCESS: (count) => `Downloaded ${count} files successfully`,
    VIDEO_CONNECTION_SUCCESS: (count) => `Connected ${count} videos to their events!`,
    REEL_OPEN_SUCCESS: (count) => `Opened ${count} events in background tabs`,

    // Info messages
    DOWNLOAD_STARTED: 'Download started!',
    SCANNING_VIDEOS: 'Scanning for videos...',
    CREATING_PACKAGE: 'Creating complete package...',
    DOWNLOADING_PACKAGE: (videos, media) => `Downloading complete package: ${videos} captured videos + ${media} media files...`,

    // Warning messages
    MISSING_VIDEOS: (count) => `${count} events need manual opening`,
    PARTIAL_SUCCESS: 'Operation completed with some issues'
};

/**
 * Helper function to get user-friendly error message
 * @param {Error|string} error - The error object or message
 * @param {string} fallback - Fallback message if error can't be processed
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error, fallback = ErrorMessages.GENERIC_ERROR) => {
    if (!error) return fallback;

    if (typeof error === 'string') {
        return error;
    }

    if (error.message) {
        // Try to match common error patterns and provide better messages
        const message = error.message.toLowerCase();

        if (message.includes('network') || message.includes('fetch')) {
            return ErrorMessages.NETWORK_ERROR;
        }

        if (message.includes('timeout')) {
            return ErrorMessages.TIMEOUT_ERROR;
        }

        if (message.includes('permission') || message.includes('access')) {
            return ErrorMessages.TAB_ACCESS_FAILED;
        }

        return error.message;
    }

    return fallback;
};

/**
 * Creates a formatted error message with context
 * @param {string} operation - The operation that failed
 * @param {Error|string} error - The error details
 * @returns {string} Formatted error message
 */
export const formatErrorMessage = (operation, error) => {
    const errorMsg = getErrorMessage(error);
    return `${operation}: ${errorMsg}`;
};
