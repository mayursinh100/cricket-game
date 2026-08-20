// ═══════════════════════════════════════════════════════════════
//  MATCH ENGINE — Tactical ball-by-ball simulation
//  Driven by player stats + aggression/tactics settings
// ═══════════════════════════════════════════════════════════════

var MatchEngine = {
  
  // Overs per innings (short format like Hitwicket)
  OVERS: 5,
  
  // --- Start a new match ---
  startMatch: function(homeTeam, awayTeam, userBattingFirst, userIsHome) {
    var battingTeam = userBattingFirst ? homeTeam : awayTeam;
    var bowlingTeam = userBattingFirst ? awayTeam : homeTeam;
    
    var match = {
      homeTeam: homeTeam, awayTeam: awayTeam, userIsHome: userIsHome,
      innings: 1, target: 0,
      battingTeam: battingTeam, bowlingTeam: bowlingTeam,
      score: [0, 0], wickets: [0, 0], balls: [0, 0],
      battingXI: this.getBestXI(battingTeam), bowlingXI: this.getBestXI(bowlingTeam),
      striker: 0, nonStriker: 1, bowlerIdx: 0,
      battingCard: [[], []], bowlingCard: [[], []],
      overHistory: [[], []], currentOver: [],
      battingAggression: 'balanced', bowlingTactic: 'balanced',
      done: false, result: null, motm: null,
    };
    
    match.battingCard[0] = [
      { player: match.battingXI[0], runs: 0, balls: 0, fours: 0, sixes: 0, out: false, howOut: '' },
      { player: match.battingXI[1], runs: 0, balls: 0, fours: 0, sixes: 0, out: false, howOut: '' },
    ];
    match.bowlingCard[0] = [];
    return match;
  },
  
  // --- Get best playing XI from squad ---
  getBestXI: function(team) {
    var sorted = team.squad.slice().sort(function(a, b) { return b.overall - a.overall; });
    var xi = [];
    var batsmen = sorted.filter(function(p) { return p.role === 'Batsman'; }).slice(0, 4);
    var bowlers = sorted.filter(function(p) { return p.role === 'Bowler'; }).slice(0, 4);
    var allrounders = sorted.filter(function(p) { return p.role === 'All-rounder'; }).slice(0, 2);
    var keepers = sorted.filter(function(p) { return p.role === 'Wicket-keeper'; }).slice(0, 1);
    xi = xi.concat(batsmen, allrounders, keepers, bowlers);
    if (xi.length < 11) {
      var used = xi.map(function(p) { return p.id; });
      var remaining = sorted.filter(function(p) { return used.indexOf(p.id) < 0; });
      xi = xi.concat(remaining.slice(0, 11 - xi.length));
    }
    return xi.slice(0, 11);
  },
  
  // --- Simulate one ball ---
  simulateBall: function(match) {
    if (match.done) return null;
    var ci = match.innings - 1;
    var striker = match.battingCard[ci][match.striker].player;
    var bowler = this.selectBowler(match);
    var outcome = this.calculateOutcome(striker, bowler, match.battingAggression, match.bowlingTactic);
    
    var result = { runs: 0, wicket: false, four: false, six: false, howOut: '', striker: striker, bowler: bowler, ballText: '', commentary: '' };
    
    var r = Math.random();
    if (r < outcome.wicketProb) {
      result.wicket = true; result.howOut = this.getDismissal(bowler); result.ballText = 'W';
      result.commentary = this.getWicketComment(striker, bowler, result.howOut);
    } else if (r < outcome.wicketProb + outcome.sixProb) {
      result.six = true; result.runs = 6; result.ballText = '6';
      result.commentary = this.getCommentary('six', striker);
    } else if (r < outcome.wicketProb + outcome.sixProb + outcome.fourProb) {
      result.four = true; result.runs = 4; result.ballText = '4';
      result.commentary = this.getCommentary('four', striker);
    } else if (r < outcome.wicketProb + outcome.sixProb + outcome.fourProb + outcome.dotProb) {
      result.runs = 0; result.ballText = '.'; result.commentary = this.getCommentary('dot', striker);
    } else {
      var runR = Math.random();
      if (runR < outcome.oneProb) { result.runs = 1; result.ballText = '1'; }
      else if (runR < outcome.oneProb + outcome.twoProb) { result.runs = 2; result.ballText = '2'; }
      else { result.runs = 3; result.ballText = '3'; }
      result.commentary = this.getCommentary('runs' + result.runs, striker);
    }
    this.applyResult(match, result, bowler);
    return result;
  },
  
  // --- Calculate outcome probabilities ---
  calculateOutcome: function(batsman, bowler, batAgg, bowlTactic) {
    var batSkill = batsman.batting * (0.7 + batsman.form / 200) * (0.8 + batsman.fitness / 300);
    var bowlSkill = bowler.bowling * (0.7 + 50 / 200) * (0.8 + bowler.fitness / 300);
    var aggMod = { defensive: 0.8, balanced: 1.0, aggressive: 1.3 };
    var tacticMod = { defensive: 0.8, balanced: 1.0, attacking: 1.2 };
    var batAdv = (batSkill / 100) * (aggMod[batAgg] || 1);
    var bowlAdv = (bowlSkill / 100) * (tacticMod[bowlTactic] || 1);
    var batEdge = batAdv - bowlAdv * 0.8;
    
    var wicketProb, sixProb, fourProb, dotProb, oneProb, twoProb;
    if (batEdge > 0.15) { wicketProb = 0.03; sixProb = 0.12; fourProb = 0.18; dotProb = 0.25; }
    else if (batEdge > -0.05) { wicketProb = 0.06; sixProb = 0.06; fourProb = 0.12; dotProb = 0.32; }
    else if (batEdge > -0.2) { wicketProb = 0.10; sixProb = 0.03; fourProb = 0.07; dotProb = 0.40; }
    else { wicketProb = 0.15; sixProb = 0.01; fourProb = 0.04; dotProb = 0.45; }
    
    if (batAgg === 'aggressive') { sixProb *= 1.6; fourProb *= 1.3; wicketProb *= 1.4; dotProb *= 0.8; }
    else if (batAgg === 'defensive') { sixProb *= 0.4; fourProb *= 0.6; wicketProb *= 0.7; dotProb *= 1.3; }
    if (bowlTactic === 'attacking') { wicketProb *= 1.3; sixProb *= 1.1; dotProb *= 0.9; }
    else if (bowlTactic === 'defensive') { wicketProb *= 0.7; sixProb *= 0.8; fourProb *= 0.85; dotProb *= 1.15; }
    
    var remaining = 1 - wicketProb - sixProb - fourProb - dotProb;
    oneProb = remaining * 0.6; twoProb = remaining * 0.3;
    return { wicketProb: wicketProb, sixProb: sixProb, fourProb: fourProb, dotProb: dotProb, oneProb: oneProb, twoProb: twoProb };
  },
  
  // --- Select bowler (one bowler per over) ---
  selectBowler: function(match) {
    var ci = match.innings - 1;
    var ballsThisInnings = match.balls[ci];
    var ballsThisOver = ballsThisInnings % 6;
    
    if (ballsThisOver === 0) {
      var bowlers = match.bowlingXI.filter(function(p) { return p.bowling > 40; });
      if (bowlers.length === 0) bowlers = match.bowlingXI;
      var maxOvers = Math.ceil((match.OVERS || MatchEngine.OVERS) / bowlers.length);
      var lastBowlerId = match._lastBowlerId;
      var available = bowlers.filter(function(b) {
        var bowled = match.bowlingCard[ci].find(function(bc) { return bc.player.id === b.id; });
        var oversBowled = bowled ? Math.ceil(bowled.balls / 6) : 0;
        return oversBowled < maxOvers && b.id !== lastBowlerId;
      });
      if (available.length === 0) available = bowlers.filter(function(b) { return b.id !== lastBowlerId; });
      if (available.length === 0) available = bowlers;
      match._currentBowler = available[Math.floor(Math.random() * available.length)];
      match._lastBowlerId = match._currentBowler.id;
    }
    var bowler = match._currentBowler;
    var existing = match.bowlingCard[ci].find(function(b) { return b.player.id === bowler.id; });
    if (!existing) match.bowlingCard[ci].push({ player: bowler, balls: 0, runs: 0, wickets: 0 });
    return bowler;
  },
  
  // --- Apply ball result to match state ---
  applyResult: function(match, result, bowler) {
    var ci = match.innings - 1;
    var batCard = match.battingCard[ci][match.striker];
    var bowlCard = match.bowlingCard[ci].find(function(b) { return b.player.id === bowler.id; });
    batCard.runs += result.runs; batCard.balls++;
    if (result.four) batCard.fours++; if (result.six) batCard.sixes++;
    if (bowlCard) { bowlCard.balls++; bowlCard.runs += result.runs; if (result.wicket) bowlCard.wickets++; }
    match.score[ci] += result.runs; match.balls[ci]++; match.currentOver.push(result.ballText);
    if (result.wicket) {
      batCard.out = true; batCard.howOut = result.howOut; match.wickets[ci]++;
      var nextBatIdx = match.battingCard[ci].length;
      if (nextBatIdx < match.battingXI.length) {
        match.battingCard[ci].push({ player: match.battingXI[nextBatIdx], runs: 0, balls: 0, fours: 0, sixes: 0, out: false, howOut: '' });
        match.striker = nextBatIdx;
      }
    } else if (result.runs % 2 === 1) {
      var temp = match.striker; match.striker = match.nonStriker; match.nonStriker = temp;
    }
    if (match.balls[ci] % 6 === 0) {
      match.overHistory[ci].push(match.currentOver); match.currentOver = [];
      var t = match.striker; match.striker = match.nonStriker; match.nonStriker = t;
    }
    this.checkEnd(match);
  },
  
  // --- Check if innings or match is over ---
  checkEnd: function(match) {
    var ci = match.innings - 1;
    var maxBalls = (match.OVERS || this.OVERS) * 6;
    var oversUp = match.balls[ci] >= maxBalls;
    var allOut = match.wickets[ci] >= 10;
    if (match.innings === 2) {
      if (match.score[1] > match.score[0]) { match.done = true; match.result = 'chased'; return; }
      if (oversUp || allOut || match.score[1] >= match.score[0]) {
        match.done = true; match.result = match.score[1] === match.score[0] ? 'tie' : 'defended'; return;
      }
    }
    if (match.innings === 1 && (oversUp || allOut)) {
      match.innings = 2; match.target = match.score[0] + 1; match.currentOver = [];
      var temp = match.battingTeam; match.battingTeam = match.bowlingTeam; match.bowlingTeam = temp;
      match.battingXI = this.getBestXI(match.battingTeam); match.bowlingXI = this.getBestXI(match.bowlingTeam);
      match.striker = 0; match.nonStriker = 1; match.bowlerIdx = 0;
      match._lastBowlerId = null; match._currentBowler = null;
      match.battingCard[1] = [
        { player: match.battingXI[0], runs: 0, balls: 0, fours: 0, sixes: 0, out: false, howOut: '' },
        { player: match.battingXI[1], runs: 0, balls: 0, fours: 0, sixes: 0, out: false, howOut: '' },
      ];
      match.bowlingCard[1] = [];
    }
  },
  
  getDismissal: function(bowler) {
    var types = ['b', 'b', 'b', 'lbw', 'c', 'c', 'c&b', 'st'];
    var t = types[Math.floor(Math.random() * types.length)];
    return t + ' ' + bowler.name.split(' ')[1];
  },
  
  getCommentary: function(type, player) {
    var lines = {
      six: ['SIX! Massive hit by ' + player.name + '!', 'Into the stands! ' + player.name + ' clears the rope!', 'Huge six! ' + player.name + ' on fire!'],
      four: ['FOUR! Beautiful shot by ' + player.name + '!', 'Cracking drive! ' + player.name + ' finds the gap!', 'Boundary! ' + player.name + ' times it perfectly!'],
      dot: ['Good length, defended by ' + player.name, 'Dot ball. Tight bowling', 'No run, solid defense by ' + player.name, 'Beaten outside off!'],
      runs1: ['Quick single by ' + player.name, 'Tucked away for one', 'Good running between wickets'],
      runs2: ['Two runs for ' + player.name, 'Placed into the gap, comes back for two', 'Good shot, two runs'],
      runs3: ['Three runs! Excellent running', 'Into the deep, three runs for ' + player.name],
    };
    var arr = lines[type] || lines.dot;
    return arr[Math.floor(Math.random() * arr.length)];
  },
  
  getWicketComment: function(batsman, bowler, howOut) {
    return 'WICKET! ' + batsman.name + ' ' + howOut + ' — bowler: ' + bowler.name;
  },
  
  getMotM: function(match) {
    var ci = match.score[0] > match.score[1] ? 0 : 1;
    var bestBat = null, bestBowl = null, bestBatScore = 0, bestBowlScore = 0;
    match.battingCard[ci].forEach(function(b) {
      var s = b.runs + b.fours * 2 + b.sixes * 4;
      if (s > bestBatScore) { bestBatScore = s; bestBat = b.player; }
    });
    match.bowlingCard[ci].forEach(function(b) {
      var s = b.wickets * 20 - b.runs + b.balls * 0.5;
      if (s > bestBowlScore) { bestBowlScore = s; bestBowl = b.player; }
    });
    return bestBatScore > bestBowlScore ? bestBat : bestBowl;
  },
  
  simulateAIMatch: function(homeTeam, awayTeam) {
    var match = this.startMatch(homeTeam, awayTeam, Math.random() > 0.5, true);
    match.battingAggression = 'balanced'; match.bowlingTactic = 'balanced';
    var safety = 0;
    while (!match.done && safety < 200) { this.simulateBall(match); safety++; }
    return { home: homeTeam, away: awayTeam, score: match.score, wickets: match.wickets, result: match.result,
      winner: match.score[0] > match.score[1] ? homeTeam : (match.score[1] > match.score[0] ? awayTeam : null) };
  },
};