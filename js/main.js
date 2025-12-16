import { createOverlay } from './renderers/overlay.js';
import { updateContent } from './renderers/render.js';

// Main initialization
const overlay = createOverlay();
document.body.appendChild(overlay);

// Initial update
updateContent(overlay);

// Update every 1 second
setInterval(() => {
  updateContent(overlay);
}, 1000);
