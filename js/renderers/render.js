import { getColors, setOverlayStyles, isDarkMode } from '../styles/theme.js';
import {
  collectHeadings,
  collectParagraphs,
  collectLists,
  collectImages,
  collectLinks,
  collectButtons,
  collectOtherText,
  collectTables
} from '../utils/collectors.js';

// Helper to build tree HTML for lists
export function buildListTree(item, indent = 10) {
  let html = `<div style="font-size: 14px; margin-left: ${indent}px;">- ${item.text.slice(0, 50)}${item.text.length > 50 ? '...' : ''}</div>`;
  item.subItems.forEach(sub => {
    html += buildListTree(sub, indent + 10);
  });
  return html;
}

// Function to update the content
export function updateContent(overlay) {
  // Get the current site name
  const siteName = window.location.hostname || 'unknown site';

  const { btnBg, btnColor, linkColor } = getColors();
  setOverlayStyles(overlay);

  // Collect all items
  const headings = collectHeadings();
  const paragraphs = collectParagraphs();
  const lists = collectLists();
  const images = collectImages();
  const links = collectLinks();
  const buttons = collectButtons();
  const otherText = collectOtherText();
  const tables = collectTables();

  // Build content HTML
  let content = `<button id="mode-toggle-btn" style="position: absolute; top: 5px; right: 5px; padding: 2px 5px; background-color: ${btnBg}; color: ${btnColor}; border: 1px solid #ccc; cursor: pointer; font-size: 12px;">${isDarkMode ? '☀ Light' : '☾ Dark'}</button><div>http://AgencySMM.com</div>`;

  if (headings.length > 0) {
    content += `<div style="margin-top: 10px;"><strong>Headings:</strong></div>`;
    headings.forEach(h => {
      content += `<div style="font-size: 14px;">${h.tag}: ${h.text.slice(0, 50)}${h.text.length > 50 ? '...' : ''}</div>`;
    });
  }

  if (paragraphs.length > 0) {
    content += `<div style="margin-top: 10px;"><strong>Paragraphs:</strong></div>`;
    paragraphs.forEach(p => {
      content += `<div style="font-size: 14px;">${p.slice(0, 100)}${p.length > 100 ? '...' : ''}</div>`;
    });
  }

  if (lists.length > 0) {
    content += `<div style="margin-top: 10px;"><strong>Lists:</strong></div>`;
    lists.forEach((list, i) => {
      content += `<div style="font-size: 14px;">${list.type.toUpperCase()} ${i+1}:</div>`;
      list.items.forEach(item => {
        content += buildListTree(item);
      });
    });
  }

  if (images.length > 0) {
    content += `<div style="margin-top: 10px;"><strong>Images (${images.length}):</strong></div>`;
    content += `<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; width: 100%;">`;
    images.forEach(src => {
      content += `<img src="${src}" alt="Image" style="width: 100%; height: 60px; object-fit: cover; border-radius: 5px;">`;
    });
    content += `</div>`;
    content += `<button id="download-images-btn" style="margin-top: 10px; padding: 5px 10px; background-color: ${btnBg}; color: ${btnColor}; border: 1px solid #ccc; border-radius: 5px; cursor: pointer; pointer-events: auto;">Download All Images</button>`;
  }

  if (links.length > 0) {
    content += `<div style="margin-top: 10px;"><strong>Links:</strong></div>`;
    links.forEach(link => {
      content += `<div style="font-size: 14px;"><a href="${link.href}" target="_blank" title="${link.href}" style="color: ${linkColor};">${link.text.slice(0, 30)}${link.text.length > 30 ? '...' : ''}</a></div>`;
    });
  }

  if (buttons.length > 0) {
    content += `<div style="margin-top: 10px;"><strong>Buttons:</strong></div>`;
    buttons.forEach(btn => {
      content += `<div style="font-size: 14px;">${btn.slice(0, 20)}${btn.length > 20 ? '...' : ''}</div>`;
    });
  }

  if (otherText.length > 0) {
    content += `<div style="margin-top: 10px;"><strong>Other Text:</strong></div>`;
    otherText.forEach(text => {
      content += `<div style="font-size: 14px;">${text.slice(0, 100)}${text.length > 100 ? '...' : ''}</div>`;
    });
  }

  if (tables.length > 0) {
    content += `<div style="margin-top: 10px;"><strong>Tables:</strong></div>`;
    tables.forEach(table => {
      content += `<div style="font-size: 14px;">Table ${table.id}:</div>`;
      table.rows.forEach(row => {
        content += `<div style="font-size: 12px; margin-left: 10px;">${row.slice(0, 60)}${row.length > 60 ? '...' : ''}</div>`;
      });
    });
  }

  // Update the overlay
  overlay.innerHTML = content;

  // Add event listeners after setting innerHTML
  const downloadBtn = overlay.querySelector('#download-images-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({action: 'downloadImages', urls: images});
    });
  }

  const toggleBtn = overlay.querySelector('#mode-toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      isDarkMode = !isDarkMode;
      updateContent(overlay);
    });
  }
}
