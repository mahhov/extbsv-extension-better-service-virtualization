# Better Service Virtualization Extension

## Setup

1. download chrome extension: https://chrome.google.com/webstore/detail/feodfapnkbdlhlcjeoijpcblmdlcmobm

2. download or create a `bsvConfig.js` file (see below for more details on config)

3. click on extension icon to open popup.

4. in the `manage config` section, click the choose file button and select the config downloaded from step 2

5. in the `manage config` section, click the `upload arrow`

## Usage

### recording and replaying

2 modes available: recording and replaying, which will be indicated at the top of the extension popup

when completed recording, type in a recording name and click `save`

to switch to replaying, click on one of the available recordings in the `recordings` section

to switch back to recording, click the `begin recording` button

to clear an individual recording, click the `X` button next to the recording in the `recordings` section

to clear all recordings, click the `clear` button in the `recordings` section

### sharing and editing

to download to share or edit recordings, click the `download arrow` next to the recording name you wish to share in the `recordings` section

to download all recordings, click the `download all arrow` in the `recordings` section

to upload shared or edited recordings, in the `upload recording` section, select the `.json` file and click the `upload arrow`

to download to share or edit config, click the `download arrow` in the`manage config` section

to upload shared or edited config, in the `manage config` section, select the `.json` file and click the `upload arrow`

## Config

The config file should register the methods and fields you want to record and replay. For example, for an angularjs app, that would look something like:

```
angular.module('MyModule').run(function (carRepository) {
    bsv.registerPromise('makes', myRepository, 'getMakes');
    bsv.registerPromise('models', myRepository, 'getModels');
    bsv.registerPromise('years', myRepository, 'getYears');
});
```

More details on the bsv api available in the config file can be found at: https://www.npmjs.com/package/bsv-better-service-virtualization.