import { IncomingEvents as Events } from "./Events";

export type IncomingPayload = IncomingPlayerUpdatePayload | IncomingStatsPayload | IncomingEventPayload;

export interface IncomingPlayerUpdatePayloadState {
	time: number;
	position: number;
}

export interface IncomingPlayerUpdatePayload {
	op: Events.PLAYER_UPDATE;
	guildId: string;
	state: IncomingPlayerUpdatePayloadState;
}

export interface IncomingStatsPayloadMemory {
	free: number;
	used: number;
	allocated: number;
	reservable: number;
}

export interface IncomingStatsPayloadCPU {
	cores: number;
	systemLoad: number;
	lavalinkLoad: number;
}

export interface IncomingStatsPayloadFrames {
	sent: number;
	nulled: number;
	deficit: number;
}

export interface IncomingStatsPayload {
	op: Events.STATS;
	players: number;
	playingPlayers: number;
	uptime: number;
	memory: IncomingStatsPayloadMemory;
	cpu: IncomingStatsPayloadCPU;
	frames?: IncomingStatsPayloadFrames;
}

interface IIncomingEvent {
	op: Events.EVENT;
	guildId: string;
}

export type IncomingEventPayload =
	| IncomingEventStartPayload
	| IncomingEventTrackEndPayload
	| IncomingEventTrackExceptionPayload
	| IncomingEventTrackStuckPayload
	| IncomingEventWebSocketClosedPayload;

export interface IncomingEventStartPayload extends IIncomingEvent {
	type: Events.TRACK_START_EVENT;
	track: string;
}

export interface IncomingEventTrackEndPayload extends IIncomingEvent {
	type: Events.TRACK_END_EVENT;
	track: string;
	reason: string;
}

export interface IncomingEventTrackExceptionPayloadException {
	/**
	 * The message explaining the cause of the exception.
	 * @example
	 * ```json
	 * "The uploader has not made this video available in your country."
	 * ```
	 */
	message: string;

	/**
	 * The severity of the exception.
	 * @example
	 * ```json
	 * "COMMON"
	 * ```
	 */
	severity: ExceptionSeverity;

	/**
	 * The cause for the exception.
	 */
	cause: string;
}

export interface IncomingEventTrackExceptionPayload extends IIncomingEvent {
	type: Events.TRACK_EXCEPTION_EVENT;

	/**
	 * The track that received the exception.
	 */
	track: string;

	/**
	 * The exception's details.
	 */
	exception: IncomingEventTrackExceptionPayloadException;
}

export interface IncomingEventTrackStuckPayload extends IIncomingEvent {
	type: Events.TRACK_STUCK_EVENT;

	/**
	 * The track that got stuck.
	 */
	track: string;

	/**
	 * The threshold in milliseconds at which the track will resume.
	 */
	thresholdMs: number;
}

export interface IncomingEventWebSocketClosedPayload extends IIncomingEvent {
	type: Events.WEBSOCKET_CLOSEDEVENT;

	/**
	 * The closing error code from the websocket.
	 * @example
	 * ```json
	 * 4006
	 * ```
	 */
	code: number;

	/**
	 * The reason the websocket was closed.
	 * @example
	 * ```json
	 * "Your session is no longer valid."
	 * ```
	 */
	reason: string;

	/**
	 * Whether or not the websocket was closed by Discord.
	 * @example
	 * ```json
	 * true
	 * ```
	 */
	byRemote: boolean;
}

export const enum ExceptionSeverity {
	/**
	 * The cause is known and expected, indicates that there is nothing wrong with the library itself.
	 */
	Common = 'COMMON',

	/**
	 * The cause might not be exactly known, but is possibly caused by outside factors. For example when an outside
	 * service responds in a format that we do not expect.
	 */
	Suspicious = 'SUSPICIOUS',

	/**
	 * If the probable cause is an issue with the library or when there is no way to tell what the cause might be.
	 * This is the default level and other levels are used in cases where the thrower has more in-depth knowledge
	 * about the error.
	 */
	Fault = 'FAULT'
}