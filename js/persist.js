// ═══════════════════════════════════════════════════════════════
//  PERSISTENCE LAYER — Save/Load to localStorage
// ═══════════════════════════════════════════════════════════════

var SAVE_KEY = 'cricket_championship_save';

var Save = {
  save: function() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(Game.state));
      return true;
    } catch(e) {
      console.error('Save failed:', e);
      return false;
    }
  },
  
  load: function() {
    try {
      var data = localStorage.getItem(SAVE_KEY);
      if (data) {
        Game.state = JSON.parse(data);
        return true;
      }
    } catch(e) {
      console.error('Load failed:', e);
    }
    return false;
  },
  
  exists: function() {
    try {
      return localStorage.getItem(SAVE_KEY) !== null;
    } catch(e) {
      return false;
    }
  },
  
  delete: function() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch(e) {
      console.error('Delete failed:', e);
    }
  },
};
