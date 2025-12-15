/**
 * Refactored Popup Script - Clean, modular Chrome extension popup
 * Uses separate modules for concerns: data extraction, UI rendering, event handling, CSV export
 */

import PopupController from './popupController.js';

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const controller = new PopupController();
  controller.init();
});
