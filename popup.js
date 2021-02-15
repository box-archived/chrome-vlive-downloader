const resultArea = document.getElementById('result');
function safeFilename(dangerName) {
    let temp = dangerName;
    // remove front space
    temp = temp.replace(/^(\s+)/gs, "");
    // < > : " / \ | ? *
    temp = temp.replace(/[<>:"\\\/|?*~]/gi, "_");
    return temp
}

function removeEmoji(text) {
    let temp = text;
    temp = temp.replace(new RegExp(/(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/, 'g'), '_');

    return temp
}

function getExtension(fileUrl) {
    const cleanUrl = fileUrl.split("?")[0].split("#")[0];
    return cleanUrl.split(".")[cleanUrl.split(".").length - 1];
}

function alertTemplate(message, type) {
    if(!type){
        type = 'primary'
    }
    let alert = document.createElement('div');
    alert.classList.add('alert');
    alert.classList.add(`alert-${type}`);
    alert.role = "alert";
    alert.innerText = message;
    return alert
}

function genParamUri(paramSet) {
    let params = "?";
    Object.keys(paramSet).forEach(function (name) {
        if (params !== "?") {
            params += "&"
        }
        params += `${name}=${paramSet[name]}`;
    });
    return params
}

function cardTemplate(resultObj) {
    let live_video = false;
    if(Object.keys(resultObj.sources).length === 0) {
        live_video = true
    }
    const sources = resultObj.sources;
    // get title and escape
    const escapedTitle = safeFilename(resultObj.title);
    let videoSafeTitle = "";
    if (escapedTitle.length > 100) {
        videoSafeTitle = escapedTitle.slice(0, 100) + ".."
    } else {
        videoSafeTitle = escapedTitle
    }
    let maxResKey = 0;
    if(!live_video) {
        maxResKey = Object.keys(sources)[Object.keys(sources).length - 1];
    }

    // Lv.1 : div(./cardDiv)
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card");

    // Lv.2 : img(./cardDiv/thumbImg)
    const thumbImg = document.createElement("img");
    thumbImg.src = resultObj.thumb;
    thumbImg.classList.add("card-img");
    thumbImg.classList.add("thumb-prv");
    thumbImg.alt = "Thumbnail";

    // Lv.2 : div(./cardDiv/headBody)
    const headBody = document.createElement("div");
    headBody.classList.add("card-body");

    // Lv.3: div(./cardDiv/headBody/dnldMain)
    const dnldMain = document.createElement("div");
    dnldMain.classList.add("text-center");

    function mainLinkNodeSetting(DOMNode) {
        DOMNode.href = "#";
        DOMNode.classList.add('card-link');
        DOMNode.classList.add('btn');
        DOMNode.classList.add('btn-outline-primary');
    }

    function addDownloadIcon(html) {
        return '<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-download" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path fill-rule="evenodd" d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/></svg> ' + html
    }
    // Lv.4 : a(./cardDiv/headBody/dnldMain/dnldMaxRes)
    const dnldMaxRes = document.createElement('a');
    if(!live_video) {
        mainLinkNodeSetting(dnldMaxRes);
        dnldMaxRes.classList.add("dnld-stream-btn");
        const params = genParamUri(resultObj.streamKeyParams);
        dnldMaxRes.dataset.name = `${videoSafeTitle}_${maxResKey}p`;
        dnldMaxRes.dataset.src = resultObj.streamSources[maxResKey] + params;
        dnldMaxRes.innerHTML = addDownloadIcon(`${maxResKey}p`);
    }

    // Lv.4 : a(./cardDiv/headBody/dnldMain/dnldThumb)
    const dnldThumb = document.createElement('a');
    dnldThumb.classList.add('dnld-btn');
    mainLinkNodeSetting(dnldThumb);
    dnldThumb.dataset.name = removeEmoji(videoSafeTitle) + "_thumb";
    dnldThumb.dataset.ext = getExtension(resultObj.thumb);
    dnldThumb.dataset.src = resultObj.thumb;
    dnldThumb.innerHTML = addDownloadIcon("썸네일");

    // Lv.3 div(./cardDiv/headBody/dnldResolutions)
    const dnldResoultions = document.createElement('div');
    dnldResoultions.classList.add('text-center');

    // Lv.4 button(./cardDiv/headBody/dnldReslutions/$item)
    let dnldItem = "<hr/><p class='mb-2' style='line-height: 1'><small class='font-weight-bold'>다른 다운로드 옵션</small></p><div style='line-height: 2.5'>";
    if(!live_video) {
        const finalItem = Object.keys(sources).length - 1;
        let nowItem = 1;
        let middleOption = 'mr-2';
        const params = genParamUri(resultObj.streamKeyParams);
        Object.keys(resultObj.streamSources).forEach(function (key) {
            if(nowItem === finalItem + 1 || (nowItem % 5 === 0)) {
                middleOption = "";
            } else {
                middleOption = 'mr-2'
            }
            const srcUrl = resultObj.streamSources[key] + params;
            if(key !== maxResKey)
                dnldItem += `<a type="button" class="dnld-stream-btn btn btn-outline-secondary btn-sm border-round ${middleOption}" data-name="${videoSafeTitle}_${key}p" data-src="${srcUrl}">${key}p</a>`;
            nowItem++;
        });
        dnldItem += "</div>";

        // feature-distdnld
        if (resultObj.streamSources) {
            dnldItem += "<hr/><p class='mb-2' style='line-height: 1'><small class='font-weight-bold'>다운로드에 문제가 있나요?</small><br><sub class='text-muted'>느린 다운로드 방식 사용</sub></p><div style='line-height: 2.5'>";
            const srcUrl = sources[maxResKey];
            const ext = getExtension(srcUrl);
            dnldItem += `<a type="button" class="dnld-btn btn btn-outline-secondary btn-sm border-round" data-name="${removeEmoji(videoSafeTitle)}_${maxResKey}p" data-src="${srcUrl}" data-ext="${ext}">${maxResKey}p</a>`;
        }
        dnldItem += "</div>";
    }

    // make
    // Lv.4
    if(!live_video) {
        dnldMain.appendChild(dnldMaxRes);
    }
    dnldMain.appendChild(dnldThumb);
    if(!live_video) {
        dnldResoultions.innerHTML = dnldItem;
    }

    // Lv.3
    // headBody.appendChild(ovTitle);
    headBody.appendChild(dnldMain);
    if(!live_video) {
        headBody.appendChild(dnldResoultions);
    }

    // Lv.2
    cardDiv.appendChild(thumbImg);
    cardDiv.appendChild(headBody);

    return cardDiv
}

let downloadVideo = function(params) {
    try {
        chrome.downloads.download(params)
    } catch (e) {
        downloadProc("값이 누락되어 다시 로딩합니다.")
    }
};

function uiStarted(message) {
    let html = "";
    if(message) {
        html += alertTemplate(message).outerHTML;
    }
    // spinner
    html += '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="sr-only">Loading...</span></div></div>';
    resultArea.innerHTML = html
}

function uiEnded() {
}

let createListener = function() {
    document.querySelectorAll('.dnld-btn').forEach(function(item) {
        item.addEventListener("click", function (e) {
            e.preventDefault();
            const data = e.target.dataset;
            downloadVideo({
                "url": data.src,
                "filename": `${data.name}.${data.ext}`
            });
        });
    });
    document.querySelectorAll('.dnld-stream-btn').forEach(function(item) {
        item.addEventListener("click", function (e) {
            e.preventDefault();
            createDownloadTab(e.target.dataset);
        });
    });
};

function createDownloadTab(dataset) {
    const encodedName = encodeURIComponent(dataset.name);
    const encodedSrc = encodeURIComponent(dataset.src);
    window.open(`streamDownload.html?streamname=${encodedName}&streamsrc=${encodedSrc}`,"_blank");
}

function showResult(success) {
    resultArea.innerHTML = "";
    if(success) {
        chrome.tabs.executeScript(null, {code: 'window.__VD_RESULT__'}, function (ret) {
            const result = ret[0];
            if(result.success) {
                resultArea.appendChild(cardTemplate(result));
                // create button click listener
                createListener();
                uiEnded();
            } else {
                let errorMessageNode = alertTemplate(result.message, "danger");
                resultArea.appendChild(errorMessageNode);
            }
        })
    } else {
        uiEnded();
    }
}

function runPostAttachScript() {
    let iterations = 0;
    chrome.tabs.executeScript(null, {file:'postAttach.js'}, function () {
        chrome.tabs.executeScript(null, {code:'VD_RUN()'}, function () {
            let watcher = setInterval(function () {
                chrome.tabs.executeScript(null, {code:'Object.keys(window.__VD_RESULT__).length'}, function (result) {
                    if(iterations > 20){
                        showResult(false);
                        clearInterval(watcher)
                    } else {
                        if (result > 0) {
                            showResult(true);
                            clearInterval(watcher)
                        } else {
                            iterations++;
                        }
                    }
                })
            }, 500)
        });
    });
}
function downloadProc(message) {
    uiStarted(message);
    chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT},
        function(){
            runPostAttachScript();
        }
    );
}
window.onload = function() {
    downloadProc()
};
