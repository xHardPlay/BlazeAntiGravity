// Extension constants
export const EXTENSION_NAME = 'AgencySMM';

export const DEFAULT_FOLDER_NAME = 'RelaxingPhotos';

export const SELECTORS = {
  MORE_BUTTONS: '.TruncatedText_moreButton__1d231.TruncatedText_expandable__1d231',
  CALENDAR_EVENTS: '.CalendarEventCard_eventContainer__335fa',
  SOCIAL_PLATFORMS: {
    FACEBOOK: 'Icon_facebook__d7da4',
    LINKEDIN: 'Icon_linkedIn__d7da4',
    INSTAGRAM: 'Icon_instagram__d7da4',
    YOUTUBE: 'Icon_youtube__d7da4',
    X: 'Icon_xplatform__d7da4'
  },
  VIDEO_PLAYER: '.VideoPlayer_videoContainer__cfc97 video',
  NEW_BADGE: '[data-testid="new-badge"]',
  VIDEO_DURATION: '[data-testid="video-duration"]'
};

export const TIMEOUTS = {
  EXPANSION_WAIT: 1000,
  MODAL_LOAD: 2000,
  EXTRACTION_INTERVAL: 1000,
  VIDEO_EXTRACTION: 3000
};

export const LIMITS = {
  EVENTS_PER_POPUP: 20,
  PARAGRAPHS: 10,
  LINKS: 10,
  VIDEOS: 10,
  BUTTONS: 5,
  OTHER_TEXT: 5,
  TABLES: 2,
  LISTS_PER_TYPE: 3,
  ITEMS_PER_LIST: 5,
  LIST_DEPTH: 2
};

export const PLATFORMS = {
  FACEBOOK: 'Facebook',
  LINKEDIN: 'LinkedIn',
  INSTAGRAM: 'Instagram',
  YOUTUBE: 'YouTube',
  X: 'X'
};
