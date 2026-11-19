import { describe, expect, it } from 'vitest';
import { computeSaveScore } from '../cloudSync';
import { createNewSaveData } from '../saveSystem';

describe('cloudSync — Progression Scoring', () => {
  it('increases progression score monotonically with level, zones, quests, and Chaos Core victory', () => {
    const start = createNewSaveData();
    const startScore = computeSaveScore(start);

    const mid = createNewSaveData();
    mid.level = 3;
    mid.xp = 90;
    mid.quests.mq_1_camp.status = 'completed';
    mid.worldState.discoveredZones = ['arrival', 'camp', 'wild_jungle', 'river'];
    const midScore = computeSaveScore(mid);

    const end = createNewSaveData();
    end.level = 6;
    end.xp = 200;
    end.quests.mq_5_boss.status = 'completed';
    end.worldState.discoveredZones = [
      'arrival',
      'camp',
      'wild_jungle',
      'river',
      'ancient_ruins',
      'hidden_cave',
      'forgotten_temple',
      'chaos_zone',
      'boss_arena',
      'secret_sanctuary',
    ];
    end.worldState.bossDefeated = true;
    end.worldState.chaosCoreObtained = true;
    const endScore = computeSaveScore(end);

    expect(midScore).toBeGreaterThan(startScore);
    expect(endScore).toBeGreaterThan(midScore);
  });
});
