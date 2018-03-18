// UTILITY

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

let recordings;

// IMPORTING AN EXPORTING DATA

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

let download = (fileName, content) => {
    let blob = new Blob([content], {type: 'application/json'});
    let url = URL.createObjectURL(blob);
    chrome.downloads.download({url, filename: fileName});
};

let downloadRecording = recording => {
    let content = JSON.stringify(recording.recording, null, 2);
    download(`${recording.name}.json`, content)
};

let downloadConfig = () => {
    getConfig().then(config => {
        download(config.name, config.run);
    });
};

// STORAGE

let getStorage = name =>
    new Promise(resolve => {
        chrome.storage.local.get(name, storage => {
            resolve(storage[name]);
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

let getDisabled = () =>
    getStorage('disabled');

let setDisabled = value => {
    setStorage('disabled', value);
};

let getConfig = () =>
    getStorage('config');

let setConfig = config => {
    setStorage('config', config);
};

// INIT

let refresh = () => {
    getDisabled().then(value => {
        if (value) {
            getEl('recordingControls').hidden = true;
            getEl('disable').hidden = true;
        } else {
            getEl('enable').hidden = true;
        }
    });

    let listEl = getEl('list');

    while (listEl.firstChild)
        listEl.removeChild(listEl.firstChild);

    Promise.all([getRecordings(), getActive()]).then(([getRecordings, activeRecording]) => {
        if (activeRecording) {
            getEl('recordSection').hidden = true;
            getEl('replaySection').hidden = false;
            getEl('replayName').innerHTML = activeRecording.name;
        } else {
            getEl('replaySection').hidden = true;
            getEl('recordSection').hidden = false;
        }

        recordings = getRecordings || [];
        recordings.forEach((recording, index) => {
            recording.index = index;
            let selected = activeRecording && index === activeRecording.index;
            itemEl = createItemEl(recording.name, index, selected);
            listEl.appendChild(itemEl);
        });
    });

    getConfig().then(config => {
        if (config && config.name) {
            getEl('configName').innerHTML = config.name;
            getEl('configWarning').hidden = true;
        } else
            getEl('currentConfig').hidden = true;
    });
};

let refreshPage = () => {
    chrome.tabs.executeScript({code: 'window.location.reload();'});
    window.close();
};

let createItemEl = (name, index, selected) => {
    let itemEl = document.createElement('div');

    let nameEl = document.createElement('button');
    nameEl.innerHTML = name;
    nameEl.classList.add('recording-item-name');
    selected && nameEl.classList.add('selected');

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

// CONTROLLER

let documentContentLoaded = () =>
    new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', () => {
            resolve();
        });
    });

documentContentLoaded().then(() => {
    let recordingName = getEl('recordingName');

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
            setConfig({run: fileContent, name: file.name});
            refreshPage();
        });
    });

    getEl('configDownload').addEventListener('click', () => {
        downloadConfig();
    });

    getEl('disable').addEventListener('click', () => {
        setDisabled(true);
        refreshPage();
    });

    getEl('enable').addEventListener('click', () => {
        setDisabled(false);
        refreshPage();
    });

    refresh();
});

// todo
// filter matching urls
// renaming and reordering records
// local store and editable config
// see if we're using chrome.tabs correctly
// support switching between multiple configs