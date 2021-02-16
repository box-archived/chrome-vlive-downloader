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
            "data": []
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

    const resolutionSorter = function (a, b) {
        const h_a = a.name.replace("P", "");
        const h_b = b.name.replace("P", "");
        const distance = h_a - h_b;
        if(distance > 0) {
            return 1
        } else if (distance < 0) {
            return -1
        } else {
            return 0
        }
    };

    const processStreamList = function (streams) {
        let streamParams = {};
        let streamList = [];

        // parse params
        streams.keys.forEach(item => streamParams[item.name] = item.value);

        streams.videos.forEach(item => streamList.push({
            "name": item['encodingOption']['name'],
            "src": encodedUrl(item['source'], streamParams)
        }));

        streamList.sort(resolutionSorter);

        return streamList
    };

    const processVideoList = function (videos) {
        let videoList = [];

        videos.list.forEach(item => videoList.push({
            "name": item['encodingOption']['name'],
            "src": item['source']
        }));

        videoList.sort(resolutionSorter);

        return videoList
    };

    const downloadPost = async function (url) {
        const postId = url.match(/(?<=post\/)[\d-]+/);

        // Load Post Data
        const postData = await ajaxGetJSON(encodedUrl(
            `https://www.vlive.tv/globalv-web/vam-web/post/v1.0/post-${postId}`,
            {
                "appId": appId,
                "fields": "attachments,author,authorId,availableActions,board{boardId,title,boardType," +
                "readAllowedLabel,payRequired,includedCountries,excludedCountries},boardId," +
                "body,channel{channelName,channelCode},channelCode,commentCount,contentType," +
                "createdAt,emotionCount,excludedCountries,includedCountries,isViewerBookmarked," +
                "isCommentEnabled,isHiddenFromStar,lastModifierMember,notice,officialVideo," +
                "originPost,plainBody,postId,postVersion,reservation,starReactions,targetMember," +
                "targetMemberId,thumbnail,title,url,smartEditorAsHtml,viewerEmotionId,writtenIn," +
                "playlist.limit(30)",
                "gcc": "KR",
                "locale": "ko_KR"
            }
        )).catch(() => raiseError("E1"));

        // Filtering Errors
        // Raise error when permission error
        if(postData.code !== 200) {
            raiseError("E20");
            return;
        }

        // routing downloadVideo() when officialVideoPost
        if("officialVideo" in postData.data) {
            await downloadVideo(`https://www.vlive.tv/video/${postData.data['officialVideo']['videoSeq']}`);
            return;
        }

        // Raise error when post's videoCount is 0
        if(postData.data['attachments']['videoCount'] === 0){
            raiseError("E13");
            return;
        }

        // Start load post
        // Construct result
        let result = {
            "working": false,
            "type": "POST",
            "data": [],
            "title": postData.data.title
        };

        // Parse video
        for (const value of Object.values(postData.data['attachments']['video'])) {
            // Init video item
            let videoItem = {};
            videoItem.thumb = value['uploadInfo']['imageUrl'];

            // Load file video data
            const videoData = await ajaxGetJSON(encodedUrl(
                `https://www.vlive.tv/globalv-web/vam-web/fvideo/v1.0/fvideo-${value['videoId']}/playInfo`,
                {
                    "appId": appId,
                    "gcc": "KR",
                    "locale": "ko_KR"
                }
            ));


            // Start parsing data
            // Parse Caption
            if("captions" in videoData.data['playInfo']) {
                videoItem.captions = videoData.data['playInfo']["captions"]["list"]
            }

            // Process stream info
            videoItem.streams = processStreamList(videoData.data['playInfo'].streams[0]);

            // Process video info
            videoItem.videos = processVideoList(videoData.data['playInfo'].videos);

            videoItem.maxIdx = videoItem.streams.length - 1;


            result.data.push(videoItem)
        }

        // return result
        result.success = true;
        result.message = "";
        window.__VD_RESULT__ = result;

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

        // Raise error when permission error
        if(videoPost.code !== 200) {
            raiseError("E20");
            return;
        }

        let result = {
            "working": false,
            "type": "VIDEO",
            "data": []
        };

        let videoItem = {};

        result.title = videoPost.data['title'];
        videoItem.thumb = videoPost.data['officialVideo']['thumb'];
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
                videoItem.captions = vodData.data["captions"]["list"]
            }

            // Process stream info
            videoItem.streams = processStreamList(vodData.data.streams[0]);

            // Process video info
            videoItem.videos = processVideoList(vodData.data.videos);

            videoItem.maxIdx = videoItem.streams.length - 1;

            // return result
            result.data.push(videoItem);
            result.success = true;
            result.message = "";
            window.__VD_RESULT__ = result;
        } else {
            if(videoItem.thumb.search(/live\/[\d-]*\/thumb/) !== -1) {
                raiseError("E21")
            }
            result.type = "LIVE";
            result.data.push(videoItem);
            result.success = true;
            result.message = "";
            console.log(result);
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
