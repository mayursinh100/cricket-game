// ═══════════════════════════════════════════════════════════════
//  DATA LAYER — Player, Team, League models + generation
// ═══════════════════════════════════════════════════════════════

// --- Name pools (Indian context) ---
var FIRST_NAMES = [
  'Rohit','Virat','Shubman','KL Rahul','Rishabh','Hardik','Ravindra','Jasprit','Mohammed','Bhuvneshwar',
  'Yuzvendra','Axar','Washington','Shardul','Mohammed Siraj','Kuldeep','Ishan','Sanju','Prasidh','Arshdeep',
  'Avesh','Umran','Tilak','Abhishek','Riyan','Sai Sudharsan','Yashasvi','Ruturaj','Rajat','Shahbaz',
  'Mayank','Devdutt','Venkatesh','Deepak','T Natarajan','Chetan','Harshal','Dinesh','Wriddhahan','Umesh',
  'Prithvi','Shreyas','Hanuma','Navdeep','K Khaleel','Suryakumar','Venkat','Vijay','Karthik','Rana'
];

var LAST_NAMES = [
  'Sharma','Kohli','Gill','Rahul','Pant','Pandya','Jadeja','Bumrah','Shami','Kumar',
  'Chahal','Patel','Sundar','Thakur','Siraj','Yadav','Kishan','Samson','Krishna','Singh',
  'Khan','Malik','Varma','Sharma','Parag','Nair','Jaiswal','Gaikwad','Patidar','Ahmed',
  'Agarwal','Padikkal','Iyer','Chahar','Natarajan','Sakariya','Patel','Karun','Saha','Yadav',
  'Shaw','Iyer','Vihari','Saini','Ahmed','Yadav','Chakravarthy','Shankar','Lord','Rana'
];

var TEAM_NAMES = [
  'Mumbai Lions','Delhi Daredevils','Chennai Kings','Bangalore Royals','Kolkata Tigers',
  'Hyderabad Sunrisers','Rajasthan Warriors','Punjab Lions','Gujarat Titans','Lucknow Superkings'
];

var TEAM_SHORT = ['MUM','DEL','CHE','BLR','KOL','HYD','RAJ','PUN','GUJ','LCK'];

var TEAM_COLORS = [
  ['#004BA0','#1A6BD6'], ['#00008B','#1E40AF'], ['#F9CD05','#FACC15'], ['#EC1C24','#FF3B3B'],
  ['#3A225D','#5B2D8F'], ['#FF822E','#FFA040'], ['#FF1E56','#FF4D7E'], ['#D71920','#E84A4A'],
  ['#1B2133','#2D3548'], ['#00A9E0','#1CC4F0']
];

// --- Roles ---
var ROLES = ['Batsman','Bowler','All-rounder','Wicket-keeper'];

// --- Player generation ---
function generatePlayer(opts) {
  opts = opts || {};
  var role = opts.role || ROLES[Math.floor(Math.random()*ROLES.length)];
  var age = opts.age || (18 + Math.floor(Math.random()*20));
  
  var batting, bowling;
  switch(role) {
    case 'Batsman':
      batting = 55 + Math.floor(Math.random()*45);
      bowling = Math.floor(Math.random()*30);
      break;
    case 'Bowler':
      batting = Math.floor(Math.random()*35);
      bowling = 55 + Math.floor(Math.random()*45);
      break;
    case 'All-rounder':
      batting = 45 + Math.floor(Math.random()*35);
      bowling = 45 + Math.floor(Math.random()*35);
      break;
    case 'Wicket-keeper':
      batting = 50 + Math.floor(Math.random()*40);
      bowling = Math.floor(Math.random()*15);
      break;
  }
  
  var fn = FIRST_NAMES[Math.floor(Math.random()*FIRST_NAMES.length)];
  var ln = LAST_NAMES[Math.floor(Math.random()*LAST_NAMES.length)];
  var name = fn + ' ' + ln;
  
  var bowlType = 'Pace';
  if(role === 'Bowler' || role === 'All-rounder') {
    bowlType = Math.random() > 0.4 ? 'Pace' : 'Spin';
  } else {
    bowlType = Math.random() > 0.5 ? 'Off-spin' : 'Pace';
  }
  
  var overall = Math.round((batting + bowling) / 2);
  if (role === 'Wicket-keeper') overall = Math.min(99, Math.round(batting * 0.7 + 15));
  if (role === 'Batsman') overall = Math.min(99, Math.round(batting * 0.85 + 5));
  if (role === 'Bowler') overall = Math.min(99, Math.round(bowling * 0.85 + 5));
  if (role === 'All-rounder') overall = Math.min(99, Math.round((batting + bowling) / 2));
  var value = Math.round((overall * overall * 100) + (batting * 200) + (bowling * 200) + (Math.random()*50000));
  value = Math.round(value / 1000) * 1000;
  
  return {
    id: 'p_' + Math.random().toString(36).substr(2, 9),
    name: name, role: role, age: age,
    batting: batting, bowling: bowling, bowlType: bowlType,
    fielding: 40 + Math.floor(Math.random()*50),
    fitness: 70 + Math.floor(Math.random()*30),
    form: 50 + Math.floor(Math.random()*40),
    overall: overall, value: value,
    basePrice: Math.max(50000, Math.round(value * 0.3 / 1000) * 1000),
    matches: 0, runs: 0, wickets: 0, highest: 0, trainingCD: 0,
  };
}

function generateSquad(teamName, count) {
  count = count || 15;
  var squad = [];
  var composition = [
    {role: 'Batsman', count: 5}, {role: 'Bowler', count: 5},
    {role: 'All-rounder', count: 3}, {role: 'Wicket-keeper', count: 2},
  ];
  composition.forEach(function(c) {
    for (var i = 0; i < c.count; i++) squad.push(generatePlayer({role: c.role}));
  });
  squad.sort(function(a, b) { return b.overall - a.overall; });
  return squad;
}

function generateLeague(userTeamName, userSquad) {
  var teams = [];
  teams.push({
    id: 'team_user', name: userTeamName, short: userTeamName.substring(0, 3).toUpperCase(),
    colors: TEAM_COLORS[0], isUser: true, squad: userSquad,
    played: 0, won: 0, lost: 0, points: 0, nrr: 0,
    runsFor: 0, oversFor: 0, runsAgainst: 0, oversAgainst: 0,
  });
  var usedNames = [userTeamName];
  for (var i = 0; i < 7; i++) {
    var tName = TEAM_NAMES[i + 1];
    if (usedNames.indexOf(tName) >= 0) tName = TEAM_NAMES[i + 3];
    usedNames.push(tName);
    teams.push({
      id: 'team_' + i, name: tName, short: TEAM_SHORT[i + 1] || tName.substring(0, 3).toUpperCase(),
      colors: TEAM_COLORS[i + 1], isUser: false, squad: generateSquad(tName),
      played: 0, won: 0, lost: 0, points: 0, nrr: 0,
      runsFor: 0, oversFor: 0, runsAgainst: 0, oversAgainst: 0,
    });
  }
  return teams;
}

function generateFixtures(teams) {
  var fixtures = [];
  var n = teams.length;
  var rounds = n - 1;
  var teamList = teams.slice();
  if (teamList.length % 2 !== 0) teamList.push(null);
  for (var round = 0; round < rounds; round++) {
    for (var i = 0; i < teamList.length / 2; i++) {
      var t1 = teamList[i];
      var t2 = teamList[teamList.length - 1 - i];
      if (t1 && t2) {
        if (round % 2 === 0) fixtures.push({ round: round + 1, home: t1.id, away: t2.id, played: false });
        else fixtures.push({ round: round + 1, home: t2.id, away: t1.id, played: false });
      }
    }
    var last = teamList.pop();
    teamList.splice(1, 0, last);
  }
  fixtures.sort(function(a, b) { return a.round - b.round; });
  fixtures.forEach(function(f, i) { f.matchNo = i + 1; });
  return fixtures;
}

function generateAuctionPool(count) {
  count = count || 30;
  var pool = [];
  for (var i = 0; i < count; i++) pool.push(generatePlayer());
  pool.sort(function(a, b) { return b.overall - a.overall; });
  return pool;
}

var Game = {
  state: null,
  init: function() {
    this.state = {
      career: { teamName: '', budget: 5000000, season: 1, day: 1 },
      userTeam: null, teams: [], fixtures: [], currentFixture: null,
      auctionPool: [], screen: 'menu', match: null,
    };
  },
  newCareer: function(teamName) {
    this.init();
    var squad = generateSquad(teamName);
    var teams = generateLeague(teamName, squad);
    this.state.career.teamName = teamName;
    this.state.userTeam = teams[0];
    this.state.teams = teams;
    this.state.fixtures = generateFixtures(teams);
    this.state.auctionPool = generateAuctionPool(30);
    this.state.screen = 'hub';
    Save.save();
  },
  getUserTeam: function() { return this.state.userTeam; },
  getTeamById: function(id) {
    for (var i = 0; i < this.state.teams.length; i++) {
      if (this.state.teams[i].id === id) return this.state.teams[i];
    }
    return null;
  },
  getNextFixture: function() {
    for (var i = 0; i < this.state.fixtures.length; i++) {
      if (!this.state.fixtures[i].played) return this.state.fixtures[i];
    }
    return null;
  },
  getPlayedFixtures: function() {
    return this.state.fixtures.filter(function(f) { return f.played; });
  },
  getLeagueTable: function() {
    var table = this.state.teams.slice();
    table.sort(function(a, b) {
      if (b.points !== a.points) return b.points - a.points;
      return b.nrr - a.nrr;
    });
    return table;
  },
  computeNRR: function(team) {
    var runRateFor = team.oversFor > 0 ? team.runsFor / team.oversFor : 0;
    var runRateAgainst = team.oversAgainst > 0 ? team.runsAgainst / team.oversAgainst : 0;
    team.nrr = runRateFor - runRateAgainst;
  },
  advanceDay: function() {
    this.state.career.day++;
    var squad = this.getUserTeam().squad;
    squad.forEach(function(p) { if (p.trainingCD > 0) p.trainingCD--; });
    if (this.state.career.day % 3 === 0) {
      var newPlayers = generateAuctionPool(5);
      this.state.auctionPool = this.state.auctionPool.concat(newPlayers);
    }
    Save.save();
  },
};