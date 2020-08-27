/*
THIS IS JUST THE COMMAND IT SELF, IF YOU USE THIS EXACTLY THEN YOU WILL NEED A WAY TO LOAD THE FILE LIKE THE FOLLOWING HERE:
https://solaris.codes/erelajs-rewrite/guides/moreCommands.html#before-you-start

YOU ALSO NEED TO INITIATE THE MANAGER AS SHOWN HERE:
https://solaris.codes/erelajs-rewrite/guides/basics.html#first-start

Or copy the code inside the run function as its simply the message and arguments.
*/

module.exports = {
  name: "pause",
  run: (message) => {
    const player = message.client.manager.players.get(message.guild.id);
    if (!player) return message.reply("there is no player for this guild.");

    const { channel } = message.member.voice;
    
    if (!channel) return message.reply("you need to join a voice channel.");
    if (channel.id !== player.voiceChannel) return message.reply("you're not in the same voice channel.");
    if (player.paused) return message.reply("the player is already paused.");

    player.pause(true)
    return message.reply("paused the player.");
  }
}