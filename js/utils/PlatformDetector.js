/**
 * PlatformDetector - Specialized class for detecting social media platforms from DOM elements
 * Handles the complex logic of identifying platforms from CSS classes, SVG content, and attributes
 */
export class PlatformDetector {
    constructor() {
        this.detectionStrategies = [
            this.detectByCssClasses.bind(this),
            this.detectBySvgContent.bind(this),
            this.detectByAriaAttributes.bind(this),
            this.detectByConservativeFallback.bind(this)
        ];
    }

    /**
     * Detect platform from a single icon element
     * @param {Element} iconElement - The icon element to analyze
     * @returns {string} Platform name or empty string if not detected
     */
    detectPlatform(iconElement) {
        if (!iconElement) return '';

        for (const strategy of this.detectionStrategies) {
            const platform = strategy(iconElement);
            if (platform) {
                return platform;
            }
        }

        return '';
    }

    /**
     * Detect platforms from multiple icon elements
     * @param {Element} container - Container element holding platform icons
     * @returns {Array<string>} Array of detected platform names
     */
    detectPlatforms(container) {
        if (!container) return [];

        const platformIcons = this.findPlatformIcons(container);
        const platforms = platformIcons
            .map(icon => this.detectPlatform(icon))
            .filter(platform => platform);

        return [...new Set(platforms)]; // Remove duplicates
    }

    /**
     * Infer platform from event label when no icons are found
     * @param {string} label - Event label text
     * @returns {Array<string>} Inferred platforms
     */
    inferPlatformFromLabel(label) {
        if (!label) return [];

        const lowerLabel = label.toLowerCase();

        if (this.containsKeywords(lowerLabel, ['email', 'mail'])) {
            return ['Email'];
        }

        if (this.containsKeywords(lowerLabel, ['blog'])) {
            return ['Blog'];
        }

        if (this.containsKeywords(lowerLabel, ['story'])) {
            return ['Instagram'];
        }

        return [];
    }

    /**
     * Find platform icon elements within a container
     * @param {Element} container - Container to search in
     * @returns {Array<Element>} Array of platform icon elements
     */
    findPlatformIcons(container) {
        const allPlatformElements = Array.from(
            container.querySelectorAll('[class*="Icon_platform"]')
        );

        // Filter out container elements, keep only actual platform icons
        return allPlatformElements.filter(el =>
            el.classList.contains('Icon_platformIcon__d7da4') &&
            !el.classList.contains('Icon_platformIconsContainer__d7da4')
        );
    }

    // Detection Strategies

    /**
     * Strategy 1: Detect by exact CSS class matches
     */
    detectByCssClasses(iconElement) {
        const classes = iconElement.className;

        if (classes.includes('Icon_facebook__d7da4')) return 'Facebook';
        if (classes.includes('Icon_instagram__d7da4')) return 'Instagram';
        if (classes.includes('Icon_youtube__d7da4')) return 'YouTube';
        if (classes.includes('Icon_x__d7da4') || classes.includes('Icon_twitter__d7da4')) return 'X';
        if (classes.includes('Icon_linkedin__d7da4')) return 'LinkedIn';

        return '';
    }

    /**
     * Strategy 2: Detect by SVG content patterns
     */
    detectBySvgContent(iconElement) {
        const svgElement = iconElement.querySelector('svg');
        if (!svgElement) return '';

        const svgContent = svgElement.outerHTML;

        // LinkedIn patterns (most distinctive)
        if (this.containsSvgPatterns(svgContent, [
            'M14.3921 4.77426',
            'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'
        ])) {
            return 'LinkedIn';
        }

        // Instagram patterns
        if (this.containsSvgPatterns(svgContent, [
            'M12.0833 1H3.91667C2.30608 1 1 2.30608 1 3.91667V12.0833C1 13.6939 2.30608 15 3.91667 15H12.0833',
            'M14.9808 7.9989'
        ])) {
            return 'Instagram';
        }

        // Facebook patterns
        if (svgContent.includes('M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z')) {
            return 'Facebook';
        }

        // YouTube patterns
        if (svgContent.includes('M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z')) {
            return 'YouTube';
        }

        // Twitter/X patterns
        if (svgContent.includes('M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z')) {
            return 'X';
        }

        return '';
    }

    /**
     * Strategy 3: Detect by aria-labels and attributes
     */
    detectByAriaAttributes(iconElement) {
        const ariaLabel = iconElement.getAttribute('aria-label') ||
                         iconElement.getAttribute('alt') ||
                         iconElement.getAttribute('title') || '';

        const lowerAriaLabel = ariaLabel.toLowerCase();

        if (lowerAriaLabel.includes('linkedin')) return 'LinkedIn';
        if (lowerAriaLabel.includes('facebook')) return 'Facebook';
        if (lowerAriaLabel.includes('instagram')) return 'Instagram';
        if (lowerAriaLabel.includes('youtube')) return 'YouTube';
        if (lowerAriaLabel.includes('twitter') || lowerAriaLabel.includes('x')) return 'X';

        return '';
    }

    /**
     * Strategy 4: Conservative fallback checks
     */
    detectByConservativeFallback(iconElement) {
        const classes = iconElement.className;

        // Only use these if very specific to avoid false positives
        if (classes.includes('linkedin') && !classes.includes('icon') && !classes.includes('social')) return 'LinkedIn';
        if (classes.includes('facebook') && !classes.includes('icon') && !classes.includes('social')) return 'Facebook';
        if (classes.includes('instagram') && !classes.includes('icon') && !classes.includes('social')) return 'Instagram';
        if (classes.includes('youtube') && !classes.includes('icon') && !classes.includes('social')) return 'YouTube';
        if (classes.includes('twitter') && !classes.includes('icon') && !classes.includes('social')) return 'X';

        return '';
    }

    // Helper methods

    /**
     * Check if text contains any of the specified keywords
     * @param {string} text - Text to search
     * @param {Array<string>} keywords - Keywords to look for
     * @returns {boolean} True if any keyword is found
     */
    containsKeywords(text, keywords) {
        return keywords.some(keyword => text.includes(keyword));
    }

    /**
     * Check if SVG content contains any of the specified patterns
     * @param {string} svgContent - SVG content to search
     * @param {Array<string>} patterns - Patterns to look for
     * @returns {boolean} True if any pattern is found
     */
    containsSvgPatterns(svgContent, patterns) {
        return patterns.some(pattern => svgContent.includes(pattern));
    }
}
