require('reflect-metadata');

const { Client, Collection } = require('discord.js');
const { readdirSync } = require('fs');
const { Erela } = require('erela.js-api');
const { LavalinkManager } = require('lavalink-erela.js-provider');

const client = new Client();
client.commands = new Collection();

const files = readdirSync('./commands').filter((file) => file.endsWith('.js'));

for (const file of files) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}
async function main() {
    /** @type {import("lavalink-erela.js-provider/structures/LavalinkManager").LavalinkManager} */

    const manager = await Erela.create({
        nodes: [
            {
                host: 'localhost',
                retryDelay: 5000,
            },
        ],
        send: (id, payload) => {
            const guild = client.guilds.cache.get(id);
            if (guild) guild.shard.send(payload);
        },
    });

    manager
        .on('nodeConnect', (node) => console.log(`Node "${node.options.identifier}" connected.`))
        .on('nodeError', (node, error) =>
            console.log(`Node "${node.options.identifier}" encountered an error: ${error.message}.`)
        )
        .on('trackStart', (player, track) => {
            const channel = client.channels.cache.get(player.textChannel);
            channel.send(`Now playing: \`${track.title}\`, requested by \`${track.requester.tag}\`.`);
        })
        .on('queueEnd', (player) => {
            const channel = client.channels.cache.get(player.textChannel);
            channel.send('Queue has ended.');
            player.destroy();
        });

    client.once('ready', () => {
        // client.manager.init(client.user.id);

        manager.init(client.user.id);
        console.log(`Logged in as ${client.user.tag}`);
    });

    client.on('raw', (d) => manager.updateVoiceState(d));

    client.on('message', async (message) => {
        if (!message.content.startsWith('!') || !message.guild || message.author.bot) return;
        const [name, ...args] = message.content.slice(1).split(/\s+/g);

        // const command = client.commands.get(name);
        // if (!command) return;

        // try {
        //   command.run(message, args);
        // } catch (err) {
        //   message.reply(`an error occurred while running the command: ${err.message}`);
        // }

        if (name === 'play') {
            const player = manager.create(message.guild.id);
            await player.connect(message.member.voice.channel.id);
            await player.play(
                'QAAAlAIAL1tIYXJkY29yZV0gLSBSZWVLIC0gUG9zc2Vzc2VkIEJ5IFRoZSBCbG9vZCBNb29uAAtTeWZlciBNdXNpYwAAAAAAA/egAAswTWtWXzNhMnkyUQABACtodHRwczovL3d3dy55b3V0dWJlLmNvbS93YXRjaD92PTBNa1ZfM2EyeTJRAAd5b3V0dWJlAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=='
            );
        }
    });

    await client.login('your bot token here');
}

void main();
