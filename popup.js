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
            url: obj.target.dataset.url,
            filename: obj.target.dataset.name
        })
    } catch (e) {
        window.location.reload()
    }
}

function streamDownload(obj) {
    console.log(obj.target.dataset)
}

function srtDownload(obj) {
    console.log(obj.target.dataset)
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

function renderVideoCard(video, only=true) {
    // build up
    let mbClass = "";
    if(only) {
        mbClass = "mb-3"
    }
    let html = `<div class="card ${mbClass}"><img src="${video.thumb}" class="card-img thumb-prv" alt="Thumbnail"><div class="card-body">`;

    // Add thumb download
    html += `<div class="btn-group w-100 mb-2"><button class="btn btn-outline-info btn-sm fn-chrome-download w-100" type="button" data-i18n="card_download_thumb" data-url="${video.thumb}" data-name="${video.safeName}_thumb.jpg"></button></div>`;

    // Add stream download
    if(video.streams) {
        html += `<div class="btn-group w-100 mb-2"><button class="btn btn-outline-primary btn-sm dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" data-i18n="card_download_stream"></button>`;
        html += `<div class="dropdown-menu">`;
        video.streams.forEach(function (streamItem) {
            html += `<a class="dropdown-item fn-stream-download" href="#" data-url="${streamItem.src}" data-name="${streamItem.filename}">${streamItem.name}</a>`
        });
        html += `</div>`;
        html += `</div>`
    }
    // Add caption download
    if(video.captions) {
        html += `<hr class="mb-4" />`;

        html += `<div class="mb-2">`;

        // start of vtt captions
        html += `<div class="btn-group w-100 mb-1"><button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" data-i18n="card_download_vtt"></button>`;
        html += `<div class="dropdown-menu">`;
        video.captions.forEach(function (captionItem) {
            let captionLabel = captionItem.label;
            if(captionItem.subLabel) {
                captionLabel += `(${captionItem.subLabel})`
            }
            html += `<a class="dropdown-item fn-chrome-download" href="#" data-url="${captionItem.source}" data-name="${captionItem.vttname}">${captionLabel}</a>`
        });
        html += "</div>";
        html += "</div>";
        // end of vtt caption

        // start of srt captions
        html += `<div class="btn-group w-100"><button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" data-i18n="card_download_srt"></button>`;
        html += `<div class="dropdown-menu">`;
        video.captions.forEach(function (captionItem) {
            let captionLabel = captionItem.label;
            if(captionItem.subLabel) {
                captionLabel += `(${captionItem.subLabel})`
            }
            html += `<a class="dropdown-item fn-srt-download" href="#" data-url="${captionItem.source}" data-name="${captionItem.srtname}">${captionLabel}</a>`
        });
        html += "</div>";
        html += "</div>";
        //end of srt captions

        html += `</div>`;
    }

    // Add legacy video download
    if(video.videos) {
        html += `<hr class="mb-4" />`;
        html += `<div class="btn-group w-100 mb-2"><button class="btn btn-outline-primary btn-sm dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" data-i18n="card_download_legacy"></button>`;
        html += `<div class="dropdown-menu">`;
        html += `<small class="text-muted p-4" style="max-width: 200px;" data-i18n="card_legacy_description"></small>`;
        video.videos.forEach(function (streamItem) {
            html += `<a class="dropdown-item fn-chrome-download" href="#" data-url="${streamItem.src}" data-name="${streamItem.filename}">${streamItem.name}</a>`
        });
        html += `</div>`;
        html += `</div>`
    }

    html += `</div>`;

    return html

}

function renderAccordion(data) {
    let html = ``;
    html += `<div class="accordion mb-2" id="videoAccordion">`;
    data.forEach(function (dataItem, index) {
        html += `
        <div class="card">
        <div class="card-header py-0 px-1" id="header${index}">
            <h2 class="mb-0">
                <button class="btn btn-link btn-block text-left" type="button" data-toggle="collapse" data-target="#collapse${index}" aria-expanded="false" aria-controls="collapseOne">
                    #${index + 1}
                </button>
            </h2>
        </div>

        <div id="collapse${index}" class="collapse" aria-labelledby="header${index}" data-parent="#videoAccordion">
            <div class="card-body">
                ${renderVideoCard(dataItem, false)}
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
        html += renderVideoCard(vdResult.data[0]);

        // setHTML
        setResultHTML(html, 3)
    } else if (vdType === "POST") {
        if(vdResult.data.length > 1) {
            html += renderAccordion(vdResult.data);
            setResultHTML(html)
        } else {
            html += renderVideoCard(vdResult.data[0]);
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
                item.addEventListener("click", chromeDownload, this)
            });
            document.querySelectorAll(".fn-stream-download").forEach(function (item) {
                item.addEventListener("click", streamDownload, this)
            });
            document.querySelectorAll(".fn-srt-download").forEach(function (item) {
                item.addEventListener("click", srtDownload, this)
            });
        }
    )
};
