/**
 * PUBG Mobile game configuration
 * Defines all game-specific features, settings, and capabilities
 */

export const PUBG_MOBILE_CONFIG = {
  id: 'pubg-mobile',
  name: 'PUBG Mobile',
  
  // Marketplace features specific to PUBG Mobile
  marketplace: {
    accounts: {
      enabled: true,
      collectionLevelRange: [1, 100],
      features: ['rpSeasons', 'rareCostumes', 'vehicleSkins', 'weaponSkins', 'otherItems'],
    },
    costumes: { enabled: true },
    vehicles: { enabled: true },
    boost: { enabled: true },
    rental: { enabled: true },
    popularity: {
      enabled: true,
      types: ['likes', 'followers', 'popularity'],
    },
    metro: {
      enabled: true,
      itemTypes: ['weapon', 'armor', 'ammo', 'material', 'other'],
    },
    homeVotes: { enabled: true },
    clans: {
      enabled: true,
      maxLevel: 10,
    },
  },

  // Tournament modes specific to PUBG Mobile
  tournaments: {
    classic: { enabled: true },
    tdm: { enabled: true },
    wow: { enabled: true },
  },

  // Game-specific data
  rpSeasons: [
    'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10',
    'S11', 'S12', 'S13', 'S14', 'S15', 'S16', 'S17', 'S18', 'S19', 'S20',
    'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10',
    'A11', 'A12', 'A13', 'A14',
  ],

  // Other features
  features: {
    training: { enabled: true },
    currency: { enabled: true, name: 'UC' },
    bots: { enabled: true },
  },
} as const;

export type PubgMobileConfig = typeof PUBG_MOBILE_CONFIG;
