const libraries: any = {
    "discord.js": {
        ws: {
            string: "raw",
            get: (client: any) => client.ws,
        },
        findChannel: (client: any, ID: string) => client.channels.get(ID),
        findGuildChannel: (guild: any, ID: any) => guild.channels.get(ID),
        findGuild: (client: any, ID: string) =>  client.guilds.get(ID),
        isSharded: (client: any) => client.ws.shards,
        sendWS: (client: any, data: any) => client.ws.send(data),
        sendShardWS: (guild: any, data: any) => guild.shard.send(data),
    },
    "eris": {
        ws: {
            string: "rawWS",
            get: (client: any) => client.shards.get(0).ws,
        },
        findChannel: (client: any, ID: string) => client.getChannel(ID),
        findGuildChannel: (guild: any, ID: any) => guild.channels.get(ID),
        findGuild: (client: any, ID: string) =>  client.guilds.get(ID),
        isSharded: (client: any) => client.shards.size > 1,
        sendWS: (client: any, data: any) => client.shards.get(0).ws.send(JSON.stringify(data)),
        sendShardWS: (guild: any, data: any) => guild.shard.ws.send(JSON.stringify(data)),
    },
};

export default libraries;
