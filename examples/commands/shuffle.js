/*
THIS IS JUST THE COMMAND IT SELF, IF YOU USE THIS EXACTLY THEN YOU WILL NEED A WAY TO LOAD THE FILE LIKE THE FOLLOWING HERE:
https://solaris.codes/erelajs/guides/moreCommands.html#before-you-start

YOU ALSO NEED TO INITIATE THE MANAGER AS SHOWN HERE:
https://solaris.codes/erelajs/guides/basics.html#first-start

Or copy the code inside the run function as its simply the message and arguments.
*/



module.exports = {
    
    name: "shuffle",
    run: async(bot, message, args) => {
        const player = message.client.manager.players.get(message.guild.id);
        
        const { channel } = message.member.voice;
        
        if (!channel) return message.reply('You need to join a voice channel.');
        
        if(!player || !player.queue[0]) return message.channel.send("No song is currently playing in this guild.");
        
        player.queue.shuffle();
        
        return message.channel.send("The queue is now shuffled.");
    }
}