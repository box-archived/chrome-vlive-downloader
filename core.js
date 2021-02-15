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
        }
    };

    const ajaxGetJSON = function (url) {
        return new Promise(function (resolve, reject) {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", url);

            // Set result
            xhr.onload = function () {
                if (xhr.status === 200) {
                    resolve(JSON.parse(xhr.responseText));
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

    const downloadPost = function (url) {
        const postId = url.match(/(?<=post\/)[\d-]+/)
    };

    const downloadVideo = function (url) {
        const videoSeq = url.match(/(?<=video\/)[\d]+/);

        // Load Video Data
        ajaxGetJSON(encodedUrl(
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
        )).then(
            //
            function (data) {
                if("vodId" in data['officialVideo']) {
                    // has video
                } else {
                    // is on_air
                }
            }
        );
    };

    // Main
    const url = window.location.href;

    // Create result object
    window.__VD_RESULT__ = {"working": true};

    const urlInfo = urlChecker(url);
    if(urlInfo[0]) {
        if(urlInfo[1] === "POST") {
            downloadPost(url)
        } else if(urlInfo[1] === "VIDEO") {
            downloadVideo(url)
        } else {
            raiseError("알 수 없는 오류");
        }
    } else {
        if (urlInfo[1] === "IN") {
            raiseError("VIDEO나 POST가 아닙니다")
        } else if (urlInfo[1] === "OUT") {
            raiseError("VLIVE 웹사이트가 아닙니다")
        } else {
            raiseError("알 수 없는 오류")
        }
    }

})();
