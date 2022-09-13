const { Client, Collection } = require("discord.js");
const { readdirSync } = require("fs");
const { Manager } = require("erela.js");
const client = new Client({ intents: ["Guilds", "GuildMessages", "GuildVoiceStates", "MessageContent"] });
client.commands = new Collection();

const files = readdirSync("./commands")
  .filter(file => file.endsWith(".js"));

for (const file of files) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

client.manager = new Manager({
  nodes: [{
    host: "localhost",
    port: 1212,
    retryDelay: 5000,
  }],
  autoPlay: true,
  send: (id, payload) => {
    const guild = client.guilds.cache.get(id);
    if (guild) guild.shard.send(payload);
  }
})
  .on("nodeConnect", node => console.log(`Node "${node.options.identifier}" connected.`))
  .on("nodeError", (node, error) => console.log(
    `Node "${node.options.identifier}" encountered an error: ${error.message}.`
  ))
  .on("trackStart", (player, track) => {
    const channel = client.channels.cache.get(player.textChannel);
    channel.send(`Now playing: \`${track.title}\`, requested by \`${track.requester.tag}\`.`);
  })
  .on("queueEnd", player => {
    const channel = client.channels.cache.get(player.textChannel);
    channel.send("Queue has ended.");
    player.destroy();
  });

client.once("ready", () => {
  client.manager.init(client.user.id);
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("raw", d => client.manager.updateVoiceState(d));

client.on("messageCreate", async message => {
  if (!message.content.startsWith("!") || !message.guild || message.author.bot) return;
  const [name, ...args] = message.content.slice(1).split(/\s+/g);

  const command = client.commands.get(name);
  if (!command) return;

  try {
    command.run(message, args);
  } catch (err) {
    message.reply(`An error occurred while running the command: ${err.message}`);
  }
});

client.login("your bot token");
