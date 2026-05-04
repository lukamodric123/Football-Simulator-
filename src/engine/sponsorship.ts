import { Team, League, SeasonRevenue } from './types';

export function calculateSeasonRevenue(team: Team, leaguePosition: number, leagueSize: number, wonCup: boolean, wonLeague: boolean, wonUcl: boolean): SeasonRevenue {
  const cap = team.stadium?.capacity || 30000;
  const matches = 19; // home league matches
  const ticketAvg = team.reputation >= 85 ? 80 : team.reputation >= 70 ? 55 : 35; // €
  const fillRate = (team.stadium?.atmosphere || 60) / 100 * (1 - (leaguePosition - 1) / leagueSize * 0.3);
  const ticketSales = Math.round((cap * ticketAvg * fillRate * matches) / 1_000_000); // €M

  const merchandise = Math.round(team.reputation * (team.titles + 1) * 0.4);
  const sponsorships = (team.sponsors || []).reduce((s, sp) => s + sp.annualValue, 0);

  const positionPrize = Math.max(0, (leagueSize - leaguePosition + 1) * 2);
  let prizeMoney = positionPrize;
  if (wonLeague) prizeMoney += 50;
  if (wonCup) prizeMoney += 25;
  if (wonUcl) prizeMoney += 100;

  const total = ticketSales + merchandise + sponsorships + prizeMoney;
  return { ticketSales, merchandise, sponsorships, prizeMoney, transfers: 0, total };
}
