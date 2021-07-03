/* eslint-disable valid-jsdoc */
/**
 * Detects and finds any provider packages.
 */
import { existsSync } from 'fs';
import { join } from 'path';

interface PackageJson {
	name?: string;
	version?: string;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
}

const dependencyRegex = /^(?:@(?<scope>\w+)\/)?(?<dependency>.+)$/mi;
const providerFormat = 'erela.js-provider';

export = {
	/**
	 * Finds and returns the root package.json.
	 */
	getProjectPackage(): PackageJson {
		const path = join(process.cwd(), 'package.json');
		if (!existsSync(path)) {
			throw new Error('Unable to find root package.json');
		}

		return require(path);
	},

	/**
	 * Finds all providers within the root package.json, whether they are installed or not.
	 */
	findProviders(): string[] {
		const { dependencies } = this.getProjectPackage();
		if (!dependencies) {
			return [];
		}

		const providers = Object.keys(dependencies)
			.filter(dependencyRegex.test)
			.map(dependencyRegex.exec)
			.filter(this.followsFormat);

		return providers.map(deps => deps[0]);
	},

	/**
	 * Whether a dependency name follows the required format.
	 *
	 * @param scope The dependency scope, or null if was none.
	 * @param dependency The dependency name
	 */
	followsFormat(res: RegExpExecArray): boolean {
		const { scope, dependency } = res.groups;

		if (!dependency) {
			return false;
		}

		return scope ? dependency === providerFormat : dependency.endsWith(providerFormat);
	}
}
