window.requestIdleCallback = window.requestIdleCallback || function(callback, options) {
    const start = Date.now();

    return setTimeout(() => {
        callback({
            didTimeout: false,
            timeRemaining: function() {
                return Math.max(0, 50 - (Date.now() - start))
            }
        })
    }, 1)
}

window.cancelIdleCallback = function(id) {
    clearTimeout(id);
}