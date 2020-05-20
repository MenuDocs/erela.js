# Erela.js &middot; [![Discord](https://discordapp.com/api/guilds/653436871858454538/embed.png)](https://discord.gg/D6FXw55) [![Downloads](https://badgen.net/npm/dt/erela.js)](https://www.npmjs.com/package/erela.js) [![Version](https://img.shields.io/npm/v/erela.js.svg?maxAge=3600)](https://www.npmjs.com/package/erela.js) [![GitHub Stars](https://badgen.net/github/stars/WarHammer414/erela.js)](https://github.com/WarHammer414/erela.js) [![License](https://badgen.net/github/license/WarHammer414/erela.js)](https://github.com/WarHammer414/erela.js/blob/master/LICENSE)

> An easy-to-use Lavalink client for NodeJS.

## Documentation

> Note: Some links do not work, I'll fix them when I can. The sidebar menu has the links that are broken.

You can find the documentation at <http://projects.warhammer.codes/erelajs> (*this* link does work)

## Installation

### Prerequisites

- [Java](https://www.java.com/en/download)

- [Lavalink](https://ci.fredboat.com/viewLog.html?buildId=lastSuccessful&buildTypeId=Lavalink_Build&tab=artifacts&guest=1)

> Note: Java v11 or newer is required to run the Lavalink.jar.


```shell
npm install erela.js
```

## Getting Started

- Create an `application.yml` file in your working directory and copy the [example](https://github.com/Frederikam/Lavalink/blob/master/LavalinkServer/application.yml.example) into the created file and edit it with your configuration.

- Run the jar file by running `java -jar Lavalink.jar` in a Terminal window.

## Example usage

> Note: Discord.js is used in this example, but it does work with other libraries with the same example but with your library functions.

```javascript
// To install Discord.JS and Erela.JS, run:
// npm install discord.js erela.js
const { Client } = require("discord.js");
const { Manager, Player } = require("erela.js");

// Initialize the Discord.JS Client.
const client = new Client();

// Initiate the Manager with some options and listen to some events.
client.manager = new Manager({
    // Pass an array of node. Note: You do not need to pass any if you are using the default values.
    nodes: [{
        host: "localhost",
        port: 2333,
        password: "youshallnotpass",
    }],
    // A send method to send data to the Discord WebSocket using your library.
    // Getting the shard for the guild and sending the data to the WebSocket.
    send(id, payload) {
        const guild = client.guilds.cache.get(id);
        if (guild) guild.shard.send(payload);
    }
})
.on("nodeConnect", node => console.log("New node connected"))
.on("nodeError", (node, error) => console.log(`Node error: ${error.message}`))
.on("trackStart", (player, track) => {
    player.textChannel.send(`Now playing: ${track.title}`)
})
.on("queueEnd", player => {
    player.textChannel.send("Queue has ended.");
    player.destroy();
})
// You must handle moves by yourself, by default Erela.JS will not change the voice channel.
.on("playerMove", (player, currentChannel, newChannel) => {
    // Note: newChannel will always be a string, if you pass the channel object you will need to get the cached channel.
    player.voiceChannel = client.channels.cache.get(newChannel);
});

// Ready event fires when the Discord.JS client is ready.
// Use EventEmitter#once() so it only fires once.
client.once("ready", () => {
    console.log("I am ready!")
    // Initiate the manager.
    client.init(client.user.id);
});

client.on("message", async message => {
    if (message.content.startsWith("!play")) {
        // Retrieves tracks with your query and the requester of the track(s).
        // Note: This retrieves tracks from youtube by default, to get from other sources you must enable them in application.yml and provide a link for the source.
        // Note: If you want to "search" with you must provide an object with a "query" property being the query to use, and "source" being one of "youtube", "soundcloud".
        // Returns a SearchResult.
        const res = await client.music.search(message.content.slice(6), message.author);

        // Create a new player. This will return the player if it already exists.
        const player = new Player({
            guild: message.guild,
            voiceChannel: message.member.voice.channel,
            textChannel: message.channel,
        });

        // Connect to the voice channel.
        player.connect();

        // Adds the first track to the queue.
        player.queue.add(res.tracks[0]);
        message.channel.send(`Enqueuing track ${res.tracks[0].title}.`);

        // Plays the player (plays the first track in the queue).
        // The if statement is needed else it will play the current track again
        if (player.queue.size == 1 && !player.playing) player.play();
    }
});

client.login("your token");
```

## Extending

Erela.JS can expand on its functionality by extending its classes.
Note: This should only used if you are adding *your own* functions.

```javascript
const { Queue } = require("erela.js");

// Use the extend method to extend the class.
Queue.extend(queue => class extends queue {
    save() {
        // Somehow save the queue.
    }
});

// Usage.
const player = // Get the player somehow.
player.queue.save();
```

## Plugins

Erela.JS can expand on its functionality with plugins.
Note: This should only be used if you want to use others functions.

```javascript
const { Manager } = require("erela.js");
const SaveQueue = require("erela.js-save-queue");

const manager = new Manager({
    plugins: [ new SaveQueue() ],
})

// Usage.
const player = // Get the player somehow.
player.queue.save();
```

> Creating your own plugins.

```javascript
const { Plugin, Queue } = require("erela.js");

Queue.extend(queue => class extends queue {
    save() {
        // Somehow save the queue.
    }
});

module.exports = class SaveQueue extends Plugin {
    // Use the constructor to pass values to the plugin.
    constructor(options) {
        this.options = options;
    }

    load(manager) {}
}

```

## Author

👤 **WarHammer414**

- Website: <https://warhammer.codes/>
- Github: [@WarHammer414](https://github.com/WarHammer414)
