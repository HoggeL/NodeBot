const request = require("request")
const http = require("http")

module.exports = {
    getSingleVideo: function(query, callback, applyLength = true) {
        var apiKey = require("./settings.js").youtube.apiKey;

        var _this = this;
        request.get("https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=" + query + "&maxResults=1&key=" + apiKey, function(error, response, body) {
            var video = JSON.parse(body).items[0];
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
        queryCollection.forEach(function(element) {
            this.getSingleVideo(element, function(metadata) {
                metadataArray.push(metadata);

                // If same length, we're done
                if (metadataArray.length === queryCollection.length) {
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
            }

            currentRequest += "," + videos[i].id;
            count++;
        }
        if (count < 50) {
            currentRequest += "&part=snippet,contentDetails&key=" + apiKey;
            requests.push(currentRequest);
        }

        requests.forEach(function(element) {
            request.get(element, function(error, response, body) {
                
                var map = {};

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

                videos.map(function(element) {
                    element.title = map[element.id].title;
                    element.length = map[element.id].seconds;
                    return element;
                });

                callback(videos);
            });
        }, this);
    }
}