Object.prototype.forEach = function(func) {
    for (var i = 0; i < this.length; i++) {
		func.call(this, this[i]);
    }
};

Object.prototype.map = function(func) {
    let map = [];
    for (var i = 0; i < this.length; i++) {
		map[i] = func.call(this, this[i]);
    }
    return map;
};

let nameEl;
let saveEl;
let fileEl;
let uploadEl;
let listEl;
let clearEl;

let recordings = [];

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

let save = recordings => {
    chrome.storage.local.set({'recordings': recordings});
};

let load = callback => {
    chrome.storage.local.get('recordings', callback);
};

let refresh = () => {
    while (listEl.firstChild) {
        listEl.removeChild(listEl.firstChild);
    }
    load(result => {
        recordings = result.recordings;
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
    removeEl.addEventListener('click', () => {
        recordings.splice(index, 1);
        save(recordings);
        refresh();
    });
    extractEl.addEventListener('click', () => {
        let recording = recordings[index];
        download(`${recording.name}.json`, recording.recording);
    });
    return itemEl;
};

document.addEventListener('DOMContentLoaded', function() {
    nameEl = getEl('name');
    saveEl = getEl('save');
    fileEl = getEl('file');
    uploadEl = getEl('upload');
    listEl = getEl('list');
    clearEl = getEl('clear');

    refresh();

    saveEl.addEventListener('click', () => {
        getCurrentRecording().then(recording => {
            recordings.push({
                name: nameEl.value,
                recording
            });
            save(recordings);
            refresh();
        });
    });

    uploadEl.addEventListener('click', () => {
        let fileReads = fileEl.files.map(file =>
            return readFile(file).then(fileContent => {
                recordings.push({
                    name: file.name.replace(/\.[\w]+$/, ''),
                    recording: JSON.parse(fileContent)
                });
            });
        );

        Promise.all(fileReads).then(() => {
            save(recordings);
            refresh();
        });
    });

    clearEl.addEventListener('click', () => {
        recordings = [];
        save(recordings);
        refresh();
    });
});
