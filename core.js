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

    const retryResult = function () {
        window.__VD_RESULT__ = {
            "working": false,
            "success": false,
            "message": "오류가 발생했습니다. 다시 시도해 주세요.",
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
        const videoSeq = url.match(/(?<=video\/)[\d]+/)
    };

    // Main
    const url = window.location.href;

    // Create result object
    window.__VD_RESULT__ = {"working": true};

    const urlInfo = urlChecker(url);
    let result;
    if(urlInfo[0]) {
        if(urlInfo[1] === "POST") {
            result = downloadPost()
        } else if(urlInfo[1] === "VIDEO") {
            result = downloadVideo()
        } else {
            result = {
                "working": false,
                "success": false,
                "message": "알 수 없는 오류",
                "type": "ERROR",
                "data": {}
            }
        }
    } else {
        if(urlInfo[1] === "IN") {
            result = {
                "working": false,
                "success": false,
                "message": "VIDEO나 POST가 아닙니다",
                "type": "ERROR",
                "data": {}
            }
        } else if (urlInfo[1] === "OUT") {
            result = {
                "working": false,
                "success": false,
                "message": "VLIVE 웹사이트가 아닙니다",
                "type": "ERROR",
                "data": {}
            }
        } else {
            result = {
                "working": false,
                "success": false,
                "message": "알 수 없는 오류",
                "type": "ERROR",
                "data": {}
            }
        }
    }

    // Set result
    window.__VD_RESULT__ = result

})();
