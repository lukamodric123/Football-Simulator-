import { Team, Player, LoanDeal } from './types';

let loanId = 0;

export function createLoan(
  teams: Record<string, Team>,
  players: Record<string, Player>,
  playerId: string,
  fromTeamId: string,
  toTeamId: string,
  weeks: number,
  buyOption: number,
  season: number
): { teams: Record<string, Team>; players: Record<string, Player>; loan: LoanDeal | null; message: string } {
  const player = players[playerId];
  const fromTeam = teams[fromTeamId];
  const toTeam = teams[toTeamId];
  if (!player || !fromTeam || !toTeam) return { teams, players, loan: null, message: 'Invalid teams or player.' };
  if (toTeam.squad.length >= 30) return { teams, players, loan: null, message: 'Receiving squad is full.' };
  if (fromTeam.squad.filter(p => !p.retired).length <= 18) return { teams, players, loan: null, message: 'Source squad too thin.' };

  const updatedPlayers = { ...players, [playerId]: { ...player, onLoanFromTeamId: fromTeamId, loanWeeksRemaining: weeks, loanBuyOption: buyOption } };
  const updatedTeams = { ...teams,
    [fromTeamId]: { ...fromTeam, squad: fromTeam.squad.filter(p => p.id !== playerId) },
    [toTeamId]: { ...toTeam, squad: [...toTeam.squad, updatedPlayers[playerId]] },
  };

  return {
    teams: updatedTeams,
    players: updatedPlayers,
    loan: {
      id: `loan-${loanId++}-${Date.now()}`,
      playerId, playerName: `${player.firstName} ${player.lastName}`,
      fromTeamId, fromTeamName: fromTeam.name,
      toTeamId, toTeamName: toTeam.name,
      weeksRemaining: weeks, buyOption, season,
    },
    message: 'Loan agreed.',
  };
}

export function updateLoanWeeks(
  players: Record<string, Player>,
  loans: LoanDeal[]
): { players: Record<string, Player>; loans: LoanDeal[] } {
  const updatedPlayers = { ...players };
  const updatedLoans = loans.map(loan => {
    const weeksRemaining = Math.max(0, loan.weeksRemaining - 1);
    if (updatedPlayers[loan.playerId]) {
      updatedPlayers[loan.playerId] = { ...updatedPlayers[loan.playerId], loanWeeksRemaining: weeksRemaining };
    }
    return { ...loan, weeksRemaining };
  });
  return { players: updatedPlayers, loans: updatedLoans };
}

export function processLoanReturns(
  teams: Record<string, Team>,
  players: Record<string, Player>,
  loans: LoanDeal[]
): { teams: Record<string, Team>; players: Record<string, Player>; loans: LoanDeal[]; messages: string[] } {
  const messages: string[] = [];
  let updatedTeams = { ...teams };
  let updatedPlayers = { ...players };
  const remainingLoans: LoanDeal[] = [];

  for (const loan of loans) {
    if (loan.weeksRemaining > 0) {
      remainingLoans.push(loan);
      continue;
    }

    const player = updatedPlayers[loan.playerId];
    if (!player) continue;
    const exercise = loan.buyOption > 0 && Math.random() < 0.35 && updatedTeams[loan.toTeamId] && updatedTeams[loan.toTeamId].budget >= loan.buyOption;

    if (exercise) {
      updatedTeams[loan.toTeamId] = {
        ...updatedTeams[loan.toTeamId],
        budget: updatedTeams[loan.toTeamId].budget - loan.buyOption,
      };
      if (updatedTeams[loan.fromTeamId]) {
        updatedTeams[loan.fromTeamId] = {
          ...updatedTeams[loan.fromTeamId],
          budget: updatedTeams[loan.fromTeamId].budget + loan.buyOption,
        };
      }
      updatedPlayers[loan.playerId] = { ...player, onLoanFromTeamId: undefined, loanWeeksRemaining: 0, loanBuyOption: 0 };
      messages.push(`${loan.toTeamName} activated buy option for ${loan.playerName} (€${loan.buyOption}M)`);
    } else {
      const fromTeam = updatedTeams[loan.fromTeamId];
      const toTeam = updatedTeams[loan.toTeamId];
      if (fromTeam && toTeam) {
        updatedTeams[loan.toTeamId] = { ...toTeam, squad: toTeam.squad.filter(p => p.id !== loan.playerId) };
        updatedTeams[loan.fromTeamId] = { ...fromTeam, squad: [...fromTeam.squad, { ...player, onLoanFromTeamId: undefined, loanWeeksRemaining: 0, loanBuyOption: 0 }] };
        updatedPlayers[loan.playerId] = { ...player, onLoanFromTeamId: undefined, loanWeeksRemaining: 0, loanBuyOption: 0 };
        messages.push(`${loan.playerName} returns to ${loan.fromTeamName} from loan.`);
      }
    }
  }

  return { teams: updatedTeams, players: updatedPlayers, loans: remainingLoans, messages };
}
