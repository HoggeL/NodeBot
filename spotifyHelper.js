const utils = require("./utils");
const request = require("request")
const http = require("http")
const spotify = require("spotify-web-api-node")
const ythelper = require("./youtubeHelper.js")

module.exports = {
    getPlaylist: function(spotifyUri, callback) {
        var q = spotifyUri.split(":");
        var u = q[2];
        var i = q[4];

        var settings = require("./settings.js").spotify;

        var spotifyApi = new spotify({ clientId: settings.clientId, clientSecret: settings.clientSecret, redirectUrl: settings.redirectUrl });

        spotifyApi.clientCredentialsGrant().then(function(data) { 
            spotifyApi.setAccessToken(data.body['access_token']); 

            spotifyApi.getPlaylist(u, i, { limit: 0 }).then(function(data) { 
                var queries = [];

                data.body.tracks.items.forEach(function(e, i) {
                    queries.push(e.track.artists[0].name.replace(/\"/g, "") + " - " + e.track.name.replace(/\"/g, ""));
                }, this);

                ythelper.getMultipleVideos(queries, function(metadata) {
                    callback(metadata);
                });
            }, function(err) { 
                console.log('Something went wrong!', err);
            });

        }, function(err) { 
            console.log('Something went wrong when retrieving an access token', err);
        });
    }
}