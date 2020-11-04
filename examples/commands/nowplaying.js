/*
THIS IS JUST THE COMMAND IT SELF, IF YOU USE THIS EXACTLY THEN YOU WILL NEED A WAY TO LOAD THE FILE LIKE THE FOLLOWING HERE:
https://solaris.codes/erelajs/guides/moreCommands.html#before-you-start

YOU ALSO NEED TO INITIATE THE MANAGER AS SHOWN HERE:
https://solaris.codes/erelajs/guides/basics.html#first-start

Or copy the code inside the run function as its simply the message and arguments.
*/



const { MessageEmbed } = require('discord.js');
const { stripIndents } = require('common-tags');

module.exports = {
    
    name: "nowplaying",
    run: async(message) => {

        const player = message.client.manager.players.get(message.guild.id);
        if(!player || !player.queue[0]) return message.channel.send("No song is currently playing in your guild!");
        
        const { title, author, thumbnail, duration } = player.queue.current;


        const embed = new MessageEmbed()
        .setAuthor("Current song playing:", message.author.displayAvatarURL)
        .setThumbnail(thumbnail)
        .setDescription(stripIndents`
        ${player.playing ? "▶" : "⏸"} **${title}** \n\`by ${author}\`
        `)
        .setColor("#d9d9d9");

        return message.channel.send(embed);
    }
}