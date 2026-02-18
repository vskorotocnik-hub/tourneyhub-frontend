import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const maps = [
  {
    mapId: '847291',
    name: 'OFFICIAL 2v2 WOW MAP',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop',
    format: '2v2',
    teamCount: 2,
    playersPerTeam: 2,
    rounds: 9,
    rules: '1 ROUND 15 KILLS, TOTAL 9 ROUND',
    prizeDistribution: JSON.stringify([100, 0]),
  },
  {
    mapId: '653827',
    name: 'OSE CLASH 3v3 12R IN ERANGEL',
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=300&fit=crop',
    format: '3v3',
    teamCount: 2,
    playersPerTeam: 3,
    rounds: 12,
    rules: '3VS3 CLOSE 12 ROUNDS',
    prizeDistribution: JSON.stringify([100, 0]),
  },
  {
    mapId: '192847',
    name: 'AR 1v1 2v2 M416',
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b2b0e?w=400&h=300&fit=crop',
    format: '1v1',
    teamCount: 2,
    playersPerTeam: 1,
    rounds: 10,
    rules: 'M416 ONLY',
    prizeDistribution: JSON.stringify([100, 0]),
  },
  {
    mapId: '483920',
    name: 'FUN GUN GAME 2V2V2V2',
    image: 'https://images.unsplash.com/photo-1493711662062-fa541f7f2cd7?w=400&h=300&fit=crop',
    format: '2v2v2v2',
    teamCount: 4,
    playersPerTeam: 2,
    rounds: 1,
    rules: 'GUN GAME MODE',
    prizeDistribution: JSON.stringify([50, 30, 20, 0]),
  },
  {
    mapId: '728194',
    name: 'SNIPER 1v1 AWM ONLY',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&h=300&fit=crop',
    format: '1v1',
    teamCount: 2,
    playersPerTeam: 1,
    rounds: 15,
    rules: 'AWM ONLY, 15 KILLS',
    prizeDistribution: JSON.stringify([100, 0]),
  },
  {
    mapId: '394857',
    name: 'SQUAD ARENA 4v4',
    image: 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=400&h=300&fit=crop',
    format: '4v4',
    teamCount: 2,
    playersPerTeam: 4,
    rounds: 7,
    rules: 'FULL SQUAD BATTLE',
    prizeDistribution: JSON.stringify([100, 0]),
  },
];

async function main() {
  console.log('Seeding WoW maps...');
  for (const map of maps) {
    await prisma.woWMap.upsert({
      where: { mapId: map.mapId },
      update: map,
      create: map,
    });
    console.log(`  ✓ ${map.name} (ID: ${map.mapId})`);
  }
  console.log('Done! Seeded', maps.length, 'WoW maps.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
