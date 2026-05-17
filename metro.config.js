const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add 3D model extensions to Metro's asset resolver so it doesn't crash
config.resolver.assetExts.push('glb', 'gltf');

module.exports = config;