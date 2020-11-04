/*
THIS IS JUST THE COMMAND IT SELF, IF YOU USE THIS EXACTLY THEN YOU WILL NEED A WAY TO LOAD THE FILE LIKE THE FOLLOWING HERE:
https://solaris.codes/erelajs/guides/moreCommands.html#before-you-start

YOU ALSO NEED TO INITIATE THE MANAGER AS SHOWN HERE:
https://solaris.codes/erelajs/guides/basics.html#first-start

Or copy the code inside the run function as its simply the message and arguments.
*/


module.exports = {
    name: "skip",
    run: async (message) => {

        const player = message.client.manager.players.get(message.guild.id);
        const queue = player.queue;
        
        if (!player) return message.reply("I have not joined a channel because I have nothing to play. Use the play command to play the song.");
        if (!player.playing) player.playing = true;

        await message.react("⏩");
        player.stop();
    }
}