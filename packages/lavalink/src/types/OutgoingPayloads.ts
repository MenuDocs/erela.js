import { OutgoingEvents as Events } from './Events';
import type { GatewayVoiceServerUpdateDispatch } from 'discord-api-types';

export type VoiceServerUpdate = GatewayVoiceServerUpdateDispatch['d'];

export type OutgoingPayload =
	| OutgoingDestroyPayload
	| OutgoingEqualizerPayload
	| OutgoingPausePayload
	| OutgoingPlayPayload
	| OutgoingSeekPayload
	| OutgoingStopPayload
	| OutgoingVoiceUpdatePayload
	| OutgoingVolumePayload
	| OutgoingConfigureResumingPayload
	| OutgoingFilterPayload;

export interface BaseOutgoingPayload {
	/**
	 * The guild's ID to identify the player.
	 */
	guildId: string;
}

export interface OutgoingDestroyPayload extends BaseOutgoingPayload {
	op: Events.DESTROY;
}

export interface OutgoingStopPayload extends BaseOutgoingPayload {
	op: Events.STOP;
}

export interface OutgoingSeekPayload extends BaseOutgoingPayload {
	op: Events.SEEK;

	/**
	 * The offset in milliseconds to play the current track from.
	 */
	position: number;
}

export interface OutgoingPausePayload extends BaseOutgoingPayload {
	op: Events.PAUSE;

	/**
	 * Whether or not the player should be paused.
	 */
	pause: boolean;
}

export interface OutgoingPlayPayload extends BaseOutgoingPayload {
	op: Events.PLAY;

	/**
	 * The track to be played.
	 */
	track: string;

	/**
	 * If set to true, this operation will be ignored if a track is already playing or paused.
	 */
	noReplace?: boolean;

	/**
	 * Determines the number of milliseconds to offset the track by. Defaults to 0.
	 */
	startTime?: number;

	/**
	 * Determines at the number of milliseconds at which point the track should stop playing. Helpful if you only want
	 * to play a snippet of a bigger track. By default the track plays until it's end as per the encoded data.
	 */
	endTime?: number;

	/**
	 * If set to true, the playback will be paused.
	 */
	pause?: boolean;
}

export interface OutgoingVoiceUpdatePayload extends BaseOutgoingPayload {
	op: Events.VOICE_UPDATE;

	/**
	 * The voice channel's session ID.
	 */
	sessionId: string;

	/**
	 * The raw event data from Discord.
	 */
	event: VoiceServerUpdate;
}

export interface OutgoingVolumePayload extends BaseOutgoingPayload {
	op: Events.VOLUME;

	/**
	 * The volume to be set.
	 * @default 100
	 * @range [0, 1000]
	 */
	volume: number;
}

export interface EqualizerBand {
	/**
	 * The band to be changed, ranges from 0 to 14 inclusive.
	 * @range [0, 14]
	 */
	band: number;

	/**
	 * The multiplier of the band. Valid values range from -0.25 to 1.0, where -0.25 means the given band is
	 * completely muted, and 0.25 means it is doubled. Modifying the gain could also change the volume of the output.
	 * @default 0
	 * @range [-0.25, 1]
	 */
	gain: number;
}

export interface OutgoingEqualizerPayload extends BaseOutgoingPayload {
	op: Events.EQUALIZER;

	/**
	 * The bands to be set.
	 */
	bands: readonly EqualizerBand[];
}

export interface OutgoingConfigureResumingPayload {
	op: Events.CONFIGURE_RESUMING;

	/**
	 * The string you will need to send when resuming the session. Set to null to disable resuming altogether.
	 */
	key?: string | null;

	/**
	 * The number of seconds after disconnecting before the session is closed anyways.
	 * This is useful for avoiding accidental leaks.
	 */
	timeout?: number;
}

/**
 * @note This is not available in Lavalink v3.3.
 */
export interface OutgoingFilterPayload extends BaseOutgoingPayload {
	op: Events.FILTERS;

	/**
	 * The volume to set the track. Valid values range from 0 to 5.0, where 0 means the stream is completely muted, and
	 * 2 means it is doubled.
	 * @range [0, 5]
	 */
	volume?: number;

	/**
	 * The equalizer bands, there are 15 bands (0-14) that can be changed.
	 */
	equalizer?: readonly EqualizerBand[];

	/**
	 * The karaoke options, uses equalization to eliminate a part of a band, usually targeting vocals.
	 */
	karaoke?: KaraokeOptions;

	/**
	 * The timescale options, used to change the speed, pitch, and rate.
	 */
	timescale?: TimescaleOptions;

	/**
	 * The tremolo options, uses amplification to create a shuddering effect, where the volume quickly oscillates,
	 * {@link https://en.wikipedia.org/wiki/File:Fuse_Electronics_Tremolo_MK-III_Quick_Demo.ogv example}.
	 */
	tremolo?: FrequencyDepthOptions;

	/**
	 * The vibrato options. Similar to tremolo, while tremolo oscillates the volume, vibrato oscillates the pitch.
	 */
	vibrato?: FrequencyDepthOptions;

	/**
	 * The distortion options.
	 */
	distortion?: DistortionOptions;

	/**
	 * The rotation options. This rotates the sound around the stereo channels/user headphones, also known as
	 * {@link https://en.wikipedia.org/wiki/Panning_(audio) Audio Panning}.
	 */
	rotation?: RotationOptions;
}

/**
 * @note This is not available in Lavalink v3.3.
 */
export interface KaraokeOptions {
	/**
	 * The level.
	 * @default 1.0
	 */
	level?: number;

	/**
	 * The mono level.
	 * @default 1.0
	 */
	monoLevel?: number;

	/**
	 * The band to filter.
	 * @default 220.0
	 */
	filterBand?: number;

	/**
	 * The width of the frequencies to filter.
	 * @default 100.0
	 */
	filterWidth?: number;
}

/**
 * @note This is not available in Lavalink v3.3.
 */
export interface TimescaleOptions {
	/**
	 * The speed of the track. Must be >=0.
	 * @default 1.0
	 */
	speed?: number;

	/**
	 * The pitch of the track. Must be >=0.
	 * @default 1.0
	 */
	pitch?: number;

	/**
	 * The rate of the track. Must be >=0.
	 * @default 1.0
	 */
	rate?: number;
}

/**
 * @note This is not available in Lavalink v3.3.
 */
export interface FrequencyDepthOptions {
	/**
	 * The frequency to edit. Must be >0 and <=14.
	 * @default 2.0
	 */
	frequency?: number;

	/**
	 * The depth for the selected frequency. Must be >0 and <=1.
	 * @default 0.5
	 */
	depth?: number;
}

/**
 * @note This is not available in Lavalink v3.3.
 */
export interface DistortionOptions {
	/**
	 * The sine's offset.
	 * @default 0.0
	 */
	sinOffset?: number;

	/**
	 * The sine's scale.
	 * @default 1.0
	 */
	sinScale?: number;

	/**
	 * The cosine's offset.
	 * @default 0.0
	 */
	cosOffset?: number;

	/**
	 * The cosine's scale.
	 * @default 1.0
	 */
	cosScale?: number;

	/**
	 * The tangent offset.
	 * @default 0.0
	 */
	tanOffset?: number;

	/**
	 * The tangent scale.
	 * @default 1.0
	 */
	tanScale?: number;

	/**
	 * The overall offset for all waves.
	 * @default 0.0
	 */
	offset?: number;

	/**
	 * The overall scale for all waves.
	 * @default 1.0
	 */
	scale?: number;
}

/**
 * @note This is not available in Lavalink v3.3.
 */
export interface RotationOptions {
	/**
	 * The frequency in Hz to rotate.
	 * @default 2.0
	 */
	rotationHz?: number;
}