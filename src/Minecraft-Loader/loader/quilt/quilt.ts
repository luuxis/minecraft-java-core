/**
 * @author Luuxis
 * Luuxis License v1.0 (voir fichier LICENSE pour les détails en FR/EN)
 */

import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

import { getPathLibraries } from '../../../utils/Index.js';
import Downloader from '../../../utils/Downloader.js';

/**
 * Represents the Quilt loader configuration within the user's options.
 */
interface QuiltLoaderConfig {
	version: string; // e.g., "1.19.2"
	build: string;   // e.g., "latest", "recommended", or a specific build ID
}

/**
 * The main options object passed to the Quilt class.
 * You can extend this as needed by your application.
 */
interface QuiltOptions {
	path: string;                 // Base path for storing downloaded libraries, etc.
	loader: QuiltLoaderConfig;    // Loader configuration for Quilt
	downloadFileMultiple?: number; // Number of concurrent downloads
	[key: string]: any;          // Allow additional fields as needed
}

/**
 * Describes the data needed for fetching Quilt metadata and loader JSON.
 * For example:
 * {
 *   metaData: "https://meta.quiltmc.org/v3/versions",
 *   json: "https://meta.quiltmc.org/v3/versions/loader/${version}/${build}/profile/json"
 * }
 */
interface LoaderObject {
	metaData: string;
	json: string; // URL pattern with placeholders like ${version} and ${build}
}

/**
 * A structure for one library entry in the Quilt loader JSON.
 */
interface QuiltLibrary {
	name: string;
	url: string;
	rules?: Array<unknown>;
}

/**
 * The JSON object typically returned by the Quilt API,
 * containing an array of libraries and possibly other fields.
 */
interface QuiltJSON {
	libraries: QuiltLibrary[];
	[key: string]: any;
}

/**
 * This class handles fetching the Quilt loader metadata,
 * identifying the appropriate build for a given Minecraft version,
 * and downloading required libraries.
 */
export default class Quilt extends EventEmitter {
	private readonly options: QuiltOptions;
	private versionMinecraft: string | undefined;

	constructor(options: QuiltOptions = { path: '', loader: { version: '', build: '' } }) {
		super();
		this.options = options;
	}

	/**
	 * Fetches the Quilt loader metadata to identify the correct build for the specified
	 * Minecraft version. If "latest" or "recommended" is requested, picks the most
	 * recent or stable build accordingly.
	 *
	 * @param Loader An object describing where to fetch Quilt metadata and JSON.
	 * @returns      A QuiltJSON object on success, or an error object if something fails.
	 */
	public async downloadJson(Loader: LoaderObject): Promise<QuiltJSON | { error: string }> {
		let selectedBuild: any;

		// Fetch the metadata
		const metaResponse = await fetch(Loader.metaData);
		const metaData = await metaResponse.json();

		// Check if the requested Minecraft version is supported
		const mcVersionExists = metaData.game.find((ver: any) => ver.version === this.options.loader.version);
		if (!mcVersionExists) {
			return { error: `QuiltMC doesn't support Minecraft ${this.options.loader.version}` };
		}

		// Gather all available builds for this version
		const availableBuilds = metaData.loader.map((b: any) => b.version);

		// Determine which build to use
		if (this.options.loader.build === 'latest') {
			selectedBuild = metaData.loader[0];
		} else if (this.options.loader.build === 'recommended') {
			// Attempt to find a build that isn't labeled "beta"
			selectedBuild = metaData.loader.find((b: any) => !b.version.includes('beta'));
		} else {
			// Otherwise, match a specific build
			selectedBuild = metaData.loader.find(
				(loaderItem: any) => loaderItem.version === this.options.loader.build
			);
		}

		if (!selectedBuild) {
			return {
				error: `QuiltMC Loader ${this.options.loader.build} not found, Available builds: ${availableBuilds.join(', ')}`
			};
		}

		// Build the URL for the Quilt loader profile JSON
		const url = Loader.json
			.replace('${build}', selectedBuild.version)
			.replace('${version}', this.options.loader.version);

		// Fetch the JSON profile
		try {
			const response = await fetch(url);
			const quiltJson: QuiltJSON = await response.json();
			return quiltJson;
		} catch (err: any) {
			return { error: err.message || 'Failed to fetch or parse Quilt loader JSON' };
		}
	}

	/**
	 * Parses the Quilt JSON to determine which libraries need downloading, skipping
	 * any that already exist or that are disqualified by "rules". Downloads them
	 * in bulk using the Downloader utility.
	 *
	 * @param quiltJson A QuiltJSON object containing a list of libraries.
	 * @returns         The final list of libraries, or an error if something fails.
	 */
	public async downloadLibraries(quiltJson: QuiltJSON): Promise<QuiltLibrary[]> {
		const { libraries } = quiltJson;
		const downloader = new Downloader();

		let filesToDownload: Array<{
			url: string;
			folder: string;
			path: string;
			name: string;
			size: number;
		}> = [];

		let checkedLibraries = 0;
		let totalSize = 0;

		for (const lib of libraries) {
			// If rules exist, skip it (likely platform-specific logic)
			if (lib.rules) {
				this.emit('check', checkedLibraries++, libraries.length, 'libraries');
				continue;
			}

			// Construct the local path where this library should reside
			const libInfo = getPathLibraries(lib.name);
			const libFolder = path.resolve(this.options.path, 'libraries', libInfo.path);
			const libFilePath = path.resolve(libFolder, libInfo.name);

			// If the library doesn't exist locally, prepare to download
			if (!fs.existsSync(libFilePath)) {
				const libUrl = `${lib.url}${libInfo.path}/${libInfo.name}`;

				let fileSize = 0;
				const checkResult = await downloader.checkURL(libUrl);

				if (checkResult && checkResult.status === 200) {
					fileSize = checkResult.size;
					totalSize += fileSize;
				}

				filesToDownload.push({
					url: libUrl,
					folder: libFolder,
					path: libFilePath,
					name: libInfo.name,
					size: fileSize
				});
			}


			// Emit a "check" event for each library
			this.emit('check', checkedLibraries++, libraries.length, 'libraries');
		}

		// If there are libraries to download, proceed with the bulk download
		if (filesToDownload.length > 0) {
			downloader.on('progress', (downloaded: number, total: number) => {
				this.emit('progress', downloaded, total, 'libraries');
			});

			await downloader.downloadFileMultiple(filesToDownload, totalSize, this.options.downloadFileMultiple);
		}

		return libraries;
	}
}
