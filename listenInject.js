window.addEventListener("message", event => {
    if (event.source === window && event.data)
        if (event.data.injectMockData) {
            window.mockData = event.data.injectMockData;
            window.postMessage('injectedMockData', "*");
        } else if (event.data === 'getBsvExport')
            window.postMessage({'bsvExport': bsv.exportObject()}, "*");
});

window.postMessage('listenerReady', '*');

console.log('listen inject  loaded')
