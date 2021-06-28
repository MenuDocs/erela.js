/**
 * Detects and finds any provider packages.
 */
import { existsSync } from "fs";
import { join } from "path";

export namespace Detector {

    const dependencyRegex = /^(?:@(?<scope>\w+)\/)?(?<dependency>.+)$/mi;
    const providerFormat = "erela.js-provider";

    /**
     * Finds and returns the root package.json.
     */
    export function getProjectPackage(): PackageJson {
        const path = join(process.cwd(), "package.json");
        if (!existsSync(path)) {
            throw new Error("Unable to find root package.json")
        }

        return require(path);
    }

    /**
     * Finds all providers within the root package.json, whether they are installed or not.
     */
    export function findProviders(): string[] {
        const { dependencies } = getProjectPackage();
        if (!dependencies) {
            return [];
        }

        const providers = Object.keys(dependencies)
            .filter(str => dependencyRegex.test(str))
            .map(m => dependencyRegex.exec(m)!)
            .filter(m => followsFormat(m.groups?.scope, m.groups?.dependency));

        return providers.map(m => m[0]);
    }

    /**
     * Whether a dependency name follows the required format.
     *
     * @param scope The dependency scope, or null if was none.
     * @param dependency The dependency name
     */
    export function followsFormat(scope?: string, dependency?: string): boolean {
        if (!dependency) {
            return false;
        }

        return scope ? dependency === providerFormat : dependency.endsWith(providerFormat);
    }

    interface PackageJson {
        name?: string;
        version?: string;
        dependencies?: NodeJS.Dict<string>;
        devDependencies?: NodeJS.Dict<string>;
        peerDependencies?: NodeJS.Dict<string>;
    }

}
