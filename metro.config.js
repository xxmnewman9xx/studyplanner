// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// expo-sqlite's web worker ships a .wasm binary. Registering the extension only
// affects web bundles (used for screenshot QA); iOS/Android never load it.
config.resolver.assetExts.push("wasm");

// Agent worktrees live under .claude/worktrees; keep them out of the graph.
config.resolver.blockList = [/\.claude\/worktrees\/.*/];

module.exports = config;
