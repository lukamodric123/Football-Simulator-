import { Team, League } from './types';

// Hardcoded rivalry pairs (by team name substrings) — fall back to per-league reputation pairs
const RIVAL_PAIRS: [string, string][] = [
  ['Manchester Red', 'Manchester Blue'], ['Liverpool', 'Manchester Red'],
  ['Madrid Royal', 'Barcelona'], ['Madrid Royal', 'Madrid Athletic'],
  ['Munich', 'Dortmund'], ['Milan AC', 'Internazionale'], ['Milan AC', 'Juventus'],
  ['Paris', 'Marseille'], ['Roma', 'Lazio'], ['Arsenal', 'Tottenham'],
];

export function assignRivalries(teams: Record<string, Team>, leagues: League[]): Record<string, Team> {
  const updated = { ...teams };
  for (const [a, b] of RIVAL_PAIRS) {
    const teamA = Object.values(updated).find(t => t.name.includes(a));
    const teamB = Object.values(updated).find(t => t.name.includes(b));
    if (teamA && teamB) {
      updated[teamA.id] = { ...updated[teamA.id], rivals: Array.from(new Set([...(updated[teamA.id].rivals || []), teamB.id])) };
      updated[teamB.id] = { ...updated[teamB.id], rivals: Array.from(new Set([...(updated[teamB.id].rivals || []), teamA.id])) };
    }
  }
  // Fallback: top 2 by reputation in each tier-1 league become rivals
  for (const league of leagues.filter(l => l.tier === 1)) {
    const sorted = league.teams
      .map(id => updated[id])
      .filter(Boolean)
      .sort((x, y) => y.reputation - x.reputation);
    if (sorted.length >= 2 && (sorted[0].rivals?.length || 0) === 0) {
      updated[sorted[0].id] = { ...sorted[0], rivals: [sorted[1].id] };
      updated[sorted[1].id] = { ...sorted[1], rivals: [sorted[0].id] };
    }
  }
  return updated;
}

export function isDerby(homeId: string, awayId: string, teams: Record<string, Team>): boolean {
  const h = teams[homeId];
  return !!h?.rivals?.includes(awayId);
}
