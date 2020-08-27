/*
THIS IS JUST THE COMMAND IT SELF, IF YOU USE THIS EXACTLY THEN YOU WILL NEED A WAY TO LOAD THE FILE LIKE THE FOLLOWING HERE:
https://solaris.codes/erelajs-rewrite/guides/moreCommands.html#before-you-start

YOU ALSO NEED TO INITIATE THE MANAGER AS SHOWN HERE:
https://solaris.codes/erelajs-rewrite/guides/basics.html#first-start

Or copy the code inside the run function as its simply the message and arguments.
*/

const { MessageEmbed } = require("discord.js");

module.exports = {
  name: "queue",
  run: (message, args) => {
    const player = message.client.manager.players.get(message.guild.id);
    if (!player) return message.reply("there is no player for this guild.");

    const queue = player.queue;
    const embed = new MessageEmbed().setAuthor(`Queue for ${message.guild.id}`);

    const multiple = 10;
    const page = args.length && Number(args[0]) ? Number(args[0]) : 1;

    const end = page * multiple;
    const start = end - multiple;

    const tracks = queue.slice(start, end);

    if (!tracks.length) return message.reply("that page does not exist.");

    if (queue.current) embed.addField("Current", `[${queue.current.title}](${queue.current.uri})`);

    if (!tracks.length) embed.setDescription("No tracks in the queue.");
    else embed.setDescription(tracks.map((track, i) => `${start + (++i)} - [${track.title}](${track.uri})`).join("\n"));

    embed.setFooter(`Page ${page} of ${Math.ceil(queue.length / 10)}`);
    
    return message.reply(embed);
  }
}