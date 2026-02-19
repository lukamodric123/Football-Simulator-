import { Team, Player, Transfer, NewsItem, Position, positionToCategory } from './types';
import { getPlayerOverall, generatePlayer, uid } from './generator';

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

let transferId = 0;
let newsId = 5000;

// Count positions in squad
function positionCount(squad: Player[], category: string): number {
  return squad.filter(p => !p.retired && positionToCategory(p.position) === category).length;
}

// Find weakest position category
function getWeakestPosition(squad: Player[]): Position {
  const counts = {
    GK: positionCount(squad, 'GK'),
    DEF: positionCount(squad, 'DEF'),
    MID: positionCount(squad, 'MID'),
    FWD: positionCount(squad, 'FWD'),
  };

  const targets = { GK: 2, DEF: 6, MID: 6, FWD: 4 };
  let worstRatio = Infinity;
  let worstCat = 'MID';

  for (const [cat, count] of Object.entries(counts)) {
    const ratio = count / (targets[cat as keyof typeof targets] || 5);
    if (ratio < worstRatio) {
      worstRatio = ratio;
      worstCat = cat;
    }
  }

  const posMap: Record<string, Position[]> = {
    GK: ['GK'],
    DEF: ['CB', 'LB', 'RB'],
    MID: ['CM', 'CDM', 'CAM'],
    FWD: ['ST', 'LW', 'RW'],
  };

  return pick(posMap[worstCat] || ['CM']);
}

export function simulateTransfers(
  teams: Record<string, Team>,
  players: Record<string, Player>,
  season: number
): { teams: Record<string, Team>; players: Record<string, Player>; transfers: Transfer[]; news: NewsItem[] } {
  const updatedTeams = { ...teams };
  const updatedPlayers = { ...players };
  const transfers: Transfer[] = [];
  const news: NewsItem[] = [];

  const allTeamIds = Object.keys(updatedTeams);

  // Each team makes 1-4 transfer moves
  for (const teamId of allTeamIds) {
    const team = updatedTeams[teamId];
    if (!team) continue;

    const moveCount = team.personality === 'big_spender' ? rand(2, 4) : rand(0, 3);

    for (let m = 0; m < moveCount; m++) {
      // Decide: buy or sell
      const action = team.squad.length > 26 ? 'sell' : team.squad.length < 20 ? 'buy' : (Math.random() > 0.5 ? 'buy' : 'sell');

      if (action === 'sell' && team.squad.length > 18) {
        // Sell worst/oldest/unhappy player
        const sellCandidates = team.squad
          .filter(p => !p.retired && updatedPlayers[p.id])
          .map(p => updatedPlayers[p.id])
          .filter(p => p.morale < 60 || p.age > 31 || getPlayerOverall(p) < team.reputation - 20)
          .sort((a, b) => getPlayerOverall(a) - getPlayerOverall(b));

        if (sellCandidates.length > 0) {
          const selling = sellCandidates[0];
          // Find buyer
          const buyerCandidates = allTeamIds.filter(id => id !== teamId && updatedTeams[id].squad.length < 28);
          if (buyerCandidates.length > 0) {
            const buyerId = pick(buyerCandidates);
            const buyer = updatedTeams[buyerId];
            const fee = Math.max(1, Math.round(selling.value * (0.6 + Math.random() * 0.8)));

            // Execute transfer
            updatedTeams[teamId] = {
              ...updatedTeams[teamId],
              squad: updatedTeams[teamId].squad.filter(p => p.id !== selling.id),
              budget: updatedTeams[teamId].budget + fee,
            };
            
            const transferredPlayer = { ...updatedPlayers[selling.id], morale: rand(60, 85) };
            updatedPlayers[selling.id] = transferredPlayer;

            updatedTeams[buyerId] = {
              ...updatedTeams[buyerId],
              squad: [...updatedTeams[buyerId].squad, transferredPlayer],
              budget: Math.max(0, updatedTeams[buyerId].budget - fee),
            };

            const transfer: Transfer = {
              id: `t${transferId++}`,
              playerId: selling.id,
              playerName: `${selling.firstName} ${selling.lastName}`,
              fromTeamId: teamId,
              fromTeamName: team.name,
              toTeamId: buyerId,
              toTeamName: buyer.name,
              fee,
              season,
              type: fee > 0 ? 'buy' : 'free',
            };

            transfers.push(transfer);
            news.push({
              id: `n${newsId++}`,
              headline: fee > 50 
                ? `💥 BLOCKBUSTER: ${transfer.playerName} joins ${buyer.name} from ${team.name} for €${fee}M!`
                : `💰 ${transfer.playerName} moves to ${buyer.name} for €${fee}M.`,
              body: '',
              category: 'transfer',
              week: 0,
              season,
              importance: fee > 50 ? 5 : 3,
            });
          }
        }
      } else if (action === 'buy') {
        // Buy: generate a new player for needed position or poach from weaker team
        const neededPos = getWeakestPosition(team.squad.map(p => updatedPlayers[p.id] || p));

        // Try to buy from other teams first
        const targetTeams = allTeamIds
          .filter(id => id !== teamId && updatedTeams[id].reputation < team.reputation)
          .sort(() => Math.random() - 0.5)
          .slice(0, 5);

        let bought = false;
        for (const srcId of targetTeams) {
          const src = updatedTeams[srcId];
          const candidates = src.squad
            .filter(p => !p.retired && updatedPlayers[p.id] && positionToCategory(p.position) === positionToCategory(neededPos))
            .map(p => updatedPlayers[p.id])
            .filter(p => getPlayerOverall(p) >= team.reputation - 15 && p.age < 32)
            .sort((a, b) => getPlayerOverall(b) - getPlayerOverall(a));

          if (candidates.length > 0 && src.squad.length > 18) {
            const target = candidates[0];
            const fee = Math.max(2, Math.round(target.value * (0.8 + Math.random() * 0.6)));

            if (fee <= team.budget * 1.5) {
              // Execute
              updatedTeams[srcId] = {
                ...updatedTeams[srcId],
                squad: updatedTeams[srcId].squad.filter(p => p.id !== target.id),
                budget: updatedTeams[srcId].budget + fee,
              };

              const transferredPlayer = { ...updatedPlayers[target.id], morale: rand(65, 90) };
              updatedPlayers[target.id] = transferredPlayer;

              updatedTeams[teamId] = {
                ...updatedTeams[teamId],
                squad: [...updatedTeams[teamId].squad, transferredPlayer],
                budget: Math.max(0, updatedTeams[teamId].budget - fee),
              };

              const transfer: Transfer = {
                id: `t${transferId++}`,
                playerId: target.id,
                playerName: `${target.firstName} ${target.lastName}`,
                fromTeamId: srcId,
                fromTeamName: src.name,
                toTeamId: teamId,
                toTeamName: team.name,
                fee,
                season,
                type: 'buy',
              };

              transfers.push(transfer);
              news.push({
                id: `n${newsId++}`,
                headline: fee > 80
                  ? `🔥 MEGA DEAL: ${team.name} sign ${transfer.playerName} from ${src.name} for €${fee}M!`
                  : `📝 ${team.name} complete signing of ${transfer.playerName} from ${src.name} (€${fee}M).`,
                body: '',
                category: 'transfer',
                week: 0,
                season,
                importance: fee > 80 ? 5 : 3,
              });

              bought = true;
              break;
            }
          }
        }

        // If couldn't buy from other team, sign free agent (generate)
        if (!bought && team.squad.length < 24) {
          const newPlayer = generatePlayer(neededPos, Math.max(40, team.reputation - 10), [20, 28]);
          updatedPlayers[newPlayer.id] = newPlayer;
          updatedTeams[teamId] = {
            ...updatedTeams[teamId],
            squad: [...updatedTeams[teamId].squad, newPlayer],
          };

          news.push({
            id: `n${newsId++}`,
            headline: `📋 ${team.name} sign free agent ${newPlayer.firstName} ${newPlayer.lastName} (${neededPos}).`,
            body: '',
            category: 'transfer',
            week: 0,
            season,
            importance: 2,
          });
        }
      }
    }
  }

  return { teams: updatedTeams, players: updatedPlayers, transfers, news };
}
