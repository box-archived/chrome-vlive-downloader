/*
 * VLIVE Downloader Chrome-extension by box_archived
 * Copyright (c) 2020- box_archived
 *
 * VLIVE Downloader is free software under license GPL-3.0
 * You can modify and redistribute the software by follow the license
 * Check source code at github.com
 * <https://github.com/box-archived/chrome-vlive-downloader>
 *
 * For only personal purpose, you can download video.
 * However, if you share or redistribute downloaded video,
 * it could be a copyright infringement on VLIVE.
 * We do not guarantee any legal responsibility for the use.
 */

let blobObj;
let blobUrl;
let downloadedObj = {};
let abort = false;
const filenameDisplay = document.getElementById("filenameDisplay");
const progressObj = document.getElementById("progressItem");
const nowText = document.getElementById("nowText");
const subText = document.getElementById("subText");
const downloadDisplay = document.getElementById("downloadDisplay");
const resultArea = document.getElementById("result");
const statusPercent = document.getElementById("statusPercent");

function i18nString(name) {
    return chrome.i18n.getMessage(name)
}

// exec
(function () {
    // i18n load
    const elementList = document.querySelectorAll("[data-i18n]");
    elementList.forEach(function (element) {
        element.innerText = i18nString(element.dataset.i18n)
    });

    //getData
    const selfUrl = window.location.href;
    if (selfUrl.search(/\?/) !== -1) {
        const urlParam = selfUrl.split("?")[1];
        const paramsLine = urlParam.split("&");
        paramsLine.forEach(function (line) {
            const splitItem = line.split("=");
            window[splitItem[0]] = window.decodeURIComponent(splitItem[1])
        });
        let filename = `${window.streamname}.ts`;
        if(filename.length > 30) {
            filename = filename.slice(0, 30) + "..."
        }
        filenameDisplay.innerText = filename;
        if(window.streamname && window.streamsrc) {
            downloadStart()
        } else {
            displayMessage(i18nString("stream_oops"), {text: i18nString("stream_bad_request"), color: "var(--danger)"}, true, true)
        }
    } else {
        displayMessage(i18nString("stream_oops"), {text: i18nString("stream_forbidden"), color: "var(--danger)"}, true, true)
    }
})();

function ajaxOnError() {
    this.errcnt++;
    if (this.errcnt > 9) {
        displayMessage(i18nString("stream_oops"), {text: i18nString("stream_connection_error"), color: "var(--danger)"}, true, true);
    } else {
        setTimeout(()=>ajaxGet(this.ajaxUrl, this.callback, this.errcnt, this.responseType), 500);
    }
}


function ajaxGet(ajaxUrl, onSuccess, errcnt, responseType) {
    if(!errcnt) {
        errcnt = 0;
    }
    if(!abort) {
        const xhr = new XMLHttpRequest();
        xhr.errcnt = errcnt;
        xhr.ajaxUrl = ajaxUrl;
        xhr.callback = onSuccess;
        xhr.onerror = ajaxOnError;
        xhr.onload = function () {
            if (xhr.status === 200) {
                clearInterval(statusChecker);
                onSuccess(xhr.response);
            } else {
                setTimeout(()=>xhr.onerror(undefined), 500);
            }
        };
        xhr.open("GET", ajaxUrl);
        if(!responseType){
            responseType = "";
        }
        xhr.responseType = responseType;
        xhr.send();
        const statusChecker = setInterval(function() {
            if(abort) {
                xhr.abort();
            }
        }, 500);
    }
}

function ajaxGetBlob(ajaxUrl, onSuccess, errcnt) {
    ajaxGet(ajaxUrl, onSuccess, errcnt, "blob");
}
function reportProgress(percent) {
    progressObj.setAttribute("aria-valuenow", percent);
    progressObj.style.width = `${percent}%`;
    statusPercent.innerText = `${Math.round(percent*10)/10}%`;
}
function dnldObserver(count) {
    reportProgress(Object.keys(downloadedObj).length / count * 100);
    if (Object.keys(downloadedObj).length === count) {
        // create blob
        blobObj = new Blob(Object.values(downloadedObj), {type: 'video/mp2t'});
        downloadedObj = undefined;
        blobUrl = window.URL.createObjectURL(blobObj);
        resultArea.innerHTML += `<a id="download" style="display: none" href="${blobUrl}" download="${window.streamname}">download</a>`;
        document.querySelector('#download').click();
        window.URL.revokeObjectURL(blobUrl);
        blobObj = undefined;
        setTimeout(() => displayMessage(i18nString("stream_download_success"), {text: i18nString("stream_close"), color: "var(--green)"}, true), 700);
    }
}
function displayMessage(title, message, close, error) {
    if(close) {
        let closeStyle = "closeDiv";
        if(error) {
            abort = true;
            closeStyle += "Error"
        }
        downloadDisplay.classList.add(closeStyle);
    }
    nowText.innerText = title;
    subText.innerText = message.text;
    subText.style.color = message.color;
}

function collectItemsFromM3U8(playlistUrl, m3u8)
{
    let req = {};
    const regexUrl = playlistUrl.match(/(?<param>(?<=(?<=(?<=(?<base>.+(?=[0-9a-z.\-]+(?<=m3u8))))).+\?).+)/).groups;
    const baseUrl = regexUrl.base;
    const params = regexUrl.param;
    const items = m3u8.match(/^#EXT.*INF:.+\s.+$/gmi);
    const filenameExp = new RegExp(/(?<number>[0-9]+.ts(?<=(?<full>(?<=\s).+)))/i);
    items.forEach(function (item) {
        const regexFilename = item.match(filenameExp).groups;
        const filename = regexFilename.full;
        const fileNum = Number(regexFilename.number.split(".")[0]);
        req[fileNum] = `${baseUrl}${filename}?${params}`
    });
    return req;
}

function downloadStart() {
    ajaxGet(window.streamsrc, function (result) {
        const req = collectItemsFromM3U8(window.streamsrc, result);
        const count = Object.keys(req).length;
        dnldObserver(count);
        Object.keys(req).forEach(function (key) {
            ajaxGetBlob(req[key], function (result) {
                downloadedObj[key] = result;
                dnldObserver(count);
            })
        })
    })
}
