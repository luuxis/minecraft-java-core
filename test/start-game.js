const spawn = require("child_process");


let args = [
    "-cp",
    libs,
    `-Xms1024M`,
    `-Xmx1024M`,
    /* custom args */
    "-XX:+UnlockExperimentalVMOptions",
    "-XX:+UseG1GC",
    "-XX:G1NewSizePercent=20",
    "-XX:G1ReservePercent=20",
    "-XX:MaxGCPauseMillis=50",
    "-XX:G1HeapRegionSize=32M",
    "-Xmn128M",
    /* ends */
    `-Djava.library.path=./minecraft/versions/1.12.2/natives`,
    `-Dlog4j.configurationFile=./testgggytufjjjggj`,
    "net.minecraft.launchwrapper.Launch",
    "--username",
    "luuxis",
    "--version",
    "1.12.2",
    "--gameDir",
    "./minecraft",
    "--assetsDir",
    `./minecraft/assets`,
    "--assetIndex",
    "1.12.2",
    "--uuid",
    "f07f8dd65265475781ed92a58f11df26",
    "--accessToken",
    "eyJhbGciOiJIUzI1NiJ9.eyJ4dWlkIjoiMjUzNTQwOTUyOTE2Nzg2OCIsImFnZyI6IkFkdWx0Iiwic3ViIjoiYzMyNmM1OGEtNjgwMS00YjM4LWExNTItZWFiOTYwYTc4ZDNjIiwibmJmIjoxNjM2NzM5NTExLCJhdXRoIjoiWEJPWCIsInJvbGVzIjpbXSwiaXNzIjoiYXV0aGVudGljYXRpb24iLCJleHAiOjE2MzY4MjU5MTEsImlhdCI6MTYzNjczOTUxMSwicGxhdGZvcm0iOiJVTktOT1dOIiwieXVpZCI6IjdjZGVlODFkMTczNmFkZjkzNDUyZDQ0YjcyZDUzYThiIn0.K6JobtD1Uo_wxXCepaPC_m2yOriKKvPCYayDSGzfg0o",
    "--userProperties",
    "{}",
    "--userType",
    "mojang",
    "--tweakClass",
    "cpw.mods.fml.common.launcher.FMLTweaker"
  ];




spawn("C:/Program Files/Java/jre1.8.0_311/bin/java.exe", args, { cwd: "./testgggytufjjjggj", detached: true })