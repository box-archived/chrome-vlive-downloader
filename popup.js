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

function chromeDownload(obj) {
    try {
        chrome.downloads.download({
            url: obj.dataset.url,
            filename: obj.dataset.name
        })
    } catch (e) {
        // window.location.reload()
    }
}

function srtDownload(obj) {
    const vttLoad = new Promise(function (resolve, reject) {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", obj.target.dataset.url);

        // Set result
        xhr.onload = function () {
            if (xhr.status === 200) {
                resolve(xhr.response);
            } else {
                reject()
            }
        };
        // send
        xhr.send();
    });

    vttLoad.then(function(result) {
        result = result.slice(result.search("1"));
        result = result.replaceAll(/(?<=\d{2}:\d{2}:\d{2}).(?=\d{3})/gm, ",");
        const blobObj = new Blob([result], {type: 'application/x-subrip'});
        const blobUrl = window.URL.createObjectURL(blobObj);
        chrome.downloads.download({url: blobUrl, filename: obj.target.dataset.name}, () => {URL.revokeObjectURL(blobUrl)});
    });
}

function i18nLoader() {
    const elementList = document.querySelectorAll("[data-i18n]");
    elementList.forEach(function (element) {
        element.innerText = chrome.i18n.getMessage(element.dataset.i18n)
    })
}

function hideSpinner() {
    document.querySelector("#spinner").classList.add("disappear");
}

function setResultHTML(html, sizing) {
    const resultNode = document.querySelector("#result");
    if(sizing){
        resultNode.classList.add(`px-${sizing}`);
    }
    resultNode.innerHTML = html
}

function renderAlert(i18n, type) {
    if(!type) {
        type = 'primary'
    }
    hideSpinner();
    return `<div class="alert alert-${type}" data-i18n="alert_${i18n}">${i18n}</div>`
}

function renderVideoCard(vdResult, idx, only=true) {
    // set vars
    const video = vdResult.data[idx];

    // build up
    let mbClass = "";
    if(only) {
        mbClass = "mb-3"
    }
    let html = `<div class="card ${mbClass}"><img src="${video.thumb}" class="card-img thumb-prv" alt="Thumbnail"><div class="video-card-overlay"><small class="card-text font-weight-bold">${vdResult.title}</small></div><div class="card-body">`;

    // Add thumb download
    html += `<div class="btn-group w-100 mb-2"><button class="btn btn-outline-info btn-sm fn-chrome-download w-100" type="button" data-i18n="card_download_thumb" data-url="${video.thumb}" data-name="${video.safeName}_thumb.jpg"></button></div>`;

    // Add stream download
    if(video.videos) {
        html += `<div class="btn-group w-100 mb-2"><button class="btn btn-primary btn-sm" type="button" data-toggle="modal" data-i18n="card_download_stream" data-target="#modal${idx}video"></button>`;

        html += `<div class="modal fade" id="modal${idx}video" tabindex="-1" aria-hidden="true">`;
        html += `<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-dialog-override">`;
        html += `<div class="modal-content modal-content-override"><div class="modal-body text-center">`;
        html += `<small class="font-weight-bold mb-2 d-block text-muted" data-i18n="card_download_stream"></small>`;
        video.videos.forEach(function (videoItem) {
            html += `<a class="dropdown-item fn-chrome-download dropdown-item-override" href="#" data-url="${videoItem.src}" data-name="${videoItem.filename}" data-dismiss="modal">${videoItem.name}</a>`
        });
        html += `</div>`;
        html += `</div>`;
        html += `</div></div>`;

        html += `</div>`
    }
    // Add caption download
    if(video.captions) {
        html += `<hr class="mb-4" />`;

        html += `<div class="mb-2">`;

        // start of vtt captions
        html += `<div class="btn-group w-100 mb-1"><button class="btn btn-outline-secondary btn-sm" type="button" data-toggle="modal" data-i18n="card_download_vtt" data-target="#modal${idx}vtt"></button>`;

        html += `<div class="modal fade" id="modal${idx}vtt" tabindex="-1" aria-hidden="true">`;
        html += `<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-dialog-override-lg">`;
        html += `<div class="modal-content modal-content-override"><div class="modal-body">`;
        html += `<small class="font-weight-bold mb-2 d-block text-muted text-center" data-i18n="card_download_vtt"></small>`;
        video.captions.forEach(function (captionItem) {
            let captionLabel = captionItem.label;
            if(captionItem.subLabel) {
                captionLabel += `(${captionItem.subLabel})`
            }
            if(captionItem.type === "fan") {
                captionLabel += `<small class="text-muted pl-1">Fan.${captionItem.fanName}</small>`;
            } else {
                captionLabel += `<small class="pl-1" style="color:#ffc107;">Official</small>`;
            }
            html += `<a class="dropdown-item fn-chrome-download overflow-hidden to-ellipsis" href="#" data-url="${captionItem.source}" data-name="${captionItem.vttname}">${captionLabel}</a>`
        });
        html += `</div>`;
        html += `</div>`;
        html += `</div></div>`;

        html += "</div>";
        // end of vtt caption

        // start of srt captions
        html += `<div class="btn-group w-100"><button class="btn btn-outline-secondary btn-sm" type="button" data-toggle="modal" data-i18n="card_download_srt" data-target="#modal${idx}srt"></button>`;

        html += `<div class="modal fade" id="modal${idx}srt" tabindex="-1" aria-hidden="true">`;
        html += `<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-dialog-override-lg">`;
        html += `<div class="modal-content modal-content-override"><div class="modal-body">`;
        html += `<small class="font-weight-bold mb-2 d-block text-muted text-center" data-i18n="card_download_srt"></small>`;
        video.captions.forEach(function (captionItem) {
            let captionLabel = captionItem.label;
            if(captionItem.subLabel) {
                captionLabel += `(${captionItem.subLabel})`
            }
            if(captionItem.type === "fan") {
                captionLabel += `<small class="text-muted pl-1">Fan.${captionItem.fanName}</small>`;
            } else {
                captionLabel += `<small class="pl-1" style="color:#ffc107;">Official</small>`;
            }
            html += `<a class="dropdown-item fn-srt-download overflow-hidden to-ellipsis" href="#" data-url="${captionItem.source}" data-name="${captionItem.srtname}">${captionLabel}</a>`
        });
        html += `</div>`;
        html += `</div>`;
        html += `</div></div>`;

        html += "</div>";
        //end of srt captions

        html += `</div>`;
    }

    html += `</div>`;

    return html

}

function renderAccordion(vdResult) {

    const data = vdResult.data;
    let html = ``;
    html += `<div class="accordion mb-2" id="videoAccordion">`;
    data.forEach(function (dataItem, index) {
        html += `
        <div class="card">
        <div class="card-header py-0 px-1" id="header${index}">
            <h2 class="mb-0">
                <button class="btn btn-link btn-block text-left" type="button" data-toggle="collapse" data-target="#collapse${index}" aria-expanded="false" aria-controls="collapse${index}">
                    #${index + 1}
                </button>
            </h2>
        </div>

        <div id="collapse${index}" class="collapse" aria-labelledby="header${index}" data-parent="#videoAccordion">
            <div class="card-body">
                ${renderVideoCard(vdResult, index, false)}
            </div>
        </div>
    </div>`;
        html += `</div>`
    });
    return html
}

function renderDOM(vdResult) {
    // check result
    let html = ``;

    const vdType = vdResult.type;
    if(vdType === "ERROR") {
        // setHTML
        setResultHTML(renderAlert(`${vdResult.message}`, "danger"), 3);
    } else if (vdType === "VIDEO" || vdType === "LIVE") {
        html += renderVideoCard(vdResult, 0);

        // setHTML
        setResultHTML(html, 3)
    } else if (vdType === "POST") {
        if(vdResult.data.length > 1) {
            html += renderAccordion(vdResult);
            setResultHTML(html)
        } else {
            html += renderVideoCard(vdResult, 0);
            setResultHTML(html, 3)
        }
    }
}

async function main() {
    function resultCheck() {
        return new Promise(function (resolve) {
            const checker = setInterval(function () {
                chrome.tabs.executeScript(null, {code: 'window.__VD_RESULT__'}, function (vdResult) {
                    if(vdResult[0].working === false) {
                        clearInterval(checker);
                        resolve(vdResult[0])
                    }
                })
            }, 25)
        });
    }


    await new Promise(function(resolve) {
        chrome.tabs.executeScript(null, {file: 'core.js'}, function () {
                resolve();
        });
    }).then(() => {});
    const vdResult = await resultCheck();

    renderDOM(vdResult);
    hideSpinner()
}

window.onload = function () {
    new Promise(function (resolve) {
        chrome.tabs.getSelected(null, function(tab) {
            if(tab.url.search(/(?<=chrom)[\-a-z]*:/g) !== -1) {
                setResultHTML(renderAlert("E10", "danger"), 3);
                resolve()
            } else {
                main().then(() => {resolve()});
            }
        });
    }).then(
        i18nLoader
    ).then(
        function() {
            document.querySelectorAll(".fn-chrome-download").forEach(function (item) {
                item.addEventListener("click", function () {
                    chromeDownload(this)
                })
            });
            document.querySelectorAll(".fn-srt-download").forEach(function (item) {
                item.addEventListener("click", function () {
                    srtDownload(this)
                })
            });
        }
    )
};
