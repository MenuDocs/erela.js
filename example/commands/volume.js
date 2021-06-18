/*
THIS IS JUST THE COMMAND IT SELF, IF YOU USE THIS EXACTLY THEN YOU WILL NEED A WAY TO LOAD THE FILE LIKE THE FOLLOWING HERE:
https://solaris.codes/erelajs/guides/moreCommands.html#before-you-start

YOU ALSO NEED TO INITIATE THE MANAGER AS SHOWN HERE:
https://solaris.codes/erelajs/guides/basics.html#first-start

Or copy the code inside the run function as its simply the message and arguments.
*/

module.exports = {
  name: "volume",
  run: (message, args) => {
    const player = message.client.manager.get(message.guild.id);

    if (!player) return message.reply("there is no player for this guild.");
    if (!args.length) return message.reply(`the player volume is \`${player.volume}\`.`)

    const { channel } = message.member.voice;
    
    if (!channel) return message.reply("you need to join a voice channel.");
    if (channel.id !== player.voiceChannel) return message.reply("you're not in the same voice channel.");

    const volume = Number(args[0]);
    
    if (!volume || volume < 1 || volume > 100) return message.reply("you need to give me a volume between 1 and 100.");

    player.setVolume(volume);
    return message.reply(`set the player volume to \`${volume}\`.`);
  }
}