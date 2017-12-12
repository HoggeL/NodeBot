const request = require("request")
const http = require("http")
const encoding = require("encoding")
const queryString = require("querystring")

module.exports = {
    getSingleVideo: function(query, callback, applyLength = true) {
        var apiKey = require("./settings.js").youtube.apiKey;

        var _this = this;
        request.get("https://www.googleapis.com/youtube/v3/search?regionCode=SE&part=snippet&type=video&q=" + queryString.escape(query) + "&maxResults=1&key=" + apiKey, function(error, response, body) {

            var items = JSON.parse(body).items;
            if (items.length <= 0) {
                console.log(query, body);
                callback(undefined);
                return;
            }
            var video = items[0];
            var id = video.id.videoId;

            var metadata = {
                title: video.snippet.title,
                url: "www.youtube.com/watch?v=" + id,
                id: id,
                announce: true,
                length: 0
            };

            if (applyLength) {
                _this.applyVideosLength([ metadata ], function(newMetadata) {
                    callback(newMetadata[0])
                });
            }
            else
                callback(metadata);
        });
    },

    getMultipleVideos: function(queryCollection, callback) {
        var metadataArray = [];
        var _this = this;
        var count = 0;
        queryCollection.forEach(function(element) {
            this.getSingleVideo(element, function(metadata) {
                if (metadata !== undefined)
                    metadataArray.push(metadata);

                count++;

                // If same length, we're done
                if (count === queryCollection.length) {
                    _this.applyVideosLength(metadataArray, function(newMetadata) {
                        callback(newMetadata);
                    });
                }
            }, false);
        }, this);
    },

    applyVideosLength: function(videos, callback) {
        var apiKey = require("./settings.js").youtube.apiKey;

        var requests = []

        var count = 1;
        var currentRequest = "https://www.googleapis.com/youtube/v3/videos?id=" + videos[0].id;
        for(i = 1; i < videos.length; i++) {
            if (count >= 50) {
                currentRequest += "&part=snippet,contentDetails&key=" + apiKey;
                requests.push(currentRequest);
                currentRequest = "https://www.googleapis.com/youtube/v3/videos?id=";
                count = 0;
            }

            currentRequest += "," + videos[i].id;
            count++;
        }
        if (count < 50) {
            currentRequest += "&part=snippet,contentDetails&key=" + apiKey;
            requests.push(currentRequest);
        }

        var map = {};
        function updateVideos() {
            videos.map(function(element) {
                if (map[element.id] === undefined) {
                    // TODO: Fix this
                    element.length = 0;
                    return element;
                }
                element.title = map[element.id].title;
                element.length = map[element.id].seconds;
                return element;
            });

            callback(videos);
        }

        var count = 0;
        requests.forEach(function(element) {
            request.get(element, function(error, response, body) {
                JSON.parse(body).items.forEach(function(detail) {
                    var duration = detail.contentDetails.duration.split("PT")[1]
                    var arr = duration.split(/[A-Z]/);
                    arr.pop();
                    var s = Number(arr.pop());
                    var m = Number(arr.pop());
                    var h = Number(arr.pop());

                    var clipSeconds = (isNaN(s) ? 0 : s) + (isNaN(m) ? 0 : m * 60) + (isNaN(h) ? 0 : h * 60 * 60)

                    var id = detail.id;

                    map[id] = { seconds: clipSeconds, title: detail.snippet.title };
                }, this);
                count++;

                // If map is populated fully
                if (count === requests.length) {
                    updateVideos(); 
                }
            });
        }, this);
    }
}