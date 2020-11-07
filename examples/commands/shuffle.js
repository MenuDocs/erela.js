/*
THIS IS JUST THE COMMAND IT SELF, IF YOU USE THIS EXACTLY THEN YOU WILL NEED A WAY TO LOAD THE FILE LIKE THE FOLLOWING HERE:
https://solaris.codes/erelajs/guides/moreCommands.html#before-you-start

YOU ALSO NEED TO INITIATE THE MANAGER AS SHOWN HERE:
https://solaris.codes/erelajs/guides/basics.html#first-start

Or copy the code inside the run function as its simply the message and arguments.
*/



module.exports = {
        name: "shuffle",

    run: async(message, args) => {
        const player = message.client.manager.players.get(message.guild.id); //get the player
        
        const { channel } = message.member.voice; //get the member voice channel
        
        if (!channel) return message.reply('You need to join a voice channel.'); //if the user has not joined any voice channel, return.
        
        if(!player || !player.queue[0]) return message.channel.send("No song is currently playing in this guild."); //Check if the player is playing a song, or have tracks in queue.
        
        player.queue.shuffle(); //shuffle property of erela.js manager player. Shuffles track automatically in any random order.
        
        return message.channel.send("The queue is now shuffled.");
    }
}