let nameEl;
let saveEl;
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
        copy(recordings[index]);
    });
    return itemEl;
};

document.addEventListener('DOMContentLoaded', function() {
    nameEl = getEl('name');
    saveEl = getEl('save');
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

    clearEl.addEventListener('click', () => {
        recordings = [];
        save(recordings);
        refresh();
    });
});
