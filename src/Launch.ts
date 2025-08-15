/**
 * @author Luuxis
 * Luuxis License v1.0 (voir fichier LICENSE pour les détails en FR/EN)
 */

import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';

import jsonMinecraft from './Minecraft/Minecraft-Json.js';
import librariesMinecraft from './Minecraft/Minecraft-Libraries.js';
import assetsMinecraft from './Minecraft/Minecraft-Assets.js';
import loaderMinecraft from './Minecraft/Minecraft-Loader.js';
import javaMinecraft from './Minecraft/Minecraft-Java.js';
import bundleMinecraft from './Minecraft/Minecraft-Bundle.js';
import argumentsMinecraft from './Minecraft/Minecraft-Arguments.js';

import { isold } from './utils/Index.js';
import Downloader from './utils/Downloader.js';

type loader = {
	/**
	 * Path to loader directory. Relative to absolute path to Minecraft's root directory (config option `path`).
	 * 
	 * If `undefined`, defaults to `.minecraft/loader/<loader_type>`.
	 * 
	 * Example: `'fabricfiles'`.
	 */
	path?: string,
	/**
	 * Loader type. 
	 * 
	 * Acceptable values: `'forge'`, `'neoforge'`, `'fabric'`, `'legacyfabric'`, `'quilt'`.
	 */
	type?: string,
	/**
	 * Loader build (version).
	 * 
	 * Acceptable values: `'latest'`, `'recommended'`, actual version.
	 * 
	 * Example: `'0.16.3'`
	 */
	build?: string,
	/**
	 * Should the launcher use a loader?
	 */
	enable?: boolean
}

/**
 * Screen options.
 */
type screen = {
	width?: number,
	height?: number,
	/**
	 * Should Minecraft be started in fullscreen mode?
	 */
	fullscreen?: boolean
}

/**
 * Memory limits
 */
type memory = {
	/**
	 * Sets the `-Xms` JVM argument. This is the initial memory usage.
	 */
	min?: string,
	/**
	 * Sets the `-Xmx` JVM argument. This is the limit of memory usage.
	 */
	max?: string
}

/** 
 * Java download options
 */
type javaOPTS = {
	/**
	 * Absolute path to Java binaries directory. 
	 * 
	 * If set, expects Java to be already downloaded. If `undefined`, downloads Java and sets it automatically.
	 * 
	 * Example: `'C:\Program Files\Eclipse Adoptium\jdk-21.0.2.13-hotspot\bin'`
	 */
	path?: string,
	/** 
	 * Java version number.
	 * 
	 * If set, fetched from https://api.adoptium.net.
	 * If `undefined`, fetched from [Mojang](https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json).
	 * 
	 * Example: `21`
	 */
	version?: string,
	/** 
	 * Java image type. Acceptable values: `'jdk'`, `'jre'`, `'testimage'`, `'debugimage'`, `'staticlibs'`, `'sources'`, `'sbom'`.
	 * 
	 * Using `jre` is recommended since it only has what's needed.
	 */
	type: string
}

/** 
 * Launch options.
 */
export type LaunchOPTS = {
	/**
	 * URL to the launcher backend. Refer to [Selvania Launcher Wiki](https://github.com/luuxis/Selvania-Launcher/blob/master/docs/wiki_EN-US.md) for setup instructions.
	 */
	url?: string | null,
	/**
	 * Something to Authenticate the player. 
	 * 
	 * Refer to `Mojang`, `Microsoft` or `AZauth` classes.
	 * 
	 * Example: `await Mojang.login('Luuxis')`
	 */
	authenticator: any,
	/**
	 * Connection timeout in milliseconds.
	 */
	timeout?: number,
	/**
	 * Absolute path to Minecraft's root directory.
	 * 
	 * Example: `'%appdata%/.minecraft'`
	 */
	path: string,
	/** 
	 * Minecraft version.
	 * 
	 * Example: `'1.20.4'`
	 */
	version: string,
	/**
	 * Path to instance directory. Relative to absolute path to Minecraft's root directory (config option `path`).
	 * This separates game files (e.g. versions, libraries, assets) from game data (e.g. worlds, resourcepacks, options).
	 * 
	 * Example: `'PokeMoonX'`
	 */
	instance?: string,
	/**
	 * Should Minecraft process be independent of launcher?
	 */
	detached?: boolean,
	/**
	 * How many concurrent downloads can be in progress at once.
	 */
	downloadFileMultiple?: number,
	/**
	 * Should the launcher bypass offline mode?
	 * 
	 * If `true`, the launcher will not check if the user is online.
	 */
	bypassOffline?: boolean,
	intelEnabledMac?: boolean,
	/**
	 * Loader config
	 */
	loader: loader,
	/**
	 * MCPathcer directory. (idk actually luuxis please verify this)
	 * 
	 * If `instance` if set, relative to it.
	 * If `instance` is `undefined`, relative to `path`.
	 */
	mcp: any,
	/**
	 * Should game files be verified each launch?
	 */
	verify: boolean,
	/**
	 * Files to ignore from instance. (idk actually luuxis please verify this)
	 */
	ignored: string[],
	/**
	 * Custom JVM arguments. Read more on [wiki.vg](https://wiki.vg/Launching_the_game#JVM_Arguments)
	 */
	JVM_ARGS: string[],
	/**
	 * Custom game arguments. Read more on [wiki.vg](https://wiki.vg/Launching_the_game#Game_Arguments)
	 */
	GAME_ARGS: string[],
	/**
	 * Java options.
	 */
	java: javaOPTS,
	/**
	 * Screen options.
	 */
	screen: screen,
	/**
	 * Memory limit options.
	 */
	memory: memory
};

export default class Launch extends EventEmitter {
	options: LaunchOPTS;
	private isCancelled: boolean = false;
	private minecraftProcess: ChildProcess | null = null;
	private currentDownloader: Downloader | null = null;
	private downloadPromise: Promise<void> | null = null;

	async Launch(opt: LaunchOPTS) {
		this.isCancelled = false;
		this.minecraftProcess = null;
		this.currentDownloader = null;
		this.downloadPromise = null;

		const defaultOptions: LaunchOPTS = {
			url: null,
			authenticator: null,
			timeout: 10000,
			path: '.Minecraft',
			version: 'latest_release',
			instance: null,
			detached: false,
			intelEnabledMac: false,
			downloadFileMultiple: 5,
			bypassOffline: false,

			loader: {
				path: './loader',
				type: null,
				build: 'latest',
				enable: false,
			},

			mcp: null,

			verify: false,
			ignored: [],
			JVM_ARGS: [],
			GAME_ARGS: [],

			java: {
				path: null,
				version: null,
				type: 'jre',
			},

			screen: {
				width: null,
				height: null,
				fullscreen: false,
			},

			memory: {
				min: '1G',
				max: '2G'
			},
			...opt,
		};

		this.options = defaultOptions;
		this.options.path = path.resolve(this.options.path).replace(/\\/g, '/');

		if (this.options.mcp) {
			if (this.options.instance) this.options.mcp = `${this.options.path}/instances/${this.options.instance}/${this.options.mcp}`
			else this.options.mcp = path.resolve(`${this.options.path}/${this.options.mcp}`).replace(/\\/g, '/')
		}

		if (this.options.loader.type) {
			this.options.loader.type = this.options.loader.type.toLowerCase()
			this.options.loader.build = this.options.loader.build.toLowerCase()
		}

		if (!this.options.authenticator) return this.emit("error", { error: "Authenticator not found" });
		if (this.options.downloadFileMultiple < 1) this.options.downloadFileMultiple = 1
		if (this.options.downloadFileMultiple > 30) this.options.downloadFileMultiple = 30
		if (typeof this.options.loader.path !== 'string') this.options.loader.path = `./loader/${this.options.loader.type}`;
		this.start();
	}

	async start() {
		if (this.isCancelled) {
			this.emit('cancelled', 'Launch has been cancelled');
			return;
		}

		let data: any = await this.DownloadGame();
		if (data.error) return this.emit('error', data);

		if (this.isCancelled) {
			this.emit('cancelled', 'Launch has been cancelled');
			return;
		}

		let { minecraftJson, minecraftLoader, minecraftVersion, minecraftJava } = data;

		let minecraftArguments: any = await new argumentsMinecraft(this.options).GetArguments(minecraftJson, minecraftLoader);
		if (minecraftArguments.error) return this.emit('error', minecraftArguments);

		let loaderArguments: any = await new loaderMinecraft(this.options).GetArguments(minecraftLoader, minecraftVersion);
		if (loaderArguments.error) return this.emit('error', loaderArguments);

		let Arguments: any = [
			...minecraftArguments.jvm,
			...minecraftArguments.classpath,
			...loaderArguments.jvm,
			minecraftArguments.mainClass,
			...minecraftArguments.game,
			...loaderArguments.game
		]

		let java: any = this.options.java.path ? this.options.java.path : minecraftJava.path;
		let logs = this.options.instance ? `${this.options.path}/instances/${this.options.instance}` : this.options.path;
		if (!fs.existsSync(logs)) fs.mkdirSync(logs, { recursive: true });

		let argumentsLogs: string = Arguments.join(' ')
		argumentsLogs = argumentsLogs.replaceAll(this.options.authenticator?.access_token, '????????')
		argumentsLogs = argumentsLogs.replaceAll(this.options.authenticator?.client_token, '????????')
		argumentsLogs = argumentsLogs.replaceAll(this.options.authenticator?.uuid, '????????')
		argumentsLogs = argumentsLogs.replaceAll(this.options.authenticator?.xboxAccount?.xuid, '????????')
		argumentsLogs = argumentsLogs.replaceAll(`${this.options.path}/`, '')
		this.emit('data', `Launching with arguments ${argumentsLogs}`);

		if (this.isCancelled) {
			this.emit('error', { error: 'Launch has been cancelled' });
			return;
		}

		this.minecraftProcess = spawn(java, Arguments, { cwd: logs,detached: this.options.detached });
		this.minecraftProcess.stdout?.on('data', (data) => this.emit('data', data.toString('utf-8')));
		this.minecraftProcess.stderr?.on('data', (data) => this.emit('data', data.toString('utf-8')));
		this.minecraftProcess.on('close', (code) => {
			this.minecraftProcess = null;
			if (!this.isCancelled) this.emit('close', 'Minecraft closed');
		});
	}

	async DownloadGame() {
		let InfoVersion = await new jsonMinecraft(this.options).GetInfoVersion();
		let loaderJson: any = null;
		if ('error' in InfoVersion) {
			return this.emit('error', InfoVersion);
		}
		let { json, version } = InfoVersion;

		let libraries = new librariesMinecraft(this.options)
		let bundle = new bundleMinecraft(this.options)
		let java = new javaMinecraft(this.options)

		java.on('progress', (progress: any, size: any, element: any) => {
			this.emit('progress', progress, size, element)
		});

		java.on('extract', (progress: any) => {
			this.emit('extract', progress)
		});

		let gameLibraries: any = await libraries.Getlibraries(json);
		let gameAssetsOther: any = await libraries.GetAssetsOthers(this.options.url);
		let gameAssets: any = await new assetsMinecraft(this.options).getAssets(json);
		let gameJava: any = this.options.java.path ? { files: [] } : await java.getJavaFiles(json);

		if (gameJava.error) return gameJava

		let filesList: any = await bundle.checkBundle([...gameLibraries, ...gameAssetsOther, ...gameAssets, ...gameJava.files]);

		if (filesList.length > 0) {
			if (this.isCancelled) return { error: 'Download has been cancelled' };

			this.currentDownloader = new Downloader();
			let totsize = await bundle.getTotalSize(filesList);

			this.currentDownloader.on('progress',(DL: any, totDL: any, element: any) => {
					this.emit('progress', DL, totDL, element);
				},
			);

			this.currentDownloader.on('speed', (speed: any) => {
				this.emit('speed', speed);
			});

			this.currentDownloader.on('estimated', (time: any) => {
				this.emit('estimated', time);
			});

			this.currentDownloader.on('error', (e: any) => {
				this.emit('error', e);
			});

			this.downloadPromise = this.currentDownloader.downloadFileMultiple(
				filesList,
				totsize,
				this.options.downloadFileMultiple,
				this.options.timeout,
			);

			await this.downloadPromise;
			this.currentDownloader = null;
			this.downloadPromise = null;
		}

		if (this.options.loader.enable === true) {
			let loaderInstall = new loaderMinecraft(this.options)

			loaderInstall.on('extract', (extract: any) => {
				this.emit('extract', extract);
			});

			loaderInstall.on('progress', (progress: any, size: any, element: any) => {
				this.emit('progress', progress, size, element);
			});

			loaderInstall.on('check', (progress: any, size: any, element: any) => {
				this.emit('check', progress, size, element);
			});

			loaderInstall.on('patch', (patch: any) => {
				this.emit('patch', patch);
			});

			let jsonLoader = await loaderInstall.GetLoader(version, this.options.java.path ? this.options.java.path : gameJava.path)
				.then((data: any) => data)
				.catch((err: any) => err);
			if (jsonLoader.error) return jsonLoader;
			loaderJson = jsonLoader;
		}

		if (this.options.verify) await bundle.checkFiles([...gameLibraries, ...gameAssetsOther, ...gameAssets, ...gameJava.files]);

		let natives = await libraries.natives(gameLibraries);
		if (natives.length === 0) json.nativesList = false;
		else json.nativesList = true;

		if (isold(json)) new assetsMinecraft(this.options).copyAssets(json);

		return {
			minecraftJson: json,
			minecraftLoader: loaderJson,
			minecraftVersion: version,
			minecraftJava: gameJava
		}
	}

	cancel(): void {
		if (this.isCancelled) return;
		this.isCancelled = true;

		if (this.currentDownloader) {
			this.emit('data', 'Cancelling downloads...');
			try {
				this.currentDownloader.cancel();
			} catch {}
		}

		if (this.minecraftProcess && !this.minecraftProcess.killed) {
			this.emit('data', 'Terminating Minecraft process...');
			try {
				this.minecraftProcess.kill('SIGTERM');
				setTimeout(() => {
					if (this.minecraftProcess && !this.minecraftProcess.killed) {
						if (process.platform === 'win32' && this.minecraftProcess.pid) {
							require('child_process').exec(
								`taskkill /PID ${this.minecraftProcess.pid} /T /F`,
								() => {},
							);
						} else {
							this.minecraftProcess.kill('SIGKILL');
						}
					}
				}, 2000);
			} catch (error) {
				this.emit('data', `Failed to terminate process: ${error}`);
			}
		}

		this.currentDownloader = null;
		this.downloadPromise = null;
		this.emit('cancelled', 'Launch has been cancelled');
	}
}
