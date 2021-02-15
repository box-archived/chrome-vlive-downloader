appId = "8c6cc7b45d2568fb668be6e05b6e5a3b";
(function () {
    // Functions
    const urlChecker = function (url) {
        if(url.search("vlive.tv") === -1) {
            return [false, "OUT"]
        } else {
            if(url.search("/post/") !== -1) {
                return [true, "POST"]
            } else if(url.search("/video/") !== -1) {
                return [true, "VIDEO"]
            } else {
                return [false, "IN"]
            }
        }
    };

    const raiseError = function (message) {
        window.__VD_RESULT__ = {
            "working": false,
            "success": false,
            "message": message,
            "type": "ERROR",
            "data": {}
        };
        throw new Error(`[CODE: ${message}] VLIVE DOWNLOADER`)
    };

    const ajaxGetJSON = function (url) {
        return new Promise(function (resolve, reject) {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", url);

            // Set result
            xhr.onload = function () {
                if (xhr.status === 200 || xhr.status === 403) {
                    resolve({code: xhr.status, data: JSON.parse(xhr.responseText)});
                } else {
                    reject()
                }
            };

            // send
            xhr.send();
        });
    };

    const encodedUrl = function (url, params) {
        let count = 0;
        let formatted = url;
        for (const [key, value] of Object.entries(params)) {
            if(count === 0) {
                formatted += "?"
            } else {
                formatted += "&"
            }
            formatted += `${key}=${value}`;
            count++
        }

        return formatted
    };

    const downloadPost = async function (url) {
        // const postId = url.match(/(?<=post\/)[\d-]+/)
    };

    const downloadVideo = async function (url) {
        const videoSeq = url.match(/(?<=video\/)[\d]+/);

        // Load Video Data
        const videoPost = await ajaxGetJSON(encodedUrl(
            `https://www.vlive.tv/globalv-web/vam-web/post/v1.0/officialVideoPost-${videoSeq}`,
            {
                "appId": appId,
                "fields": "attachments,author,authorId,availableActions,board{boardId,title,boardType," +
                    "readAllowedLabel,payRequired,includedCountries,excludedCountries},boardId,body," +
                    "channel{channelName,channelCode},channelCode,commentCount,contentType,createdAt," +
                    "emotionCount,excludedCountries,includedCountries,isViewerBookmarked,isCommentEnabled," +
                    "isHiddenFromStar,lastModifierMember,notice,officialVideo,originPost,plainBody,postId," +
                    "postVersion,reservation,starReactions,targetMember,targetMemberId,thumbnail,title,url," +
                    "smartEditorAsHtml,viewerEmotionId,writtenIn,playlist.limit(30)",
                "gcc": "KR",
                "locale": "ko_KR"
            }
        )).catch(() => raiseError("E1"));

        // construct result
        let result = {};

        if(videoPost.code === 200) {
            result.title = videoPost.data['title'];
            result.thumb = videoPost.data['thumb'];
            if("vodId" in videoPost.data['officialVideo']) {
                const vodId = videoPost.data['officialVideo']['vodId'];

                // Load inKey
                let inKeyParams = {
                    "appId": appId,
                    "platformType": "PC",
                    "gcc": "KR",
                    "locale": "ko_KR"
                };
                if(localStorage.getItem('vpdid2') != null) {
                    inKeyParams.vpdid2 = localStorage.getItem('vpdid2');
                }
                let inKey = await ajaxGetJSON(encodedUrl(
                    `https://www.vlive.tv/globalv-web/vam-web/video/v1.0/vod/${videoSeq}/inkey`,
                    inKeyParams
                )).catch(() => raiseError("E1"));
                inKey = inKey.data.inkey;

                // Load VOD
                const vodData = await ajaxGetJSON(encodedUrl(
                    `https://apis.naver.com/rmcnmv/rmcnmv/vod/play/v2.0/${vodId}`,
                    {
                        "key": inKey,
                        "videoId": vodId
                    })).catch(() => raiseError("E1"));

                if("captions" in vodData.data) {
                    result.captions = vodData.data["captions"]["list"]
                }
            } else {
                // Thumbnail Download
                raiseError("E12")
            }
        } else {
            raiseError("E20")
        }
    };

    // Main
    const url = window.location.href;

    // Create result object
    window.__VD_RESULT__ = {"working": true};

    const urlInfo = urlChecker(url);
    if(urlInfo[0]) {
        if(urlInfo[1] === "POST") {
            downloadPost(url).then()
        } else if(urlInfo[1] === "VIDEO") {
            downloadVideo(url).then()
        } else {
            raiseError("E0");
        }
    } else {
        if (urlInfo[1] === "IN") {
            raiseError("E11")
        } else if (urlInfo[1] === "OUT") {
            raiseError("E10")
        } else {
            raiseError("E0")
        }
    }

})();
/*
webvtt to srt (TC)
replaceAll(/(?<=\d{2}:\d{2}:\d{2}).(?=\d{3})/gm, ",")
*/
