let addScript = scriptFile => {
    let script = document.createElement('script');
    script.setAttribute('src', chrome.extension.getURL(scriptFile));
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

window.addEventListener("message", event => {
    if (event.source === window && event.data)
        if (event.data === 'listenerReady')
            chrome.storage.local.get('activeRecording', result => {
                let injectMockData = result.activeRecording && result.activeRecording.recording;
                if (injectMockData)
                    window.postMessage({injectMockData}, '*');
                else
                    window.postMessage('noMockData', '*');
            });
        else if (event.data.bsvExport)
            getRecordingCallback(event.data.bsvExport);
});

addScript("bsvInject.js");
addScript("listenInject.js");
addScript("bsvConfigInject.js");

// todo if inserted scripts in order, should execut in order, and avoid listeners
// convert chrome.storage.local.get callback to promise
// replace all sintacnes of var that are not required