# Erela.js

[![Discord](https://discordapp.com/api/guilds/653436871858454538/embed.png)](https://discord.gg/D6FXw55)
[![Downloads](https://badgen.net/npm/dt/erela.js)](https://www.npmjs.com/package/erela.js)
[![Version](https://img.shields.io/npm/v/erela.js.svg)](https://www.npmjs.com/package/erela.js)
[![GitHub Stars](https://badgen.net/github/stars/WarHammer414/erela.js)](https://github.com/WarHammer414/erela.js)
[![License](https://badgen.net/github/license/WarHammer414/erela.js)](https://github.com/WarHammer414/erela.js/blob/master/LICENSE)

> An easy-to-use Lavalink client for NodeJS.

## Documentation

> Note: Some links do not work, I'll fix them when I can. The sidebar menu has the links that are broken.

New to Erela.js? Check out the [API documentation](http://projects.warhammer.codes/erelajs).

## Installation

```bash
npm install erela.js
```

## Prerequisites

You will have to install Java runtime and Lavalink.jar file to run Erela.js. You can find both of them here:

- [Java](https://www.java.com/en/download)
- [Lavalink](https://ci.fredboat.com/viewLog.html?buildId=lastSuccessful&buildTypeId=Lavalink_Build&tab=artifacts&guest=1)

> Note: Java v11 or newer is required to run the Lavalink.jar.

## Getting Started

- Create an `application.yml` file in your working directory and copy the [example](https://github.com/Frederikam/Lavalink/blob/master/LavalinkServer/application.yml.example) content into the created file (`application.yml`) and modify it with your configuration.
- Run the `Lavalink.jar` file by running `java -jar Lavalink.jar` in your Terminal/cmd/Powershell.

## Example usage

> Note: Erela.js does not work with Eris, thus we are using [Discord.js](https://discord.js.org) for this example.

```javascript
// To install Discord.js, run `npm i discord.js` in your console.
const { Client } = require("discord.js");
const { ErelaClient } = require("erela.js");

// Initialize the Discord.js Client instance and an array of nodes for Erela.js.
const client = new Client();
const nodes = [{
    host: "localhost",
    port: 2333,
    password: "youshallnotpass",
}];

// Ready event fires when the Discord.js client has sucessfulyl connected to the API.
// Use EventEmitter#once to fire the event only once.
client.once("ready", () => {
    console.log("I am ready!")
    // Initializes an Erela client with the Discord.js client and nodes.
    client.music = new ErelaClient(client, nodes);
    // Listens to events.
    client.music
        .on("nodeConnect", node => console.log("New node connected"));
        .on("nodeError", (node, error) => console.log(`Node error: ${error.message}`));
        .on("trackStart", (player, track) => player.textChannel.send(`Now playing: ${track.title}`));
        .on("queueEnd", player => {
            player.textChannel.send("Queue has ended.")
            client.music.players.destroy(player.guild.id);
        });
});

client.on("message", async message => {
    if (message.content.startsWith("!play")) {
        // For Discord.js v11 or older:
        const { voiceChannel } = message.member;
        // For discord.js stable version (v12), you need to use:
        // const { channel } = message.member.voice;

        // Spawns a player and joins the voice channel.
        const player = client.music.players.spawn({
            guild: message.guild,
            voiceChannel: voiceChannel,
            textChannel: message.channel,
        });

        // Searches Youtube with your query and the requester of the track(s).
        // Returns a SearchResult with tracks property.
        const res = await client.music.search(message.content.slice(6), message.author);

        // Adds the first track to the queue.
        player.queue.add(res.tracks[0]);
        message.channel.send(`Enqueuing track ${res.tracks[0].title}.`)

        // Plays the player (plays the first track in the queue).
        // The if statement is needed else it will play the current track again
        if (!player.playing) player.play();
    }
});

client.login("your token");
```

## Andesite-node

Erela.js can work with [andesite-node](https://github.com/natanbc/andesite-node). For filters (other than equalizer) you have to extend Player and add methods for each filter.

```javascript
const { Player } = require("erela.js");

class CustomPlayer extends Player {
    constructor(...args) {
        super(...args);
    }

    setTimescale(speed, pitch, rate) {
        this.node.send({
            op: "filters",
            guildId: this.guild.id,
            timescale: {
                speed,
                pitch,
                rate
            },
        });
    }
}

client.once("ready", () => {
    client.music = new ErelaClient(client, nodes, {
        player: CustomPlayer
    });
});
```

## Author

👤 **WarHammer414**

- Website: <https://warhammer.codes/>
- Github: [@WarHammer414](https://github.com/WarHammer414)
