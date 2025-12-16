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
   * Returns the CSV column headers
   * @returns {string} Comma-separated headers
   */
  static getCSVHeaders() {
    const headers = [
      'Label',
      'Platforms',
      'Timestamp',
      'Description',
      'Image URL',
      'Video URL',
      'Has Video',
      'Video Duration',
      'Is New',
      'Badge Text',
      'Can Open Preview',
      'Brand Color',
      'Image Width',
      'Image Height',
      'Aspect Ratio',
      'Card Index',
      'Card Classes',
      'Event URL'
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
      event.timestamp,
      event.description,
      event.imageSrc,
      event.videoSrc,
      event.hasVideo,
      event.videoDuration,
      event.isNew,
      event.badgeText,
      event.canOpenPreview,
      event.brandColor,
      event.imageWidth,
      event.imageHeight,
      event.aspectRatio,
      event.cardIndex,
      event.cardClasses,
      event.eventUrl
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
