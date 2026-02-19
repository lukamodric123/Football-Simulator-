import { NewsItem, GameState, Player, GOATEntry, WorldCup, UCLTournament } from './types';
import { getPlayerOverall, calculateGOATScore } from './generator';

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

let newsId = 1000;

const transferHeadlines = [
  '{player} linked with shock move to {team}',
  '{team} target {player} in ambitious swoop',
  'Transfer drama: {player} hands in transfer request',
  '{team} prepare record bid for {player}',
  'Deadline day chaos: {player} to {team}?',
  '{team} close in on deal for {player}',
  'Agent confirms {player} wants {team} move',
];

const matchHeadlines = [
  '{team} produce stunning comeback victory',
  'Dominant {team} cruise to easy win',
  '{team} suffer embarrassing defeat',
  'Late drama as {team} snatch draw',
  'Underdog {team} pull off massive upset',
  '{team} extend winning streak to new heights',
  'Derby day delight for {team} fans',
];

const dramaHeadlines = [
  'Dressing room bust-up reported at {team}',
  '{team} manager under mounting pressure',
  'Star player unhappy with role at {team}',
  'Financial trouble brewing at {team}',
  '{team} fans protest after poor results',
  'Board meeting called at struggling {team}',
  'Ego clash between stars at {team}',
  'Secret transfer request leaked at {team}',
];

const youthHeadlines = [
  'Wonderkid {player} takes {team} by storm',
  '{team} academy graduate {player} earns first call-up',
  'Scouts flock to see {team} prodigy {player}',
  'Teenage sensation {player} scores on debut for {team}',
  '{player} tipped as future Ballon d\'Or winner',
];

const generalHeadlines = [
  'Title race heats up in {league}',
  'Relegation battle intensifies in {league}',
  'Golden Boot race: Who leads the charts?',
  'Manager of the Month announced',
  'Injury crisis hits multiple top clubs',
  'Surprise leaders emerge in {league}',
];

const goatHeadlines = [
  'Is {player} already top 5 all time?',
  '{player} enters GOAT conversation after stellar season',
  'New era: {player} surpassing legends of the past',
  'GOAT debate sparks heated fan arguments about {player}',
  'Pundits split: Is {player} the greatest ever?',
  '{player}\'s legacy grows with every match',
];

const legendHeadlines = [
  'Generational talent {player} emerges at {team}',
  '{player} dubbed "the next Messi" after incredible display',
  'Once-in-a-generation: {player} is the real deal',
  '{team}\'s {player} breaks records with stunning performance',
];

const retirementHeadlines = [
  'Legend {player} announces retirement from football',
  'End of an era: {player} hangs up boots after glorious career',
  '{player} retires with {goals} career goals and {trophies} trophies',
  'Football mourns as {player} plays final match',
  'Farewell to a legend: {player} calls time on career',
];

const takeoverHeadlines = [
  'BREAKING: New billionaire owner takes over {team}',
  '{team} face financial crisis, budget slashed',
  'Ownership change at {team} promises new era',
  '{team} announce ambitious rebuild plan under new ownership',
];

const managerHeadlines = [
  '{team} sack manager after poor run of results',
  'New manager bounce expected at {team}',
  '{team} appoint legendary coach as new boss',
  'Manager of the Year race wide open',
];

export function generateWeeklyNews(state: GameState): NewsItem[] {
  const news: NewsItem[] = [];
  const allTeams = Object.values(state.teams);

  const count = rand(2, 5);
  for (let i = 0; i < count; i++) {
    const team = pick(allTeams);
    const league = state.leagues.find(l => l.id === team.leagueId);
    const player = team.squad.length > 0 ? pick(team.squad) : null;
    const playerName = player ? `${player.firstName} ${player.lastName}` : 'Unknown';

    const roll = Math.random();
    let headline: string;
    let category: NewsItem['category'];

    if (roll < 0.15) {
      headline = pick(transferHeadlines).replace('{player}', playerName).replace('{team}', team.name);
      category = 'transfer';
    } else if (roll < 0.35) {
      headline = pick(matchHeadlines).replace('{team}', team.name);
      category = 'match';
    } else if (roll < 0.50) {
      headline = pick(dramaHeadlines).replace('{team}', team.name);
      category = 'drama';
    } else if (roll < 0.60 && player && player.age < 22) {
      headline = pick(youthHeadlines).replace('{player}', playerName).replace('{team}', team.name);
      category = 'youth';
    } else if (roll < 0.70 && player && player.isLegend) {
      headline = pick(legendHeadlines).replace('{player}', playerName).replace('{team}', team.name);
      category = 'legend';
    } else if (roll < 0.80) {
      headline = pick(managerHeadlines).replace('{team}', team.name);
      category = 'manager';
    } else if (roll < 0.88) {
      headline = pick(takeoverHeadlines).replace('{team}', team.name);
      category = 'takeover';
    } else {
      headline = pick(generalHeadlines).replace('{league}', league?.name || 'the league');
      category = 'match';
    }

    news.push({
      id: `n${newsId++}`,
      headline,
      body: '',
      category,
      week: state.week,
      season: state.season,
      importance: rand(1, 5),
    });
  }

  return news;
}

export function generateGOATNews(rankings: GOATEntry[], season: number): NewsItem[] {
  if (rankings.length === 0) return [];
  const top = rankings[0];
  const headline = pick(goatHeadlines).replace('{player}', top.playerName);
  return [{
    id: `n${newsId++}`,
    headline,
    body: '',
    category: 'goat',
    week: 0,
    season,
    importance: 5,
  }];
}

export function generateRetirementNews(player: Player, season: number): NewsItem {
  const headline = pick(retirementHeadlines)
    .replace('{player}', `${player.firstName} ${player.lastName}`)
    .replace('{goals}', String(player.careerGoals))
    .replace('{trophies}', String(player.trophies));
  return {
    id: `n${newsId++}`,
    headline,
    body: '',
    category: 'retirement',
    week: 0,
    season,
    importance: player.isLegend ? 5 : 3,
  };
}

export function generateSeasonAwardNews(awardName: string, playerName: string, season: number): NewsItem {
  return {
    id: `n${newsId++}`,
    headline: `🏆 ${awardName}: ${playerName} wins the prestigious award for Season ${season}!`,
    body: '',
    category: 'award',
    week: 0,
    season,
    importance: 5,
  };
}

export function generateNewSeasonNews(season: number): NewsItem {
  return {
    id: `n${newsId++}`,
    headline: `⚽ Season ${season} kicks off! New signings, fresh hopes, and the race begins again.`,
    body: '',
    category: 'match',
    week: 0,
    season,
    importance: 5,
  };
}

export function generatePromotionNews(teamName: string, fromLeague: string, toLeague: string, isPromotion: boolean, season: number): NewsItem {
  const headline = isPromotion
    ? `🎉 ${teamName} PROMOTED to ${toLeague}! A dream season ends in glory.`
    : `😢 ${teamName} RELEGATED to ${toLeague}. A bitter end to the season.`;
  return {
    id: `n${newsId++}`,
    headline,
    body: '',
    category: isPromotion ? 'award' : 'drama',
    week: 0,
    season,
    importance: 4,
  };
}

export function generateWorldCupNews(wc: WorldCup, season: number): NewsItem[] {
  const news: NewsItem[] = [];
  if (wc.winner) {
    news.push({
      id: `n${newsId++}`,
      headline: `🏆🌍 WORLD CUP: ${wc.winner} are WORLD CHAMPIONS! An incredible tournament comes to an end.`,
      body: '',
      category: 'award',
      week: 0,
      season,
      importance: 5,
    });
  }
  if (wc.goldenBoot) {
    news.push({
      id: `n${newsId++}`,
      headline: `👟 World Cup Golden Boot: ${wc.goldenBoot.playerName} finishes with ${wc.goldenBoot.goals} goals!`,
      body: '',
      category: 'award',
      week: 0,
      season,
      importance: 4,
    });
  }
  if (wc.goldenBall) {
    news.push({
      id: `n${newsId++}`,
      headline: `⭐ World Cup Golden Ball: ${wc.goldenBall.playerName} named tournament's best player!`,
      body: '',
      category: 'award',
      week: 0,
      season,
      importance: 4,
    });
  }
  return news;
}

export function generateUCLNews(ucl: UCLTournament, season: number): NewsItem[] {
  const news: NewsItem[] = [];
  if (ucl.winner) {
    news.push({
      id: `n${newsId++}`,
      headline: `🏆⭐ CHAMPIONS LEAGUE: ${ucl.winner} are EUROPEAN CHAMPIONS! A glorious campaign reaches its climax.`,
      body: '',
      category: 'ucl',
      week: 0,
      season,
      importance: 5,
    });
  }
  if (ucl.topScorer) {
    news.push({
      id: `n${newsId++}`,
      headline: `👟 UCL Top Scorer: ${ucl.topScorer.playerName} finishes with ${ucl.topScorer.goals} goals in the Champions League!`,
      body: '',
      category: 'ucl',
      week: 0,
      season,
      importance: 4,
    });
  }
  if (ucl.bestPlayer) {
    news.push({
      id: `n${newsId++}`,
      headline: `⭐ UCL Best Player: ${ucl.bestPlayer.playerName} named Champions League's best!`,
      body: '',
      category: 'ucl',
      week: 0,
      season,
      importance: 4,
    });
  }
  return news;
}
