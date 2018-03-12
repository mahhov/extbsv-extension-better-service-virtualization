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

let downloadRecording = recording => {
    download(`${recording.name}.json`, recording.recording)
};

let getStorage = name =>
    new Promise(resolve => {
        chrome.storage.local.get(name, result => {
            resolve(result);
        });
    });

let setStorage = (name, value) => {
    chrome.storage.local.set({[name]: value});
};

let getRecordings = () =>
    getStorage('recordings');

let setRecordings = recordings => {
    setStorage('recordings', recordings);
};

let getActive = () =>
    getStorage('activeRecording');

let setActive = recording => {
    setStorage('activeRecording', recording);
};

let setConfig = config => {
    setStorage('config', config);
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
    getRecordings().then(result => {
        recordings = result.recordings || [];
        recordings.forEach((recording, index) => {
            itemEl = createItemEl(recording.name, index);
            listEl.appendChild(itemEl);
        });
    });
};

let refreshPage = () => {
    chrome.tabs.executeScript({code: 'window.location.reload();'});
    window.close();
};

let createItemEl = (name, index) => {
    let itemEl = document.createElement('div');
    let nameEl = document.createElement('button');
    nameEl.innerHTML = name;
    nameEl.style = 'width:80px;';
    let removeEl = document.createElement('button');
    removeEl.innerHTML = 'X';
    let extractEl = document.createElement('button');
    extractEl.innerHTML = '&#8681;';
    itemEl.appendChild(nameEl);
    itemEl.appendChild(removeEl);
    itemEl.appendChild(extractEl);
    nameEl.addEventListener('click', () => {
        setActive(recordings[index]);
        refreshPage();
    });
    removeEl.addEventListener('click', () => {
        recordings.splice(index, 1);
        setRecordings(recordings);
        refresh();
    });
    extractEl.addEventListener('click', () => {
        downloadRecording(recordings[index]);
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
            setRecordings(recordings);
            refresh();
        });
    });

    getEl('beginRecord').addEventListener('click', () => {
        setActive(null);
        refreshPage();
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
            setRecordings(recordings);
            refresh();
        });
    });

    getEl('clear').addEventListener('click', () => {
        recordings = [];
        setRecordings(recordings);
        refresh();
    });

    getEl('extractAll').addEventListener('click', () => {
        recordings.forEach(downloadRecording);
    });

    getEl('configUpload').addEventListener('click', () => {
        let file = getEl('configFile').files[0];
        file && readFile(file).then(fileContent => {
            setConfig(fileContent);
            refreshPage();
        });
    });

    refresh();
});

// todo
// reorganize method order in popup.js
// filter matching urls
// renaming and reordering records
// local store and editable config
