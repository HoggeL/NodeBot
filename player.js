const shuffleArray = require('shuffle-array');
const ytdl = require('ytdl-core');
var SC = require('node-soundcloud');

module.exports = {
    isPlaying: false,
    nowplaying: undefined,
    dispatcher: undefined,
    queue: [],
    lastEnd: undefined,
    channel: undefined,
    connection: undefined,
    currentPlayInfo: undefined,
    discordClient: undefined,
    volume: 0.1,

    play: function(channel, connection, playInfo, isRetry) {
        if (playInfo === undefined)
            return;
        // if (this.isPlaying === true)
        //     return;

        this.nowplaying = playInfo.metadata;

        this.currentPlayInfo = playInfo;

        if (playInfo.stream === false) {
            this.dispatcher = connection.playFile(playInfo.name, { passes: 2 })
        }
        else if (playInfo.metadata.url.indexOf("youtube.com") > -1) {
            var stream = undefined;
            if (playInfo.metadata.isLive === undefined || playInfo.metadata.isLive === false)
                stream = ytdl(playInfo.name, { filter : 'audioonly', quality_label: "720p" })
	        else
                stream = ytdl(playInfo.name)
            
            this.dispatcher = connection.playStream(stream, { passes: 2 });
        }
        else if (playInfo.metadata.url.indexOf("soundcloud.com") > -1) {

            //this.dispatcher = connection.playStream(, { passes: 2 });
        }

        this.dispatcher.setVolume(this.volume);
        this.isPlaying = true;
        if (isRetry === false && playInfo.metadata !== undefined) {
            if (playInfo.metadata.isLive === true)
                channel.send("Now streaming **" + playInfo.metadata.title + "**")
            else
                channel.send("Now playing **" + playInfo.metadata.title + "**")
        }

        if (playInfo.metadata !== undefined)
            this.discordClient.user.setGame(playInfo.metadata.title);


	    this.dispatcher.on("end", end => {
            var _this = this;
            setTimeout(function() {
                _this.dispatcher.removeAllListeners("end");
                _this.dispatcher.stream.destroy();
                _this.dispatcher.destroy();

                _this.discordClient.user.setGame("nothing");

                _this.isPlaying = false;

                if (end === undefined) {
                    console.log("Song is not done yet");
                    _this.dispatcher.stream = undefined;
                    _this.play(channel, connection, playInfo, true);
                    return;
                }

                if (_this.queue.length > 0) {
                    console.log("trying to play next");
                    _this.play(channel, connection, _this.queue.shift(), false);
                }
            }, 200);
	    });
    
	    this.dispatcher.on('error', e => {
	    	console.log("Dispatcher error callback");
            console.log(e);	
	    });
    },
    start: function(message, connection) {
        if (this.isPlaying === true) {
            console.log("Already playing");
            return;
        }

        this.channel = message.channel;
        this.connection = connection;

        var date = new Date();
        this.lastEnd = date.getMilliseconds();

        if (this.queue.length > 0)
            this.play(message.channel, connection, this.queue.shift(), false);
    },
    enqueue: function(channel, playInfo, unshift = false) {
        if (playInfo.metadata instanceof Array) {
            channel.send("Adding **" + playInfo.metadata.length + "** songs to queue");
            playInfo.metadata.forEach(function(metadata) {
                if (unshift)
                    this.queue.unshift({ name: metadata.url, stream: playInfo.stream, metadata });
                else
                    this.queue.push({ name: metadata.url, stream: playInfo.stream, metadata });
            }, this);
        }
        else {
            if (playInfo.metadata !== undefined)
                channel.send("Adding **" + playInfo.metadata.title + "** to queue");

            if (unshift)
                this.queue.unshift(playInfo);
            else
                this.queue.push(playInfo);
        }
    },
    pause: function() {
        if (this.dispatcher !== undefined)
            this.dispatcher.pause();
    },
    resume: function() {
        if (this.dispatcher !== undefined)
            this.dispatcher.resume();
    },
    skip: function() {
        this.discordClient.user.setGame("nothing");
        
        this.isPlaying = false;
        if (this.dispatcher !== undefined) {
            this.dispatcher.removeAllListeners("end");
            this.dispatcher.on("end", end => { });
            this.dispatcher.end("skip");
            this.dispatcher.stream.destroy();
            this.dispatcher.destroy();
            this.play(this.channel, this.connection, this.queue.shift(), false);    
        }
    },
    getQueue: function() {
        return this.queue;
    },
    getNowPlaying: function() {
        return this.nowplaying;
    },
    destroy: function() {
        if (this.dispatcher === undefined)
            return;
        this.discordClient.user.setGame("nothing");
        this.dispatcher.removeAllListeners("end");
        this.dispatcher.on("end", end => {});
        this.dispatcher.end();
    },
    remove: function(begin, end) {
        if (end === undefined) {
            this.queue.splice(begin, this.queue.length - begin);
            return;
        }
        // 0-indexed
        begin--;
        end--;
        var numToRemove = end - begin + 1;
        console.log(this.queue.splice(begin, numToRemove));
    },
    shuffle: function() {
        shuffleArray(this.queue);
    }
}
