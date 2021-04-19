export enum IncomingEvents {
    PLAYER_UPDATE = 'playerUpdate',
    STATS = 'stats',
    EVENT = 'event',
    TRACK_START_EVENT = 'TrackStartEvent',
    TRACK_END_EVENT = 'TrackEndEvent',
    TRACK_EXCEPTION_EVENT = 'TrackExceptionEvent',
    TRACK_STUCK_EVENT = 'TrackStuckEvent',
    WEBSOCKET_CLOSEDEVENT = 'WebSocketClosedEvent'
}

export enum OutgoingEvents {
    DESTROY = 'destroy',
    STOP = 'stop',
    SEEk = 'seek',
    PAUSE = 'pause',
    PLAY = 'play',
    VOICE_UPDATE = 'voiceUpdate',
    VOLUME = 'volume',
    EQUALIZER = 'equalizer',
    CONFIGURE_RESUMING = 'configureResuming',
    FILTERS = 'filters'
}

export const enum WebSocketEvents {
	OPEN = 'open',
	CLOSE = 'close',
	MESSAGE = 'message',
	ERROR = 'error'
}

export const enum ConnectionEvents {
	CLOSE = 'close',
	ERROR = 'error',
	EVENT = 'event',
	OPEN = 'open',
}