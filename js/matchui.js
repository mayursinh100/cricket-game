// ═══════════════════════════════════════════════════════════════
//  MATCH UI — 3D match visualization with tactical controls
//  Adapts the existing Three.js scene for ball-by-ball play
// ═══════════════════════════════════════════════════════════════

var MatchUI = {
  match: null,
  autoPlay: false,
  autoPlayTimer: null,
  ballAnimating: false,
  
  start: function() {
    this.match = Game.state.match;
    if (!this.match) { UI.show('hub'); return; }
    document.getElementById('gameCanvas').style.display = 'block';
    document.getElementById('appContent').style.display = 'none';
    this.showMatchHUD();
    this.updateMatchHUD();
    var self = this;
    setTimeout(function() { self.playNextBall(); }, 1500);
  },
  
  showMatchHUD: function() {
    var hud = document.getElementById('hud');
    if (!hud) { hud = document.createElement('div'); hud.id = 'hud'; document.body.appendChild(hud); }
    hud.innerHTML = '<div id="topBar"><div id="teamInfo"><div class="t-name t-bat" id="batTeam">&#127951; ' + this.match.battingTeam.name + '</div><div class="t-name t-bowl" id="bowlTeam">&#127919; ' + this.match.bowlingTeam.name + '</div></div><div id="scoreBox"><div id="mainScore">0/0</div><div id="subScore">0.0 ov &#8226; RR: 0.00</div></div><div id="statsRow"><div class="stat-box"><div class="stat-label">Innings</div><div class="stat-val" id="inningsVal">1</div></div><div class="stat-box"><div class="stat-label">Target</div><div class="stat-val" id="targetVal">-</div></div></div></div><div id="overWidget"><div id="overTitle">THIS OVER</div><div id="overBalls"></div></div><div id="eventText"></div><div id="commentary"></div><div id="matchControls"><button class="action-btn" id="btnPlayBall">Next Ball</button><button class="action-btn" id="btnAutoPlay">Auto Play</button><button class="action-btn" id="btnSkipOver">Skip Over</button></div><div id="inningsBanner"><h2 id="bannerTitle">Innings Break</h2><p id="bannerSub">Loading...</p></div>';
    var self = this;
    document.getElementById('btnPlayBall').onclick = function() { self.playNextBall(); };
    document.getElementById('btnAutoPlay').onclick = function() { self.toggleAutoPlay(); };
    document.getElementById('btnSkipOver').onclick = function() { self.skipOver(); };
  },
  
  playNextBall: function() {
    if (this.ballAnimating) return;
    if (!this.match || this.match.done) { this.onMatchEnd(); return; }
    var result = MatchEngine.simulateBall(this.match);
    if (!result) return;
    this.ballAnimating = true;
    this.animateBall(result);
    if (result.commentary) showCommentary(result.commentary);
    if (result.wicket) {
      showEvent('WICKET!', '#f87171');
      if (stumpGroupBat) stumpGroupBat.rotation.x = -0.8;
      spawnParticles(ballMesh.position.clone(), 0xff4422, 25);
    } else if (result.six) {
      showEvent('SIX!', '#facc15');
      spawnParticles(ballMesh.position.clone(), 0xffd700, 40);
    } else if (result.four) {
      showEvent('FOUR!', '#22d3ee');
      spawnParticles(ballMesh.position.clone(), 0x22d3ee, 25);
    }
    this.updateMatchHUD();
    var self = this;
    setTimeout(function() {
      self.ballAnimating = false;
      if (stumpGroupBat) stumpGroupBat.rotation.x = 0;
      ballPos.set(0, 0.1, -9.5);
      ballMesh.position.copy(ballPos);
      if (self.match.done) { self.onMatchEnd(); }
      else if (self.autoPlay) { setTimeout(function() { self.playNextBall(); }, 800); }
    }, 1500);
  },
  
  animateBall: function(result) {
    ballPhase = 'bowling'; ballMoving = true; ballBounced = false;
    var pace = 0.32 + Math.random() * 0.05;
    var swing = (Math.random() - 0.5) * 0.4;
    ballPos.set(swing * 0.2, 2.0, -9.8);
    ballVel.set(swing * 0.06, -0.09, pace);
    var kmh = Math.round(pace * 320 + 110);
    var speedInd = document.getElementById('speedIndicator');
    if (speedInd) {
      document.getElementById('speedVal').textContent = kmh;
      speedInd.style.display = 'block';
      setTimeout(function() { speedInd.style.display = 'none'; }, 2000);
    }
    bowlerRunning = true; bowlerRunT = 0;
    setTimeout(function() {
      if (result.wicket) { ballVel.set(0, -0.05, 0.15); ballPhase = 'shot'; }
      else {
        batSwingT = 0;
        var dir = (Math.random() - 0.5) * 2;
        var power = result.six ? 0.95 : result.four ? 0.7 : result.runs / 6;
        ballVel.set(dir * power * 0.38, power * 0.3 + 0.1, -(power * 0.55 + 0.12));
        ballPhase = 'shot';
      }
    }, 1000);
  },
  
  toggleAutoPlay: function() {
    this.autoPlay = !this.autoPlay;
    var btn = document.getElementById('btnAutoPlay');
    if (this.autoPlay) {
      btn.textContent = 'Stop Auto'; btn.classList.add('charging');
      if (!this.ballAnimating) this.playNextBall();
    } else { btn.textContent = 'Auto Play'; btn.classList.remove('charging'); }
  },
  
  skipOver: function() {
    if (this.ballAnimating || !this.match) return;
    var ballsLeftInOver = 6 - (this.match.balls[this.match.innings - 1] % 6);
    if (ballsLeftInOver === 0) ballsLeftInOver = 6;
    var self = this; var count = 0;
    function playNext() {
      if (count >= ballsLeftInOver || self.match.done) {
        self.updateMatchHUD();
        if (self.match.done) self.onMatchEnd();
        return;
      }
      count++; self.playNextBall();
      setTimeout(playNext, 1800);
    }
    playNext();
  },
  
  updateMatchHUD: function() {
    if (!this.match) return;
    var ci = this.match.innings - 1;
    var b = this.match.balls[ci];
    var overs = Math.floor(b / 6) + '.' + (b % 6);
    var rr = b > 0 ? ((this.match.score[ci] / b) * 6).toFixed(2) : '0.00';
    document.getElementById('mainScore').textContent = this.match.score[ci] + '/' + this.match.wickets[ci];
    document.getElementById('subScore').textContent = overs + ' ov &#8226; RR: ' + rr;
    document.getElementById('inningsVal').textContent = this.match.innings;
    document.getElementById('batTeam').innerHTML = '&#127951; ' + this.match.battingTeam.name;
    document.getElementById('bowlTeam').innerHTML = '&#127919; ' + this.match.bowlingTeam.name;
    if (this.match.innings === 2) document.getElementById('targetVal').textContent = this.match.target;
    else document.getElementById('targetVal').textContent = '-';
    var container = document.getElementById('overBalls');
    if (container) {
      container.innerHTML = '';
      this.match.currentOver.forEach(function(v) {
        var div = document.createElement('div');
        div.className = 'over-ball'; div.textContent = v;
        if (v === '.') div.classList.add('dot');
        else if (v === 'W') div.classList.add('wicket');
        else if (v === '4') div.classList.add('runs4');
        else if (v === '6') div.classList.add('runs6');
        else if (parseInt(v) > 0) div.classList.add('runs' + v);
        container.appendChild(div);
      });
    }
    if (this.match.innings === 2 && this.match.balls[0] === 0) {
      var ban = document.getElementById('inningsBanner');
      if (ban) {
        document.getElementById('bannerTitle').textContent = 'Innings Break!';
        document.getElementById('bannerSub').textContent = this.match.battingTeam.name + ' need ' + this.match.target + ' runs in ' + MatchEngine.OVERS + ' overs';
        ban.style.display = 'block';
        setTimeout(function() { ban.style.display = 'none'; }, 4000);
      }
    }
  },
  
  onMatchEnd: function() {
    this.autoPlay = false;
    var hud = document.getElementById('hud');
    if (hud) hud.innerHTML = '';
    UI.show('results');
  },
};