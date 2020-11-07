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

    run: async(message, args) => {

        const player = message.client.manager.players.get(message.guild.id);//get the player

        if(!player || !player.queue[0]) return message.channel.send("No song is currently playing in your guild!"); //check if a song is playing in the current guild
        
        const { title, author, thumbnail, duration } = player.queue.current; //fetch the info of the song currentply being played. Title, author, thumbnail

        const titleFinal = Util.escapeMarkdown(title) //parse the name of the track properly

        //new embed
        const embed = new MessageEmbed()
        .setAuthor("Current song playing:", message.author.displayAvatarURL)
        .setThumbnail(thumbnail)
        .setDescription(stripIndents`
        ${player.playing ? "▶" : "⏸"} **${titleFinal}** \n\`by ${author}\` 
        `)//check if the song currently playing is actually playing or is in paused state
        .setColor("#d9d9d9");

        return message.channel.send(embed);
    }
}