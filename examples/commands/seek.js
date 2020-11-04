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

		if(isNaN(args[0]) && args[0] < 0) return message.reply(`Invalid number. Please provide a number in seconds.\nCorrect Usage: \`seek <seconds>\``);

		const player = message.client.manager.players.get(message.guild.id);
		if(args[0] * 1000 >= player.queue.current.length || args[0] < 0) return message.channel.send('Cannot seek beyond length of song.');
		player.seek(args[0] * 1000);

		return message.channel.send(`Seeked ${args[0]} second(s)`);
	}
};