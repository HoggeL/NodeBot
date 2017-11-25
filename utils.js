const https = require("https");
const cheerio = require("cheerio");
const fs = require('fs');
const url = require('url');
const Entities = require('html-entities').XmlEntities;

module.exports = {
    getYoutubeURL: function(query, callback) {
        var options = {}
        var isUrl = false;
        var isList = false;
        if (query.startsWith("http")) {
            options = {
                hostname: 'www.youtube.com',
                port: 443,
                path: url.parse(query).path,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json; charset=iso-8859-1',
                    "user-agent": "Mozilla/5.0 (Windows; U; Windows NT 5.1; en-GB; rv:1.8.1.6) Gecko/20070725 Firefox/2.0.0.6" 
                }
            };
            
            if (query.includes("watch"))
                isUrl = true;
            else if (query.includes("playlist"))
                isList = true;
            else
                return;
        }
        else {
            var formattedquery = query.replace(/\s/g, "+").replace(/å/g, "a").replace(/ä/g, "a").replace(/ö/g, "o");
            options = {
                hostname: 'www.youtube.com',
                port: 443,
                path: '/results?search_query='+formattedquery,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    "user-agent": "Mozilla/5.0 (Windows; U; Windows NT 5.1; en-GB; rv:1.8.1.6) Gecko/20070725 Firefox/2.0.0.6" 
                },
            };
        }

        if (isUrl === true) {
            var id = query.split("v=")[1].split("&")[0];
            var metadata = {
                title: "",
                url: "www.youtube.com/watch?v=" + id,
                id: id,
                announce: true,
                length: 0
            };

            require("./youtubeHelper").applyVideosLength([ metadata ], function(newMetadata) {
                callback(newMetadata[0]);
            });
            return;
        }

        if (isList === false) {
            require("./youtubeHelper").getSingleVideo(query, function(metadata) {
                callback(metadata);
            })
            return;
        }

        https.get(options, (res) => {
            res.setEncoding('utf8');
            var body = ""

            res.on("data", function(chunk) {
                body += chunk.toString();
            });
            res.on("end", function() {
                var entities = new Entities();                
                var $ = cheerio.load(body);
                if (isList === true) {
                    var songs = []
                    $("tr.pl-video").each(function(elem) {
                        if ($(this).find("div.timestamp").find("span").html() == null)
                            return false;
                            
                        var a = $(this).find("div.timestamp").find("span").html().split(":");
                        var seconds = ((+a[0]) * 60) + (+a[1]);

                        var metadata = {
                            title: entities.decode($(this).find("a.yt-uix-tile-link").html().trim()),
                            announce: !isList,
                            url: "www.youtube.com" + $(this).find("a.yt-uix-tile-link").attr("href"),
                            length: seconds
                        };

                        songs.push(metadata);
                    });
                    callback(songs);
                }
                else if (isUrl === false) {
                    if ($( "div.yt-lockup" ).length <= 0)
                        callback(undefined);
                    $("div.yt-lockup").each(function(elem) {
                        var title = $(this).find("a.yt-uix-tile-link");
                        if (title.attr("href").includes("user") || title.attr("href").includes("list") || title.attr("href").includes("ads"))
                            return true;

                        var time = $(this).find("span.video-time").html();
                        var a = undefined;
                        var seconds = 0;
                        if (time !== null) {
                            a = $(this).find("span.video-time").html().split(":");
                            seconds = ((+a[0]) * 60) + (+a[1]);
                        }

                        var metadata = { 
                            title: entities.decode(title.html().trim()),
                            announce: !isList,
                            url: "www.youtube.com" + title.attr("href"),
                            length: seconds
                        };

                        callback(metadata);
                        return false;
                    });
                } else {
                    const utils = require("./utils.js")
                    utils.getYoutubeURL($("span#eow-title").attr("title"), function(_metadata){
                        var len = 0;
                        if (_metadata !== undefined)
                            len = _metadata.length;

                        var metadata = { 
                            title: $("span#eow-title").attr("title"),
                            announce: true,
                            url: query,
                            length: len
                        };
                        callback(metadata);
                    });
                }
            });
        });
    },

    getSoundCloudUrl(query, callback) {
        callback({
            title: "asd",
            url: "https://soundcloud.com/canti_god_of_the_black_flames",
            announce: true,
            length: 110,
        });
    },

    // downloadVideo: function(videoUrl, callbackInfo, callbackDone) {
    //     console.log("Downloading " + videoUrl)

    //     var video = youtubedl(videoUrl,
    //         // Optional arguments passed to youtube-dl.
    //         ['--format=18'],
    //         // Additional options can be given for calling `child_process.execFile()`.
    //         { cwd: __dirname });

    //     // Will be called when the download starts.
    //     video.on('info', function(info) {
    //         console.log('Download started');
    //         console.log('filename: ' + info._filename);
    //         console.log('size: ' + info.size);
    //         this._filename = info._filename;
    //         callbackInfo("./audio_cache/" + this._filename);
    //         this.pipe(fs.createWriteStream("./audio_cache/" + this._filename));
    //     });

    //     video.on('complete', function complete(info) {
    //         console.log("already done");
    //         callbackDone("./audio_cache/" + this._filename);
    //     });

    //     video.on('end', function() {
    //         callbackDone("./audio_cache/" + this._filename);
    //     });
    // }
}