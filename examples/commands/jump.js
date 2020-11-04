/*
THIS IS JUST THE COMMAND IT SELF, IF YOU USE THIS EXACTLY THEN YOU WILL NEED A WAY TO LOAD THE FILE LIKE THE FOLLOWING HERE:
https://solaris.codes/erelajs/guides/moreCommands.html#before-you-start

YOU ALSO NEED TO INITIATE THE MANAGER AS SHOWN HERE:
https://solaris.codes/erelajs/guides/basics.html#first-start

Or copy the code inside the run function as its simply the message and arguments.
*/


module.exports =  {
		name: 'jump',
		
		run: async (message, args) => {

            if (isNaN(args[0])) return message.channel.send('Invalid number.');
            if (args[0] === 0) return message.channel.send(`Cannot skip to a song that is already playing.`);
    
            const player = message.client.manager.players.get(message.guild.id);
            if ((args[0] > player.queue.length) || (args[0] && !player.queue[args[0] - 1])) return message.channel.send('Song not found.');
            const { title } = player.queue[args[0] - 1];
            if (args[0] == 1) player.stop();
            player.queue.splice(0, args[0] - 1);
            player.stop();
    
            return message.channel.send(`Skipped to **${title}**.`);
	}
};