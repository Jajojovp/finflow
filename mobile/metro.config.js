const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");
const config = getDefaultConfig(__dirname);
// Watch the shared, platform-independent financial modules, rather than the
// entire web checkout and its separate dependency tree.
config.watchFolders = [path.resolve(__dirname, "../src/services"), path.resolve(__dirname, "../src/workspace")];
config.resolver.nodeModulesPaths = [path.resolve(__dirname, "node_modules")];
// Expo packages may have their own nested SDK dependencies.
config.resolver.disableHierarchicalLookup = false;
if (!config.resolver.sourceExts.includes("mjs"))
  config.resolver.sourceExts.push("mjs");
module.exports = config;
