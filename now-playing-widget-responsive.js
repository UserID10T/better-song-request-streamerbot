/* Responsive text fitting for the stock Now Playing banner layout. */
(function () {
    'use strict';

    const MIN_TITLE_SIZE = 14;
    const MAX_TITLE_SIZE = 58;
    const MIN_AUTHOR_SIZE = 12;
    const MAX_AUTHOR_SIZE = 34;
    const observedCards = new WeakSet();
    const scheduledCards = new WeakSet();

    function fits(element) {
        return element.scrollHeight <= element.clientHeight + 1 &&
            element.scrollWidth <= element.clientWidth + 1;
    }

    function findLargestFittingSize(element, min, max) {
        if (!element || element.clientWidth < 2 || element.clientHeight < 2) return;

        const computed = getComputedStyle(element);
        let low = min;
        let high = max;
        let best = min;

        element.style.fontSize = max + 'px';
        if (fits(element)) {
            element.style.fontSize = max + 'px';
            return;
        }

        for (let i = 0; i < 9; i += 1) {
            const mid = (low + high) / 2;
            element.style.fontSize = mid + 'px';
            if (fits(element)) {
                best = mid;
                low = mid;
            } else {
                high = mid;
            }
        }

        element.style.fontSize = Math.max(min, Math.floor(best * 10) / 10) + 'px';
        element.dataset.responsiveWidgetFontSize = element.style.fontSize;
        void computed;
    }

    function fitCard(card) {
        if (!card || card.classList.contains('has-custom-layout')) return;

        const title = card.querySelector('.np-card-title');
        const author = card.querySelector('.np-card-author');

        if (title) {
            title.style.whiteSpace = 'normal';
            title.style.overflowWrap = 'anywhere';
            title.style.wordBreak = 'normal';
            findLargestFittingSize(title, MIN_TITLE_SIZE, MAX_TITLE_SIZE);
        }

        if (author) {
            author.style.whiteSpace = 'nowrap';
            author.style.overflow = 'hidden';
            author.style.textOverflow = 'ellipsis';
            findLargestFittingSize(author, MIN_AUTHOR_SIZE, MAX_AUTHOR_SIZE);
        }
    }

    function scheduleFit(card) {
        if (scheduledCards.has(card)) return;
        scheduledCards.add(card);
        requestAnimationFrame(function () {
            scheduledCards.delete(card);
            fitCard(card);
        });
    }

    function observeCard(card) {
        if (!card || observedCards.has(card)) return;
        observedCards.add(card);

        if ('ResizeObserver' in window) {
            const resizeObserver = new ResizeObserver(function () {
                scheduleFit(card);
            });
            resizeObserver.observe(card);
            const title = card.querySelector('.np-card-title');
            const author = card.querySelector('.np-card-author');
            if (title) resizeObserver.observe(title);
            if (author) resizeObserver.observe(author);
        }

        scheduleFit(card);
    }

    function scan() {
        document.querySelectorAll('body.now-playing-widget-page .now-playing-card').forEach(observeCard);
    }

    const mutationObserver = new MutationObserver(function () {
        scan();
    });

    function start() {
        scan();
        mutationObserver.observe(document.body, { childList: true, subtree: true });
        window.addEventListener('resize', scan, { passive: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
})();
