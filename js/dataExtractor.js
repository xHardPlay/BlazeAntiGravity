import {
  collectParagraphs,
  collectLinks,
  collectButtons,
  collectImages,
  collectVideos,
  collectLists,
  collectTables,
  collectOtherText,
  isElementVisible
} from './collectors.js';
import {
  SELECTORS,
  TIMEOUTS,
  LIMITS,
  PLATFORMS
} from './constants.js';

/**
 * Main data extraction class for the extension
 */
export class DataExtractor {
  constructor() {
    this.events = [];
  }

  /**
   * Extracts all data from the current page
   * @returns {Promise<Object>} Extracted data object
   */
  async extractAllData() {
    try {
      console.log('Starting data extraction...');

      // Expand truncated content
      await this.expandTruncatedContent();

      // Extract different data types
      const [
        headings,
        paragraphs,
        lists,
        events,
        links,
        buttons,
        images,
        videos,
        otherText,
        tables
      ] = await Promise.all([
        this.extractHeadings(),
        collectParagraphs(),
        this.extractLists(),
        this.extractEvents(),
        collectLinks(),
        collectButtons(),
        collectImages(),
        collectVideos(),
        collectOtherText(),
        collectTables()
      ]);

      this.events = events;

      return {
        headings: headings.slice(0, LIMITS.PARAGRAPHS),
        paragraphs: paragraphs.slice(0, LIMITS.PARAGRAPHS),
        lists: lists.slice(0, LIMITS.LISTS_PER_TYPE),
        events: events.slice(0, LIMITS.EVENTS_PER_POPUP),
        links: links.slice(0, LIMITS.LINKS),
        buttons: buttons.slice(0, LIMITS.BUTTONS),
        images: images.slice(0, LIMITS.LINKS),
        videos: videos.slice(0, LIMITS.VIDEOS),
        otherText: otherText.slice(0, LIMITS.OTHER_TEXT),
        tables: tables.slice(0, LIMITS.TABLES)
      };
    } catch (error) {
      console.error('Error during data extraction:', error);
      throw new Error(`Data extraction failed: ${error.message}`);
    }
  }

  /**
   * Expands any truncated text content on the page
   */
  async expandTruncatedContent() {
    try {
      const moreButtons = Array.from(document.querySelectorAll(SELECTORS.MORE_BUTTONS));
      moreButtons.forEach(button => button.click());

      // Wait for expansion to complete
      await new Promise(resolve => setTimeout(resolve, TIMEOUTS.EXPANSION_WAIT));
    } catch (error) {
      console.warn('Error expanding truncated content:', error);
    }
  }

  /**
   * Extracts headings from the page
   * @returns {Array} Array of heading objects with tag and text
   */
  extractHeadings() {
    const headings = [];
    for (let level = 1; level <= 6; level++) {
      const elements = Array.from(document.querySelectorAll(`h${level}`))
        .filter(isElementVisible);

      elements.forEach(element => {
        const text = element.textContent?.trim();
        if (text && text.length > 0) {
          headings.push({ tag: `H${level}`, text });
        }
      });
    }
    return headings.slice(0, LIMITS.PARAGRAPHS);
  }

  /**
   * Extracts calendar events with detailed metadata
   * @returns {Array} Array of event objects
   */
  extractEvents() {
    const eventContainers = Array.from(document.querySelectorAll(SELECTORS.CALENDAR_EVENTS))
      .filter(isElementVisible);

    return eventContainers.map(container => this.extractEventData(container));
  }

  /**
   * Extracts detailed data from a single event container
   * @param {Element} container - The event container element
   * @returns {Object} Event data object
   */
  extractEventData(container) {
    // Extract basic event information
    const label = this.extractEventLabel(container);
    const platforms = this.extractEventPlatforms(container);
    const timestamp = this.extractEventTimestamp(container);
    const description = this.extractEventDescription(container);
    const imageData = this.extractEventImages(container);
    const videoData = this.extractEventVideo(container);
    const url = this.extractEventUrl(container);
    const metadata = this.extractEventMetadata(container);

    return {
      label,
      platforms,
      timestamp,
      description,
      imageSrc: imageData.src,
      videoSrc: videoData.src,
      hasVideo: videoData.hasVideo,
      videoDuration: videoData.duration,
      isNew: metadata.isNew,
      badgeText: metadata.badgeText,
      canOpenPreview: metadata.canOpenPreview,
      brandColor: metadata.brandColor,
      imageWidth: metadata.imageDimensions?.width,
      imageHeight: metadata.imageDimensions?.height,
      aspectRatio: metadata.imageDimensions?.aspectRatio,
      cardIndex: metadata.cardIndex,
      cardClasses: metadata.cardClasses,
      eventUrl: url
    };
  }

  /**
   * Extracts event label from container
   */
  extractEventLabel(container) {
    // Try specific container first
    const channelContainer = container.querySelector('[class*="CalendarEventCard_channelContainer"]');
    const labelSpan = channelContainer?.querySelector('span[class*="Text_root_"]') ||
      container.querySelector('span[class*="Text_root_"]'); // Fallback to any text root in card
    return labelSpan?.textContent?.trim() || 'No Label';
  }

  /**
   * Extracts platform information from icons
   */
  extractEventPlatforms(container) {
    const platformIcons = container.querySelectorAll('.Icon_platformIcon__d7da4');
    const platforms = Array.from(platformIcons).map(icon => {
      const classes = icon.className.split(' ');
      return PLATFORMS[this.mapClassesToPlatform(classes)] || '';
    }).filter(platform => platform);

    return platforms.join(', ');
  }

  /**
   * Maps CSS classes to platform names
   */
  mapClassesToPlatform(classes) {
    const platformMappings = {
      [SELECTORS.SOCIAL_PLATFORMS.FACEBOOK]: 'FACEBOOK',
      [SELECTORS.SOCIAL_PLATFORMS.LINKEDIN]: 'LINKEDIN',
      [SELECTORS.SOCIAL_PLATFORMS.INSTAGRAM]: 'INSTAGRAM',
      [SELECTORS.SOCIAL_PLATFORMS.YOUTUBE]: 'YOUTUBE',
      [SELECTORS.SOCIAL_PLATFORMS.X]: 'X'
    };

    return Object.entries(platformMappings).find(([className]) =>
      classes.includes(className.replace('Icon_', ''))
    )?.[1];
  }

  /**
   * Extracts event timestamp
   */
  extractEventTimestamp(container) {
    const eventHeader = container.querySelector('[class*="CalendarEventCard_eventHeader"]');
    if (!eventHeader) return '';

    const timeSpans = eventHeader.querySelectorAll('span[class*="Text_root_"]');
    // Usually the second span is the time, but let's be safer
    if (timeSpans.length > 1) return timeSpans[1]?.textContent?.trim() || '';

    // Fallback search for time-like patterns
    const textContent = eventHeader.textContent;
    const timeMatch = textContent.match(/\d{1,2}:\d{2}\s?(?:AM|PM|am|pm)/);
    return timeMatch ? timeMatch[0] : '';
  }

  /**
   * Extracts event description
   */
  extractEventDescription(container) {
    const descDiv = container.querySelector('[class*="TruncatedText_caption"]');
    if (descDiv) return descDiv.textContent?.trim();

    // Fallback: finding the longest paragraph text in the card
    const paragraphs = Array.from(container.querySelectorAll('p, div[class*="text"], span[class*="caption"]'));
    const longest = paragraphs.reduce((a, b) => (a.textContent.length > b.textContent.length ? a : b), { textContent: '' });

    return longest.textContent.trim() || '';
  }

  /**
   * Extracts image data from event
   */
  extractEventImages(container) {
    const img = container.querySelector('img');
    if (!img || img.src.startsWith('data:') || img.offsetWidth <= 50 || img.offsetHeight <= 50) {
      return { src: null };
    }

    // Extract dimensions and aspect ratio
    const imageDimensions = this.extractImageMetadata(container);

    return {
      src: img.src,
      ...imageDimensions
    };
  }

  /**
   * Extracts video data from event
   */
  extractEventVideo(container) {
    const hasPlayOverlay = !!container.querySelector('.CalendarEventCard_playButtonOverlay__335fa');
    const hasVideoContainer = !!container.querySelector('[class*="VideoPlayer_videoContainer"]');
    const hasVideoTag = !!container.querySelector('video');

    const hasVideo = hasPlayOverlay || hasVideoContainer || hasVideoTag;
    const videoDuration = this.extractVideoDuration(container);

    return {
      src: hasVideo ? 'VIDEO DETECTADO' : null,
      hasVideo,
      duration: videoDuration
    };
  }

  /**
   * Extracts video duration if available
   */
  extractVideoDuration(container) {
    const durationEl = container.querySelector(SELECTORS.VIDEO_DURATION);
    return durationEl?.textContent?.trim() || '';
  }

  /**
   * Extracts event URL
   */
  extractEventUrl(container) {
    const linkEl = container.closest('a') || container.querySelector('a');
    return linkEl?.href || null;
  }

  /**
   * Extracts various metadata from event container
   */
  extractEventMetadata(container) {
    const cardClasses = container.className || '';
    const cardIndex = Array.from(container.parentNode?.children || []).indexOf(container) + 1;

    const isNew = cardClasses.includes('CalendarEventCard_new__335fa');
    const canOpenPreview = cardClasses.includes('CalendarEventCard_canOpenPreview__335fa');

    const newBadge = container.querySelector(SELECTORS.NEW_BADGE);
    const badgeText = newBadge?.textContent?.trim() || '';

    const brandColor = this.extractBrandColor(container);
    const imageDimensions = this.extractImageMetadata(container);

    return {
      isNew,
      badgeText,
      canOpenPreview,
      brandColor,
      imageDimensions,
      cardIndex,
      cardClasses
    };
  }

  /**
   * Extracts brand color from CSS variables
   */
  extractBrandColor(container) {
    const imgContainer = container.querySelector('[id^="image-wrapper-"]');
    if (!imgContainer) return null;

    const style = imgContainer.getAttribute('style') || '';
    const colorMatch = style.match(/--brand-kit-color:\s*([^;]+)/);
    return colorMatch ? colorMatch[1].trim() : null;
  }

  /**
   * Extracts image dimensions and aspect ratio
   */
  extractImageMetadata(container) {
    const imgContainer = container.querySelector('[id^="image-wrapper-"]');
    if (!imgContainer) return null;

    const style = imgContainer.getAttribute('style') || '';
    const widthMatch = style.match(/--aspect-w:\s*([^;]+)/);
    const heightMatch = style.match(/--aspect-h:\s*([^;]+)/);

    if (widthMatch && heightMatch) {
      const width = parseInt(widthMatch[1]);
      const height = parseInt(heightMatch[1]);
      const aspectRatio = width ? `${width}:${height}` : null;

      return {
        width,
        height,
        aspectRatio
      };
    }

    return null;
  }

  /**
   * Extracts list data from the page
   */
  async extractLists() {
    return Array.from(document.querySelectorAll('ul, ol'))
      .filter(list => isElementVisible(list) && this.hasValidListItems(list))
      .slice(0, LIMITS.LISTS_PER_TYPE)
      .map(list => ({
        type: list.tagName.toLowerCase(),
        items: this.extractListItems(list).slice(0, LIMITS.ITEMS_PER_LIST)
      }));
  }

  /**
   * Checks if a list has valid items
   */
  hasValidListItems(list) {
    const listItems = Array.from(list.children).filter(child => child.tagName === 'LI');
    return listItems.some(li => li.textContent?.trim().length > 0);
  }

  /**
   * Extracts items from a list recursively
   */
  extractListItems(list, depth = 0) {
    if (depth > LIMITS.LIST_DEPTH) return [];

    return Array.from(list.children)
      .filter(child => child.tagName === 'LI')
      .map(li => {
        const text = li.textContent?.trim();
        if (!text) return null;

        const subLists = Array.from(li.children).filter(child =>
          child.tagName === 'UL' || child.tagName === 'OL'
        );

        const subItems = subLists.flatMap(sub => this.extractListItems(sub, depth + 1));

        return { text, subItems: subItems.filter(Boolean) };
      })
      .filter(Boolean);
  }
}</content >
