// =====================================================
// FIREBASE CONFIGURATION
// Pakistan Islamia Higher Secondary School
// Safety Management System
// =====================================================
//
// HOW TO SET UP FIREBASE (FREE):
// 1. Go to https://console.firebase.google.com/
// 2. Click "Add project" → Name it "islamia-hss-safety"
// 3. Disable Google Analytics (optional) → Create project
// 4. Click "Web" icon (</>) to add a web app
// 5. Register app name "safety-system" → Copy the config below
// 6. Go to Firestore Database → Create database → Start in TEST MODE
// 7. Replace the placeholder values below with your real config
//
// =====================================================
const firebaseConfig = {
  apiKey: "AIzaSyCSJ-12Tp0EIvnZnR61fM0kcx5PesTrDPo",
  authDomain: "islamia-hss-safety.firebaseapp.com",
  projectId: "islamia-hss-safety",
  storageBucket: "islamia-hss-safety.firebasestorage.app",
  messagingSenderId: "177386692237",
  appId: "1:177386692237:web:a7276e9b3bb5c7e9268cc4"
};

// =====================================================
// DEMO MODE: If no Firebase config, uses localStorage
// Replace the config above with real Firebase values
// to enable cloud sync across devices
// =====================================================

let db = null;
let usingDemo = false;

try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  
  // Test connection
  db.collection('_test').limit(1).get()
    .then(() => {
      document.getElementById('fbStatus').textContent = '● Firebase Connected';
      document.getElementById('fbStatus').className = 'firebase-status connected';
    })
    .catch(() => {
      enableDemoMode();
    });
} catch(e) {
  enableDemoMode();
}

function enableDemoMode() {
  usingDemo = true;
  document.getElementById('fbStatus').textContent = '● Demo Mode (Local)';
  document.getElementById('fbStatus').className = 'firebase-status';
  document.getElementById('fbStatus').style.color = '#f59e0b';
}

// =====================================================
// DEMO DATABASE (localStorage wrapper)
// Simulates Firestore API for local testing
// =====================================================

const demoDb = {
  data: {},

  load() {
    const saved = localStorage.getItem('islamia_hss_data');
    this.data = saved ? JSON.parse(saved) : {};
  },

  save() {
    localStorage.setItem('islamia_hss_data', JSON.stringify(this.data));
  },

  collection(name) {
    if (!this.data[name]) this.data[name] = {};
    return {
      _name: name,
      _db: this,

      add(doc) {
        const id = 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2,6);
        doc.id = id;
        doc.createdAt = new Date().toISOString();
        this._db.data[this._name][id] = doc;
        this._db.save();
        return Promise.resolve({ id });
      },

      doc(id) {
        return {
          _col: this,
          _id: id,
          get() {
            const d = this._col._db.data[this._col._name][this._id];
            return Promise.resolve({
              exists: !!d,
              id: this._id,
              data: () => d
            });
          },
          set(doc) {
            doc.id = this._id;
            this._col._db.data[this._col._name][this._id] = doc;
            this._col._db.save();
            return Promise.resolve();
          },
          update(fields) {
            const existing = this._col._db.data[this._col._name][this._id] || {};
            this._col._db.data[this._col._name][this._id] = { ...existing, ...fields };
            this._col._db.save();
            return Promise.resolve();
          },
          delete() {
            delete this._col._db.data[this._col._name][this._id];
            this._col._db.save();
            return Promise.resolve();
          }
        };
      },

      orderBy(field, dir) { return this; },
      where(field, op, val) {
        this._filters = this._filters || [];
        this._filters.push({ field, op, val });
        return this;
      },
      limit(n) { this._limit = n; return this; },

      get() {
        let docs = Object.entries(this._db.data[this._name] || {})
          .map(([id, d]) => ({ id, data: () => ({ ...d, id }) }));

        if (this._filters) {
          for (const f of this._filters) {
            docs = docs.filter(doc => {
              const v = doc.data()[f.field];
              if (f.op === '==') return v === f.val;
              if (f.op === '>=') return v >= f.val;
              if (f.op === '<=') return v <= f.val;
              return true;
            });
          }
        }

        if (this._limit) docs = docs.slice(0, this._limit);

        return Promise.resolve({ docs, empty: docs.length === 0, size: docs.length });
      }
    };
  }
};

demoDb.load();

// Unified DB access function
function getCollection(name) {
  if (usingDemo || !db) return demoDb.collection(name);
  return db.collection(name);
}
