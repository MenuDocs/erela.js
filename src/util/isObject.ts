/**
 * Verify if the input is an object literal (or class).
 * @param input The object to verify
 */
 // eslint-disable-next-line @typescript-eslint/ban-types
 export function isObject(input: unknown): input is Record<PropertyKey, unknown> | object {
	return typeof input === 'object' && input ? input.constructor === Object : false;
}