// ═══════════════════════════════════════════════════════════════
//  UI SCREENS — All management screens
// ═══════════════════════════════════════════════════════════════

var UI = {
  
  // --- Navigate to a screen ---
  show: function(screen) {
    Game.state.screen = screen;
    var content = document.getElementById('appContent');
    content.innerHTML = '';
    content.style.display = 'block';
    
    // Hide 3D canvas when not in match
    var canvas = document.getElementById('gameCanvas');
    if (screen !== 'match') { canvas.style.display = 'none'; }
    
    switch(screen) {
      case 'menu': this.renderMenu(content); break;
      case 'hub': this.renderHub(content); break;
      case 'squad': this.renderSquad(content); break;
      case 'auction': this.renderAuction(content); break;
      case 'training': this.renderTraining(content); break;
      case 'matchSetup': this.renderMatchSetup(content); break;
      case 'match': content.style.display = 'none'; canvas.style.display = 'block'; MatchUI.start(); break;
      case 'results': this.renderResults(content); break;
      case 'league': this.renderLeague(content); break;
      case 'fixtures': this.renderFixtures(content); break;
      case 'seasonEnd': this.renderSeasonEnd(content); break;
    }
    Save.save();
  },
  
  // --- Top nav bar ---
  navBar: function(active) {
    var team = Game.getUserTeam();
    if (!team) return '';
    var budget = Game.state.career.budget;
    var budgetStr = (budget >= 10000000) ? (budget/10000000).toFixed(1) + 'Cr' : (budget/100000).toFixed(0) + 'L';
    
    var tabs = [
      {id: 'hub', label: 'Hub'}, {id: 'squad', label: 'Squad'},
      {id: 'auction', label: 'Auction'}, {id: 'training', label: 'Training'},
      {id: 'fixtures', label: 'Fixtures'}, {id: 'league', label: 'Table'},
    ];
    
    var html = '<div class="nav-bar">';
    html += '<div class="nav-team">' + team.name + ' <span class="nav-season">S' + Game.state.career.season + ' D' + Game.state.career.day + '</span></div>';
    html += '<div class="nav-tabs">';
    tabs.forEach(function(t) {
      html += '<button class="nav-tab' + (active === t.id ? ' active' : '') + '" onclick="UI.show(\'' + t.id + '\')">' + t.label + '</button>';
    });
    html += '</div>';
    html += '<div class="nav-budget">&#8377; ' + budgetStr + '</div>';
    html += '</div>';
    return html;
  },
  
  // ═══ MENU SCREEN ═══
  renderMenu: function(c) {
    var hasSave = Save.exists();
    c.innerHTML = '<div class="menu-screen"><div class="menu-logo">&#9670; CRICKET CHAMPIONSHIP &#9670;</div><div class="menu-title">Superstars</div><div class="menu-sub">Strategy &#8226; Management &#8226; Cricket</div><div class="menu-buttons">' + (hasSave ? '<button class="menu-btn primary" onclick="UI.show(\'hub\')">Continue Career</button>' : '') + '<button class="menu-btn" onclick="UI.showNewCareer()">New Career</button>' + (hasSave ? '<button class="menu-btn danger" onclick="UI.deleteSave()">Delete Save</button>' : '') + '</div><div class="menu-footer">Build your team, train your players, win the league!</div></div>';
  },
  
  showNewCareer: function() {
    var c = document.getElementById('appContent');
    c.innerHTML = '<div class="menu-screen"><div class="form-title">Start New Career</div><div class="form-sub">Enter your team name</div><input type="text" id="teamNameInput" class="text-input" placeholder="e.g. Mumbai Superkings" maxlength="20" /><button class="menu-btn primary" onclick="UI.createCareer()">Start Career</button><button class="menu-btn" onclick="UI.show(\'menu\')">Back</button></div>';
    document.getElementById('teamNameInput').focus();
    document.getElementById('teamNameInput').addEventListener('keydown', function(e) { if (e.key === 'Enter') UI.createCareer(); });
  },
  
  createCareer: function() {
    var name = document.getElementById('teamNameInput').value.trim();
    if (!name) name = 'My Team';
    Game.newCareer(name);
    this.show('hub');
  },
  
  deleteSave: function() {
    if (confirm('Delete your saved career? This cannot be undone.')) {
      Save.delete(); Game.init(); this.show('menu');
    }
  },
  
  // ═══ CAREER HUB ═══
  renderHub: function(c) {
    var team = Game.getUserTeam();
    var table = Game.getLeagueTable();
    var myRank = table.indexOf(team) + 1;
    var nextFx = Game.getNextFixture();
    var played = team.played;
    
    var nextFixtureHtml = '';
    if (nextFx) {
      var home = Game.getTeamById(nextFx.home);
      var away = Game.getTeamById(nextFx.away);
      var opp = home.id === team.id ? away : home;
      var isHome = home.id === team.id;
      nextFixtureHtml = '<div class="card next-fixture" onclick="UI.show(\'matchSetup\')"><div class="card-label">Next Match</div><div class="fixture-vs"><div class="fixture-team">' + (isHome ? team.name : opp.name) + '</div><div class="fixture-vs-text">VS</div><div class="fixture-team">' + (isHome ? opp.name : team.name) + '</div></div><div class="fixture-info">' + (isHome ? 'Home' : 'Away') + ' &#8226; Round ' + nextFx.round + '</div><button class="action-btn green">Play Match &#9654;</button></div>';
    } else {
      nextFixtureHtml = '<div class="card"><div class="card-label">Season Complete!</div><div class="card-big">' + (myRank === 1 ? '&#127942; Champions!' : 'Finished #' + myRank) + '</div></div>';
    }
    
    var squadSummary = '<div class="squad-stat"><span>Batsmen</span><span>' + team.squad.filter(function(p){return p.role==='Batsman';}).length + '</span></div><div class="squad-stat"><span>Bowlers</span><span>' + team.squad.filter(function(p){return p.role==='Bowler';}).length + '</span></div><div class="squad-stat"><span>All-rounders</span><span>' + team.squad.filter(function(p){return p.role==='All-rounder';}).length + '</span></div><div class="squad-stat"><span>Keepers</span><span>' + team.squad.filter(function(p){return p.role==='Wicket-keeper';}).length + '</span></div>';
    var avgRating = Math.round(team.squad.reduce(function(s,p){return s+p.overall;},0)/team.squad.length);
    
    var miniTable = table.slice(0, 5).map(function(t, i) {
      return '<div class="mini-table-row ' + (t.id === team.id ? 'highlight' : '') + '"><span>' + (i+1) + '. ' + t.short + '</span><span>' + t.played + 'P</span><span>' + t.won + 'W</span><span>' + t.points + 'pts</span></div>';
    }).join('');
    
    c.innerHTML = this.navBar('hub') + '<div class="screen-content"><div class="hub-grid"><div class="card team-card"><div class="card-label">Your Team</div><div class="team-name-big">' + team.name + '</div><div class="team-stats-row"><div class="mini-stat"><div class="mini-val">' + played + '</div><div class="mini-label">Played</div></div><div class="mini-stat"><div class="mini-val">' + team.won + '</div><div class="mini-label">Won</div></div><div class="mini-stat"><div class="mini-val">' + team.lost + '</div><div class="mini-label">Lost</div></div><div class="mini-stat"><div class="mini-val">' + team.points + '</div><div class="mini-label">Points</div></div></div><div class="team-rank">Rank: #' + myRank + '</div></div>' + nextFixtureHtml + '<div class="card"><div class="card-label">Squad Overview</div><div class="squad-summary">' + squadSummary + '</div><div class="avg-rating">Avg Rating: ' + avgRating + '</div><button class="action-btn" onclick="UI.show(\'squad\')">View Squad</button></div><div class="card"><div class="card-label">League Table</div><div class="mini-table">' + miniTable + '</div><button class="action-btn" onclick="UI.show(\'league\')">Full Table</button></div></div></div>';
  },
  
  // ═══ SQUAD SCREEN ═══
  renderSquad: function(c) {
    var team = Game.getUserTeam();
    var sorted = team.squad.slice().sort(function(a, b) { return b.overall - a.overall; });
    c.innerHTML = this.navBar('squad') + '<div class="screen-content"><div class="screen-title">Your Squad (' + team.squad.length + ' players)</div><div class="player-grid">' + sorted.map(function(p) { return UI.playerCard(p); }).join('') + '</div></div>';
  },
  
  // --- Player card HTML ---
  playerCard: function(p) {
    var roleColor = { 'Batsman': '#3b82f6', 'Bowler': '#ef4444', 'All-rounder': '#a855f7', 'Wicket-keeper': '#f59e0b' };
    var color = roleColor[p.role] || '#666';
    var formColor = p.form > 65 ? '#4ade80' : p.form > 45 ? '#facc15' : '#f87171';
    var fitColor = p.fitness > 70 ? '#4ade80' : p.fitness > 50 ? '#facc15' : '#f87171';
    
    return '<div class="player-card"><div class="pc-header" style="border-color:' + color + '"><div class="pc-name">' + p.name + '</div><div class="pc-role" style="background:' + color + '">' + p.role + '</div></div><div class="pc-body"><div class="pc-overall"><div class="pc-o-val">' + p.overall + '</div><div class="pc-o-label">OVR</div></div><div class="pc-stats"><div class="pc-stat"><span>BAT</span><div class="stat-bar"><div class="stat-fill" style="width:' + p.batting + '%;background:#3b82f6"></div></div><span>' + p.batting + '</span></div><div class="pc-stat"><span>BWL</span><div class="stat-bar"><div class="stat-fill" style="width:' + p.bowling + '%;background:#ef4444"></div></div><span>' + p.bowling + '</span></div><div class="pc-stat"><span>FLD</span><div class="stat-bar"><div class="stat-fill" style="width:' + p.fielding + '%;background:#22d3ee"></div></div><span>' + p.fielding + '</span></div></div></div><div class="pc-footer"><div class="pc-meta">Age ' + p.age + ' &#8226; ' + p.bowlType + '</div><div class="pc-conditions"><span class="condition-pill" style="color:' + formColor + '">Form ' + p.form + '</span><span class="condition-pill" style="color:' + fitColor + '">Fit ' + p.fitness + '%</span></div></div>' + (p.trainingCD > 0 ? '<div class="pc-cd">Training: ' + p.trainingCD + 'd</div>' : '') + '</div>';
  },
  
  // ═══ AUCTION SCREEN ═══
  renderAuction: function(c) {
    var team = Game.getUserTeam();
    var pool = Game.state.auctionPool;
    var budget = Game.state.career.budget;
    c.innerHTML = this.navBar('auction') + '<div class="screen-content"><div class="screen-title">Auction Pool <span class="budget-display">Budget: &#8377; ' + this.formatMoney(budget) + '</span></div><div class="player-grid">' + pool.map(function(p) { return UI.auctionCard(p, budget); }).join('') + '</div></div>';
  },
  
  auctionCard: function(p, budget) {
    var roleColor = { 'Batsman': '#3b82f6', 'Bowler': '#ef4444', 'All-rounder': '#a855f7', 'Wicket-keeper': '#f59e0b' };
    var color = roleColor[p.role] || '#666';
    var canAfford = budget >= p.basePrice;
    return '<div class="player-card auction-card"><div class="pc-header" style="border-color:' + color + '"><div class="pc-name">' + p.name + '</div><div class="pc-role" style="background:' + color + '">' + p.role + '</div></div><div class="pc-body"><div class="pc-overall"><div class="pc-o-val">' + p.overall + '</div><div class="pc-o-label">OVR</div></div><div class="pc-stats"><div class="pc-stat"><span>BAT</span><div class="stat-bar"><div class="stat-fill" style="width:' + p.batting + '%;background:#3b82f6"></div></div><span>' + p.batting + '</span></div><div class="pc-stat"><span>BWL</span><div class="stat-bar"><div class="stat-fill" style="width:' + p.bowling + '%;background:#ef4444"></div></div><span>' + p.bowling + '</span></div></div></div><div class="pc-footer"><div class="pc-price">&#8377; ' + this.formatMoney(p.basePrice) + '</div><button class="action-btn ' + (canAfford ? 'green' : 'disabled') + '" ' + (canAfford ? '' : 'disabled') + ' onclick="UI.buyPlayer(\'' + p.id + '\')">' + (canAfford ? 'Buy' : 'Can\'t Afford') + '</button></div></div>';
  },
  
  buyPlayer: function(playerId) {
    var team = Game.getUserTeam();
    var pool = Game.state.auctionPool;
    var p = pool.find(function(x) { return x.id === playerId; });
    if (!p) return;
    if (Game.state.career.budget < p.basePrice) return;
    Game.state.career.budget -= p.basePrice;
    team.squad.push(p);
    pool.splice(pool.indexOf(p), 1);
    Save.save();
    this.show('auction');
  },
  
  // ═══ TRAINING SCREEN ═══
  renderTraining: function(c) {
    var team = Game.getUserTeam();
    var sorted = team.squad.slice().sort(function(a, b) { return b.overall - a.overall; });
    var rows = sorted.map(function(p) {
      return '<div class="training-row ' + (p.trainingCD > 0 ? 'cooldown' : '') + '"><div class="train-info"><div class="train-name">' + p.name + '</div><div class="train-stats">BAT ' + p.batting + ' &#8226; BWL ' + p.bowling + ' &#8226; FIT ' + p.fitness + '%</div></div><div class="train-actions">' + (p.trainingCD > 0 ? '<span class="cd-badge">CD: ' + p.trainingCD + 'd</span>' : '<button class="action-btn small" onclick="UI.showTrainOptions(\'' + p.id + '\')">Train</button>') + '</div></div>';
    }).join('');
    c.innerHTML = this.navBar('training') + '<div class="screen-content"><div class="screen-title">Training Center</div><div class="training-info">Select a player to train. Each session costs 1 day cooldown and &#8377; 50,000.</div><div class="player-list">' + rows + '</div></div>';
  },
  
  showTrainOptions: function(playerId) {
    var team = Game.getUserTeam();
    var p = team.squad.find(function(x) { return x.id === playerId; });
    if (!p) return;
    if (Game.state.career.budget < 50000) { alert('Not enough budget for training! Need &#8377; 50,000'); return; }
    var c = document.getElementById('appContent');
    c.innerHTML = this.navBar('training') + '<div class="screen-content"><div class="screen-title">Train ' + p.name + '</div><div class="training-info">Current: BAT ' + p.batting + ' &#8226; BWL ' + p.bowling + ' &#8226; FIT ' + p.fitness + '%</div><div class="train-options"><div class="train-option" onclick="UI.doTraining(\'' + p.id + '\', \'batting\')"><div class="to-title">Batting Practice</div><div class="to-desc">+2-4 Batting rating</div><div class="to-cost">&#8377; 50,000 &#8226; 1 day CD</div></div><div class="train-option" onclick="UI.doTraining(\'' + p.id + '\', \'bowling\')"><div class="to-title">Bowling Practice</div><div class="to-desc">+2-4 Bowling rating</div><div class="to-cost">&#8377; 50,000 &#8226; 1 day CD</div></div><div class="train-option" onclick="UI.doTraining(\'' + p.id + '\', \'fitness\')"><div class="to-title">Fitness Training</div><div class="to-desc">+5-10 Fitness, +3 Form</div><div class="to-cost">&#8377; 50,000 &#8226; 1 day CD</div></div><div class="train-option" onclick="UI.doTraining(\'' + p.id + '\', \'form\')"><div class="to-title">Net Session</div><div class="to-desc">+5-10 Form</div><div class="to-cost">&#8377; 50,000 &#8226; 1 day CD</div></div></div><button class="action-btn" onclick="UI.show(\'training\')">Back</button></div>';
  },
  
  doTraining: function(playerId, type) {
    var team = Game.getUserTeam();
    var p = team.squad.find(function(x) { return x.id === playerId; });
    if (!p) return;
    if (Game.state.career.budget < 50000) return;
    Game.state.career.budget -= 50000;
    switch(type) {
      case 'batting': p.batting = Math.min(99, p.batting + 2 + Math.floor(Math.random() * 3)); break;
      case 'bowling': p.bowling = Math.min(99, p.bowling + 2 + Math.floor(Math.random() * 3)); break;
      case 'fitness': p.fitness = Math.min(100, p.fitness + 5 + Math.floor(Math.random() * 6)); p.form = Math.min(99, p.form + 3); break;
      case 'form': p.form = Math.min(99, p.form + 5 + Math.floor(Math.random() * 6)); break;
    }
    p.overall = Math.min(99, Math.round((p.batting + p.bowling) / 2));
    if (p.role === 'Wicket-keeper') p.overall = Math.min(99, Math.round(p.batting * 0.7 + 15));
    if (p.role === 'Batsman') p.overall = Math.min(99, Math.round(p.batting * 0.85 + 5));
    if (p.role === 'Bowler') p.overall = Math.min(99, Math.round(p.bowling * 0.85 + 5));
    p.trainingCD = 2;
    Save.save(); Game.advanceDay(); this.show('training');
  },
  
  // ═══ MATCH SETUP SCREEN ═══
  renderMatchSetup: function(c) {
    var team = Game.getUserTeam();
    var fx = Game.getNextFixture();
    if (!fx) { this.show('hub'); return; }
    var home = Game.getTeamById(fx.home);
    var away = Game.getTeamById(fx.away);
    var opp = home.id === team.id ? away : home;
    var isHome = home.id === team.id;
    var xi = MatchEngine.getBestXI(team);
    var xiHtml = xi.map(function(p, i) {
      return '<div class="xi-card"><div class="xi-num">' + (i+1) + '</div><div class="xi-name">' + p.name + '</div><div class="xi-role">' + p.role + ' &#8226; ' + p.overall + ' OVR</div></div>';
    }).join('');
    
    c.innerHTML = this.navBar('matchSetup') + '<div class="screen-content"><div class="match-setup-title">' + (isHome ? team.name : opp.name) + ' VS ' + (isHome ? opp.name : team.name) + '</div><div class="match-setup-info">' + (isHome ? 'Home' : 'Away') + ' Match &#8226; ' + MatchEngine.OVERS + ' Overs</div><div class="setup-section"><div class="setup-label">Your Playing XI</div><div class="xi-grid">' + xiHtml + '</div></div><div class="setup-section"><div class="setup-label">Batting Aggression</div><div class="tactic-buttons"><button class="tactic-btn" onclick="UI.setTactic(\'bat\', \'defensive\')">Defensive</button><button class="tactic-btn active" onclick="UI.setTactic(\'bat\', \'balanced\')">Balanced</button><button class="tactic-btn" onclick="UI.setTactic(\'bat\', \'aggressive\')">Aggressive</button></div></div><div class="setup-section"><div class="setup-label">Bowling Tactic</div><div class="tactic-buttons"><button class="tactic-btn" onclick="UI.setTactic(\'bowl\', \'defensive\')">Defensive</button><button class="tactic-btn active" onclick="UI.setTactic(\'bowl\', \'balanced\')">Balanced</button><button class="tactic-btn" onclick="UI.setTactic(\'bowl\', \'attacking\')">Attacking</button></div></div><div class="setup-section"><div class="setup-label">Toss Decision</div><div class="tactic-buttons"><button class="tactic-btn active" onclick="UI.setToss(\'bat\')">Bat First</button><button class="tactic-btn" onclick="UI.setToss(\'bowl\')">Bowl First</button></div></div><button class="action-btn green big" onclick="UI.startMatch()">Start Match &#9654;</button><button class="action-btn" onclick="UI.show(\'hub\')">Back</button></div>';
    this.setupTactics = { bat: 'balanced', bowl: 'balanced', toss: 'bat' };
  },
  
  setTactic: function(type, val) {
    this.setupTactics = this.setupTactics || { bat: 'balanced', bowl: 'balanced', toss: 'bat' };
    this.setupTactics[type] = val;
    var group = type === 'bat' ? 0 : (type === 'bowl' ? 1 : 2);
    var btns = document.querySelectorAll('.tactic-buttons')[group].querySelectorAll('.tactic-btn');
    btns.forEach(function(b) { b.classList.remove('active'); });
    event.target.classList.add('active');
  },
  
  setToss: function(val) {
    this.setupTactics = this.setupTactics || { bat: 'balanced', bowl: 'balanced', toss: 'bat' };
    this.setupTactics.toss = val;
    var btns = document.querySelectorAll('.tactic-buttons')[2].querySelectorAll('.tactic-btn');
    btns.forEach(function(b) { b.classList.remove('active'); });
    event.target.classList.add('active');
  },
  
  startMatch: function() {
    var team = Game.getUserTeam();
    var fx = Game.getNextFixture();
    if (!fx) return;
    var home = Game.getTeamById(fx.home);
    var away = Game.getTeamById(fx.away);
    var userIsHome = home.id === team.id;
    var userBatsFirst = this.setupTactics.toss === 'bat';
    Game.state.match = MatchEngine.startMatch(home, away, userBatsFirst, userIsHome);
    Game.state.match.battingAggression = this.setupTactics.bat;
    Game.state.match.bowlingTactic = this.setupTactics.bowl;
    Game.state.currentFixture = fx;
    this.show('match');
  },
  
  // ═══ MATCH RESULTS SCREEN ═══
  renderResults: function(c) {
    var match = Game.state.match;
    if (!match) { this.show('hub'); return; }
    var ci = match.score[0] > match.score[1] ? 0 : 1;
    var winTeam = ci === 0 ? match.homeTeam : match.awayTeam;
    var isUserWin = winTeam.id === Game.getUserTeam().id;
    var motm = MatchEngine.getMotM(match);
    
    c.innerHTML = this.navBar('results') + '<div class="screen-content"><div class="result-banner ' + (isUserWin ? 'win' : 'loss') + '">' + (isUserWin ? 'VICTORY!' : 'DEFEAT') + '</div><div class="result-score">' + match.battingTeam.name + ' ' + match.score[0] + '/' + match.wickets[0] + ' vs ' + match.bowlingTeam.name + ' ' + match.score[1] + '/' + match.wickets[1] + '</div><div class="result-motm">&#127942; Man of the Match: ' + (motm ? motm.name : 'N/A') + '</div><div class="scorecard"><div class="sc-title">Batting Scorecard</div>' + this.battingScorecard(match, 0) + this.battingScorecard(match, 1) + '<div class="sc-title">Bowling Scorecard</div>' + this.bowlingScorecard(match, 0) + this.bowlingScorecard(match, 1) + '</div><div class="result-rewards"><div class="reward-item">&#8377; ' + (isUserWin ? '500,000' : '200,000') + ' match fee earned</div><div class="reward-item">' + (isUserWin ? '+2 points' : '+0 points') + ' in league</div></div><button class="action-btn green big" onclick="UI.continueCareer()">Continue</button></div>';
  },
  
  battingScorecard: function(match, innings) {
    var batTeam = innings === 0 ? match.battingTeam : match.bowlingTeam;
    var card = match.battingCard[innings];
    if (!card || card.length === 0) return '';
    var overs = Math.floor(match.balls[innings] / 6) + '.' + (match.balls[innings] % 6);
    var rows = card.map(function(b) {
      var sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(0) : '0';
      return '<div class="sc-row"><span class="sc-name">' + b.player.name + '</span><span>' + b.runs + '</span><span>' + b.balls + '</span><span>' + b.fours + '</span><span>' + b.sixes + '</span><span>' + sr + '</span><span class="sc-out">' + (b.out ? b.howOut : 'not out') + '</span></div>';
    }).join('');
    return '<div class="sc-innings"><div class="sc-innings-title">' + batTeam.name + ' - ' + match.score[innings] + '/' + match.wickets[innings] + ' (' + overs + ' ov)</div><div class="sc-table"><div class="sc-row sc-header"><span>Batsman</span><span>R</span><span>B</span><span>4s</span><span>6s</span><span>SR</span><span>How Out</span></div>' + rows + '</div></div>';
  },
  
  bowlingScorecard: function(match, innings) {
    var bowlTeam = innings === 0 ? match.bowlingTeam : match.battingTeam;
    var card = match.bowlingCard[innings];
    if (!card || card.length === 0) return '';
    var rows = card.map(function(b) {
      var ovs = Math.floor(b.balls / 6) + '.' + (b.balls % 6);
      var econ = b.balls > 0 ? (b.runs / (b.balls / 6)).toFixed(1) : '0.0';
      return '<div class="sc-row"><span class="sc-name">' + b.player.name + '</span><span>' + ovs + '</span><span>0</span><span>' + b.runs + '</span><span>' + b.wickets + '</span><span>' + econ + '</span></div>';
    }).join('');
    return '<div class="sc-innings"><div class="sc-innings-title">' + bowlTeam.name + ' Bowling</div><div class="sc-table"><div class="sc-row sc-header"><span>Bowler</span><span>O</span><span>M</span><span>R</span><span>W</span><span>Econ</span></div>' + rows + '</div></div>';
  },
  
  continueCareer: function() {
    var match = Game.state.match;
    var fx = Game.state.currentFixture;
    var team = Game.getUserTeam();
    
    if (match && fx) {
      var userBatFirst = match.battingTeam.id === team.id;
      var userScore = userBatFirst ? match.score[0] : match.score[1];
      var oppScore = userBatFirst ? match.score[1] : match.score[0];
      var userWon = userScore > oppScore;
      var opp = Game.getTeamById(fx.home === team.id ? fx.away : fx.home);
      
      team.played++; opp.played++;
      team.runsFor += userScore; team.runsAgainst += oppScore;
      team.oversFor += match.balls[userBatFirst ? 0 : 1] / 6;
      team.oversAgainst += match.balls[userBatFirst ? 0 : 1] / 6;
      Game.computeNRR(team);
      
      if (userWon) {
        team.won++; team.points += 2; opp.lost++;
        Game.state.career.budget += 500000;
      } else {
        team.lost++; opp.won++; opp.points += 2;
        Game.state.career.budget += 200000;
      }
      Game.computeNRR(opp);
      
      fx.played = true;
      fx.result = { score: match.score, wickets: match.wickets, winner: userWon ? team.id : opp.id };
      
      // Simulate other matches in this round
      var otherFx = Game.state.fixtures.filter(function(f) {
        return !f.played && f.round === fx.round && f.matchNo !== fx.matchNo;
      });
      otherFx.forEach(function(f) {
        var h = Game.getTeamById(f.home);
        var a = Game.getTeamById(f.away);
        var sim = MatchEngine.simulateAIMatch(h, a);
        h.played++; a.played++;
        h.runsFor += sim.score[0]; h.runsAgainst += sim.score[1];
        a.runsFor += sim.score[1]; a.runsAgainst += sim.score[0];
        h.oversFor += MatchEngine.OVERS; a.oversFor += MatchEngine.OVERS;
        h.oversAgainst += MatchEngine.OVERS; a.oversAgainst += MatchEngine.OVERS;
        if (sim.winner) {
          sim.winner.won++; sim.winner.points += 2;
          var loser = sim.winner.id === h.id ? a : h; loser.lost++;
        }
        Game.computeNRR(h); Game.computeNRR(a);
        f.played = true;
        f.result = { score: sim.score, wickets: sim.wickets, winner: sim.winner ? sim.winner.id : null };
      });
      
      // Update player stats
      match.battingCard[0].forEach(function(b) { b.player.runs += b.runs; b.player.matches++; });
      match.battingCard[1].forEach(function(b) { b.player.runs += b.runs; });
      match.bowlingCard[0].forEach(function(b) { b.player.wickets += b.wickets; });
      match.bowlingCard[1].forEach(function(b) { b.player.wickets += b.wickets; });
      
      // Form updates
      team.squad.forEach(function(p) {
        p.form = Math.max(30, Math.min(99, p.form + (Math.random() - 0.5) * 10));
        p.form = Math.round(p.form);
      });
    }
    
    Game.advanceDay();
    Game.state.match = null;
    Game.state.currentFixture = null;
    Save.save();
    
    var nextFx = Game.getNextFixture();
    if (!nextFx) { this.show('seasonEnd'); } else { this.show('hub'); }
  },
  
  // ═══ LEAGUE TABLE SCREEN ═══
  renderLeague: function(c) {
    var table = Game.getLeagueTable();
    var team = Game.getUserTeam();
    var rows = table.map(function(t, i) {
      return '<div class="lt-row ' + (t.id === team.id ? 'highlight' : '') + '"><span>' + (i+1) + '</span><span class="lt-team">' + t.name + '</span><span>' + t.played + '</span><span>' + t.won + '</span><span>' + t.lost + '</span><span><b>' + t.points + '</b></span><span>' + (t.nrr > 0 ? '+' : '') + t.nrr.toFixed(2) + '</span></div>';
    }).join('');
    c.innerHTML = this.navBar('league') + '<div class="screen-content"><div class="screen-title">League Table - Season ' + Game.state.career.season + '</div><div class="league-table"><div class="lt-header"><span>#</span><span>Team</span><span>P</span><span>W</span><span>L</span><span>PTS</span><span>NRR</span></div>' + rows + '</div></div>';
  },
  
  // ═══ FIXTURES SCREEN ═══
  renderFixtures: function(c) {
    var fixtures = Game.state.fixtures;
    var team = Game.getUserTeam();
    var rows = fixtures.map(function(f) {
      var home = Game.getTeamById(f.home);
      var away = Game.getTeamById(f.away);
      var isUser = home.id === team.id || away.id === team.id;
      var resultStr = '';
      if (f.played && f.result) {
        var winner = f.result.winner ? Game.getTeamById(f.result.winner) : null;
        resultStr = winner ? winner.short + ' won' : 'Tied';
      }
      return '<div class="fixture-row ' + (isUser ? 'user' : '') + ' ' + (f.played ? 'played' : '') + '"><span class="fx-round">R' + f.round + '</span><span class="fx-teams">' + home.short + ' vs ' + away.short + '</span><span class="fx-result">' + resultStr + '</span></div>';
    }).join('');
    c.innerHTML = this.navBar('fixtures') + '<div class="screen-content"><div class="screen-title">Fixtures - Season ' + Game.state.career.season + '</div><div class="fixtures-list">' + rows + '</div></div>';
  },
  
  // ═══ SEASON END ═══
  renderSeasonEnd: function() {
    var table = Game.getLeagueTable();
    var team = Game.getUserTeam();
    var rank = table.indexOf(team) + 1;
    var c = document.getElementById('appContent');
    var bonus = rank === 1 ? '10,000,000' : rank <= 4 ? '5,000,000' : '2,000,000';
    c.innerHTML = this.navBar('hub') + '<div class="screen-content"><div class="season-end-banner">' + (rank === 1 ? '&#127942; CHAMPIONS!' : 'Season Complete') + '</div><div class="season-rank">You finished #' + rank + ' in the league</div><div class="season-rewards"><div class="reward-item">&#8377; ' + bonus + ' season bonus</div><div class="reward-item">All players +5 form refresh</div></div><button class="action-btn green big" onclick="UI.startNewSeason()">Start Next Season</button></div>';
  },
  
  startNewSeason: function() {
    Game.state.career.season++;
    Game.state.career.day = 1;
    Game.state.career.budget += 5000000;
    Game.state.teams.forEach(function(t) {
      t.played = 0; t.won = 0; t.lost = 0; t.points = 0; t.nrr = 0;
      t.runsFor = 0; t.oversFor = 0; t.runsAgainst = 0; t.oversAgainst = 0;
      t.squad.forEach(function(p) {
        p.age++; p.form = 60 + Math.floor(Math.random() * 20);
        p.fitness = Math.max(50, p.fitness - 5); p.trainingCD = 0;
      });
      t.squad = t.squad.filter(function(p) { return p.age < 38; });
      while (t.squad.length < 15) { t.squad.push(generatePlayer()); }
    });
    Game.state.fixtures = generateFixtures(Game.state.teams);
    Game.state.auctionPool = generateAuctionPool(30);
    Save.save();
    this.show('hub');
  },
  
  // ═══ UTILITY ═══
  formatMoney: function(amount) {
    if (amount >= 10000000) return (amount / 10000000).toFixed(1) + 'Cr';
    if (amount >= 100000) return (amount / 100000).toFixed(0) + 'L';
    return amount.toLocaleString('en-IN');
  },
};