/*
THIS IS JUST THE COMMAND IT SELF, IF YOU USE THIS EXACTLY THEN YOU WILL NEED A WAY TO LOAD THE FILE LIKE THE FOLLOWING HERE:
https://solaris.codes/erelajs/guides/moreCommands.html#before-you-start

YOU ALSO NEED TO INITIATE THE MANAGER AS SHOWN HERE:
https://solaris.codes/erelajs/guides/basics.html#first-start

Or copy the code inside the run function as its simply the message and arguments.
*/


module.exports =  {
		name: 'seek',
		
		run: async (message, args) => {
			//check if the args provided by the user is a number or not, if not, then return with a mesage saying, invalid number

		if(isNaN(args[0]) && args[0] < 0) return message.reply(`Invalid number. Please provide a number in seconds.\nCorrect Usage: \`${prefix}seek <seconds>\``);

		const player = message.client.manager.players.get(message.guild.id); //get the player.

		//check and parse the song duration. Required for seeking
		if(args[0] * 1000 >= player.queue.current.length || args[0] < 0) return message.channel.send('Cannot seek beyond length of song.'); 

		player.seek(args[0] * 1000); //seek property of erela.js, seeks the song to the provided duration

		return message.channel.send(`Seeked ${args[0]} second(s)`);
	}
};