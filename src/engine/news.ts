import { NewsItem, GameState, Team } from './types';
import { getPlayerOverall, getTeamOverall } from './generator';

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

let newsId = 0;

const transferHeadlines = [
  '{player} linked with shock move to {team}',
  '{team} target {player} in ambitious swoop',
  'Transfer drama: {player} hands in transfer request',
  '{team} prepare record bid for {player}',
  'Deadline day chaos: {player} to {team}?',
];

const matchHeadlines = [
  '{team} produce stunning comeback victory',
  'Dominant {team} cruise to easy win',
  '{team} suffer embarrassing defeat',
  'Late drama as {team} snatch draw',
  'Underdog {team} pull off massive upset',
];

const dramaHeadlines = [
  'Dressing room bust-up reported at {team}',
  '{team} manager under mounting pressure',
  'Star player unhappy with role at {team}',
  'Financial trouble brewing at {team}',
  '{team} fans protest after poor results',
  'Board meeting called at struggling {team}',
];

const youthHeadlines = [
  'Wonderkid {player} takes {team} by storm',
  '{team} academy graduate {player} earns first call-up',
  'Scouts flock to see {team} prodigy {player}',
  'Teenage sensation {player} scores on debut for {team}',
];

const generalHeadlines = [
  'Title race heats up in {league}',
  'Relegation battle intensifies in {league}',
  'Golden Boot race: Who leads the charts?',
  'Manager of the Month announced',
  'Injury crisis hits multiple top clubs',
];

export function generateWeeklyNews(state: GameState): NewsItem[] {
  const news: NewsItem[] = [];
  const allTeams = Object.values(state.teams);

  // Generate 2-5 news items per week
  const count = rand(2, 5);
  for (let i = 0; i < count; i++) {
    const team = pick(allTeams);
    const league = state.leagues.find(l => l.id === team.leagueId);
    const player = team.squad.length > 0 ? pick(team.squad) : null;
    const playerName = player ? `${player.firstName} ${player.lastName}` : 'Unknown';

    const roll = Math.random();
    let headline: string;
    let category: NewsItem['category'];

    if (roll < 0.2) {
      headline = pick(transferHeadlines)
        .replace('{player}', playerName)
        .replace('{team}', team.name);
      category = 'transfer';
    } else if (roll < 0.45) {
      headline = pick(matchHeadlines).replace('{team}', team.name);
      category = 'match';
    } else if (roll < 0.65) {
      headline = pick(dramaHeadlines).replace('{team}', team.name);
      category = 'drama';
    } else if (roll < 0.8 && player && player.age < 22) {
      headline = pick(youthHeadlines)
        .replace('{player}', playerName)
        .replace('{team}', team.name);
      category = 'youth';
    } else {
      headline = pick(generalHeadlines)
        .replace('{league}', league?.name || 'the league');
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
