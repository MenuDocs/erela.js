<div align = "center">
    <img src = "https://projects.solaris.codes/erelajs/images/transparent_logo.png">
    <hr>
    <br>
    <a href="https://discord.gg/D6FXw55">
<img src="https://img.shields.io/discord/653436871858454538?color=7289DA&label=Support&logo=discord&style=for-the-badge" alt="Discord">
</a>

<a href="https://www.npmjs.com/package/erela.js">
<img src="https://img.shields.io/npm/dw/erela.js?color=CC3534&logo=npm&style=for-the-badge" alt="Downloads">
</a>

<a href="https://www.npmjs.com/package/erela.js">
<img src="https://img.shields.io/npm/v/erela.js?color=red&label=Version&logo=npm&style=for-the-badge" alt="Npm version">
</a>

<br>

<a href="https://github.com/WarHammer414/erela.js">
<img src="https://img.shields.io/github/stars/WarHammer414/erela.js?color=333&logo=github&style=for-the-badge" alt="Github stars">
</a>

<a href="https://github.com/WarHammer414/erela.js/blob/master/LICENSE">
<img src="https://img.shields.io/github/license/WarHammer414/erela.js?color=6e5494&logo=github&style=for-the-badge" alt="License">
</a>
<hr>
</div>

## Documentation & Guides

- [Documentation](http://projects.solaris.codes/erelajs/docs/gettingstarted.html "Erela.js Documentation")

- [Guides](http://projects.solaris.codes/erelajs/guides/introduction.html "Erela.js Guides")

## Prerequisites

- Java - [Azul](https://www.azul.com/downloads/zulu-community/?architecture=x86-64-bit&package=jdk "Download Azul OpenJDK") or [Adopt](https://adoptopenjdk.net/ "Download Adopt OpenJDK") or [sdkman](https://sdkman.io/install "Download sdkman")

- [Lavalink](https://ci.fredboat.com/viewLog.html?buildId=lastSuccessful&buildTypeId=Lavalink_Build&tab=artifacts&guest=1 "Download Lavalink")

**Note**: _Java v11 or newer is required to run the Lavalink.jar. Java v13 is recommended._ If you are using **sdkman** then _its a manager, not Java, you have to install sdkman and use sdkman to install Java_

**Warning**: Java v14 has issues with Lavalink.

## Installation

**NPM** :

```bash
npm install erela.js
```

**Yarn** :

```bash
yarn add erela.js
```

## Getting Started

- Create an application.yml file in your working directory and copy the [example](https://github.com/Frederikam/Lavalink/blob/master/LavalinkServer/application.yml.example "application.yml file") into the created file and edit it with your configuration.

- Run the jar file by running `java -jar Lavalink.jar` in a Terminal window.

## Example usage

```js
// To install Discord.JS and Erela.JS, run:
// npm install discord.js erela.js
const { Client } = require("discord.js");
const { Manager } = require("erela.js");

// Initialize the Discord.JS Client.
const client = new Client();

// Initiate the Manager with some options and listen to some events.
client.manager = new Manager({
  // Pass an array of node. Note: You do not need to pass any if you are using the default values (ones shown below).
  nodes: [
    // If you pass a object like so the "host" property is required
    {
      host: "localhost", // Optional if Lavalink is local
      port: 2333, // Optional if Lavalink is set to default
      password: "youshallnotpass", // Optional if Lavalink is set to default
      secure: false, // Uses HTTPS and WSS if enabled
    },
  ],
  // Auto plays tracks after one ends, defaults to "false".
  autoPlay: true,
  // A send method to send data to the Discord WebSocket using your library.
  // Getting the shard for the guild and sending the data to the WebSocket.
  send(id, payload) {
    const guild = client.guilds.cache.get(id);
    if (guild) guild.shard.send(payload);
  },
})
  .on("nodeConnect", () => console.log("New node connected"))
  .on("nodeError", (node, error) => console.log(`Node error: ${error.message}`))
  .on("trackStart", (player, track) => {
    client.channels.cache
      .get(player.textChannel)
      .send(`Now playing: ${track.title}`);
  })
  .on("queueEnd", (player) => {
    client.channels.cache.get(player.textChannel).send("Queue has ended.");
    player.destroy();
  });

// Ready event fires when the Discord.JS client is ready.
// Use EventEmitter#once() so it only fires once.
client.once("ready", () => {
  console.log("I am ready!");
  // Initiate the manager.
  client.manager.init(client.user.id);
});

// Here we send voice data to lavalink whenever the bot joins a voice channel to play audio in the channel.
client.on("raw", (d) => client.manager.updateVoiceState(d));

client.on("message", async (message) => {
  if (message.content.startsWith("!play")) {
    // Note: This example only works for retrieving tracks using a query, such as "Rick Astley - Never Gonna Give You Up".

    // Retrieves tracks with your query and the requester of the tracks.
    // Note: This retrieves tracks from youtube by default, to get from other sources you must enable them in application.yml and provide a link for the source.
    // Note: If you want to "search" for tracks you must provide an object with a "query" property being the query to use, and "source" being one of "youtube", "soundcloud".
    const res = await client.manager.search(
      message.content.slice(6),
      message.author
    );

    // Create a new player. This will return the player if it already exists.
    const player = client.manager.create({
      guild: message.guild.id,
      voiceChannel: message.member.voice.channel.id,
      textChannel: message.channel.id,
    });

    // Connect to the voice channel.
    player.connect();

    // Adds the first track to the queue.
    player.queue.add(res.tracks[0]);
    message.channel.send(`Enqueuing track ${res.tracks[0].title}.`);

    // Plays the player (plays the first track in the queue).
    // The if statement is needed else it will play the current track again
    if (!player.playing && !player.paused && !player.queue.length)
      player.play();

    // For playlists you'll have to use slightly different if statement
    if (
      !player.playing &&
      !player.paused &&
      player.queue.size === res.tracks.length
    )
      player.play();
  }
});

client.login("your token");
```

**Note**: Discord.js is used in this example, but it does work with other libraries with the same example but with your library functions.

You can find more examples in the _[examples](./examples)_ folder.

## Contributors

👤 **Solaris**

- Author
- Website: <https://solaris.codes/>
- Github: [@Solaris9](https://github.com/Solaris9)

👤 **Anish Shobith**

- Contributor
- Github: [@Anish-Shobith](https://github.com/Anish-Shobith)

👤 **Chroventer**

- Contributor
- Github: [@chroventer](https://github.com/chroventer)
