let addScript = scriptFile => {
    let script = document.createElement('script');
    script.setAttribute('src', chrome.extension.getURL(scriptFile));
    script.type = 'module';
    document.documentElement.appendChild(script);
};

let getRecordingCallback;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request === 'getBsvExport') {
        getRecordingCallback = sendResponse;
        window.postMessage('getBsvExport', '*');
        return true;
    }
});

let getStorage = name =>
    new Promise(resolve => {
        chrome.storage.local.get(name, storage => {
            resolve(storage[name]);
        });
    });

window.addEventListener('message', event => {
    if (event.source === window && event.data)
        if (event.data === 'listenerReady')
            Promise.all([getStorage('disabled'), getStorage('config'), getStorage('activeRecording')]).then(([disabled, config, activeRecording]) => {
                if (!disabled) {
                    let mockData = activeRecording && activeRecording.recording;
                    window.postMessage({setBsv: true, config: config.run, mockData}, '*');
                }
            });

        else if (event.data.bsvExport)
            getRecordingCallback(event.data.bsvExport);
});

addScript('inject.js');
