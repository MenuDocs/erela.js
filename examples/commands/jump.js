const { PREFIX } = require("../../config")
const db = require("quick.db")

module.exports =  {

	config: {
		name: 'jump',
		description: 'Skips to a song.',
		usage: '<seconds>',
		aliases: ['skipto', 'j'], 
	},
		
		run: async (bot, message, args) => {
			let prefix;
			let fetched = await db.fetch(`prefix_${message.guild.id}`);
	
			if (fetched === null) {
				prefix = PREFIX
			} else {
				prefix = fetched
			}

            if (isNaN(args[0])) return message.channel.send('Invalid number.');
            if (args[0] === 0) return message.channel.send(`Cannot skip to a song that is already playing. To skip the current playing song type: \`${prefix}skip\``);
    
            const player = message.client.manager.players.get(message.guild.id);
            if ((args[0] > player.queue.length) || (args[0] && !player.queue[args[0] - 1])) return message.channel.send('Song not found.');
            const { title } = player.queue[args[0] - 1];
            if (args[0] == 1) player.stop();
            player.queue.splice(0, args[0] - 1);
            player.stop();
    
            return message.channel.send(`Skipped to **${title}**.`);
	}
};