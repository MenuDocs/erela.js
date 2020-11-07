---
title: Updating
displayHeaders: true
sidebarDepth: 1
---

::: tip
Anything not specified means it was not changed or was forgotten to be added here.
:::

## ErelaClient

Previously:
```javascript
const { ErelaClient } = require("erela.js");
const { Client } = require("discord.js");

const client = new Client();
const nodes = [
  {
    host: "localhost",
    password: "youshallnotpass",
    port: 2333
  }
];

const options = {};

client.music = new ErelaClient(client, nodes, options)
```
New:
```javascript
const { Manager } = require("erela.js");
const { Client } = require("discord.js");

const client = new Client();
const nodes = [
  {
    host: "localhost",
    password: "youshallnotpass",
    port: 2333
  }
];

client.music = new Manager({
  nodes,
  send: (id, payload) => {
    const guild = client.guilds.cache.get(id);
    if (guild) guild.shard.send(payload);
  } 
})
```

Previous in Erela.js v1 you would initiate the ErelaClient class, this was changed to Manager with different parameters.

<h3>What changed</h3>

- ErelaClient was renamed to Manager
- You no longer need to pass the client
- Most of the node options can be omitted
- You no longer need to provide a node if you're using completely default lavalink options
- You ***need*** provide a `send` function to send voice data to Discord

## Player

## Creating players

Before you had to get the PlayerStore and use the `spawn` method to create a Player, now PlayerStore was removed as it's completely useless and bloated the package.

You can still create players using a similar method named `create` like so:

```javascript
const player = manager.create(options);
```

Or directly off the Player class:

```javascript
const player = new Player(options);
```

In both these examples the [`options`](/docs/typedefs/ManagerOptions.html) is same as before.

## Destroying players

In v1 you had to destroy players using the PlayerStore `destroy` method, now you use it off of the Manager class or directly on the Player class.

```javascript
const player = manager.get("guildId")

manager.destroy("guildId");

// Or

player.destroy();
```

## Setting equalizer

Before v2 you had to provide an array of objects to set the equalizer, now you just have to put each object on their own.
If your band objects are in an array you can use the [spread operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax) to *spread* the objects out.

```javascript
// Before
player.setEQ([{ band: 0, gain: .25}, { band: 2, gain: .25}])

// After
player.setEQ({ band: 0, gain: .25}, { band: 1, gain: .25})
```

## Connecting to voice

Before Erela.js would automatically connect to the voice channel. Now you must use the <code>Player#<a href="/docs/classes/Player.html#connect">connect</a>()</code> method.

```javascript
const player = new Player(options);
player.connect();
```

## Queue

The Queue class had some changed regarding the current song, before it was the first element in the array but was changed to the `current` property.

## Utils

The utils was removed as it bloated the package and didn't offer as much flexibility. There are some packages below to parse and format times.

## Format time

- [https://www.npmjs.com/package/humanize-duration](https://www.npmjs.com/package/humanize-duration)

## Parse time

- [https://www.npmjs.com/package/timestring](https://www.npmjs.com/package/timestring)
