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

let getActive = () =>
    new Promise(resolve => {
        chrome.storage.local.get('activeRecording', result => {
            resolve(result.activeRecording);
        });
    });

window.addEventListener("message", event => {
    if (event.source === window && event.data)
        if (event.data === 'listenerReady')
            getActive().then(activeRecording => {
                let injectMockData = activeRecording && activeRecording.recording;
                if (injectMockData)
                    window.postMessage({injectMockData}, '*');
                else
                    window.postMessage('noMockData', '*');
            });
        else if (event.data.bsvExport)
            getRecordingCallback(event.data.bsvExport);
});

addScript("browser/inject.js");
