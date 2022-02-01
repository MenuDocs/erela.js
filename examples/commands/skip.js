/*
THIS IS JUST THE COMMAND IT SELF, IF YOU USE THIS EXACTLY THEN YOU WILL NEED A WAY TO LOAD THE FILE LIKE THE FOLLOWING HERE:
https://solaris.codes/erelajs/guides/moreCommands.html#before-you-start

YOU ALSO NEED TO INITIATE THE MANAGER AS SHOWN HERE:
https://solaris.codes/erelajs/guides/basics.html#first-start

Or copy the code inside the run function as its simply the message and arguments.
*/

module.exports = {
  name: "skip",
  run: (message) => {
    const player = message.client.manager.get(message.guild.id);
    if (!player) return message.reply("there is no player for this guild.");

    const { channel } = message.member.voice;
    if (!channel) return message.reply("you need to join a voice channel.");
    if (channel.id !== player.voiceChannel)
      return message.reply("you're not in the same voice channel.");

    if (!player.queue.current)
      return message.reply("there is no music playing.");



    player.stop();
    return message.reply(`${player.queue.current} was skipped.`);
  },
};
