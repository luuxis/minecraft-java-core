##### v4 • **minecraft‑java‑core**
[![License: CC‑BY‑NC 4.0](https://img.shields.io/badge/License-CC--BY--NC%204.0-yellow.svg)](https://creativecommons.org/licenses/by-nc/4.0/)
![stable version](https://img.shields.io/npm/v/minecraft-java-core?logo=nodedotjs)

**minecraft‑java‑core** is a **NodeJS/TypeScript** solution for launching both vanilla *and* modded Minecraft Java Edition without juggling JSON manifests, assets, libraries or Java runtimes yourself. Think of it as the *core* of an Electron/NW.js/CLI launcher.

---

### Getting support
Need help or just want to chat? Join the community Discord!

<p align="center">
    <a href="http://discord.luuxis.fr">
        <img src="https://invidget.switchblade.xyz/e9q7Yr2cuQ">
    </a>
</p>

---

### Installing

```bash
npm i minecraft-java-core
# or
yarn add minecraft-java-core
```

*Requirements:* Node ≥ 18, TypeScript (only if you import *.ts*), 7‑Zip embedded binary.

---

### Standard Example (ESM)
```ts
const { Launch, Microsoft } = require('minecraft-java-core');
const launcher = new Launch();

const fs = require('fs');
let mc

(async () => {
    if (!fs.existsSync('./account.json')) {
        mc = await new Microsoft().getAuth();
        fs.writeFileSync('./account.json', JSON.stringify(mc, null, 4));
    } else {
        mc = JSON.parse(fs.readFileSync('./account.json'));
        if (!mc.refresh_token) {
            mc = await new Microsoft().getAuth();
            fs.writeFileSync('./account.json', JSON.stringify(mc, null, 4));
        } else {
            mc = await new Microsoft().refresh(mc);
            fs.writeFileSync('./account.json', JSON.stringify(mc, null, 4));
            if (mc.error) process.exit(1);
        }
    }

    const opt = {
        url: "https://luuxcraft.fr/api/user/48c74227-13d1-48d6-931b-0f12b73da340/instance",
        path: './minecraft',
        authenticator: mc,
        version: '1.8.9',
        intelEnabledMac: true,
        instance: "Hypixel",

        ignored: [
            "config",
            "logs",
            "resourcepacks",
            "options.txt",
            "optionsof.txt"
        ],

        loader: {
            type: 'forge',
            build: 'latest',
            enable: true
        },
        memory: {
            min: '14G',
            max: '16G'
        },
    };

    launcher.Launch(opt);
    launcher.on('progress', (progress, size) => console.log(`[DL] ${((progress / size) * 100).toFixed(2)}%`));
    launcher.on('patch', pacth => process.stdout.write(pacth));
    launcher.on('data', line => process.stdout.write(line));
    launcher.on('error', err => console.error(err));
})();
```

---

## Documentation

### Launch class

| Function | Type    | Description                                                           |
|----------|---------|------------------------------------------------------------------------|
| `launch` | Promise | Launches Minecraft with the given **`LaunchOptions`** (see below).     |

#### LaunchOptions

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `path` | String | Working directory where game files are stored (usually `.minecraft`). | ✔︎ |
| `url` | String \| null | Custom version manifest base URL (only for mirror setups). | — |
| `authenticator` | Object | Microsoft / Mojang / AZauth profile returned by the authenticator. | ✔︎ |
| `timeout` | Integer | Network timeout in **milliseconds** for downloads. | — |
| `version` | String  | `'latest_release'`, `'latest_snapshot'`, `'1.21.1'`. | — |
| `instance` | String \| null | Name of the instance if you manage multiple profiles. | — |
| `detached` | Boolean | Detach the Java process from the launcher. | — |
| `intelEnabledMac` | Boolean | Force Rosetta when running on Apple Silicon. | — |
| `downloadFileMultiple` | Integer | Max parallel downloads. | — |
| `loader.enable` | Boolean | Whether to install a mod‑loader (Forge/Fabric/…). | — |
| `loader.type` | String \| null | `forge`, `neoforge`, `fabric`, `legacyfabric`, `quilt`. | — |
| `loader.build` | String | Loader build tag (e.g. `latest`, `0.15.9`). | — |
| `loader.path` | String | Destination folder for loader files. Defaults to `./loader`. | — |
| `mcp` | String \| null | Path to MCP configuration for legacy mods. | — |
| `verify` | Boolean | Verify SHA‑1 of downloaded files. | — |
| `ignored` | Array | List of files to skip during verification. | — |
| `JVM_ARGS` | Array | Extra JVM arguments. | — |
| `GAME_ARGS` | Array | Extra Minecraft arguments. | — |
| `java.path` | String \| null | Absolute path to Java runtime. | — |
| `java.version` | String \| null | Force a specific Java version (e.g. `17`). | — |
| `java.type` | String | `jre` or `jdk`. | — |
| `screen.width` | Number \| null | Width of game window. | — |
| `screen.height` | Number \| null | Height of game window. | — |
| `screen.fullscreen` | Boolean | Start the game in fullscreen mode. | — |
| `memory.min` | String | Minimum RAM (e.g. `1G`). | ✔︎ |
| `memory.max` | String | Maximum RAM (e.g. `2G`). | ✔︎ |

> **Recommendation:** Start with the minimal set (`authenticator`, `path`, `version`, `memory`) and gradually add overrides only when you need them.

#### Default configuration

Below is the complete **default** `LaunchOptions` object returned by
`minecraft‑java‑core` when you don’t override any field. Use it as a quick
reference for every available parameter and its default value.  
(Parameters marked *nullable* can be left `null`/`undefined` and the library
will figure out sane values.)

```ts
const defaultOptions = {
  url: null,                        // Optional custom manifest URL
  authenticator: null,              // Microsoft/Mojang/AZauth profile
  timeout: 10000,                   // Network timeout in ms
  path: '.Minecraft',               // Root directory (alias: root)
  version: 'latest_release',        // Minecraft version (string or 'latest_…')
  instance: null,                   // Multi‑instance name (optional)
  detached: false,                  // Detach Java process from parent
  intelEnabledMac: false,           // Rosetta toggle for Apple Silicon
  downloadFileMultiple: 5,          // Parallel downloads

  loader: {
    path: './loader',               // Where to install loaders
    type: null,                     // forge | neoforge | fabric | …
    build: 'latest',                // Build number / tag
    enable: false,                  // Whether to install the loader
  },

  mcp: null,                        // Path to MCP config (legacy mods)

  verify: false,                    // SHA‑1 check after download
  ignored: [],                      // Files to skip verification
  JVM_ARGS: [],                     // Extra JVM arguments
  GAME_ARGS: [],                    // Extra game arguments

  java: {
    path: null,                     // Custom JVM path
    version: null,                  // Explicit Java version
    type: 'jre',                    // jre | jdk
  },

  screen: {
    width: null,
    height: null,
    fullscreen: false,
  },

  memory: {
    min: '1G',
    max: '2G',
  },
} as const;
```

> **Note** : Any field you provide when calling `Launch.launch()` will be
> merged on top of these defaults; you rarely need to specify more than
> `authenticator`, `path`, `version` and `memory`.

---

#### Events

| Event Name  | Payload | Description                                                  |
|-------------|---------|--------------------------------------------------------------|
| `data`      | String  | Raw output from the Java process.                            |
| `progress`  | Number  | Global download progress percentage.                         |
| `speed`     | Number  | Current download speed (kB/s).                               |
| `estimated` | Number  | Estimated time remaining (s).                                |
| `extract`   | String  | Name of the file currently being extracted.                  |
| `patch`     | String  | Loader patch currently applied.                              |
| `close`     | void    | Emitted when the Java process exits.                         |
| `error`     | Error   | Something went wrong.                                        |

---

### Authentication *(built‑in)*

* **Microsoft** — OAuth 2 Device Code flow via Xbox Live → XSTS → Minecraft.
* **Mojang** *(legacy)* — classic Yggdrasil endpoint.
* **AZauth** — community Yggdrasil‑compatible server.

> The authenticator returns a profile object that you pass directly to `Launch.launch()`.

---

### Utilities

* **Downloader** — resilient downloader with resume, integrity check & `progress`/`speed` events.
* **Status** — simple TCP ping that returns MOTD, player count & latency.

---

### File structure (simplified)
```
src/
  Authenticator/       Microsoft, Mojang, AZauth flows
  Minecraft/           Version JSON, assets, libraries, args builder
  Minecraft-Loader/    Forge, NeoForge, Fabric, Quilt, … installers
  StatusServer/        Server ping implementation
  utils/               Downloader & helpers
  Launch.ts            Main entry point
assets/                LWJGL native indexes
```

---

### Contributors
See the commit history for a full list. Special thanks to:

* **Luuxis** — original author.
* Community testers & issue reporters.

---

### License
Released under **Creative Commons Attribution‑NonCommercial 4.0 International**.