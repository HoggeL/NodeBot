module.exports = {
    play: function() {
        return "Plays specified song using key words, url, or playlists.";
    },
    download: function() {
        return "Same as [play], but downloads clip and plays from local storage. May result in slightly better playback (highly unlikely)";
    },
    help: function() {
        return "Shows available commands. If command supplied, displays information about that command. But you already knew this.";
    },
    pause: function() {
        return "Pauses the music. Obviously.";
    },
    resume: function() {
        return "Resumes paused music. Did you really need help with that?";
    },
    skip: function() {
        return "Plays next song in queue.";
    },
    queue: function() {
        return "Displays items in queue.";
    },
    remove: function() {
        return "Removes specified item from queue. Can remove multiple items if supplied with range (e.g: /remove 2-8).";
    },
    restart: function() {
        return "Restarts the bot, you dingus.";
    },
    clear: function() {
        return "Clears the current queue.";
    },
    playnext: function() {
        return "Puts item in the first slot of the playlist queue.";
    }
}