export const CAFE_VISUAL_CONFIG = {
  resolution: {
    width: 540,
    height: 960,
    aspectRatio: 9 / 16,
  },

  layout: {
    headerHeight: 90,
    cafeTop: 90,
    cafeBottom: 775,
    commandPanelTop: 775,
    commandPanelHeight: 185,
  },

  colors: {
    cream: '#FAF0DD',
    parchment: '#FFF9EE',
    honey: '#DCA86A',
    sage: '#8BA88A',
    coffee: '#8A5338',
    darkBrown: '#3D2112',
    coral: '#E89591',
    ptplayBlue: '#0066FF',
    ptplayGold: '#FFD700',
    actionJoin: '#8B5CF6',
    actionFeed: '#EA580C',
    actionPlay: '#10B981',
    actionNap: '#3B82F6',
    actionLove: '#EC4899',
  },

  visual: {
    artStyle: 'cozy-storybook',
    lighting: true,
    particles: true,
    shadows: true,
    ambientAnimation: true,
    weatherEnabled: true,
    quality: 'high' as const,
  },

  performance: {
    targetFPS: 60,
    maxAmbientParticles: 60,
    maxSimultaneousCelebrations: 5,
  },
} as const;

