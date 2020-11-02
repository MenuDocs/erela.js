const { PREFIX } = require("../../config")
const db = require("quick.db")

module.exports =  {

	config: {
		name: 'seek',
		description: 'Skips to a timestamp in the song.',
		usage: '<seconds>',
		aliases: ['ff']
	},
		
		run: async (bot, message, args) => {
			let prefix;
			let fetched = await db.fetch(`prefix_${message.guild.id}`);
	
			if (fetched === null) {
				prefix = PREFIX
			} else {
				prefix = fetched
			}

		if(isNaN(args[0]) && args[0] < 0) return message.reply(`Invalid number. Please provide a number in seconds.\nCorrect Usage: \`${prefix}seek <seconds>\``);

		const player = message.client.manager.players.get(message.guild.id);
		if(args[0] * 1000 >= player.queue.current.length || args[0] < 0) return message.channel.send('Cannot seek beyond length of song.');
		player.seek(args[0] * 1000);

		return message.channel.send(`Seeked ${args[0]} second(s)`);
	}
};