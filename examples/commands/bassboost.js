/*
THIS IS JUST THE COMMAND IT SELF, IF YOU USE THIS EXACTLY THEN YOU WILL NEED A WAY TO LOAD THE FILE LIKE THE FOLLOWING HERE:
https://solaris.codes/erelajs-rewrite/guides/moreCommands.html#before-you-start

YOU ALSO NEED TO INITIATE THE MANAGER AS SHOWN HERE:
https://solaris.codes/erelajs-rewrite/guides/basics.html#first-start

Or copy the code inside the run function as its simply the message and arguments.
*/

const levels = {
  none: 0.0,
  low: 0.10,
  medium: 0.15,
  high: 0.25,
};

module.exports = {
  name: "bassboost",
  run: (message, args) => {
    const player = message.client.manager.players.get(message.guild.id);
    if (!player) return message.reply("there is no player for this guild.");

    const { channel } = message.member.voice;
    
    if (!channel) return message.reply("you need to join a voice channel.");
    if (channel.id !== player.voiceChannel) return message.reply("you're not in the same voice channel.");

    let level = "none";
    if (args.length && args[0].toLowerCase() in levels) level = args[0].toLowerCase();

    player.setEQ(...new Array(3).fill(null).map((_, i) => ({ band: i, gain: levels[level] })));

    return message.reply(`set the bassboost level to ${level}`);
  }
}
