import type { NodeOptions } from "../structures/Node";
import type { IncomingStatsPayload } from "../types/IncomingPayloads";

export const DefaultNodeOptions: Omit<NodeOptions, 'id'> = {
    password: 'youshallnotpass',
    host: 'localhost',
    port: 2333,
    resumeTimeout: 120,
    reconnectInterval: 10000
} as const;

export const DefaultStatsOptions: Omit<IncomingStatsPayload, 'op'> = {
    players: 0,
    playingPlayers: 0,
    uptime: 0,
    memory: {
        allocated: 0,
        free: 0,
        used: 0,
        reservable: 0
    },
    cpu: {
        cores: 0,
        systemLoad: 0,
        lavalinkLoad: 0,
    },
    frames: {
        sent: 0,
        nulled: 0,
        deficit: 0
    }
}