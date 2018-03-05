let forEach = (object, func) => {
    for (let i = 0; i < object.length; i++) {
        func.call(object, object[i]);
    }
};

window.addEventListener("message", event => {
    if (event.source === window && event.data)
        if (event.data.injectMockData) {
            let mockData = event.data.injectMockData;
            window.bsv.import(mockData.responseData);

            window.bsv.setReplayDelay(mockData.replayDelay);
            forEach(mockData.customReplayDelays, customReplayDelay => {
                window.bsv.setCustomReplayDelay(customReplayDelay.name, customReplayDelay.amount);
            });

            window.bsv.setModeReplay();

        } else if (event.data === 'noMockData') {
            window.bsv.setModeRecord();

        } else if (event.data === 'getBsvExport')
            window.postMessage({'bsvExport': bsv.exportObject()}, "*");
});

window.postMessage('listenerReady', '*');
