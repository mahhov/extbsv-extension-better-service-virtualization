Object.prototype.forEach = function (func) {
    for (var i = 0; i < this.length; i++) {
        func.call(this, this[i]);
    }
};

Object.prototype.map = function (func) {
    let map = [];
    for (var i = 0; i < this.length; i++) {
        map[i] = func.call(this, this[i]);
    }
    return map;
};

let listEl;

let recordings;

let getEl = id => document.getElementById(id);

let getCurrentRecording = () => {
    return getBsvExport().then(bsvExport => ({
        replayDelay: 50,
        customReplayDelays: {},
        responseData: bsvExport
    }));
};

let getBsvExport = () => {
    return new Promise(resolve => {
        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
            chrome.tabs.sendMessage(tabs[0].id, 'getBsvExport', bsvExport => {
                resolve(bsvExport);
            });
        });
    });
};

let readFile = file => {
    return new Promise(resolve => {
        let fileReader = new FileReader();
        fileReader.onload = () => {
            resolve(fileReader.result);
        };
        fileReader.readAsText(file);
    });
};

let download = (fileName, json) => {
    let dataString = `data:text/json,${JSON.stringify(json)}`;
    let elem = document.createElement('a');
    elem.setAttribute('href', dataString);
    elem.setAttribute('download', fileName);
    elem.click();
    elem.remove();
};

let setRecording = recordings => {
    chrome.storage.local.set({'recordings': recordings});
};

let getRecording = callback => {
    chrome.storage.local.get('recordings', callback);
};

let setActive = recording => {
    chrome.storage.local.set({'activeRecording': recording});
};

let getActive = callback => {
    chrome.storage.local.get('activeRecording', callback);
};

let refresh = () => {
    getActive(result => {
        if (result.activeRecording) {
            getEl('recordSection').hidden = true;
            getEl('replaySection').hidden = false;
            getEl('replayName').innerHTML = result.activeRecording.name;
        } else {
            getEl('replaySection').hidden = true;
            getEl('recordSection').hidden = false;
        }
    });

    while (listEl.firstChild) {
        listEl.removeChild(listEl.firstChild);
    }
    getRecording(result => {
        recordings = result.recordings || [];
        recordings.forEach((recording, index) => {
            itemEl = createItemEl(recording.name, index);
            listEl.appendChild(itemEl);
        });
    });
};

let createItemEl = (name, index) => {
    let itemEl = document.createElement('div');
    let nameEl = document.createElement('button');
    nameEl.innerHTML = name;
    nameEl.style = "width:80px;";
    let removeEl = document.createElement('button');
    removeEl.innerHTML = 'X';
    let extractEl = document.createElement('button');
    extractEl.innerHTML = '&#8681;';
    itemEl.appendChild(nameEl);
    itemEl.appendChild(removeEl);
    itemEl.appendChild(extractEl);
    nameEl.addEventListener('click', () => {
        setActive(recordings[index]);
        refresh();
    });
    removeEl.addEventListener('click', () => {
        recordings.splice(index, 1);
        setRecording(recordings);
        refresh();
    });
    extractEl.addEventListener('click', () => {
        let recording = recordings[index];
        download(`${recording.name}.json`, recording.recording);
    });
    return itemEl;
};

document.addEventListener('DOMContentLoaded', function () {
    let recordingName = getEl('name');
    let saveEl = getEl('save');
    let beginRecordEl = getEl('beginRecord');
    let fileEl = getEl('file');
    let uploadEl = getEl('upload');
    listEl = getEl('list');
    let clearEl = getEl('clear');

    saveEl.addEventListener('click', () => {
        getCurrentRecording().then(recording => {
            recordings.push({
                name: recordingName.value,
                recording
            });
            setRecording(recordings);
            refresh();
        });
    });

    beginRecordEl.addEventListener('click', () => {
        setActive(null);
        refresh();
    });

    uploadEl.addEventListener('click', () => {
        let fileReads = fileEl.files.map(file =>
            readFile(file).then(fileContent => {
                recordings.push({
                    name: file.name.replace(/\.[\w]+$/, ''),
                    recording: JSON.parse(fileContent)
                });
            }));

        Promise.all(fileReads).then(() => {
            setRecording(recordings);
            refresh();
        });
    });

    clearEl.addEventListener('click', () => {
        recordings = [];
        setRecording(recordings);
        refresh();
    });

    refresh();
});

// todo convert callbacks to promises
// extract all items
// merge upload and file select buttons
// reload page on toggle record/replay mode and popup close 