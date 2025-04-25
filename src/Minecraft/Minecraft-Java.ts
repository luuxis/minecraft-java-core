/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Original author: Luuxis
 */

import os from 'os';
import path from 'path';
import fs from 'fs';
import EventEmitter from 'events';
import Seven from 'node-7z';
import sevenBin from '7zip-bin';

import { getFileHash } from '../utils/Index.js';
import Downloader from '../utils/Downloader.js';

/**
 * Represents the Java-specific options a user might pass to the downloader.
 */
export interface JavaDownloaderOptions {
	path: string;                 // Base path to store the downloaded Java runtime
	java: {
		version?: string;           // Force a specific Java version (e.g., "17")
		type: string;               // Image type for Adoptium (e.g., "jdk" or "jre")
	};
	intelEnabledMac?: boolean;    // If `true`, allows using Intel-based Java on Apple Silicon
}

/**
 * A generic JSON structure for the Minecraft version, which may include
 * a javaVersion property. Adjust as needed to fit your actual data.
 */
export interface MinecraftVersionJSON {
	javaVersion?: {
		component?: string;   // e.g., "jre-legacy" or "java-runtime-alpha"
		majorVersion?: number; // e.g., 8, 17, 19
	};
}

/**
 * Structure returned by getJavaFiles() and getJavaOther().
 */
export interface JavaDownloadResult {
	files: JavaFileItem[];
	path: string;      // Local path to the java executable
	error?: boolean;   // Indicate an error if any
	message?: string;  // Error message if error is true
}

/**
 * Represents a single Java file entry that might need downloading.
 */
export interface JavaFileItem {
	path: string;        // Relative path to store the file under the runtime directory
	executable?: boolean;
	sha1?: string;
	size?: number;
	url?: string;
	type?: string;       // "Java" or other type
}

/**
 * Manages the download and extraction of the correct Java runtime for Minecraft.
 * It supports both Mojang's curated list of Java runtimes and the Adoptium fallback.
 */
export default class JavaDownloader extends EventEmitter {
	private options: JavaDownloaderOptions;

	constructor(options: JavaDownloaderOptions) {
		super();
		this.options = options;
	}

	/**
	 * Retrieves Java files from Mojang's runtime metadata if possible,
	 * otherwise falls back to getJavaOther().
	 *
	 * @param jsonversion A JSON object describing the Minecraft version (with optional javaVersion).
	 * @returns An object containing a list of JavaFileItems and the final path to "java".
	 */
	public async getJavaFiles(jsonversion: MinecraftVersionJSON): Promise<JavaDownloadResult> {
		// If a specific version is forced, delegate to getJavaOther() immediately
		if (this.options.java.version) {
			return this.getJavaOther(jsonversion, this.options.java.version);
		}

		// OS-to-architecture mapping for Mojang's curated Java.
		const archMapping: Record<string, Record<string, string>> = {
			win32: { x64: 'windows-x64', ia32: 'windows-x86', arm64: 'windows-arm64' },
			darwin: { x64: 'mac-os', arm64: this.options.intelEnabledMac ? 'mac-os' : 'mac-os-arm64' },
			linux: { x64: 'linux', ia32: 'linux-i386' }
		};

		const osPlatform = os.platform();    // "win32", "darwin", "linux", ...
		const arch = os.arch();             // "x64", "arm64", "ia32", ...

		const javaVersionName = jsonversion.javaVersion?.component || 'jre-legacy';
		const osArchMapping = archMapping[osPlatform];
		const files: JavaFileItem[] = [];

		// If we don't have a valid mapping for the current OS, fallback to Adoptium
		if (!osArchMapping) {
			return this.getJavaOther(jsonversion);
		}

		// Determine the OS-specific identifier
		const archOs = osArchMapping[arch];
		if (!archOs) {
			// If we can't match the arch in the sub-object, fallback
			return this.getJavaOther(jsonversion);
		}

		// Fetch Mojang's Java runtime metadata
		const url = 'https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json';
		const javaVersionsJson = await fetch(url).then(res => res.json());

		const versionName = javaVersionsJson[archOs]?.[javaVersionName]?.[0]?.version?.name;
		if (!versionName) {
			return this.getJavaOther(jsonversion);
		}

		// Fetch the runtime manifest which lists individual files
		const manifestUrl = javaVersionsJson[archOs][javaVersionName][0]?.manifest?.url;
		const manifest = await fetch(manifestUrl).then(res => res.json());
		const manifestEntries: Array<[string, any]> = Object.entries(manifest.files);

		// Identify the Java executable in the manifest
		const javaExeKey = process.platform === 'win32' ? 'bin/javaw.exe' : 'bin/java';
		const javaEntry = manifestEntries.find(([relPath]) => relPath.endsWith(javaExeKey));
		if (!javaEntry) {
			// If we can't find the executable, fallback
			return this.getJavaOther(jsonversion);
		}

		const toDelete = javaEntry[0].replace(javaExeKey, '');
		for (const [relPath, info] of manifestEntries) {
			if (info.type === 'directory') continue;
			if (!info.downloads) continue;

			files.push({
				path: `runtime/jre-${versionName}-${archOs}/${relPath.replace(toDelete, '')}`,
				executable: info.executable,
				sha1: info.downloads.raw.sha1,
				size: info.downloads.raw.size,
				url: info.downloads.raw.url,
				type: 'Java'
			});
		}

		return {
			files,
			path: path.resolve(
				this.options.path,
				`runtime/jre-${versionName}-${archOs}`,
				'bin',
				process.platform === 'win32' ? 'javaw.exe' : 'java'
			)
		};
	}

	/**
	 * Fallback method to download Java from Adoptium if Mojang's metadata is unavailable
	 * or doesn't have the appropriate runtime for the user's platform/arch.
	 *
	 * @param jsonversion A Minecraft version JSON (with optional javaVersion).
	 * @param versionDownload A forced Java version (string) if provided by the user.
	 */
	public async getJavaOther(jsonversion: MinecraftVersionJSON, versionDownload?: string): Promise<JavaDownloadResult> {
		// Determine which major version of Java we need
		const majorVersion = versionDownload || jsonversion.javaVersion?.majorVersion || 8;
		const { platform, arch } = this.getPlatformArch();

		// Build the Adoptium API URL
		const queryParams = new URLSearchParams({
			image_type: this.options.java.type,  // e.g. "jdk" or "jre"
			architecture: arch,
			os: platform
		});
		const javaVersionURL = `https://api.adoptium.net/v3/assets/latest/${majorVersion}/hotspot?${queryParams.toString()}`;
		const javaVersions = await fetch(javaVersionURL).then(res => res.json());

		// If no valid version is found, return an error
		const java = javaVersions[0];
		if (!java) {
			return { files: [], path: '', error: true, message: 'No Java found' };
		}

		const { checksum, link: url, name: fileName } = java.binary.package;
		const pathFolder = path.resolve(this.options.path, `runtime/jre-${majorVersion}`);
		const filePath = path.join(pathFolder, fileName);

		// Determine the final path to the java executable after extraction
		let javaExePath = path.join(pathFolder, 'bin', 'java');
		if (platform === 'mac') {
			javaExePath = path.join(pathFolder, 'Contents', 'Home', 'bin', 'java');
		}

		// Download and extract if needed
		if (!fs.existsSync(javaExePath)) {
			await this.verifyAndDownloadFile({
				filePath,
				pathFolder,
				fileName,
				url,
				checksum
			});

			// Extract the downloaded archive
			await this.extract(filePath, pathFolder);
			fs.unlinkSync(filePath);

			// For .tar.gz files, we may need a second extraction step
			if (filePath.endsWith('.tar.gz')) {
				const tarFilePath = filePath.replace('.gz', '');
				await this.extract(tarFilePath, pathFolder);
				if (fs.existsSync(tarFilePath)) {
					fs.unlinkSync(tarFilePath);
				}
			}

			// If there's only one folder extracted, move its contents up
			const extractedItems = fs.readdirSync(pathFolder);
			if (extractedItems.length === 1) {
				const singleFolder = path.join(pathFolder, extractedItems[0]);
				const stat = fs.statSync(singleFolder);
				if (stat.isDirectory()) {
					const subItems = fs.readdirSync(singleFolder);
					for (const item of subItems) {
						const srcPath = path.join(singleFolder, item);
						const destPath = path.join(pathFolder, item);
						fs.renameSync(srcPath, destPath);
					}
					fs.rmdirSync(singleFolder);
				}
			}

			// Ensure the Java executable is marked as executable on non-Windows systems
			if (platform !== 'windows') {
				fs.chmodSync(javaExePath, 0o755);
			}
		}

		return { files: [], path: javaExePath };
	}

	/**
	 * Maps the Node `os.platform()` and `os.arch()` to Adoptium's expected format.
	 * Apple Silicon can optionally download x64 if `intelEnabledMac` is true.
	 */
	private getPlatformArch(): { platform: string; arch: string } {
		const platformMap: Record<string, string> = {
			win32: 'windows',
			darwin: 'mac',
			linux: 'linux'
		};
		const archMap: Record<string, string> = {
			x64: 'x64',
			ia32: 'x32',
			arm64: 'aarch64',
			arm: 'arm'
		};

		const mappedPlatform = platformMap[os.platform()] || os.platform();
		let mappedArch = archMap[os.arch()] || os.arch();

		// Force x64 if Apple Silicon but user wants to use Intel-based Java
		if (os.platform() === 'darwin' && os.arch() === 'arm64' && this.options.intelEnabledMac) {
			mappedArch = 'x64';
		}

		return { platform: mappedPlatform, arch: mappedArch };
	}

	/**
	 * Verifies if the Java archive already exists and matches the expected checksum.
	 * If it doesn't exist or fails the hash check, it downloads from the given URL.
	 * 
	 * @param params.filePath   The local file path
	 * @param params.pathFolder The folder to place the file in
	 * @param params.fileName   The name of the file
	 * @param params.url        The remote download URL
	 * @param params.checksum   Expected SHA-256 hash
	 */
	private async verifyAndDownloadFile({
		filePath,
		pathFolder,
		fileName,
		url,
		checksum
	}: {
		filePath: string;
		pathFolder: string;
		fileName: string;
		url: string;
		checksum: string;
	}): Promise<void> {
		// If the file already exists, check its integrity
		if (fs.existsSync(filePath)) {
			const existingChecksum = await getFileHash(filePath, 'sha256');
			if (existingChecksum !== checksum) {
				fs.unlinkSync(filePath);
				fs.rmSync(pathFolder, { recursive: true, force: true });
			}
		}

		// If not found or failed checksum, download anew
		if (!fs.existsSync(filePath)) {
			fs.mkdirSync(pathFolder, { recursive: true });
			const download = new Downloader();

			// Relay progress events
			download.on('progress', (downloaded: number, size: number) => {
				this.emit('progress', downloaded, size, fileName);
			});

			// Start download
			await download.downloadFile(url, pathFolder, fileName);
		}

		// Final verification of the downloaded file
		const downloadedChecksum = await getFileHash(filePath, 'sha256');
		if (downloadedChecksum !== checksum) {
			throw new Error('Java checksum failed');
		}
	}

	/**
	 * Extracts the given archive (ZIP or 7Z), using the `node-7z` library and the system's 7z binary.
	 * Emits an "extract" event with the extraction progress (percent).
	 *
	 * @param filePath  Path to the archive file
	 * @param destPath  Destination folder to extract into
	 */
	private async extract(filePath: string, destPath: string): Promise<void> {
		// Ensure the 7z binary is executable on Unix-like OSes
		if (os.platform() !== 'win32') {
			fs.chmodSync(sevenBin.path7za, 0o755);
		}

		return new Promise<void>((resolve, reject) => {
			const extractor = Seven.extractFull(filePath, destPath, {
				$bin: sevenBin.path7za,
				recursive: true,
				$progress: true
			});

			extractor.on('end', () => resolve());
			extractor.on('error', (err) => reject(err));
			extractor.on('progress', (progress) => {
				if (progress.percent > 0) {
					this.emit('extract', progress.percent);
				}
			});
		});
	}
}
