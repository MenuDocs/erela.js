---
title: More Commands
displayHeaders: true
sidebarDepth: 1
meta:
   - name: og:title
     content: More command examples.
   - name: og:description
     content: Shows how to make simple command system and example commands.
---


A music bot with one command isn't really the best so let's add a few more! This will go through most commands including an improved play command.

## Before you start

Writing every command in the main file will get a bit chaotic so let's move each command to its own file.

First we need to modify the code a bit to add a map of the commands.

```diff
- const { Client } = require("discord.js");
+ const { Client, Collection } = require("discord.js");
+ const { readdirSync } = require("fs");
const { Manager } = require("erela.js");

const client = new Client();
client.manager = new Manager(/* options */);

+ client.commands = new Collection();
```

## Loading commands

We have to find and load all the commands in the `commands` folder so add the following below `client.commands`.

```javascript
// Read all the files in the ./commands directory
const files = readdirSync("./commands").filter(file => file.endsWith(".js"));

// Iterate over all the found files
for (const file of files) {
  // Require the file
  const command = require(`./commands/${file}`);
  // Set the command in the commands collection
  client.commands.set(command.name, command);
}
```

## Running commands

Then we have to run the command in the message event. Remove the current event as we'll be rewriting it.

```javascript
// Previous code blocks in #basics before the message event with the modified code above

client.on("message", async message => {
  if (!message.content.startsWith("!") || !message.guild || message.author.bot) return;
  const [name, ...args] = message.content.slice(1).split(/\s+/g);

  // Get the command and check if it exists
  const command = client.commands.get(name);
  if (!command) return;

  // Run the command and catch any errors
  try {
    command.run(message, args);
  } catch (e) {
    message.reply(`an error occurred while running the command: ${err.message}`);
  }
});
```

## Adding commands

Lastly, we need a command to load. Let's start with a simple `ping` command to make sure the command handler works.

In the `commands` folder add a `ping.js` file with the following contents.

::: tip
Here I omitted the `args` parameter as it is not used, Node.js will not throw an error if you do not have a parameter passed in the function call.
:::

```javascript
module.exports = {
  // The name of the command, this has to be different in every command
  name: "ping",
  // The function to run every time the command is ran by a user
  run: (message) => {
    message.reply("Pong!")
  }
}
```

Now start your bot and run `!ping`, you should see the bot reply with `@User, Pong!`, congratulations!

## More Commands

A music bot with only a ping command isn't really that great, so I've created some basic commands you can find in the [examples folder](https://github.com/MenuDocs/erela.js/tree/HEAD/examples).

Those aren't the only commands you can have. You can make some clear the queue, remove tracks, skip the current track and even more!

