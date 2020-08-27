---
title: Basics
displayHeaders: true
sidebarDepth: 1
---

## Installation

::: tip
This guide assumes you already have knowledge about JavaScript and a Discord API library installed, for this guide Discord.JS will be used.
:::

To start using Erela.js you first have to install it using NPM or Yarn.

:::: tabs type:border-card stretch:true

<!-- remove later on -->
::: tip
If you are looking to use the beta then you must use the `beta` tag like so `erela.js@beta`
:::

::: tab NPM
```bash
npm install erela.js
```
:::

::: tab Yarn
```bash
yarn add erela.js
```
:::
::::

## First start

The first place to start with Erela.js is the Manager class with some [options](https://projects.solaris.codes/erelajs-rewrite/docs/typedefs/ManagerOptions.html).

```javascript
// Require both libraries
const { Client } = require("discord.js");
const { Manager } = require("erela.js");

// Initiate both main classes
const client = new Client();

// Define some options for the node
const nodes = [
  {
    host: "localhost",
    password: "youshallnotpass",
    port: 2333,
  }
];

// Assign Manager to the client variable
client.manager = new Manager({
  // The nodes to connect to, optional if using default lavalink options
  nodes,
  // Automatically play the next track
  autoPlay: true,
  // Method to send voice data to Discord
  send: (id, payload) => {
    const guild = client.guilds.cache.get(id);
    if (guild) guild.shard.send(payload);
  }
});

// Listen for when the client becomes ready
client.once("ready", () => {
  // Initiates the manager and connects to all the nodes
  client.manager.init(client.user.id);
  console.log(`Logged in as ${client.user.tag}`);
});

// THIS IS REQUIRED. Send raw events to Erela.js
client.on("raw", d => client.manager.updateVoiceState(d));

// Finally login at the END of your code
client.login("your bot token here");
```

## The play command

The whole idea of a music bot is to play music right? So let's write a command to play songs.

First you want to listen to the message event.

```javascript
// Add the previous code block to this

client.on("message", async message => {
  // Some checks to see if it's a valid message
  if (!message.content.startsWith("!") || !message.guild || message.author.bot) return;

  // Get the command name and arguments
  const [command, ...args] = message.content.slice(1).split(/\s+/g);

  // Check if it's the play command
  if (command === "play") {
    if (!message.member.voice.channel) return message.reply("you need to join a voice channel.");
    if (!args.length) return message.reply("you need to give me a URL or a search term.");

    const search = args.join(" ");
    let res;

    try {
      // Search for tracks using a query or url, using a query searches youtube automatically and the track requester
      res = await client.manager.search(search, message.author);
      // Check the load type as this command is not that advanced for basics
      if (res.loadType === "LOAD_FAILED") throw new Error(res.exception.message);
      else if (res.loadType === "PLAYLIST_LOADED") throw new Error("Playlists are not supported with this command.");
    } catch (err) {
      return message.reply(`there was an error while searching: ${err.message}`);
    }

    // Create the player 
    const player = client.manager.create({
      guild: message.guild.id,
      voiceChannel: message.member.voice.channel.id,
      textChannel: message.channel.id,
    });
  
    // Connect to the voice channel and add the track to the queue
    player.connect();
    player.queue.add(res.tracks[0]);
  
    // Checks if the client should play the track if it's the first one added
    if (!player.playing && !player.paused && !player.queue.length) player.play()

    return message.reply(`enqueuing ${res.tracks[0].title}.`);
  }
});
```

## Events

You can play songs but what about knowing when a song starts or end? Those are events that the Manager class emits.

```javascript
client.manager = new Manager(/* options above */)
    // Chain it off of the Manager instance
    // Emitted when a node connects
    .on("nodeConnect", node => console.log(`Node "${node.options.identifier}" connected.`));

// Or each listener on their own
// Emitted when a track starts
client.manager.on("trackStart", (player, track) => {
  const channel = client.channels.cache.get(player.textChannel);
  channel.send(`Now playing: \`${track.title}\`, requested by \`${track.requester.tag}\`.`);
});

// Emitted the player queue ends
client.manager.on("queueEnd", player => {
  const channel = client.channels.cache.get(player.textChannel);
  channel.send("Queue has ended.");
  player.destroy();
});
```
