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
