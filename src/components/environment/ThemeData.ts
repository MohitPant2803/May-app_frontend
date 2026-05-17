export type EnvironmentMood = 'morning' | 'golden_morning' | 'sunset' | 'midnight' | 'rainy';

export const EnvironmentPalettes = {
  morning: {
    skyTop: '#C9B6E4', skyMid: '#D9D7F1', skyBot: '#F6EBD8',
    bgTrees: '#9FA8C7', // Soft desaturated hills
    lake: '#B8C3D6',    // Cool reflective water
    midTrees: '#7BA98D',// Neutral mid-layer green
    grass: '#8BC7A8',   // Slightly warmer foreground grass
    particle: '#FFF4E0',// Warm white particles
    isRain: 0, windSpeed: 1, birdDensity: 3, fogOpacity: 0.3, starOpacity: 0, moonOpacity: 0,
  },
  golden_morning: {
    skyTop: '#F7CFA1', skyMid: '#FFDFAF', skyBot: '#FFF2D6',
    bgTrees: '#7DA27D', 
    lake: '#87B7C9',
    midTrees: '#4E6B52',// Darker mid-layer for depth
    grass: '#A7CF92',
    particle: '#FFD27A',// Golden rim light particles
    isRain: 0, windSpeed: 0.8, birdDensity: 2, fogOpacity: 0.4, starOpacity: 0, moonOpacity: 0,
  },
  sunset: {
    skyTop: '#5E548E', skyMid: '#9F86C0', skyBot: '#E8B4B8',
    bgTrees: '#4D5B6A', 
    lake: '#6E7FA8',
    midTrees: '#3A4755',// Slightly darker for silhouette depth
    grass: '#7FA08A',   // Grounded neutral green
    particle: '#FFD6A5',// Dreamy warm glow
    isRain: 0, windSpeed: 0.5, birdDensity: 0.5, fogOpacity: 0.6, starOpacity: 0.5, moonOpacity: 0.2,
  },
  midnight: {
    skyTop: '#101820', skyMid: '#1D3557', skyBot: '#2B4162',
    bgTrees: '#243B4A', 
    lake: '#2F5061', 
    midTrees: '#1A2A35', 
    grass: '#355C5C', 
    particle: '#F7D488',// Warm fireflies against the cool night
    isRain: 0, windSpeed: 0.2, birdDensity: 0, fogOpacity: 0.5, starOpacity: 1, moonOpacity: 1,
  },
  rainy: {
    skyTop: '#495867', skyMid: '#6B7A8F', skyBot: '#A7B7C7',
    bgTrees: '#4E6E5D', // Neutral cool green-gray
    lake: '#607D8B',
    midTrees: '#3D594A',
    grass: '#7EA38F',
    particle: '#CFE8F7',// Soft rain reflection
    isRain: 1, windSpeed: 2.5, birdDensity: 0, fogOpacity: 0.75, starOpacity: 0, moonOpacity: 0,
  }
};

export type ThemeColors = typeof EnvironmentPalettes['midnight'];