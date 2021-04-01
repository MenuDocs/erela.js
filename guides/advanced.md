---
title: Advanced
displayHeaders: true
sidebarDepth: 1
meta:
   - name: og:title
     content: Guide for advanced usage.
   - name: og:description
     content: Set player data, track partials, create UnresolvedTrack, plugins and extend classes.
---

## Player data

Players can hold custom data like the text channel object or more.
All of this data is similar to a Map and can be referenced easily as shown below.

```javascript
const player = manager.create(/* options */);

// Settings data
player.set("textChannel", message.channel);

// Getting data
const textChannel = player.get("textChannel");
```

Now the type will show as `any` for typings, but you can add some JSDoc in your editor to give it a proper type for your editor.

```javascript
/** @type {import("discord.js").TextChannel} */
const textChannel = player.get("textChannel");
```

## Track Partials

If you only need a part of the track object then you can provide an array with the properties to keep.
The [`track`](/docs/typedefs/Track.html#track) property will always be present as it's required to play tracks.

```javascript
const { Manager } = require("erela.js");

const manager = new Manager({
  trackPartial: [ "title", "duration", "requester" ] // Every track object will have these properties. 
})
```

## UnresolvedTrack

Lavalink will only play from the sources enabled, if you want to use Spotify links you'll have to get the YouTube equivalent.
Erela offers a UnresolvedTrack option that will resolve into a playable track before its played.
This is useful for supporting other sources without sending dozens of requests to YouTube for playlists in a short time.

```javascript
const { TrackUtils } = require("erela.js");

// Basic way using just a query.
const unresolvedTrack = TrackUtils.buildUnresolved("Never gonna give you up - Rick Astley", message.author.tag);

// Advanced way using the title, author, and duration for a precise search.
const unresolvedTrack = TrackUtils.buildUnresolved({
  title: "Never gonna give you up",
  author: "Rick Astley",
  duration: 213000
}, message.author.tag);

player.queue.add(unresolvedTrack);
// Or.
player.play(unresolvedTrack);
```

## Extending

You can extend Erela.js' classes to add more functionality like adding some extra handy methods.

::: tip
You should not do exactly this as it is a waste of resources, a better way would be to slice the array before formatting it, but for space here I omitted it.
:::

```javascript
const { Structure } = require("erela.js");

Structure.extend("Queue", Queue => class extends Queue {
  format(string, ...vars) {
    return this.map(track => {
      let local = string;
      for (let i in vars) local = local.replace(`{${i}}`, track[vars[i]]);
      return local;
    })
  }
})
``` 

Then you can use it as so. 

```javascript
const tracks = player.queue.format("[{0}]({1})", "title", "uri");
```

## Plugins

Erela.js' functionality can be expanded even more with the use of plugins, they can add all sorts of new functions such as saving the queue as a playlist and more.

### Using plugins

```javascript
const { Manager } = require("erela.js");
const MyPlugin = require("my-erela.js-plugin");

const manager = new Manager({
  plugins: [ new MyPlugin({ foo: "bar" }) ]
})
```

### Writing plugins

```javascript
const { Plugin } = require("erela.js");

module.exports = class MyPlugin extends Plugin {
  constructor(options) {
    super();
    this.options = options; // will be { foo: 'bar' }
  }
  
  load(manager) {}
}
```

### Spotify

You can search using Spotify URL's using the [Spotify plugin](https://github.com/MenuDocs/erela.js-spotify) for Erela.JS. 
