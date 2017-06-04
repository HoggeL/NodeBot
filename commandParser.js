const player = require("./player.js");
const utils = require("./utils");
const doc = require("./doc.js");

function calculateTime(seconds) {
	var time = seconds;
	var _m = Math.floor(time / 60);
	var _s = Math.floor(time - _m * 60);
	var _h = Math.floor(time / 3600);
	return { s: _s, m: _m, h: _h };
}

function getNowPlaying() {
	var nowPlaying = player.getNowPlaying();

	var m = "";
	if (nowPlaying !== undefined) {
		var n = calculateTime(nowPlaying.length);
		var c = calculateTime(player.dispatcher.time / 1000);

		var pstr = "`["
				 + (c.h > 0 ? c.h + ":" : "")
			     + (c.m <= 9 ? "0" + c.m : c.m) + ":"
				 + (c.s <= 9 ? "0" + c.s : c.s) + "/"
				 + (n.h > 0 ? n.h + ":" : "")
				 + (n.m <= 9 ? "0" + n.m : n.m) + ":"
				 + (n.s <= 9 ? "0" + n.s : n.s) + "]`";

		m = "Playing **" + nowPlaying.title + "** " + pstr + "\n\n";
	}
	return m;
}

function parsePlayMessage(message, callback) {
	message.channel.startTyping();
	var songname = message.content.split(/^\//)[1].split(/^([^\s]*)(\s)/)[3];

	if (songname === undefined) {
		message.channel.send("That is not a valid song name, you dofus!");
		message.channel.stopTyping();
		return;
	}

	var voiceChannel = this.voiceChannel;

	if (voiceChannel === undefined) {
		if (message.member.voiceChannel === undefined) {
			message.channel.send("You are not in a voice channel");
			message.channel.stopTyping();
			return;
		}
		else
			voiceChannel = message.member.voiceChannel
	}

	voiceChannel.join().then(connection =>{
		this.connection = connection;
		utils.getYoutubeURL(songname, function(metadata) {
			message.channel.stopTyping();
			callback(metadata);
		});

	}).catch(err => console.log(err));
}

//
// commands starting with "__" are ignored by message parsing
//
module.exports = {
	connection: undefined,
	discordClient: undefined,
	
	__init : function() {
		player.discordClient = this.discordClient;
	},
	__dispose: function() {
		player.destroy();
		if (this.connection !== undefined)
			this.connection.disconnect();
	},
	play: function(message) {
		parsePlayMessage(message, function(metadata) {
			if (metadata === undefined) {
				message.channel.send("I did not find anything like that");
				message.channel.stopTyping();
				return;
			}

			player.enqueue(message.channel, { name: metadata.url, stream: true, metadata })
			player.start(message, connection);
		});
	},
	playnext: function(message) {
		parsePlayMessage(message, function(metadata) {
			if (metadata === undefined) {
				message.channel.send("I did not find anything like that");
				message.channel.stopTyping();
				return;
			}

			player.enqueue(message.channel, { name: metadata.url, stream: true, metadata }, true)
			player.start(message, connection);
		});
	},
	pause: function(message) {
		player.pause();
		message.channel.stopTyping();
	},
	resume: function(message) {
		player.resume();
		message.channel.stopTyping();
	},
	skip: function(message) {
		player.skip();
		message.channel.stopTyping();
	},
	queue: function(message) {
		var nowPlaying = player.getNowPlaying();

		var m = getNowPlaying();
		
		var queue = player.getQueue();
		m += "**Queue:** ```Markdown\n";
		if (queue.length <= 0)
			m += "empty";

		var i = 0; 
		queue.forEach(function(element) {
			if (i >= 20) {
				if (i == 20)
					m += "\n" + (queue.length - 20) + " more items in queue.";
				i++;
				return;
			}
			i++;
			m += i + ". " + element.metadata.title + "\n";
		}, this);

		m += "\n```";
		message.channel.send(m);
		message.channel.stopTyping();
	},
	np: function(message) {
		message.channel.send(getNowPlaying());
	},
	clear: function(message) {
			player.remove(0, undefined);
		if (Math.random() <= 0.25)
			message.channel.send("Gotcha, fam!");
		else
			message.channel.send("Playlist cleared");
	},
	remove: function(message) {
		var n = message.content.split(/^\//)[1].split(/^([^\s]*)(\s)/)[3];
	
		if (n.includes("-")) {
			var begin = Number(n.split("-")[0]);
			var end = Number(n.split("-")[1]);


			if (!isNaN(begin) && !isNaN(end) && begin < end) {
				player.remove(begin, end);
				message.channel.send("Removing song **" + begin + "** to **" + end + "**");
			}
			else
				message.channel.send("Not a valid range");

			message.channel.stopTyping();
			return;
		}
		
		n = Number(n);

		message.channel.stopTyping();
		if (isNaN(n)) {
			message.channel.send("Not a valid number");
			message.channel.stopTyping();
			return;
		}

		player.remove(n, n);
		message.channel.stopTyping();
		message.channel.send("Removing song **" + n + "**");
		message.channel.stopTyping();
	},
	cheekybreeky: function(message) {
		message.channel.send("Sluta nu, Hampus",  { tts:true });
		message.channel.stopTyping();
	},
	help: function(message) {
		var extraParam = message.content.split(/^\//)[1].split(/^([^\s]*)(\s)/)[3];
		if (extraParam !== undefined) {
			var e = extraParam.toLowerCase();
			if (doc[e] !== undefined) {
				message.channel.send("**" + e + ":**```Markdown\n" + doc[e]() + "\n```");
			}
			else
				message.channel.send("Command not recognized");

			message.channel.stopTyping();
			return;
		}

		var commands = Object.keys(this);
		var m = "**Available commands:** ```css\n"

		commands.forEach(function(element) {
			if (this[element] instanceof Function && !element.startsWith("__"))
				m += "/" + element + " ";
		}, this);

		m += "\n```\n**/help [command] for more information**";
		message.channel.send(m);
		message.channel.stopTyping();
	},
	shuffle: function(message) {
		player.shuffle();
		message.channel.send("Shuffling");
		message.channel.stopTyping();
	},
	todo: function(message) {
		message.channel.send("Todo: ```Markdown\n1.playnext\n2.download\n```");
		message.channel.stopTyping();
	}
}
// Disabled for now
// module.exports["download"] = function(message) {
// 	message.channel.startTyping();

// 	var songname = message.content.split(/^\//)[1].split(/^([^\s]*)(\s)/)[3];

// 	if (songname === undefined) {
// 		message.channel.send("That is not a valid song name, you dofus!");
// 		message.channel.stopTyping();
// 		return;
// 	}

// 	var voiceChannel = this.voiceChannel;

// 	if (voiceChannel === undefined) {
// 		if (message.member.voiceChannel === undefined) {
// 			message.channel.send("You are not in a voice channel");
// 			message.channel.stopTyping();
// 			return;
// 		}
// 		else
// 			voiceChannel = message.member.voiceChannel
// 	}

// 	voiceChannel.join().then(connection =>{
// 		this.connection = connection;
// 		utils.getYoutubeURL(songname, function(metadata) {
// 			utils.downloadVideo(metadata.url, 
// 			function(fname) {
// 				player.enqueue(message.channel, { name: fname, stream: false, metadata })	
// 			}, 
// 			function(fname) {
// 				player.start(message, connection);
// 				message.channel.stopTyping();
// 			});
// 		});
// 	}).catch(err => console.log(err));
// }
