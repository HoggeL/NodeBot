const Discord = require('discord.js');
const client = new Discord.Client();
//const token = 'MzAxNDUxMTMzNjE5MjczNzMw.DAjaQQ.mzyBK9v86j3dQ60pPcSPvIthG94';
const token = "MzE4MzI0MTI5MTg5MDY4ODAx.DAwvIw.rfqN9lQIxsEBCBLzze4KUVgmZ3s"; 
//const token = "MzE5OTI1NTgwMzE5Njg2NjU4.DBIBbw.ypYnKWzF1scihiP7f6MeLZBhF0E"; 
const streamOptions = { seek: 0, volume: 1 };
const commandMap = require("./command_map.js")

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

client.on('ready', () => {
	console.log('I am ready!');
	commandMap.discordClient = client;
	commandMap.__init();
	client.user.setGame("nothing");
});

function exitHandler(options, err) {
    if (options.cleanup) {
		commandMap.__dispose();
		client.destroy();
	};
    if (err) console.log(err.stack);
    if (options.exit) process.exit();
}

process.on('exit', exitHandler.bind(null,{cleanup:true}));
process.on('SIGINT', exitHandler.bind(null, {exit:true}));
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

client.on('message', message => {
	if (message.content.startsWith("/")) {
		var command = message.content.split(/^\//)[1];
		var voiceChannel = message.member.voiceChannel;

		command = command.split(' ')[0].toLowerCase();

		if (command === "restart") {
			message.channel.send("Restarting...");

			commandMap.__dispose();
			client.destroy();
	
			message.channel.stopTyping();

			const exec = require('child_process').exec;
			exec('systemctl restart nodebot', (error, stdout, stderr) => {
			if (error) {
	    		console.error(`exec error: ${error}`);
	    		return;
	  		}
	  			console.log(`stdout: ${stdout}`);
	  			console.log(`stderr: ${stderr}`);
			});
		
			console.log("Bye!");
			return;	
		}

		if (commandMap[command] !== undefined) {
			commandMap[command](message);
			message.channel.stopTyping();	
		}
		else
			message.channel.send("Command not recognized");
	}
});

client.login(token);
