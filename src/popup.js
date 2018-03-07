Object.prototype.forEach = function (func) {
    for (let i = 0; i < this.length; i++) {
        func.call(this, this[i]);
    }
};

Object.prototype.map = function (func) {
    let map = [];
    for (let i = 0; i < this.length; i++) {
        map[i] = func.call(this, this[i]);
    }
    return map;
};

let getEl = id => document.getElementById(id);

let listEl;

let recordings;

let getCurrentRecording = () =>
    getBsvExport().then(bsvExport => ({
        replayDelay: 50,
        customReplayDelays: {},
        responseData: bsvExport
    }));

let getBsvExport = () =>
    new Promise(resolve => {
        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
            chrome.tabs.sendMessage(tabs[0].id, 'getBsvExport', bsvExport => {
                resolve(bsvExport);
            });
        });
    });

let readFile = file =>
    new Promise(resolve => {
        let fileReader = new FileReader();
        fileReader.onload = () => {
            resolve(fileReader.result);
        };
        fileReader.readAsText(file);
    });

let download = (fileName, json) => {
    let dataString = `data:text/json,${JSON.stringify(json)}`;
    let elem = document.createElement('a');
    elem.setAttribute('href', dataString);
    elem.setAttribute('download', fileName);
    elem.click();
    elem.remove();
};

let getStorage = name =>
    new Promise(resolve => {
        chrome.storage.local.get(name, result => {
            resolve(result);
        });
    });

let setStorage = (name, data) => {
    chrome.storage.local.set({[name]: data});
};

let getRecording = () =>
    getStorage('recordings');

let setRecording = recordings => {
    setStorage('recordings', recordings);
};

let getActive = () =>
    getStorage('activeRecording');

let setActive = recording => {
    setStorage('activeRecording', recording);
};

let refresh = () => {
    getActive().then(result => {
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
    getRecording().then(result => {
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

let documentContentLoaded = () =>
    new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', () => {
            resolve();
        });
    });

documentContentLoaded().then(() => {
    let recordingName = getEl('recordingName');
    listEl = getEl('list');

    getEl('save').addEventListener('click', () => {
        getCurrentRecording().then(recording => {
            recordings.push({
                name: recordingName.value,
                recording
            });
            setRecording(recordings);
            refresh();
        });
    });

    getEl('beginRecord').addEventListener('click', () => {
        setActive(null);
        refresh();
    });

    getEl('upload').addEventListener('click', () => {
        let fileReads = getEl('file').files.map(file =>
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

    getEl('clear').addEventListener('click', () => {
        recordings = [];
        setRecording(recordings);
        refresh();
    });

    refresh();
});

// todo - popup
// extract all items
// merge upload and file select buttons
// reload page on toggle record/replay mode and popup close

// todo - bsvConfigInjectjs
// local store and editable config
// filter matching urls