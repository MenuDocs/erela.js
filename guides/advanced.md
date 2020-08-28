---
title: Advanced
displayHeaders: true
sidebarDepth: 1
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

Now the type will show as `any` for typings, but you can add some JSDoc to give it a proper type for your editor.
JSDoc must be defined by you or else there will be no type besides `any` in your editor.

```javascript
/** @type {import("discord.js").TextChannel} */
const textChannel = player.get("textChannel");
```

## Extending

You can extend Erela.js' classes to add more functionality like adding some extra handy methods.

::: tip
You should not do exactly this as it is a waste of resources, a better way would be to slice the array before formatting it, but for space here I omitted it.
:::

```javascript
const { Structure } = require("erela.js");

Structure.extend("Queue", Queue => class extends Queue {
  format(string, vars) {
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
    this.options = options;
  }
  
  load(manager) {}
}
```
