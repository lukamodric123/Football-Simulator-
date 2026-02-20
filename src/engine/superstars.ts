import { Player, Position } from './types';

let ssId = 90000;
const uid = () => `ss${ssId++}`;

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function makePlayer(
  firstName: string,
  lastName: string,
  age: number,
  nationality: string,
  position: Position,
  foot: 'left' | 'right' | 'both',
  attrs: {
    shooting: number; passing: number; dribbling: number; pace: number;
    defense: number; physicality: number; vision: number; stamina: number; positioning: number;
  },
  potential: number,
  value: number,
  wage: number,
  isLegend = true
): Player {
  const overall = Math.round(Object.values(attrs).reduce((a, b) => a + b, 0) / 9);
  return {
    id: uid(),
    firstName,
    lastName,
    age,
    nationality,
    position,
    preferredFoot: foot,
    attributes: attrs,
    hiddenTraits: {
      leadership: rand(85, 99),
      consistency: rand(80, 99),
      bigMatch: rand(85, 99),
      injuryRisk: rand(5, 25),
      workRate: rand(75, 99),
    },
    morale: rand(75, 95),
    form: rand(70, 90),
    fatigue: rand(0, 20),
    injured: false,
    injuryWeeks: 0,
    value,
    wage,
    goals: 0,
    assists: 0,
    appearances: 0,
    yellowCards: 0,
    redCards: 0,
    cleanSheets: 0,
    rating: overall,
    potential,
    contractYears: rand(2, 4),
    careerGoals: 0,
    careerAssists: 0,
    careerAppearances: 0,
    careerCleanSheets: 0,
    trophies: rand(4, 12),
    individualAwards: [],
    isLegend,
    legendType: position === 'GK' ? 'goalkeeper' : ['CB', 'LB', 'RB'].includes(position) ? 'defender' : ['LW', 'RW', 'ST'].includes(position) ? 'scorer' : 'playmaker',
    retired: false,
    personalGoal: 'legacy',
    seasonHistory: [],
  };
}

// Pool of world-class superstars inspired by real football archetypes
export function generateSuperstars(): Player[] {
  return [
    // ⭐ GOD-TIER — 90+ overall
    makePlayer('Lionel', 'Messi', 27, 'Argentina', 'CAM', 'left', {
      shooting: 95, passing: 94, dribbling: 99, pace: 87, defense: 38, physicality: 65, vision: 99, stamina: 82, positioning: 96,
    }, 99, 180, 320),
    makePlayer('Cristiano', 'Ronaldo', 28, 'Portugal', 'ST', 'right', {
      shooting: 97, passing: 82, dribbling: 90, pace: 91, defense: 35, physicality: 85, vision: 80, stamina: 90, positioning: 95,
    }, 98, 165, 310),
    makePlayer('Kylian', 'Mbappe', 23, 'France', 'ST', 'right', {
      shooting: 92, passing: 82, dribbling: 96, pace: 99, defense: 40, physicality: 75, vision: 87, stamina: 88, positioning: 91,
    }, 97, 175, 290),
    makePlayer('Erling', 'Haaland', 22, 'Norway', 'ST', 'right', {
      shooting: 97, passing: 68, dribbling: 80, pace: 89, defense: 30, physicality: 88, vision: 72, stamina: 89, positioning: 97,
    }, 96, 155, 270),
    makePlayer('Vinicius', 'Junior', 22, 'Brazil', 'LW', 'right', {
      shooting: 86, passing: 80, dribbling: 96, pace: 98, defense: 35, physicality: 67, vision: 84, stamina: 86, positioning: 87,
    }, 96, 140, 240),
    makePlayer('Jude', 'Bellingham', 20, 'England', 'CM', 'right', {
      shooting: 87, passing: 88, dribbling: 91, pace: 82, defense: 78, physicality: 85, vision: 92, stamina: 90, positioning: 86,
    }, 97, 150, 250),

    // 🌟 ELITE — 87-90 overall
    makePlayer('Neymar', 'Jr', 27, 'Brazil', 'LW', 'right', {
      shooting: 88, passing: 86, dribbling: 97, pace: 91, defense: 33, physicality: 64, vision: 90, stamina: 78, positioning: 86,
    }, 93, 120, 210),
    makePlayer('Kevin', 'De Bruyne', 27, 'Belgium', 'CM', 'right', {
      shooting: 82, passing: 96, dribbling: 87, pace: 76, defense: 65, physicality: 78, vision: 98, stamina: 84, positioning: 84,
    }, 93, 115, 200),
    makePlayer('Rodri', 'Hernandez', 26, 'Spain', 'CDM', 'right', {
      shooting: 74, passing: 91, dribbling: 80, pace: 72, defense: 89, physicality: 83, vision: 90, stamina: 88, positioning: 82,
    }, 92, 100, 180),
    makePlayer('Lamine', 'Yamal', 17, 'Spain', 'RW', 'left', {
      shooting: 82, passing: 85, dribbling: 95, pace: 93, defense: 30, physicality: 55, vision: 90, stamina: 82, positioning: 84,
    }, 98, 110, 150),
    makePlayer('Bukayo', 'Saka', 22, 'England', 'RW', 'left', {
      shooting: 84, passing: 86, dribbling: 91, pace: 90, defense: 68, physicality: 72, vision: 88, stamina: 87, positioning: 85,
    }, 94, 105, 170),
    makePlayer('Gareth', 'Bale', 28, 'Wales', 'LW', 'right', {
      shooting: 88, passing: 78, dribbling: 90, pace: 96, defense: 40, physicality: 74, vision: 80, stamina: 80, positioning: 88,
    }, 92, 95, 180),
    makePlayer('Mohamed', 'Salah', 28, 'Egypt', 'RW', 'left', {
      shooting: 91, passing: 78, dribbling: 91, pace: 93, defense: 42, physicality: 74, vision: 84, stamina: 87, positioning: 92,
    }, 93, 110, 190),
    makePlayer('Robert', 'Lewandowski', 28, 'Poland', 'ST', 'right', {
      shooting: 95, passing: 74, dribbling: 80, pace: 79, defense: 38, physicality: 84, vision: 76, stamina: 82, positioning: 95,
    }, 93, 105, 180),
    makePlayer('Luka', 'Modric', 31, 'Croatia', 'CM', 'right', {
      shooting: 76, passing: 93, dribbling: 90, pace: 75, defense: 73, physicality: 68, vision: 95, stamina: 83, positioning: 78,
    }, 92, 90, 160),
    makePlayer('Virgil', 'Van Dijk', 29, 'Netherlands', 'CB', 'right', {
      shooting: 60, passing: 82, dribbling: 72, pace: 80, defense: 94, physicality: 93, vision: 78, stamina: 82, positioning: 87,
    }, 92, 90, 170),
    makePlayer('Thibaut', 'Courtois', 29, 'Belgium', 'GK', 'right', {
      shooting: 30, passing: 72, dribbling: 30, pace: 52, defense: 90, physicality: 88, vision: 78, stamina: 80, positioning: 93,
    }, 92, 85, 155),
    makePlayer('Phil', 'Foden', 23, 'England', 'CAM', 'left', {
      shooting: 86, passing: 88, dribbling: 90, pace: 84, defense: 62, physicality: 69, vision: 91, stamina: 85, positioning: 87,
    }, 94, 115, 180),
    makePlayer('Pedri', 'Gonzalez', 21, 'Spain', 'CM', 'right', {
      shooting: 78, passing: 91, dribbling: 92, pace: 79, defense: 74, physicality: 68, vision: 94, stamina: 87, positioning: 82,
    }, 95, 120, 175),
    makePlayer('Gavi', 'Paez', 20, 'Spain', 'CM', 'right', {
      shooting: 74, passing: 89, dribbling: 90, pace: 80, defense: 78, physicality: 71, vision: 91, stamina: 88, positioning: 79,
    }, 94, 110, 165),
    makePlayer('Florian', 'Wirtz', 21, 'Germany', 'CAM', 'right', {
      shooting: 83, passing: 88, dribbling: 92, pace: 81, defense: 62, physicality: 66, vision: 92, stamina: 83, positioning: 85,
    }, 95, 120, 170),
    makePlayer('Jamal', 'Musiala', 21, 'Germany', 'CAM', 'both', {
      shooting: 82, passing: 87, dribbling: 93, pace: 83, defense: 65, physicality: 68, vision: 90, stamina: 85, positioning: 84,
    }, 95, 115, 165),
    makePlayer('Federico', 'Valverde', 24, 'Uruguay', 'CM', 'right', {
      shooting: 80, passing: 86, dribbling: 84, pace: 85, defense: 78, physicality: 83, vision: 85, stamina: 94, positioning: 80,
    }, 91, 95, 155),
    makePlayer('Ruben', 'Dias', 25, 'Portugal', 'CB', 'right', {
      shooting: 55, passing: 80, dribbling: 68, pace: 74, defense: 91, physicality: 88, vision: 75, stamina: 83, positioning: 86,
    }, 92, 88, 150),
    makePlayer('Ousmane', 'Dembele', 25, 'France', 'RW', 'right', {
      shooting: 84, passing: 80, dribbling: 94, pace: 95, defense: 38, physicality: 68, vision: 82, stamina: 78, positioning: 84,
    }, 91, 88, 150),
    makePlayer('Achraf', 'Hakimi', 24, 'Morocco', 'RB', 'right', {
      shooting: 75, passing: 82, dribbling: 88, pace: 95, defense: 79, physicality: 76, vision: 80, stamina: 88, positioning: 82,
    }, 90, 85, 145),
    makePlayer('Mike', 'Maignan', 27, 'France', 'GK', 'right', {
      shooting: 28, passing: 74, dribbling: 28, pace: 50, defense: 89, physicality: 84, vision: 76, stamina: 78, positioning: 90,
    }, 90, 72, 130),
    makePlayer('Antoine', 'Griezmann', 29, 'France', 'CAM', 'left', {
      shooting: 88, passing: 82, dribbling: 84, pace: 80, defense: 65, physicality: 72, vision: 87, stamina: 84, positioning: 90,
    }, 91, 92, 155),
    makePlayer('Bernardo', 'Silva', 28, 'Portugal', 'CAM', 'right', {
      shooting: 80, passing: 90, dribbling: 88, pace: 82, defense: 70, physicality: 68, vision: 91, stamina: 90, positioning: 83,
    }, 90, 85, 145),
    makePlayer('Marcus', 'Rashford', 25, 'England', 'LW', 'right', {
      shooting: 85, passing: 78, dribbling: 88, pace: 92, defense: 48, physicality: 73, vision: 78, stamina: 82, positioning: 86,
    }, 90, 82, 140),
  ];
}

// Get a subset of superstars to seed into top teams
export function getSuperstarsForTeam(teamReputation: number, count: number, allSuperstars: Player[], usedIds: Set<string>): Player[] {
  const available = allSuperstars.filter(p => !usedIds.has(p.id));
  // Higher rep teams get better stars
  const threshold = teamReputation > 88 ? 0 : teamReputation > 82 ? 15 : 20;
  const eligible = available.filter((_, i) => i >= threshold);
  const result: Player[] = [];
  const pool = [...eligible];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * Math.min(pool.length, 8));
    result.push(pool[idx]);
    usedIds.add(pool[idx].id);
    pool.splice(idx, 1);
  }
  return result;
}
