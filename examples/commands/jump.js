/*
THIS IS JUST THE COMMAND IT SELF, IF YOU USE THIS EXACTLY THEN YOU WILL NEED A WAY TO LOAD THE FILE LIKE THE FOLLOWING HERE:
https://solaris.codes/erelajs/guides/moreCommands.html#before-you-start

YOU ALSO NEED TO INITIATE THE MANAGER AS SHOWN HERE:
https://solaris.codes/erelajs/guides/basics.html#first-start

Or copy the code inside the run function as its simply the message and arguments.
*/


const { Util } = require("discord.js")

module.exports =  {
		name: 'jump', //name of the module/command
		
		run: async (message, args) => {

			if (isNaN(args[0])) return message.channel.send('Invalid number.'); //check if the args provided by the user is a number or not.
			
			//check if the args provided by the user is currently playing song and if it is, return error message. 
            if (args[0] === 0) return message.channel.send(`Cannot skip to a song that is already playing. To skip the current playing song type: \`${prefix}skip\``); 
    
			const player = message.client.manager.players.get(message.guild.id); //fetch the player
			
            if ((args[0] > player.queue.length) || (args[0] && !player.queue[args[0] - 1])) return message.channel.send('Song not found.'); //check to see if the song is in the queue or not.
			
			const { title } = player.queue[args[0] - 1]; //grab the title of the song the player is jumoing to.

			const titleFinal = Util.escapeMarkdown(title) //parse the name properly using the Util class of discord.js

			if (args[0] == 1) player.stop();  //stop the player, if the song the player is jumping to is next in queue
			
            player.queue.splice(0, args[0] - 1); //jump to the song using the splice property.
			
			player.stop(); //stop the player to play the track we jumped to
    
            return message.channel.send(`Skipped to **${titleFinal}**.`);
	}
};