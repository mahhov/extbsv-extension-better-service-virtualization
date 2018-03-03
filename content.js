let getRecordingCallback;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request === 'getBsvExport') {
        getRecordingCallback = sendResponse;
        window.postMessage('getBsvExport', '*');
        return true;
    }
});

window.addEventListener("message", event => {
    event.source === window && event.data && event.data.bsvExport && getRecordingCallback(event.data.bsvExport);
});

let addScript = scriptFile => {
    var body = document.getElementsByTagName('body')[0];
    var script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', chrome.extension.getURL(scriptFile));
    body.appendChild(script);
}

addScript("listenInject.js");
addScript("bsvInject.js");
addScript("bsvConfigInject.js");
