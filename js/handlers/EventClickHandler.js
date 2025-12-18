import { ErrorMessages } from '../constants/ErrorMessages.js';
import { WorkflowConfig } from '../constants/WorkflowConfig.js';

/**
 * EventClickHandler - Handles event card click interactions and navigation
 * Manages clicking event cards, opening URLs, and related UI interactions
 */
export class EventClickHandler {
    constructor(controller) {
        this.controller = controller;
    }

    /**
     * Handle clicking an event card to show details or open content
     * @param {number} index - Index of the event in the events array
     * @returns {Promise<void>}
     */
    async handleEventClick(index) {
        try {
            const event = this.controller.events[index];
            if (!event) {
                this.controller.renderer.showMessage('Event not found', 'error');
                return;
            }

            await this.controller.updateActiveTab();

            // Attempt to click the web element
            const clickResult = await this.clickWebElement(event);

            if (clickResult.success) {
                this.controller.renderer.showMessage('Event selected in web...', 'info');
            } else {
                console.warn('Failed to click web element:', clickResult.error);
            }

            // Note: Detail view opening disabled - only checkbox selection and web interaction

        } catch (error) {
            console.error('Event click failed:', error);
            this.controller.renderer.showMessage(
                ErrorMessages.EVENT_CLICK_FAILED + ': ' + error.message,
                'error'
            );
        }
    }

    /**
     * Click the corresponding web element for the event
     * @param {Object} event - Event data object
     * @returns {Promise<Object>} Click result with success status
     */
    async clickWebElement(event) {
        const results = await chrome.scripting.executeScript({
            target: { tabId: this.controller.tabId },
            func: (cardIndex) => {
                // Find the event card by index
                const containers = Array.from(document.querySelectorAll('[class*="CalendarEventCard_eventContainer"]'))
                    .filter(el => el.offsetWidth > 0 && el.offsetHeight > 0);

                const targetContainer = containers[cardIndex - 1];
                if (!targetContainer) {
                    return { success: false, error: 'Card not found at index ' + cardIndex };
                }

                // Scroll element into view first
                targetContainer.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'center'
                });

                // Check the checkbox for this event on the web page
                const checkbox = targetContainer.querySelector('input[type="checkbox"]');
                const labelElement = targetContainer.querySelector('label');
                if (checkbox && !checkbox.checked && labelElement) {
                    labelElement.click();
                }

                // Wait for scroll and checkbox interaction to complete
                setTimeout(() => {
                    // Execute multiple click strategies sequentially
                    this.executeClickStrategies(targetContainer);
                }, WorkflowConfig.DELAYS.SCROLL_AND_CLICK);

                return { success: true };
            },
            args: [event.cardIndex],
            world: 'MAIN'
        });

        return results[0].result;
    }

    /**
     * Execute multiple click strategies on a target container
     * @param {Element} targetContainer - The container element to click
     */
    executeClickStrategies(targetContainer) {
        const strategies = this.buildClickStrategies(targetContainer);

        // Execute all strategies with small delays between them
        strategies.forEach((strategy, index) => {
            setTimeout(() => {
                try {
                    strategy();
                } catch (error) {
                    console.warn(`Strategy ${index + 1} failed:`, error);
                }
            }, index * WorkflowConfig.DELAYS.CLICK_STRATEGY_DELAY);
        });
    }

    /**
     * Build an array of click strategies to try
     * @param {Element} targetContainer - The target container element
     * @returns {Array<Function>} Array of click strategy functions
     */
    buildClickStrategies(targetContainer) {
        const strategies = [];

        // Strategy 1: Click the play button overlay directly
        const playButton = targetContainer.querySelector('.CalendarEventCard_playButtonOverlay__335fa');
        if (playButton) {
            strategies.push(() => playButton.click());
        }

        // Strategy 2: Click the image container
        const imageContainer = targetContainer.querySelector('.CalendarEventCard_eventImage__335fa');
        if (imageContainer) {
            strategies.push(() => imageContainer.click());
        }

        // Strategy 3: Click the actual img element
        const imgElement = targetContainer.querySelector('img');
        if (imgElement) {
            strategies.push(() => imgElement.click());
        }

        // Strategy 4: React internal handlers on the play button
        if (playButton && playButton._reactInternalInstance) {
            strategies.push(() => {
                try {
                    const internalInstance = playButton._reactInternalInstance;
                    if (internalInstance && internalInstance.pendingProps && internalInstance.pendingProps.onClick) {
                        internalInstance.pendingProps.onClick();
                        return true;
                    }
                } catch (e) {
                    // React internal access failed
                }
                return false;
            });
        }

        // Strategy 5: React internal handlers on the image container
        if (imageContainer && imageContainer._reactInternalInstance) {
            strategies.push(() => {
                try {
                    const internalInstance = imageContainer._reactInternalInstance;
                    if (internalInstance && internalInstance.pendingProps && internalInstance.pendingProps.onClick) {
                        internalInstance.pendingProps.onClick();
                        return true;
                    }
                } catch (e) {
                    // React internal access failed
                }
                return false;
            });
        }

        // Strategy 6: Call onclick handlers directly
        const linkEl = targetContainer.closest('a') || targetContainer.querySelector('a');
        if (linkEl && linkEl.onclick) {
            strategies.push(() => linkEl.onclick());
        } else if (targetContainer.onclick) {
            strategies.push(() => targetContainer.onclick());
        }

        // Strategy 7: Programmatic navigation
        if (linkEl?.href) {
            strategies.push(() => {
                window.location.href = linkEl.href;
                return true;
            });
        }

        // Strategy 8: Mouse event sequence (mousedown -> mouseup -> click)
        strategies.push(() => {
            const rect = targetContainer.getBoundingClientRect();
            const mouseDownEvent = new MouseEvent('mousedown', {
                bubbles: true, cancelable: true, view: window,
                clientX: rect.left + rect.width / 2,
                clientY: rect.top + rect.height / 2,
                button: 0, buttons: 1
            });
            const mouseUpEvent = new MouseEvent('mouseup', {
                bubbles: true, cancelable: true, view: window,
                clientX: rect.left + rect.width / 2,
                clientY: rect.top + rect.height / 2,
                button: 0, buttons: 1
            });
            const clickEvent = new MouseEvent('click', {
                bubbles: true, cancelable: true, view: window,
                clientX: rect.left + rect.width / 2,
                clientY: rect.top + rect.height / 2,
                button: 0, buttons: 1
            });
            targetContainer.dispatchEvent(mouseDownEvent);
            targetContainer.dispatchEvent(mouseUpEvent);
            targetContainer.dispatchEvent(clickEvent);
            return true;
        });

        // Strategy 9: Keyboard Enter
        strategies.push(() => {
            targetContainer.focus();
            targetContainer.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, cancelable: true
            }));
            return true;
        });

        // Strategy 10: Double click
        strategies.push(() => {
            targetContainer.dispatchEvent(new MouseEvent('dblclick', {
                bubbles: true, cancelable: true, view: window
            }));
            return true;
        });

        // Strategy 11: Space key
        strategies.push(() => {
            targetContainer.dispatchEvent(new KeyboardEvent('keydown', {
                key: ' ', code: 'Space', keyCode: 32, bubbles: true, cancelable: true
            }));
            return true;
        });

        // Strategy 12: Basic click as final fallback
        strategies.push(() => {
            targetContainer.click();
            return true;
        });

        return strategies;
    }

    /**
     * Handle back button to return to grid view
     */
    handleBack() {
        const data = { events: this.controller.events };
        this.controller.renderer.renderDataGrid(data);
    }

    /**
     * Handle back to main button to return to main screen
     */
    handleBackToMain() {
        this.controller.renderer.renderLoadingState();
    }

    /**
     * Open event card in new tab
     * @param {Object} eventData - Event data object
     */
    handleTestOpenCard(eventData) {
        if (eventData && eventData.eventUrl) {
            chrome.tabs.create({ url: eventData.eventUrl });
        }
    }

    /**
     * Open multiple event URLs in background tabs
     * @param {Array} eventUrls - Array of event URLs to open
     */
    handleOpenReels(eventUrls) {
        const validUrls = eventUrls.filter(url => url);

        validUrls.forEach(url => {
            chrome.tabs.create({ url, active: false });
        });

        this.controller.renderer.showMessage(
            ErrorMessages.REEL_OPEN_SUCCESS(validUrls.length),
            'success'
        );
    }
}
