window.addEventListener("message", event => {
    event.source === window && event.data === 'getBsvExport' && window.postMessage({'bsvExport': bsv.exportObject()}, "*");
});
