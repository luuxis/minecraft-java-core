/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Original author: Luuxis
 */

import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import nodeFetch from 'node-fetch';

import { getPathLibraries, mirrors, getFileFromArchive } from '../../../utils/Index.js';
import Downloader from '../../../utils/Downloader.js';
import NeoForgePatcher, { Profile } from '../../patcher.js';

/**
 * Options passed to NeoForgeMC, including paths, loader configs, etc.
 * Adjust according to your application's specifics.
 */
interface NeoForgeOptions {
	path: string;        // Base path where files will be placed or read from
	loader: {
		version: string;   // Minecraft version (e.g. "1.19.2")
		build: string;     // Build type ("latest", "recommended", or a numeric version)
		config: {
			javaPath: string;         // Path to the Java executable for patching
			minecraftJar: string;     // Path to the vanilla Minecraft .jar
			minecraftJson: string;    // Path to the corresponding .json version file
		};
		type: string;   // Type of loader
	};
	downloadFileMultiple?: number; // Number of concurrent downloads
	[key: string]: any;           // Allow extra fields as necessary
}

/**
 * A structure to describe the loader object with metadata, legacy vs. new API, etc.
 * For example:
 * {
 *   legacyMetaData: 'https://.../legacyMetadata.json',
 *   metaData: 'https://.../metadata.json',
 *   legacyInstall: 'https://.../NeoForge-${version}.jar',
 *   install: 'https://.../NeoForge-${version}.jar'
 * }
 */
interface LoaderObject {
	legacyMetaData: string;
	metaData: string;
	legacyInstall: string;
	install: string;
}

/**
 * Represents the result of downloading the NeoForge installer, or an error.
 */
interface DownloadInstallerResult {
	filePath?: string;  // Path to the downloaded jar
	oldAPI?: boolean;   // Indicates whether the legacy API was used
	error?: string;     // Error message if something went wrong
}

/**
 * Represents the structure of a NeoForge install_profile.json
 * after extraction from the installer jar.
 */
interface NeoForgeProfile extends Profile {
	install?: {
		libraries?: any[];
		[key: string]: any;
	};
	version?: {
		libraries?: any[];
		[key: string]: any;
	};
	filePath?: string;
	path?: string;
	[key: string]: any;
}

/**
 * This class handles downloading and installing NeoForge (formerly Forge) for Minecraft,
 * including picking the correct build, extracting libraries, and running patchers if needed.
 */
export default class NeoForgeMC extends EventEmitter {
	private readonly options: NeoForgeOptions;

	constructor(options: NeoForgeOptions) {
		super();
		this.options = options;
	}

	/**
	 * Downloads the NeoForge installer jar for the specified version and build,
	 * either using a legacy API or the newer metaData approach. If "latest" or "recommended"
	 * is specified, it picks the newest build from the filtered list.
	 *
	 * @param Loader An object containing URLs and patterns for legacy and new metadata/installers.
	 * @returns      An object with filePath and oldAPI fields, or an error.
	 */
	public async downloadInstaller(Loader: LoaderObject): Promise<DownloadInstallerResult> {
		let build: string | undefined;
		let neoForgeURL: string;
		let oldAPI = true;

		// Try to fetch metadata from online source first, then fallback to local cache
		const metaPath = path.join(this.options.path, 'mc-assets', 'neoforge-meta.json');
		let legacyMetaData;
		let metaData;

		try {
			const legacyResponse = await nodeFetch(Loader.legacyMetaData);
			legacyMetaData = await legacyResponse.json();
			const metaResponse = await nodeFetch(Loader.metaData);
			metaData = await metaResponse.json();
			fs.mkdirSync(path.dirname(metaPath), { recursive: true });
			fs.writeFileSync(metaPath, JSON.stringify({ legacy: legacyMetaData, meta: metaData }, null, 4));
		} catch (error) {
			// Fetch failed; attempt loading from local cache
			const cachedData = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
			legacyMetaData = cachedData.legacy;
			metaData = cachedData.meta;
		}


		// Filter versions for the specified Minecraft version
		let versions: string[] = legacyMetaData.versions.filter((v: string) =>
			v.includes(`${this.options.loader.version}-`)
		);

		// If none found, fallback to the new API approach
		if (!versions.length) {
			const splitted = this.options.loader.version.split('.');
			const shortVersion = `${splitted[1]}.${splitted[2] || 0}`;
			versions = metaData.versions.filter((v: string) => v.startsWith(shortVersion));
			oldAPI = false;
		}

		// If still no versions found, return an error
		if (!versions.length) {
			return { error: `NeoForge doesn't support Minecraft ${this.options.loader.version}` };
		}

		// Determine which build to use
		if (this.options.loader.build === 'latest' || this.options.loader.build === 'recommended') {
			build = versions[versions.length - 1]; // The most recent build
		} else {
			build = versions.find(v => v === this.options.loader.build);
		}

		if (!build) {
			return {
				error: `NeoForge Loader ${this.options.loader.build} not found, Available builds: ${versions.join(', ')}`
			};
		}

		// Build the installer URL, depending on whether we use the legacy or new API
		if (oldAPI) {
			neoForgeURL = Loader.legacyInstall.replaceAll(/\${version}/g, build);
		} else {
			neoForgeURL = Loader.install.replaceAll(/\${version}/g, build);
		}

		// Create a local folder for "neoForge" if it doesn't exist
		const neoForgeFolder = path.resolve(this.options.path, 'neoForge');
		const installerFilePath = path.resolve(neoForgeFolder, `neoForge-${build}-installer.jar`);

		if (!fs.existsSync(installerFilePath)) {
			if (!fs.existsSync(neoForgeFolder)) {
				fs.mkdirSync(neoForgeFolder, { recursive: true });
			}
			const downloader = new Downloader();
			downloader.on('progress', (downloaded: number, size: number) => {
				this.emit('progress', downloaded, size, `neoForge-${build}-installer.jar`);
			});

			await downloader.downloadFile(neoForgeURL, neoForgeFolder, `neoForge-${build}-installer.jar`);
		}

		return { filePath: installerFilePath, oldAPI };
	}

	/**
	 * Extracts the main JSON profile (install_profile.json) from the NeoForge installer.
	 * If the JSON references an additional file, it also extracts and parses that, returning
	 * a unified object with `install` and `version` keys.
	 *
	 * @param pathInstaller Full path to the downloaded NeoForge installer jar.
	 * @returns A NeoForgeProfile object, or an error if invalid.
	 */
	public async extractProfile(pathInstaller: string): Promise<NeoForgeProfile | { error: any }> {
		const fileContent = await getFileFromArchive(pathInstaller, 'install_profile.json');
		if (!fileContent) {
			return { error: { message: 'Invalid neoForge installer' } };
		}

		const neoForgeJsonOrigin = JSON.parse(fileContent.toString());
		if (!neoForgeJsonOrigin) {
			return { error: { message: 'Invalid neoForge installer' } };
		}

		const result: NeoForgeProfile = { data: {} };
		if (neoForgeJsonOrigin.install) {
			result.install = neoForgeJsonOrigin.install;
			result.version = neoForgeJsonOrigin.versionInfo;
		} else {
			result.install = neoForgeJsonOrigin;
			const extraFile = await getFileFromArchive(pathInstaller, path.basename(result.install.json));
			if (extraFile) {
				result.version = JSON.parse(extraFile.toString());
			} else {
				return { error: { message: 'Unable to read additional JSON from neoForge installer' } };
			}
		}

		return result;
	}

	/**
	 * Extracts the universal jar or associated files for NeoForge into the local "libraries" directory.
	 * Also handles client.lzma if processors are present. Returns a boolean indicating whether we skip
	 * certain neoforge libraries in subsequent steps.
	 *
	 * @param profile    The extracted NeoForge profile with file path references
	 * @param pathInstaller Path to the NeoForge installer
	 * @param oldAPI     Whether we are dealing with the old or new NeoForge API (affects library naming)
	 * @returns          A boolean indicating if we should filter out certain libraries afterwards
	 */
	public async extractUniversalJar(profile: NeoForgeProfile, pathInstaller: string, oldAPI: boolean): Promise<boolean> {
		let skipNeoForgeFilter = true;

		if (profile.filePath) {
			const fileInfo = getPathLibraries(profile.path);
			this.emit('extract', `Extracting ${fileInfo.name}...`);

			const destFolder = path.resolve(this.options.path, 'libraries', fileInfo.path);
			if (!fs.existsSync(destFolder)) {
				fs.mkdirSync(destFolder, { recursive: true });
			}

			const archiveContent = await getFileFromArchive(pathInstaller, profile.filePath);
			if (archiveContent) {
				fs.writeFileSync(path.join(destFolder, fileInfo.name), archiveContent, { mode: 0o777 });
			}
		} else if (profile.path) {
			const fileInfo = getPathLibraries(profile.path);
			const filesInArchive = await getFileFromArchive(pathInstaller, null, `maven/${fileInfo.path}`);
			if (filesInArchive && Array.isArray(filesInArchive)) {
				for (const file of filesInArchive) {
					const fileName = path.basename(file);
					this.emit('extract', `Extracting ${fileName}...`);

					const content = await getFileFromArchive(pathInstaller, file);
					if (!content) continue;

					const destFolder = path.resolve(this.options.path, 'libraries', fileInfo.path);
					if (!fs.existsSync(destFolder)) {
						fs.mkdirSync(destFolder, { recursive: true });
					}
					fs.writeFileSync(path.join(destFolder, fileName), content, { mode: 0o777 });
				}
			}
		} else {
			// If no direct reference, do not skip the library filtering
			skipNeoForgeFilter = false;
		}

		// If processors exist, we likely need to store client.lzma
		if (profile.processors?.length) {
			const universalPath = profile.libraries?.find(lib =>
				(lib.name || '').startsWith(oldAPI ? 'net.neoforged:forge' : 'net.neoforged:neoforge')
			);

			const clientData = await getFileFromArchive(pathInstaller, 'data/client.lzma');
			if (clientData) {
				const fileInfo = getPathLibraries(profile.path || universalPath.name, '-clientdata', '.lzma');
				const destFolder = path.resolve(this.options.path, 'libraries', fileInfo.path);

				if (!fs.existsSync(destFolder)) {
					fs.mkdirSync(destFolder, { recursive: true });
				}
				fs.writeFileSync(path.join(destFolder, fileInfo.name), clientData, { mode: 0o777 });
				this.emit('extract', `Extracting ${fileInfo.name}...`);
			}
		}

		return skipNeoForgeFilter;
	}

	/**
	 * Downloads all libraries referenced in the NeoForge profile. If skipNeoForgeFilter is true,
	 * certain core libraries are excluded. Checks for duplicates and local existence before downloading.
	 *
	 * @param profile           The NeoForge profile containing version/install libraries
	 * @param skipNeoForgeFilter Whether we skip specific "net.minecraftforge:neoforged" libs
	 * @returns An array of library objects after download, or an error object if something fails
	 */
	public async downloadLibraries(profile: NeoForgeProfile, skipNeoForgeFilter: boolean): Promise<any[] | { error: string }> {
		let libraries = profile.version?.libraries || [];
		const dl = new Downloader();
		let checkCount = 0;
		const pendingFiles: Array<{
			url: string;
			folder: string;
			path: string;
			name: string;
			size: number;
		}> = [];
		let totalSize = 0;

		// Combine install.libraries with version.libraries
		if (profile.install?.libraries) {
			libraries = libraries.concat(profile.install.libraries);
		}

		// Remove duplicates by 'name'
		libraries = libraries.filter(
			(lib, index, self) => index === self.findIndex(item => item.name === lib.name)
		);

		// If skipping certain neoforge libs
		const skipNeoForge = ['net.minecraftforge:neoforged:', 'net.minecraftforge:minecraftforge:'];

		// Evaluate each library
		for (const lib of libraries) {
			if (skipNeoForgeFilter && skipNeoForge.some(str => lib.name.includes(str))) {
				// If there's no valid artifact URL, skip it
				if (!lib.downloads?.artifact?.url) {
					this.emit('check', checkCount++, libraries.length, 'libraries');
					continue;
				}
			}

			// If the library has rules, skip automatically
			if (lib.rules) {
				this.emit('check', checkCount++, libraries.length, 'libraries');
				continue;
			}

			// Construct the local path to the library
			const libInfo = getPathLibraries(lib.name);
			const libFolder = path.resolve(this.options.path, 'libraries', libInfo.path);
			const libFilePath = path.resolve(libFolder, libInfo.name);

			// If it doesn't exist locally, schedule for download
			if (!fs.existsSync(libFilePath)) {
				let finalURL: string | null = null;
				let fileSize = 0;

				// Attempt to resolve via mirror first
				const baseURL = `${libInfo.path}/${libInfo.name}`;
				const mirrorCheck = await dl.checkMirror(baseURL, mirrors);
				if (mirrorCheck && typeof mirrorCheck === 'object' && 'status' in mirrorCheck && mirrorCheck.status === 200) {
					finalURL = mirrorCheck.url;
					fileSize = mirrorCheck.size;
					totalSize += fileSize;
				} else if (lib.downloads?.artifact) {
					finalURL = lib.downloads.artifact.url;
					fileSize = lib.downloads.artifact.size;
					totalSize += fileSize;
				}

				if (!finalURL) {
					return { error: `Impossible to download ${libInfo.name}` };
				}

				pendingFiles.push({
					url: finalURL,
					folder: libFolder,
					path: libFilePath,
					name: libInfo.name,
					size: fileSize
				});
			}

			this.emit('check', checkCount++, libraries.length, 'libraries');
		}

		// Download all pending files
		if (pendingFiles.length > 0) {
			dl.on('progress', (downloaded: number, totDL: number) => {
				this.emit('progress', downloaded, totDL, 'libraries');
			});

			await dl.downloadFileMultiple(pendingFiles, totalSize, this.options.downloadFileMultiple);
		}

		return libraries;
	}

	/**
	 * Runs the NeoForge patch process, if any processors exist. Checks if patching is needed,
	 * then uses the `NeoForgePatcher` class. If the patch is already applied, it skips.
	 *
	 * @param profile The NeoForge profile, which may include processors.
	 * @param oldAPI  Whether we are dealing with the old or new API (passed to the patcher).
	 * @returns       True on success or if no patch was needed.
	 */
	public async patchneoForge(profile: NeoForgeProfile, oldAPI: boolean): Promise<boolean> {
		if (profile?.processors?.length) {
			const patcher = new NeoForgePatcher(this.options);

			// Relay events
			patcher.on('patch', (data: string) => {
				this.emit('patch', data);
			});
			patcher.on('error', (error: string) => {
				this.emit('error', error);
			});

			// If not already patched, run the patcher
			if (!patcher.check(profile)) {
				const config = {
					java: this.options.loader.config.javaPath,
					minecraft: this.options.loader.config.minecraftJar,
					minecraftJson: this.options.loader.config.minecraftJson
				};

				await patcher.patcher(profile, config, oldAPI);
			}
		}
		return true;
	}
}
