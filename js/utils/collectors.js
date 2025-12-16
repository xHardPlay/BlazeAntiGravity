// Helper function to check if element is visible on screen
export function isElementVisible(el) {
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none';
}

// Collect headings
export function collectHeadings() {
  const headings = [];
  for (let i = 1; i <= 6; i++) {
    Array.from(document.querySelectorAll(`h${i}`)).filter(isElementVisible).forEach(h => {
      const text = h.textContent.trim();
      if (text.length > 0) headings.push({ tag: `H${i}`, text });
    });
  }
  return headings.slice(0, 10);
}

// Collect paragraphs
export function collectParagraphs() {
  return Array.from(document.querySelectorAll('p')).filter(isElementVisible).map(p => p.textContent.trim()).filter(p => p.length > 0).slice(0, 10);
}

// Helper to get direct text content of an element (excluding nested elements)
function getDirectTextContent(element) {
  let text = '';
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent;
    }
  }
  return text.trim();
}

// Helper to collect detailed list items with text and images preserved in order
export function collectListItems(list, depth = 0, maxDepth = 2) {
  if (depth > maxDepth) return [];
  
  return Array.from(list.children).filter(child => child.tagName === 'LI').map(li => {
    // Get all content in order
    const content = [];
    
    // Process child nodes in order
    for (const node of li.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text.length > 0) {
          content.push({ type: 'text', value: text });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        
        // Handle images
        if (tagName === 'img' && node.offsetWidth > 50 && node.offsetHeight > 50) {
          content.push({ type: 'image', value: node.src, alt: node.alt || '' });
        }
        // Handle links with text or images
        else if (tagName === 'a') {
          const linkText = getDirectTextContent(node);
          if (linkText.length > 0) {
            content.push({ type: 'link', text: linkText, href: node.href });
          }
          // Check for images inside links
          const img = node.querySelector('img');
          if (img && img.offsetWidth > 50 && img.offsetHeight > 50) {
            content.push({ type: 'image', value: img.src, alt: img.alt || '' });
          }
        }
        // Handle nested lists (don't process their content here)
        else if (tagName === 'ul' || tagName === 'ol') {
          // Skip - will be handled recursively below
        }
        // Handle other elements with text
        else if (!['ul', 'ol'].includes(tagName)) {
          const text = node.textContent.trim();
          if (text.length > 0 && !node.querySelector('ul, ol')) {
            content.push({ type: 'text', value: text });
          }
        }
      }
    }
    
    // Get nested lists
    const subLists = Array.from(li.children).filter(child => 
      child.tagName === 'UL' || child.tagName === 'OL'
    );
    const subItems = subLists.flatMap(sub => collectListItems(sub, depth + 1, maxDepth));
    
    // Only return if we have content
    if (content.length === 0 && subItems.length === 0) return null;
    
    return { 
      content, 
      subItems: subItems.filter(Boolean), 
      depth 
    };
  }).filter(Boolean);
}

// Collect lists with tree structure and detailed content
export function collectLists() {
  return Array.from(document.querySelectorAll('ul, ol')).filter(isElementVisible).map((list, index) => {
    const items = collectListItems(list).slice(0, 10); // Increased limit per list
    return { type: list.tagName.toLowerCase(), items };
  }).filter(list => list.items.length > 0).slice(0, 5); // Increased to 5 lists
}

// Collect videos with context
export function collectVideos() {
  return Array.from(document.querySelectorAll('video')).filter(video => {
    return video.offsetWidth > 50 && video.offsetHeight > 50 && video.src && isElementVisible(video);
  }).map(video => {
    // Try to find surrounding context
    let context = '';

    // Check parent element for text
    const parent = video.parentElement;
    if (parent) {
      const directText = getDirectTextContent(parent);
      if (directText.length > 0) {
        context = directText;
      } else {
        // Look for sibling text nodes
        let sibling = video.previousSibling;
        while (sibling && !context) {
          if (sibling.nodeType === Node.TEXT_NODE) {
            context = sibling.textContent.trim();
          } else if (sibling.nodeType === Node.ELEMENT_NODE) {
            context = sibling.textContent.trim();
          }
          sibling = sibling.previousSibling;
        }
      }
    }

    return {
      src: video.src,
      type: video.getAttribute('type') || '',
      context: context.substring(0, 100) // Limit context to 100 chars
    };
  }).slice(0, 12);
}

// Collect images with context (surrounding text)
export function collectImages() {
  return Array.from(document.querySelectorAll('img')).filter(img => {
    return img.offsetWidth > 50 && img.offsetHeight > 50 && !img.src.startsWith('data:') && isElementVisible(img);
  }).map(img => {
    // Try to find surrounding context
    let context = '';

    // Check parent element for text
    const parent = img.parentElement;
    if (parent) {
      const directText = getDirectTextContent(parent);
      if (directText.length > 0) {
        context = directText;
      } else {
        // Look for sibling text nodes
        let sibling = img.previousSibling;
        while (sibling && !context) {
          if (sibling.nodeType === Node.TEXT_NODE) {
            context = sibling.textContent.trim();
          } else if (sibling.nodeType === Node.ELEMENT_NODE) {
            context = sibling.textContent.trim();
          }
          sibling = sibling.previousSibling;
        }
      }
    }

    return {
      src: img.src,
      alt: img.alt || '',
      context: context.substring(0, 100) // Limit context to 100 chars
    };
  }).slice(0, 12);
}

// Collect links
export function collectLinks() {
  return Array.from(document.querySelectorAll('a')).filter(isElementVisible).map(a => ({
    text: a.textContent.trim(),
    href: a.href
  })).filter(link => link.text.length > 0).slice(0, 10);
}

// Collect buttons
export function collectButtons() {
  return Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]')).filter(isElementVisible).map(btn => btn.value || btn.textContent.trim()).filter(btn => btn.length > 0).slice(0, 5);
}

// Collect TruncatedText elements (specific to your app)
export function collectTruncatedText() {
  return Array.from(document.querySelectorAll('[class*="TruncatedText"]')).filter(isElementVisible).map(el => ({
    text: el.textContent.trim(),
    className: el.className
  })).filter(item => item.text.length > 0).slice(0, 20);
}

// Collect other text elements
export function collectOtherText() {
  return Array.from(document.querySelectorAll('div, span, section, article, pre')).filter(el => {
    const text = el.textContent.trim();
    // Exclude TruncatedText elements (handled separately) and elements with headings/paragraphs
    return text.length > 10 && isElementVisible(el) && !el.querySelector('p, h1, h2, h3, h4, h5, h6') && !el.className.includes('TruncatedText');
  }).map(el => el.textContent.trim()).slice(0, 5);
}

// Collect tables
export function collectTables() {
  return Array.from(document.querySelectorAll('table')).filter(isElementVisible).map((table, i) => {
    const rows = Array.from(table.querySelectorAll('tr')).slice(0, 3).map(tr => {
      return Array.from(tr.querySelectorAll('td, th')).map(cell => cell.textContent.trim()).join(' | ');
    }).filter(row => row.trim().length > 0);
    return { id: i + 1, rows };
  }).filter(table => table.rows.length > 0).slice(0, 2);
}
