/**
 * @author Luuxis
 * Luuxis License v1.0 (voir fichier LICENSE pour les détails en FR/EN)
 */

import { EventEmitter } from 'events';
import path from 'path';
// Note: Adjust the import path according to your actual TypeScript setup.
import LoaderDownloader, { LoaderType } from '../Minecraft-Loader/index.js';

/**
 * Describes the loader options, including a path and other configurations.
 * You can expand this interface if your real code requires more fields.
 */
interface LoaderOptions {
	path: string;        // Base path for the Minecraft data or installation
	loader: {
		path?: string;      // Path to store loader files (e.g. Forge, Fabric)
		type?: string;      // Type of loader (forge, fabric, etc.)
		build?: string;    // Build number if applicable (e.g., for Forge)
	};
	downloadFileMultiple?: number;   // If your downloader can handle multiple files
}

/**
 * Represents the MinecraftLoader class options, merging LoaderOptions
 * with any additional fields your code might require.
 */
interface MinecraftLoaderOptions extends LoaderOptions {
	// Additional fields that might be needed by your application
	[key: string]: any;
}

/**
 * A simple interface describing the JSON structure returned by loader installation.
 * Adjust to reflect the actual fields from your loader JSON.
 */
interface LoaderJSON {
	libraries: Array<{
		loader?: string;
		name?: string; // Or any other required fields
	}>;
	arguments?: {
		game?: string[];
		jvm?: string[];
	};
	mainClass?: string;
	[key: string]: any;
}

/**
 * This class manages the installation and argument-building for a Minecraft
 * mod loader (e.g. Forge, Fabric). It wraps a `loaderDownloader` and emits
 * the same events for progress, extraction, patching, etc.
 */
export default class MinecraftLoader extends EventEmitter {
	private options: MinecraftLoaderOptions;
	private loaderPath: string;

	constructor(options: MinecraftLoaderOptions) {
		super();
		this.options = options;
		this.loaderPath = path.join(this.options.path, this.options.loader.path);
	}

	/**
	 * Installs the loader for a given Minecraft version using a LoaderDownloader,
	 * returning the loader's JSON on completion. This function emits several events
	 * for progress reporting and patch notifications.
	 *
	 * @param version  The Minecraft version (e.g. "1.19.2")
	 * @param javaPath Path to the Java executable used by the loader for patching
	 * @returns        A Promise that resolves to the loader's JSON configuration
	 */
	public async GetLoader(version: string, javaPath: string): Promise<LoaderJSON> {
		const loader = new LoaderDownloader({
			path: this.loaderPath,
			downloadFileMultiple: this.options.downloadFileMultiple,
			loader: {
				type: this.options.loader.type as LoaderType,
				version: version,
				build: this.options.loader.build,
				config: {
					javaPath,
					minecraftJar: `${this.options.path}/versions/${version}/${version}.jar`,
					minecraftJson: `${this.options.path}/versions/${version}/${version}.json`
				}
			}
		});

		return new Promise<LoaderJSON>((resolve, reject) => {
			loader.install();

			loader.on('json', (json: LoaderJSON) => {
				// Inject the loader path into each library if needed
				const modifiedJson = json;
				modifiedJson.libraries = modifiedJson.libraries.map(lib => {
					lib.loader = this.loaderPath;
					return lib;
				});
				resolve(modifiedJson);
			});

			loader.on('extract', (extract: any) => {
				// Forward the "extract" event
				this.emit('extract', extract);
			});

			loader.on('progress', (progress: any, size: any, element: any) => {
				// Forward the "progress" event
				this.emit('progress', progress, size, element);
			});

			loader.on('check', (progress: any, size: any, element: any) => {
				// Forward the "check" event
				this.emit('check', progress, size, element);
			});

			loader.on('patch', (patch: any) => {
				// Forward the "patch" event
				this.emit('patch', patch);
			});

			loader.on('error', (err: any) => {
				reject(err);
			});
		});
	}

	/**
	 * Builds the game and JVM arguments based on the loader's JSON data.
	 * This may involve placeholder replacements for the main class, library directories, etc.
	 *
	 * @param json    The loader JSON previously returned by GetLoader (or null)
	 * @param version The targeted Minecraft version (used for placeholder substitution)
	 * @returns       An object with `game`, `jvm`, and an optional `mainClass` property
	 */
	public async GetArguments(json: LoaderJSON | null, version: string): Promise<{
		game: string[];
		jvm: string[];
		mainClass?: string;
	}> {
		// If no loader JSON is provided, return empty arrays
		if (json === null) {
			return { game: [], jvm: [] };
		}

		const moddedArgs = json.arguments;
		// If no arguments field is present, return empty arrays
		if (!moddedArgs) return { game: [], jvm: [] };

		const args: {
			game?: string[];
			jvm?: string[];
			mainClass?: string;
		} = {};

		if (moddedArgs.game) {
			args.game = moddedArgs.game;
		}

		if (moddedArgs.jvm) {
			// Replace placeholders in the JVM arguments
			args.jvm = moddedArgs.jvm.map((jvmArg) =>
				jvmArg
					.replace(/\${version_name}/g, version)
					.replace(/\${library_directory}/g, `${this.loaderPath}/libraries`)
					.replace(/\${classpath_separator}/g, process.platform === 'win32' ? ';' : ':')
			);
		}

		args.mainClass = json.mainClass;
		return {
			game: args.game || [],
			jvm: args.jvm || [],
			mainClass: args.mainClass
		};
	}
}
