/**
 * Space Trader — Transaction toast notifications
 */
(function () {
    'use strict';

    const TOAST_LIFETIME = 3200;
    const TOAST_STAGGER = 120;

    let container = null;
    let toastQueue = 0;

    function getContainer() {
        if (!container) {
            container = document.getElementById('toast-container');
        }
        return container;
    }

    function formatAmount(amount) {
        const sign = amount >= 0 ? '+' : '';
        const i18n = window.SpaceTraderI18n;
        const symbol = i18n ? i18n.CURRENCY : '₵';
        return sign + amount + ' ' + symbol;
    }

    function dismissToast(toast) {
        if (!toast || toast.classList.contains('toast-exit')) return;
        toast.classList.remove('toast-float');
        toast.classList.add('toast-exit');
        setTimeout(function () {
            toast.remove();
        }, 450);
    }

    function showToast(amount, options) {
        const root = getContainer();
        if (!root || !amount) return;

        const opts = options || {};
        const isGain = amount > 0;
        const toast = document.createElement('div');
        toast.className = 'transaction-toast toast-enter' + (isGain ? ' toast-gain' : ' toast-spend');
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');

        const amountEl = document.createElement('span');
        amountEl.className = 'toast-amount';
        amountEl.textContent = formatAmount(amount);

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'toast-close';
        closeBtn.setAttribute('aria-label', 'Close');
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', function () {
            dismissToast(toast);
        });

        toast.appendChild(amountEl);
        toast.appendChild(closeBtn);

        toast.style.animationDelay = (toastQueue * TOAST_STAGGER) + 'ms';
        toastQueue++;

        root.appendChild(toast);

        requestAnimationFrame(function () {
            toast.classList.add('toast-visible');
            setTimeout(function () {
                toast.classList.add('toast-float');
            }, 380);
        });

        const lifetime = opts.duration || TOAST_LIFETIME;
        setTimeout(function () {
            dismissToast(toast);
            toastQueue = Math.max(0, toastQueue - 1);
        }, lifetime + toastQueue * TOAST_STAGGER);
    }

    function showFromDataset(el) {
        if (!el) return;
        const amount = parseInt(el.dataset.flashTxAmount || '0', 10);
        if (!amount) return;
        showToast(amount);
        delete el.dataset.flashTxAmount;
    }

    window.SpaceTraderToasts = {
        show: showToast,
        showFromDataset: showFromDataset,
    };
})();
