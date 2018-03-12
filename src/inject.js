let bsv = require('../node_modules/bsv-better-service-virtualization/src/index.js');

let forEach = (object, func) => {
    for (let i = 0; i < object.length; i++) {
        func.call(object, object[i]);
    }
};

let documentReadyInteractive = () =>
    new Promise(resolve => {
        document.onreadystatechange = () => {
            document.readyState === 'interactive' && resolve();
        };
    });

window.addEventListener('message', event => {
    if (event.source === window && event.data)
        if (event.data.setBsv) {
            documentReadyInteractive().then(() => {
                eval(event.data.config);
            });

            let mockData = event.data.mockData;
            if (mockData) {
                bsv.import(mockData.responseData);
                bsv.setReplayDelay(mockData.replayDelay);
                forEach(mockData.customReplayDelays, customReplayDelay => {
                    bsv.setCustomReplayDelay(customReplayDelay.name, customReplayDelay.amount);
                });
                bsv.setModeReplay();
            } else
                bsv.setModeRecord();

        } else if (event.data === 'getBsvExport')
            window.postMessage({'bsvExport': bsv.exportObject()}, '*');
});

window.postMessage('listenerReady', '*');
