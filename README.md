[![badge](https://img.shields.io/twitter/follow/api_video?style=social)](https://twitter.com/intent/follow?screen_name=api_video) &nbsp; [![badge](https://img.shields.io/github/stars/apivideo/api.video-typescript-media-recorder?style=social)](https://github.com/apivideo/api.video-typescript-media-recorder) &nbsp; [![badge](https://img.shields.io/discourse/topics?server=https%3A%2F%2Fcommunity.api.video)](https://community.api.video)
![](https://github.com/apivideo/API_OAS_file/blob/master/apivideo_banner.png)
<h1 align="center">api.video media recorder</h1>

![npm](https://img.shields.io/npm/v/@api.video/media-recorder) ![ts](https://badgen.net/badge/-/TypeScript/blue?icon=typescript&label)


[api.video](https://api.video) is the video infrastructure for product builders. Lightning fast video APIs for integrating, scaling, and managing on-demand & low latency live streaming features in your app.


# Table of contents
- [Table of contents](#table-of-contents)
- [Project description](#project-description)
- [Getting started](#getting-started)
  - [Installation](#installation)
    - [Installation method #1: requirejs](#installation-method-1-requirejs)
    - [Installation method #2: typescript](#installation-method-2-typescript)
    - [Simple include in a javascript project](#simple-include-in-a-javascript-project)
- [Documentation](#documentation)
  - [Instanciation](#instanciation)
    - [Options](#options)
      - [Using a delegated upload token (recommended):](#using-a-delegated-upload-token-recommended)
      - [Using an access token (discouraged):](#using-an-access-token-discouraged)
      - [Common options](#common-options)
    - [Example](#example)
  - [Methods](#methods)
    - [`start(options?: { timeslice?: number })`](#startoptions--timeslice-number-)
      - [Options](#options-1)
    - [`stop()`](#stop)
- [Full example](#full-example)

# Project description


Typescript library to easily upload data from a [MediaStream](https://developer.mozilla.org/fr/docs/Web/API/MediaStream) to api.video.
It can be used to upload a video to api.video from the user's webcam with ease, as well as from a screen recording.

# Getting started

## Installation

### Installation method #1: requirejs

If you use requirejs you can add the library as a dependency to your project with 

```sh
$ npm install --save @api.video/media-recorder
```

You can then use the library in your script: 

```javascript
var { ApiVideoMediaRecorder } = require('@api.video/media-recorder');

var recorder = new ApiVideoMediaRecorder(mediaStream, {
    uploadToken: "YOUR_DELEGATED_TOKEN"
    // ... other optional options
}); 
```

### Installation method #2: typescript

If you use Typescript you can add the library as a dependency to your project with 

```sh
$ npm install --save @api.video/media-recorder
```

You can then use the library in your script: 

```typescript
import { ApiVideoMediaRecorder } from '@api.video/media-recorder'

const recorder = new ApiVideoMediaRecorder(mediaStream, {file: files[0],
    uploadToken: "YOUR_DELEGATED_TOKEN"
    // ... other optional options
});
```


### Simple include in a javascript project

Include the library in your HTML file like so:

```html
<head>
    ...
    <script src="https://unpkg.com/@api.video/media-recorder" defer></script>
</head>
```

Then, once the `window.onload` event has been trigered, create your player using `new ApiVideoMediaRecorder()`:
```html
...
<script type="text/javascript"> 
    const recorder = new ApiVideoMediaRecorder(mediaStream, {
        uploadToken: "YOUR_DELEGATED_TOKEN"
    });
    recorder.start();
    // ...
    recorder.stop().then((video) => console.log(video));
</script>
```

# Documentation

## Instanciation

### Options 

The media recorder object is instanciated using a [MediaStream](https://developer.mozilla.org/fr/docs/Web/API/MediaStream) and an `options` object. Options to provide depend on the way you want to authenticate to the API: either using a delegated upload token (recommanded), or using a usual access token. 

#### Using a delegated upload token (recommended):

Using delegated upload tokens for authentication is best options when uploading from the client side. To know more about delegated upload token, read the dedicated article on api.video's blog: [Delegated Uploads](https://api.video/blog/tutorials/delegated-uploads).


|                   Option name | Mandatory | Type   | Description             |
| ----------------------------: | --------- | ------ | ----------------------- |
|                   uploadToken | **yes**   | string | your upload token       |
|                       videoId | no        | string | id of an existing video |
| _common options (see bellow)_ |           |        |                         |

#### Using an access token (discouraged):

**Warning**: be aware that exposing your access token client-side can lead to huge security issues. Use this method only if you know what you're doing :).


|                   Option name | Mandatory | Type   | Description             |
| ----------------------------: | --------- | ------ | ----------------------- |
|                   accessToken | **yes**   | string | your access token       |
|                       videoId | **yes**   | string | id of an existing video |
| _common options (see bellow)_ |           |        |                         |


#### Common options


| Option name | Mandatory | Type   | Description                                           |
| ----------: | --------- | ------ | ----------------------------------------------------- |
|     apiHost | no        | string | api.video host (default: ws.api.video)                |
|     retries | no        | number | number of retries when an API call fails (default: 5) |


### Example

```javascript
    const mediaRecorder = new ApiVideoMediaRecorder(myMediaStream, {
        uploadToken: "YOUR_DELEGATED_TOKEN",
        retries: 10,
    });
```

## Methods

### `start(options?: { timeslice?: number })`

The start() method starts the upload of the content retrieved from the MediaStream. It takes an optionnal `options` parameter.

#### Options
| Option name | Mandatory          | Type   | Description                                          |
| ----------: | ------------------ | ------ | ---------------------------------------------------- |
|   timeslice | no (default: 5000) | number | The number of milliseconds to record into each Blob. |


**Example**

```javascript
    // ... mediaRecorder instanciation

    mediaRecorder.start();
    // or, with a 2 seconds timeslice:
    // mediaRecorder.start({ timeslice: 2000 });
```

### `stop()`

The start() method stops the media recording. It upload the last part of content retrieved from the MediaStream (this will start the aggregation of the video parts on the api.video side). It takes no parameter. It returns a Promise that resolves with the newly created video.

**Example**

```javascript
    // ... mediaRecorder instanciation

    mediaRecorder.stop()
        .then(video => console.log(video));
```

# Full example


```html
<html>
    <head>
        <script src="../dist/index.js"></script>
        <style>
            #container {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            #video {
                width: 640;
                height: 480;
                border: 1px solid gray;
            }
            #container div {
                margin: 10px 0;
            }
        </style>
    </head>

    <body>
        <div id="container">
            <div>
                <video id="video"></video>
            </div>
            <div>
                <button id="start" disabled>start recording</button>
                <button id="stop" disabled>stop recording</button>
            </div>
            <div>
                <p>Video link: <span id="video-link"><i>will be displayed when the recording is finished</i></span></p>
            </div>
        </div>
        
        <script> 
            const video = document.querySelector('#video');
            const startButton = document.getElementById("start");
            const stopButton = document.getElementById("stop");
            const videoLink = document.getElementById("video-link");
            let stream, recorder;

            var constraints = window.constraints = {
                audio: true,
                video: true
            };

            navigator.mediaDevices.getUserMedia(constraints).then((s) => {
                stream = s;
                video.srcObject = s;
                video.play();
                startButton.disabled = false;
            });

            document.getElementById("start").addEventListener("click", () => {
                recorder = new ApiVideoMediaRecorder(stream, {
                    uploadToken: "UPLOAD_TOKEN"
                });
                
                recorder.start();
                
                startButton.disabled = true;
                stopButton.disabled = false;
            });

            document.getElementById("stop").addEventListener("click", () => {
                startButton.disabled = false;
                stopButton.disabled = true;

                recorder.stop().then(v => videoLink.innerHTML = v.assets.player);
            });
        </script>
    </body>
</html>
```
