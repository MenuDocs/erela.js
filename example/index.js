require('reflect-metadata');

const { Client, Collection } = require('discord.js');
const { readdirSync } = require('fs');
const { Erela } = require('erela.js-api');
const { LavalinkManager } = require('lavalink-erela.js-provider');

// import 'reflect-metadata';

// import { Client, Collection } from 'discord.js';
// import { readdirSync } from 'fs';
// import { Erela } from 'erela.js-api';
// import { LavalinkManager } from 'lavalink-erela.js-provider';

// declare module "discord.js" {
//     export interface Client {
//         commands: Collection<string, NodeJS.Dict<any>>
//         manager: LavalinkManager
//     }
// }

async function main() {
    const client = new Client();
    // client.commands = new Collection();
    
    // const files = readdirSync('./commands').filter((file) => file.endsWith('.js'));
    
    // for (const file of files) {
    //     const command = require(`./commands/${file}`);
    //     client.commands.set(command.name, command);
    // }

    /** @type {import("erela.js-api").Manager} */
    /** @type {import("lavalink-erela.js-provider").LavalinkManager} */
    const manager = await Erela.create({
        nodes: [
            {
                host: 'localhost',
                password: "youshallnotpass",
                port: 2333
            },
        ],
        send: async (id, payload) => {
            const guild = client.guilds.cache.get(id);
            if (guild) guild.shard.send(payload);
        },
    });

    client.once('ready', () => {
        manager.init(client.user.id);
        console.log(`Logged in as ${client.user.tag}`);
    });

    client.on('raw', (d) => manager.updateVoiceState(d));

    client.on('message', async (message) => {
        if (!message.content.startsWith('!') || !message.guild || message.author.bot) return;
        const [name, ...args] = message.content.slice(1).split(/\s+/g);

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
