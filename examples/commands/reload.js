/*
THIS IS JUST THE COMMAND IT SELF, IF YOU USE THIS EXACTLY THEN YOU WILL NEED A WAY TO LOAD THE FILE LIKE THE FOLLOWING HERE:
https://solaris.codes/erelajs/guides/moreCommands.html#before-you-start

YOU ALSO NEED TO INITIATE THE MANAGER AS SHOWN HERE:
https://solaris.codes/erelajs/guides/basics.html#first-start

Or copy the code inside the run function as its simply the message and arguments.
*/



const Discord = require("discord.js")

module.exports = {
     name: "reloadmusic",

    run: async (bot, message, args) => {

      //embed
        const embed = new Discord.MessageEmbed()
        .setTitle("Reload")
        .setDescription("Sorry, the `reload` command can only be executed by the Developer.")
        .setColor("#cdf785");
        if(message.author.id !== 'your discord id here. [the owner of the discord bot]') return message.channel.send(embed); //check if the user of this command is an authorized user or not

        if(!args[0].toLowerCase()) return message.channel.send("Please provide a command name!") //check to see if args have been provided or not

        const commandName = args[0].toLowerCase() //assign a constant to the name of the command

    
      //Try-catch code block to check, delete and pull the provided comamnd
        try {
          delete require.cache[require.resolve(`./${commandName}.js`)] //fetch and delete the command cache using discord's delete require.cache property
          
          bot.commands.delete(commandName) //delete the commmand from the collection too, to avoid clustering of the data

          const pull = require(`./${commandName}.js`) //assign the name of the command to be re pulled

          bot.commands.set(pull.name, pull) //set the command again in the collection to enable it for usage

          message.channel.send(`Successfully reloaded: \`${commandName}\``) //after reloading , send a success message
        }

        catch (e) {
          console.log(e) //if an error occurs, console log it.

          return message.channel.send(`Could not Reload Command: ${commandName} From Music Module Because: \n` + "```js" + `${e}` + "```") //send the full error in the channel where the command was executed
        }


      }
}