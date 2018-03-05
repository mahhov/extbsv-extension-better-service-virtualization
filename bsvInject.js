let bsv = {};

let modes = {'IGNORE': 0, 'RECORD': 1, 'REPLAY': 2};

let mode = modes.IGNORE;
let replayDelay;
let customReplayDelays = {};
let recordings = {};
let replayHistory = {};

bsv.setModeIgnore = () => {
    mode = modes.IGNORE;
};

bsv.setModeRecord = () => {
    mode = modes.RECORD;
};

bsv.setModeReplay = () => {
    mode = modes.REPLAY;
};

bsv.setReplayDelay = delay => {
    replayDelay = delay;
};

bsv.setCustomReplayDelay = (name, delay) => {
    customReplayDelays[name] = delay;
};

bsv.export = bsv.exportClipboard = () => {
    copy(recordings);
};

bsv.exportObject = () => {
    return recordings;
};

bsv.exportString = () => {
    return JSON.stringify(recordings);
};

bsv.exportFile = fileName => {
    let dataString = 'data:text/json,' + JSON.stringify(recordings);
    let elem = document.createElement('a');
    elem.setAttribute('href', dataString);
    elem.setAttribute('download', fileName);
    elem.click();
    elem.remove();
};

bsv.import = recordingsJson => {
    recordings = recordingsJson;
};

bsv.registerPromise = (name, object, method) => {
    if (mode === modes.RECORD)
        recordPromise(name, object, method);
    else if (mode === modes.REPLAY)
        replayPromise(name, object, method);
};

let recordPromise = (name, object, method) => {
    if (!recordings[name])
        recordings[name] = [];

    let oldMethod = object[method];

    object[method] = function () {
        let response = oldMethod.call(this, ...arguments);
        let recordArguments = _.map(arguments, argument => {
            return argument;
        });
        response.then(resolution => {
            recordings[name].push({'arguments': recordArguments, 'resolution': resolution, 'resolved': true});
        }).catch(rejection => {
            recordings[name].push({'arguments': recordArguments, 'rejection': rejection});
        });
        return response;
    };
};

let replayPromise = (name, object, method) => {
    if (!object) {
        warningNull(name);
        return;
    }

    if (!replayHistory[name])
        replayHistory[name] = 0;

    object[method] = () => {
        if (!recordings || !recordings[name]) {
            warning404(name);
            return Promise.reject();
        }

        let index = replayHistory[name];
        replayHistory[name] < recordings[name].length - 1 && replayHistory[name]++;
        let recording = recordings[name][index];
        if (!recording) {
            warning404(name, index);
            return Promise.reject();
        }

        let delay = customReplayDelays[name] || replayDelay;
        console.log('invoking', name, 'with', delay, 'delay');

        if (!delay)
            return recording.resolved ? Promise.resolve(recording.resolution) : Promise.reject(recording.rejection);
        else
            return recording.resolved ?
                new Promise(resolve => {
                    setTimeout(resolve, delay, recording.resolution);
                }) :
                new Promise((resolve, reject) => {
                    setTimeout(reject, delay, recording.rejection);
                });
    };
};

bsv.registerField = (name, object, field) => {
    if (mode === modes.RECORD)
        recordField(name, object, field);
    else if (mode === modes.REPLAY)
        replayField(name, object, field);
};

let recordField = (name, object, field) => {
    if (!recordings[name])
        recordings[name] = {};

    recordings[name][field] = object[field];
};

let replayField = (name, object, field) => {
    if (!object)
        warningNull(name);
    else if (!recordings || !recordings[name])
        warning404(name);
    else
        object[field] = recordings[name][field];
};

let warningNull = name => {
    warning('null object', name);
};

let warning404 = (name, details) => {
    warning('no recordings found for', name, details);
};

let warning = (message, name, details) => {
    console.error(message, name, details ? details : '');
};

window.bsv = bsv;

window.postMessage('bsvReady', '*');
