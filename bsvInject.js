let bsv = {};

let modes = {'IGNORE': 0, 'RECORD': 1, 'REPLAY': 2};
let modeResolve;
let modePromise = new Promise(resolve => {
    modeResolve = resolve
});
let replayDelay;
let customReplayDelays = {};
let recordings = {};
let replayHistory = {};

bsv.setModeIgnore = () => {
    modeResolve(modes.IGNORE);
};

bsv.setModeRecord = () => {
    modeResolve(modes.RECORD);
};

bsv.setModeReplay = () => {
    modeResolve(modes.REPLAY);
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

bsv.exportObject = () => recordings;

bsv.exportString = () => JSON.stringify(recordings);

bsv.exportFile = fileName => {
    let dataString = `data:text/json,${JSON.stringify(recordings)}`;
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
    let oldMethod = object[method];

    object[method] = function () {
        return modePromise.then(mode => {
            if (mode === modes.RECORD)
                return recordPromise(name, oldMethod, this, ...arguments);
            else if (mode === modes.REPLAY)
                return replayPromise(name, oldMethod);
            else
                return oldMethod.call(this, ...arguments);
        });
    };
};

let recordPromise = (name, oldMethod, that, argumentList) => {
    if (!recordings[name])
        recordings[name] = [];

    let response = oldMethod.call(that, argumentList);
    let recordArguments = _.map(argumentList, argument => argument);
    response.then(resolution => {
        recordings[name].push({'arguments': recordArguments, 'resolution': resolution, 'resolved': true});
    }).catch(rejection => {
        recordings[name].push({'arguments': recordArguments, 'rejection': rejection});
    });
    return response;
};

let replayPromise = (name, oldMethod) => {
    if (!recordings || !recordings[name] || !recordings[name].length) {
        warning404(name);
        return new Promise();
    }

    if (!replayHistory[name])
        replayHistory[name] = 0;

    let index = replayHistory[name];
    replayHistory[name] < recordings[name].length - 1 && replayHistory[name]++;
    let recording = recordings[name][index];
    let delay = customReplayDelays[name] || replayDelay;
    console.log('invoking', name, 'with', delay, 'delay');

    if (!delay)
        return recording.resolved ? recording.resolution : Promise.reject(recording.rejection);
    else
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                recording.resolved ? resolve(recording.resolution) : reject(recording.rejection);
            }, delay);
        });
};

bsv.registerField = (name, object, field) => {
    modePromise.then(mode => {
        if (mode === modes.RECORD)
            recordField(name, object, field);
        else if (mode === modes.REPLAY)
            replayField(name, object, field);
    });
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
