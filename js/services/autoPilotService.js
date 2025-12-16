/**
 * Auto Pilot Service - Manages automatic crawling and content extraction
 */
export class AutoPilotService {
    constructor(controller) {
        this.controller = controller;
    }

    /**
     * Auto Pilot: Automatically crawls all items to extract full details
     */
    async handleAutoPilot() {
        try {
            if (!this.controller.events || this.controller.events.length === 0) {
                this.controller.renderer.showMessage('No events to process. Please capture data first.', 'info');
                return;
            }

            await this.controller.updateActiveTab();

            // Filter events that have video or need extraction
            const eventsToProcess = this.controller.events
                .map((event, index) => ({ event, index }))
                .filter(({ event }) => event.hasVideo || event.eventUrl);

            if (eventsToProcess.length === 0) {
                this.controller.renderer.showMessage('No events with video found', 'info');
                return;
            }

            this.controller.renderer.showMessage(`Starting Auto Pilot: Processing ${eventsToProcess.length} events...`, 'info');

            let processedCount = 0;
            let successCount = 0;
            let failCount = 0;

            // Process each event sequentially
            const processNext = async () => {
                if (processedCount >= eventsToProcess.length) {
                    // All done
                    this.controller.renderer.showMessage(
                        `Auto Pilot Complete! Processed: ${processedCount}, Success: ${successCount}, Failed: ${failCount}`,
                        'success'
                    );

                    // Refresh the grid view with updated data
                    const data = { events: this.controller.events };
                    this.controller.renderer.renderDataGrid(data);
                    return;
                }

                const { event, index } = eventsToProcess[processedCount];
                processedCount++;

                this.controller.renderer.showMessage(
                    `Processing ${processedCount}/${eventsToProcess.length}: ${event.label || 'Untitled'}`,
                    'info'
                );

                try {
                    // Execute script to navigate and extract
                    const results = await chrome.scripting.executeScript({
                        target: { tabId: this.controller.tabId },
                        func: async (eventUrl) => {
                            // Helper to wait
                            const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

                            // Find the event card by URL
                            const eventContainers = Array.from(document.querySelectorAll('[class*="CalendarEventCard_eventContainer"]'))
                                .filter(el => el.offsetWidth > 0 && el.offsetHeight > 0);

                            // Find the matching container
                            let targetContainer = null;
                            for (const container of eventContainers) {
                                const linkEl = container.closest('a') || container.querySelector('a');
                                if (linkEl && linkEl.href === eventUrl) {
                                    targetContainer = container;
                                    break;
                                }
                            }

                            if (!targetContainer) {
                                throw new Error('Event card not found');
                            }

                            // Click to open detail view
                            const linkEl = targetContainer.closest('a') || targetContainer.querySelector('a');
                            if (linkEl) {
                                linkEl.click();
                            } else {
                                targetContainer.click();
                            }

                            // Wait for detail view to load
                            await wait(2500);

                            // Extract video from detail view
                            const videoEl = document.querySelector('video');
                            const videoSrc = videoEl?.src || videoEl?.querySelector('source')?.src || null;

                            // Extract image if no video
                            const imgEl = document.querySelector('[class*="DetailView"] img, [class*="Modal"] img');
                            const imageSrc = imgEl?.src || null;

                            // Extract full description
                            const descEl = document.querySelector('[class*="DetailView"] [class*="description"], [class*="Modal"] [class*="description"]');
                            const fullDescription = descEl?.textContent?.trim() || '';

                            // Close the detail view
                            const closeBtn = document.querySelector('[class*="Modal"] button[class*="close"], [class*="DetailView"] button[class*="close"]');
                            if (closeBtn) {
                                closeBtn.click();
                                await wait(500);
                            } else {
                                // Try pressing Escape
                                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27 }));
                                await wait(500);
                            }

                            return {
                                videoSrc,
                                imageSrc,
                                fullDescription,
                                extracted: true
                            };
                        },
                        args: [event.eventUrl],
                        world: 'MAIN'
                    });

                    const extractedData = results[0].result;

                    // Update event with extracted data
                    if (extractedData.videoSrc) {
                        this.controller.events[index].videoSrc = extractedData.videoSrc;
                    }
                    if (extractedData.imageSrc && !this.controller.events[index].imageSrc) {
                        this.controller.events[index].imageSrc = extractedData.imageSrc;
                    }
                    if (extractedData.fullDescription) {
                        this.controller.events[index].fullDescription = extractedData.fullDescription;
                    }

                    successCount++;

                } catch (error) {
                    console.error(`Failed to process event ${index}:`, error);
                    failCount++;
                }

                // Wait a bit before processing next
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Process next event
                await processNext();
            };

            // Start processing
            await processNext();

        } catch (error) {
            console.error('Auto Pilot failed:', error);
            this.controller.renderer.showMessage('Auto Pilot failed: ' + error.message, 'error');
        }
    }

    /**
     * Legacy alias for handleAutoPilot
     */
    handleExtractAllDetails() {
        return this.handleAutoPilot();
    }
}
