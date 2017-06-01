const shuffleArray = require('shuffle-array');

module.exports = {
    isPlaying: false,
    dispatcher: undefined,
    nowplaying: undefined,
    queue: [],
    lastEnd: undefined,
    channel: undefined,
    connection: undefined,
    currentPlayInfo: undefined,
    discordClient: undefined,

    play: function(channel, connection, playInfo, isRetry) {
        if (playInfo === undefined)
            return;
        // if (this.isPlaying === true)
        //     return;

        this.nowplaying = playInfo.metadata;

        this.currentPlayInfo = playInfo;
        
        if (playInfo.stream === false) {
            this.dispatcher = connection.playFile(playInfo.name, { passes: 4 })
        }
        else {
            const ytdl = require('ytdl-core');
            const stream = ytdl(playInfo.name, { filter : 'audioonly' });
	        this.dispatcher = connection.playStream(stream, { passes: 4 });
        }

        this.dispatcher.setVolume(0.1)
        this.isPlaying = true;
        if (isRetry === false)
            channel.send("Now playing **" + playInfo.metadata.title + "**")

        this.discordClient.user.setGame(playInfo.metadata.title);

	    this.dispatcher.on("end", end => {
            this.discordClient.user.setGame("nothing");

            this.dispatcher.removeAllListeners("end");
            this.dispatcher.end();

            this.isPlaying = false;

            // var dt = date.getMilliseconds() - this.lastEnd;
            // if (dt < 100) {
            //     console.log(date.getMilliseconds() - this.lastEnd);
            //     console.log("Skipping possible duplicate events");
            //     return;
            // }

            // this.lastEnd = date.getMilliseconds();

            if (this.dispatcher.time < (this.currentPlayInfo.metadata.length * 1000) - 1000) {
                console.log("Song is not done yet");
                this.play(channel, connection, playInfo, true);
                return;
            }

            if (this.queue.length > 0) {
                console.log("trying to play next");
                console.log(this.dispatcher.time);
                this.play(channel, connection, this.queue.shift(), false);
            }
	    });
    
	    this.dispatcher.on('error', e => {
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
    enqueue: function(channel, playInfo) {
        if (playInfo.metadata instanceof Array) {
            channel.send("Adding **" + playInfo.metadata.length + "** songs to queue");
            playInfo.metadata.forEach(function(metadata) {
                this.queue.push({ name: metadata.url, stream: playInfo.stream, metadata });
            }, this);
        }
        else {
            if (playInfo.announce === true)
                channel.send("Adding " + playInfo.metadata.title + " to queue");
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
    skip: function(channel, connection) {
        this.discordClient.user.setGame("nothing");
        
        this.isPlaying = false;
        if (this.dispatcher !== undefined) {
            this.dispatcher.removeAllListeners("end");
            this.dispatcher.on("end", end => {});
            this.dispatcher.end();
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
