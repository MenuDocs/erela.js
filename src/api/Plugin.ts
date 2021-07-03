export interface Plugin {
	name: string;
	provider?: string | string[];
	version: string;
	versions?: string | string;
}
