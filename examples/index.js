import "dotenv/config";
import { Client, Collection } from "discord.js";
import { readdirSync } from "fs";
import { Manager } from "erela.js";

const client = new Client({ intents: ["Guilds", "GuildMessages", "GuildVoiceStates", "MessageContent"] });
client.commands = new Collection();

async function loadCommands() {
    const files = readdirSync("./commands")
        .filter(file => file.endsWith(".js"));

    for (const file of files) {
        const { default: command } = await import(`./commands/${file}`);
        client.commands.set(command.name, command);
    }
}

client.manager = new Manager({
    nodes: [{
        // public lavalink node
        host: "krn.2d.gay",
        port: 443,
        retryDelay: 5000,
        secure: true,
        password: "AWP)JQ$Gv9}dm.u"
    }],
    defaultSearchPlatform: "soundcloud",
    autoPlay: true,
    send: (id, payload) => {
        const guild = client.guilds.cache.get(id);
        if (guild) guild.shard.send(payload);
    }
});

client.manager.on("nodeConnect", node => {
    console.log(`Node "${node.options.identifier}" connected.`)
});

client.manager.on("nodeError", (node, error) => {
    console.log(`Node "${node.options.identifier}" encountered an error: ${error.message}.`)
});

client.manager.on("trackStart", (player, track) => {
    const channel = client.channels.cache.get(player.textChannel);
    channel.send(`Now playing: \`${track.title}\`, requested by \`${track.requester.tag}\`.`);
});

client.manager.on("queueEnd", player => {
    const channel = client.channels.cache.get(player.textChannel);
    channel.send("Queue has ended.");
    player.destroy();
});

client.once("ready", () => {
    loadCommands();
    client.manager.init(client.user.id);
    console.log(`Logged in as ${client.user.tag}`);
});

client.manager.on("playerMove", (player, from, to) => {
    console.log(`player ${player.guild} moved from ${from} to ${to}`)
});

client.manager.on("playerDisconnect", (player, from) => {
    console.log(`player ${player.guild} disconnected from ${from}`);
    player.destroy();
});

client.on("voiceStateUpdate", (o, n) => {
    const member = o.member ?? n.member;
    if (o?.channelId != null && n?.channelId == null) {
        // left
        console.log(`${member.user.tag} left   ${o.channelId}`);

    } else if (o?.channelId == null && n?.channelId != null) {
        // join
        console.log(`${member.user.tag} joined ${n.channelId}`);

    } else if (o?.channelId != null && n?.channelId != null) {
        // moved
        console.log(`${member.user.tag} moved  ${o.channelId} -> ${n.channelId}`);

    } else {
        // something
        console.log("can't tell lol")

    }
})

client.on("raw", d => {
    client.manager.updateVoiceState(d)
});

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

client.login(process.env.DISCORD_TOKEN);
