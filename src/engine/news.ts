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
  'EXCLUSIVE: Agent demands €{fee}M release clause for {player}',
  '{player} rejects new deal — club may be forced to sell',
  'Hijacked! {team} swoop in last-minute for {player}',
];

const matchHeadlines = [
  '{team} produce stunning comeback victory',
  'Dominant {team} cruise to easy win',
  '{team} suffer embarrassing defeat',
  'Late drama as {team} snatch draw',
  'Underdog {team} pull off massive upset',
  '{team} extend winning streak to new heights',
  'Derby day delight for {team} fans',
  '🔥 VIRAL: Hat-trick hero powers {team} to glory',
  'Stunning individual brilliance seals {team} victory',
  'Last-minute winner sends {team} fans wild',
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
  '{team} superstar demands wage hike or will leave',
  'Locker room divided: captaincy row erupts at {team}',
  'Pundit DESTROYS {team} performance: "Absolute shambles"',
  '{team} star fined after training ground incident',
];

// NEW: Social media reaction headlines
const socialMediaHeadlines = [
  '🔥 TRENDING: #NeverForget{team} after shock defeat',
  '📱 Fans FLOOD social media after {team} signing: "GOATED move"',
  '🤣 {team} memes take over internet after comedy error',
  '💬 {player} posts cryptic message — transfer hint?',
  '📊 {player}\'s stats go viral: "Robotic consistency is unreal"',
  '🔴 LIVE: {team} fans storm trending list after comeback win',
  '😭 Football Twitter in mourning after {player} injury news',
  '🎉 {team} unveil signing — fans react: "CLUB IS BACK"',
  '👑 "{player} is the best in the world right now" — pundits agree',
  '🗣️ {player} subliminally responds to critics via Instagram story',
];

// NEW: Superstar ego headlines
const egoHeadlines = [
  '⭐ {player} demands to be highest earner at {team}',
  '💣 BOMBSHELL: {player} wants out of {team} — "I need UCL football"',
  '😤 {player} refuses to celebrate goal against former club',
  '🌟 {player} agent: "My client deserves Ballon d\'Or consideration"',
  '💰 {player} rejects deal — "The money doesn\'t match my status"',
  '👑 {player} reportedly upset at not wearing captain\'s armband',
  '🔥 Row erupts: {player} feels {team} aren\'t good enough for him',
  '📣 {player}\'s agent opens door to summer exit from {team}',
];

// NEW: Media pressure headlines
const mediaPressureHeadlines = [
  '📰 "SACK HIM NOW" — tabloids demand {team} manager exit',
  '🎙️ Pundit: "{team} title challenge is falling apart"',
  '⚠️ Board meets after {team}\'s humiliating loss — manager on thin ice',
  '📉 "{team} are a mess" — former player slams club',
  '🔥 {team} transfer strategy blasted: "Clueless summer window"',
  '🗞️ Sport front page: "{team} in CRISIS"',
  '💥 {team} dressing room leaks: morale at all-time low',
];

// NEW: Rivalry headlines
const rivalryHeadlines = [
  '⚔️ {team} vs rivals: Pre-match war of words heats up',
  '🏆 Classic derby: {team} claim bragging rights in thriller',
  '😡 Flashpoint! Scenes at {team} vs rivals match',
  '📊 Historic record broken as {team} dominate old rivals',
  '🔥 Derby day! Tension peaks as {team} face biggest rivals',
];

const youthHeadlines = [
  'Wonderkid {player} takes {team} by storm',
  '{team} academy graduate {player} earns first call-up',
  'Scouts flock to see {team} prodigy {player}',
  'Teenage sensation {player} scores on debut for {team}',
  '{player} tipped as future Ballon d\'Or winner',
  '⚡ BREAKOUT: {player} earns rave reviews — "The next superstar"',
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
  '👑 "{player} is already a legend — no debate needed"',
  '📊 The numbers don\'t lie: {player} is in GOAT territory',
];

const legendHeadlines = [
  'Generational talent {player} emerges at {team}',
  '{player} dubbed "the next Messi" after incredible display',
  'Once-in-a-generation: {player} is the real deal',
  '{team}\'s {player} breaks records with stunning performance',
  '🌟 ONCE IN A GENERATION: Scouts in awe of {player}',
];

const retirementHeadlines = [
  'Legend {player} announces retirement from football',
  'End of an era: {player} hangs up boots after glorious career',
  '{player} retires with {goals} career goals and {trophies} trophies',
  'Football mourns as {player} plays final match',
  'Farewell to a legend: {player} calls time on career',
  '🙏 Thank you, {player}: A career for the ages ends',
];

const takeoverHeadlines = [
  'BREAKING: New billionaire owner takes over {team}',
  '{team} face financial crisis, budget slashed',
  'Ownership change at {team} promises new era',
  '{team} announce ambitious rebuild plan under new ownership',
  '💰 Mega-rich consortium acquire {team}: Blank cheque budget incoming',
  '🚨 {team} sold to foreign consortium — fans react with excitement',
];

const managerHeadlines = [
  '{team} sack manager after poor run of results',
  'New manager bounce expected at {team}',
  '{team} appoint legendary coach as new boss',
  'Manager of the Year race wide open',
  '🔥 BREAKING: {team} in emergency talks with manager over future',
  '📋 {team} unveil new boss: "We have a clear project"',
];

const injuryHeadlines = [
  '🏥 BLOW: {player} out for {weeks} weeks with injury',
  '😱 {player} stretchered off — {team} fear the worst',
  '💪 {player} makes comeback sooner than expected — {team} boosted',
  '⚡ {player} cleared to return after injury scare at {team}',
];

export function generateWeeklyNews(state: GameState): NewsItem[] {
  const news: NewsItem[] = [];
  const allTeams = Object.values(state.teams);

  const count = rand(3, 6);
  for (let i = 0; i < count; i++) {
    const team = pick(allTeams);
    const league = state.leagues.find(l => l.id === team.leagueId);
    const player = team.squad.length > 0 ? pick(team.squad) : null;
    const playerFull = player ? state.players[player.id] || player : null;
    const playerName = playerFull ? `${playerFull.firstName} ${playerFull.lastName}` : 'Unknown';
    const isStarPlayer = playerFull && (playerFull.isLegend || getPlayerOverall(playerFull) > 84);

    const roll = Math.random();
    let headline: string;
    let category: NewsItem['category'];
    let importance = rand(1, 4);

    if (roll < 0.12) {
      headline = pick(transferHeadlines).replace('{player}', playerName).replace('{team}', team.name).replace('{fee}', String(rand(50, 200)));
      category = 'transfer';
    } else if (roll < 0.22) {
      headline = pick(matchHeadlines).replace('{team}', team.name);
      category = 'match';
    } else if (roll < 0.32) {
      headline = pick(dramaHeadlines).replace('{team}', team.name).replace('{player}', playerName);
      category = 'drama';
      importance = rand(2, 4);
    } else if (roll < 0.42) {
      // Social media reactions (new!)
      headline = pick(socialMediaHeadlines).replace('{team}', team.name).replace('{player}', playerName);
      category = 'drama';
      importance = rand(2, 4);
    } else if (roll < 0.50 && isStarPlayer) {
      // Superstar ego event (new!)
      headline = pick(egoHeadlines).replace('{player}', playerName).replace('{team}', team.name);
      category = 'drama';
      importance = 4;
      if (playerFull && state.players[playerFull.id]) {
        // Morale impact handled by news alone (narrative)
      }
    } else if (roll < 0.56) {
      // Media pressure (new!)
      if (team.fanMood === 'frustrated' || team.fanMood === 'angry') {
        headline = pick(mediaPressureHeadlines).replace('{team}', team.name);
        importance = 4;
      } else {
        headline = pick(matchHeadlines).replace('{team}', team.name);
      }
      category = 'manager';
    } else if (roll < 0.62) {
      // Rivalry (new!)
      headline = pick(rivalryHeadlines).replace('{team}', team.name);
      category = 'match';
      importance = rand(3, 5);
    } else if (roll < 0.68 && playerFull && playerFull.age < 22) {
      headline = pick(youthHeadlines).replace('{player}', playerName).replace('{team}', team.name);
      category = 'youth';
      importance = rand(2, 4);
    } else if (roll < 0.74 && playerFull && playerFull.isLegend) {
      headline = pick(legendHeadlines).replace('{player}', playerName).replace('{team}', team.name);
      category = 'legend';
      importance = 4;
    } else if (roll < 0.80) {
      headline = pick(managerHeadlines).replace('{team}', team.name);
      category = 'manager';
    } else if (roll < 0.86) {
      headline = pick(takeoverHeadlines).replace('{team}', team.name);
      category = 'takeover';
      importance = rand(3, 5);
    } else if (roll < 0.92 && playerFull && playerFull.injured) {
      headline = pick(injuryHeadlines).replace('{player}', playerName).replace('{team}', team.name).replace('{weeks}', String(playerFull.injuryWeeks));
      category = 'injury';
      importance = rand(2, 4);
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
      importance,
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
