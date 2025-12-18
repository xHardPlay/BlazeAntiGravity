/**
 * CSV Export functionality for the extension
 */
export class CSVExporter {
  /**
   * Downloads a single event data as CSV
   * @param {Object} eventData - Event data object
   */
  static exportSingleEvent(eventData) {
    const filename = this.generateFilename(eventData);
    const csvData = this.buildCSVContent([eventData]);
    this.downloadCSV(csvData, filename);
  }

  /**
   * Downloads all events data as CSV
   * @param {Array} events - Array of event data objects
   */
  static exportAllEvents(events) {
    const csvData = this.buildCSVContent(events);
    const filename = `all_events_data.csv`;
    this.downloadCSV(csvData, filename);
  }

  /**
   * Downloads all events data as CSV in Blaze format
   * @param {Array} events - Array of event data objects
   */
  static exportAllEventsForBlaze(events) {
    const csvData = this.buildBlazeCSVContent(events);
    const filename = `blaze_events_data.csv`;
    this.downloadCSV(csvData, filename);
  }

  /**
   * Builds CSV content from event data
   * @param {Array} events - Array of event objects
   * @returns {string} CSV formatted string
   */
  static buildCSVContent(events) {
    const headers = this.getCSVHeaders();
    const rows = events.map(event => this.formatEventRow(event));

    return [headers, ...rows].join('\n');
  }

  /**
   * Builds CSV content in Blaze format from event data
   * @param {Array} events - Array of event objects
   * @returns {string} CSV formatted string
   */
  static buildBlazeCSVContent(events) {
    const headers = this.getBlazeCSVHeaders();
    const rows = events.map(event => this.formatBlazeEventRow(event));

    return [headers, ...rows].join('\n');
  }

  /**
   * Returns the CSV column headers
   * @returns {string} Comma-separated headers
   */
  static getCSVHeaders() {
    const headers = [
      'Label',
      'Platforms',
      'Description',
      'Image URL',
      'Has Video',
      'Duration',
      'Video URL',
      'Timestamp'
    ];

    return headers.join(',');
  }

  /**
   * Returns the Blaze CSV column headers
   * @returns {string} Comma-separated headers
   */
  static getBlazeCSVHeaders() {
    const headers = [
      'postAtSpecificTime',
      'content',
      'link',
      'imageUrls',
      'gifUrl',
      'videoUrls'
    ];

    return headers.join(',');
  }

  /**
   * Formats a single event into CSV row format
   * @param {Object} event - Event data object
   * @returns {string} CSV formatted row
   */
  static formatEventRow(event) {
    const fields = [
      event.label,
      event.platforms,
      event.description,
      event.imageSrc,
      event.hasVideo,
      event.videoDuration,
      event.videoSrc,
      event.timestamp
    ];

    return fields.map(field => `"${field || ''}"`).join(',');
  }

  /**
   * Formats a single event into Blaze CSV row format
   * @param {Object} event - Event data object
   * @returns {string} CSV formatted row
   */
  static formatBlazeEventRow(event) {
    // postAtSpecificTime: Use timestamp but add current day in YYYY-MM-DD HH:mm:ss format
    const postAtSpecificTime = this.formatTimestampForBlaze(event.timestamp);

    // content: From description
    const content = event.description || '';

    // link: Always empty
    const link = '';

    // imageUrls: From imageSrc
    const imageUrls = event.imageSrc || '';

    // gifUrl: Always blank
    const gifUrl = '';

    // videoUrls: From videoSrc if exists and not placeholder
    const videoUrls = (event.videoSrc && event.videoSrc !== 'VIDEO DETECTADO') ? event.videoSrc : '';

    const fields = [
      postAtSpecificTime,
      content,
      link,
      imageUrls,
      gifUrl,
      videoUrls
    ];

    return fields.map(field => `"${field || ''}"`).join(',');
  }

  /**
   * Generates filename for single event export
   * @param {Object} eventData - Event data
   * @returns {string} Filename
   */
  static generateFilename(eventData) {
    const label = eventData.label || 'event';
    const sanitizedLabel = label.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 20);
    return `${sanitizedLabel}_data.csv`;
  }

  /**
   * Triggers browser download of CSV file
   * @param {string} csvContent - CSV content
   * @param {string} filename - File name
   */
  static downloadCSV(csvContent, filename) {
    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      chrome.downloads.download({
        url,
        filename,
        conflictAction: 'overwrite'
      });

      // Clean up the URL after download starts
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading CSV:', error);
      throw new Error(`Failed to export CSV: ${error.message}`);
    }
  }

  /**
   * Formats timestamp for Blaze CSV format
   * Converts timestamp like "10:30 AM" to "YYYY-MM-DD HH:mm:ss" using current date
   * @param {string} timestamp - Original timestamp string
   * @returns {string} Formatted timestamp
   */
  static formatTimestampForBlaze(timestamp) {
    if (!timestamp) return '';

    try {
      // Get current date
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');

      // Parse the time part (e.g., "10:30 AM" -> hours and minutes)
      const timeMatch = timestamp.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!timeMatch) {
        // If no AM/PM format, try 24-hour format or just use current time
        return `${year}-${month}-${day} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      }

      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2];
      const ampm = timeMatch[3].toUpperCase();

      // Convert to 24-hour format
      if (ampm === 'PM' && hours !== 12) {
        hours += 12;
      } else if (ampm === 'AM' && hours === 12) {
        hours = 0;
      }

      const hours24 = String(hours).padStart(2, '0');

      return `${year}-${month}-${day} ${hours24}:${minutes}:00`;
    } catch (error) {
      console.error('Error formatting timestamp for Blaze:', error);
      // Fallback to current time
      const now = new Date();
      return now.toISOString().slice(0, 19).replace('T', ' ');
    }
  }

  /**
   * Validates event data before export
   * @param {Object|Array} data - Event data to validate
   * @throws {Error} If data is invalid
   */
  static validateExportData(data) {
    if (!data) {
      throw new Error('No data provided for export');
    }

    const events = Array.isArray(data) ? data : [data];

    if (events.length === 0) {
      throw new Error('No events to export');
    }

    // Check that events have required structure
    const firstEvent = events[0];
    if (typeof firstEvent !== 'object') {
      throw new Error('Invalid event data format');
    }
  }
}

export default CSVExporter;
