function ajaxGet(ajaxUrl, callback) {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
        if (xhr.status === 200) {
            callback(JSON.parse(xhr.responseText));
        }
    };
    xhr.open("GET", ajaxUrl);
    xhr.send();
}

function sortDict(unsortedDict) {
    const sortedKeys = Object.keys(unsortedDict).sort(function (a, b) {
        return (a - b)
    });
    let sortedDict = {};
    sortedKeys.forEach(function (key) {
        sortedDict[key] = unsortedDict[key]
    });
    return sortedDict
}

function videoListParser(videos) {
    let sources = {};
    videos.list.forEach(function (item) {
        sources[item.encodingOption.name.toLowerCase().split("p")[0]] = item.source;
    });
    return sortDict(sources)
}

function makeResult(result) {
    Object.keys(result).forEach(function (key) {
        window.__VD_RESULT__[key] = result[key]
    })
}

function loadInKey(videoSeqId, callback) {
    let vpdid2 = "";
    if(localStorage.getItem('vpdid2') != null) {
        vpdid2 = "&vpdid2=" + localStorage.getItem('vpdid2');
    }
    const reqUrl = `https://www.vlive.tv/globalv-web/vam-web/video/v1.0/vod/${videoSeqId}/inkey?appId=${appId}&platformType=PC&gcc=KR&locale=ko_KR${vpdid2}`;
    ajaxGet(reqUrl, function (result) {
        callback(result.inkey);
    })
}

function loadPostAttachedVideo(postObj) {
    const attachedVideoKey = Object.keys(postObj.attachments.video)[0];
    const videoPostId = attachedVideoKey.replace(".", "-");
    const apiVideoUrl = `https://www.vlive.tv/globalv-web/vam-web/fvideo/v1.0/fvideo-${videoPostId}/playInfo?appId=${appId}&gcc=KR&locale=ko_KR`;
    ajaxGet(apiVideoUrl, function (result) {
        const sources = videoListParser(result.playInfo.videos);
        const firstMediaStream = result.playInfo.streams[0],
            videoList = {};
        videoList.list = firstMediaStream.videos;
        const streamSources = videoListParser(videoList);
        const streamKeyParams = hlsKeysToParamDict(firstMediaStream.keys);
        makeResult({
            success: true,
            sources: sources,
            title: postObj.title,
            thumb: postObj.attachments.video[attachedVideoKey].uploadInfo.imageUrl,
            streamSources: streamSources,
            streamKeyParams: streamKeyParams
        });
    })
}

function hlsKeysToParamDict(keys) {
    const paramDict = {};
    Object.keys(keys).forEach(function (idx) {
        const item = keys[idx];
        if(item.type === "param") {
            paramDict[item.name] = item.value;
        }
    });
    return paramDict
}

function loadVOD(videoObj) {
    ajaxGet(`https://www.vlive.tv/globalv-web/vam-web/old/v3/live/${videoObj.videoSeq}/playInfo?appId=${appId}&platformType=PC&ad=true&gcc=KR&locale=ko_KR`, function (e) {
        let liveVideo = false;
        if(e.result !== undefined){
            if(e.result.status.search("ON_AIR") !== -1){
                liveVideo = true;
            }
        }
        if(liveVideo) {
            const thumb_elements = videoObj.thumb.split("/");
            if(thumb_elements[(thumb_elements.length - 1)] === "thumb"){
                makeResult({
                    success: false,
                    message: "라이브 썸네일이 적용된 영상입니다"
                })
            } else {
                makeResult({
                    success: true,
                    sources: {},
                    thumb: videoObj.thumb,
                    title: videoObj.title,
                });
            }
        } else {
            if(videoObj.status !== undefined){
                makeResult({
                    success: true,
                    sources: {},
                    thumb: videoObj.thumb,
                    title: videoObj.title,
                });
            } else {
                loadInKey(videoObj.videoSeq, function (inkey) {
                    const reqUrl = `https://apis.naver.com/rmcnmv/rmcnmv/vod/play/v2.0/${videoObj.vodId}?key=${inkey}&videoId=${videoObj.vodId}`;
                    ajaxGet(reqUrl, function (result) {
                        // feature-distdnld
                        const firstMediaStream = result.streams[0],
                            videoList = {};
                        videoList.list = firstMediaStream.videos;
                        const streamSources = videoListParser(videoList);
                        const streamKeyParams = hlsKeysToParamDict(firstMediaStream.keys);

                        // normal-dnld
                        const sources = videoListParser(result.videos);
                        makeResult({
                            success: true,
                            sources: sources,
                            thumb: videoObj.thumb,
                            title: videoObj.title,
                            streamSources: streamSources,
                            streamKeyParams: streamKeyParams
                        });
                    })
                });
            }
        }
    });
}

var url = window.location.href;
var appId = "8c6cc7b45d2568fb668be6e05b6e5a3b";
function VD_RUN() {
    window.__VD_RESULT__ = {};
    if(url.search("vlive.tv") !== -1){
        if((url.search("/post/") !== -1) || (url.search("/video/") !== -1)){
            if (url.search("post") !== -1) {
                const postId = url.split("post/")[1].split("#")[0].split("?")[0];
                const apiPostUrl = `https://www.vlive.tv/globalv-web/vam-web/post/v1.0/post-${postId}?appId=${appId}&fields=title,attachments,officialVideo&gcc=KR&locale=ko_KR`;
                ajaxGet(apiPostUrl, function (e) {
                    if (e.attachments.videoCount === 1) {
                        loadPostAttachedVideo(e);
                    } else if (e.attachments.videoCount === 0) {
                        if(Object.keys(e).includes('officialVideo')){
                            loadVOD(e.officialVideo)
                        } else {
                            makeResult({success: false, message: "영상을 찾을 수 없습니다"});
                        }
                    }
                });
            } else if (url.search("video") !== -1) {
                const videoId = url.split("video/")[1].split("#")[0].split("?")[0];
                const apiVideoUrl = `https://www.vlive.tv/globalv-web/vam-web/post/v1.0/officialVideoPost-${videoId}?appId=${appId}&fields=attachments,author,authorId,availableActions,board{boardId,title,boardType,readAllowedLabel,payRequired,includedCountries,excludedCountries},boardId,body,channel{channelName,channelCode},channelCode,commentCount,contentType,createdAt,emotionCount,excludedCountries,includedCountries,isViewerBookmarked,isCommentEnabled,isHiddenFromStar,lastModifierMember,notice,officialVideo,originPost,plainBody,postId,postVersion,reservation,starReactions,targetMember,targetMemberId,thumbnail,title,url,smartEditorAsHtml,viewerEmotionId,writtenIn,playlist.limit(30)&gcc=KR&locale=ko_KR`;
                ajaxGet(apiVideoUrl, function (e) {
                    loadVOD(e.officialVideo);
                })
            }
        } else {
            makeResult({
                success: false,
                message: "포스트나 VOD가 아닙니다."
            });
        }
    } else {
        makeResult({
            success: false,
            message: "VLive 웹사이트가 아닙니다"
        });
    }
}
