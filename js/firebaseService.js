// Firebase Service for VOX MVP
// Supports Firebase v10 Auth and Firestore with offline-resilient local fallback
import { firebaseConfig } from './firebaseConfig.js';
import { getDemoData } from './demoData.js';

let app = null;
let auth = null;
let db = null;
let firebaseAvailable = false;

// Dynamic imports or CDN fallback
let fbApp = null;
let fbAuth = null;
let fbFirestore = null;

export async function initFirebase() {
  if (firebaseAvailable && app) return { app, auth, db, available: true };

  try {
    // Attempt standard modular CDN import
    const [appModule, authModule, firestoreModule] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js")
    ]);

    fbApp = appModule;
    fbAuth = authModule;
    fbFirestore = firestoreModule;

    app = fbApp.initializeApp(firebaseConfig);
    auth = fbAuth.getAuth(app);
    db = fbFirestore.getFirestore(app);
    firebaseAvailable = true;
    console.log("🔥 Firebase initialized successfully for VOX");
    return { app, auth, db, available: true };
  } catch (err) {
    console.warn("⚠️ Firebase CDN load note (operating with offline/demo resilient layer):", err);
    firebaseAvailable = false;
    return { app: null, auth: null, db: null, available: false };
  }
}

// Current local session state
const LOCAL_STORAGE_KEY = 'vox_user_session';
const LOCAL_DATA_PREFIX = 'vox_data_';

let currentUser = null;
let authListeners = [];

export const authService = {
  async init() {
    await initFirebase();
    // Check local storage for persistent demo/cached session
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        currentUser = JSON.parse(saved);
      } catch (e) {
        currentUser = null;
      }
    }

    if (firebaseAvailable && auth) {
      fbAuth.onAuthStateChanged(auth, (user) => {
        if (user) {
          currentUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            isAnonymous: user.isAnonymous,
            isDemo: false
          };
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentUser));
        } else if (!currentUser || !currentUser.isDemo) {
          currentUser = null;
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
        authListeners.forEach(cb => cb(currentUser));
      });
    } else {
      authListeners.forEach(cb => cb(currentUser));
    }

    return currentUser;
  },

  onAuthStateChanged(callback) {
    authListeners.push(callback);
    callback(currentUser);
    return () => {
      authListeners = authListeners.filter(cb => cb !== callback);
    };
  },

  getCurrentUser() {
    return currentUser;
  },

  async registerWithEmail(email, password, displayName = '') {
    if (firebaseAvailable && auth) {
      const userCredential = await fbAuth.createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await fbAuth.updateProfile(userCredential.user, { displayName });
      }
      currentUser = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: displayName || email.split('@')[0],
        isDemo: false
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentUser));
      return currentUser;
    } else {
      // Local fallback account creation
      const fakeUid = 'usr_' + Date.now();
      currentUser = {
        uid: fakeUid,
        email,
        displayName: displayName || email.split('@')[0],
        isDemo: false
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentUser));
      authListeners.forEach(cb => cb(currentUser));
      return currentUser;
    }
  },

  async loginWithEmail(email, password) {
    if (firebaseAvailable && auth) {
      const userCredential = await fbAuth.signInWithEmailAndPassword(auth, email, password);
      currentUser = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName || email.split('@')[0],
        isDemo: false
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentUser));
      return currentUser;
    } else {
      const fakeUid = 'usr_' + btoa(email).substring(0, 10);
      currentUser = {
        uid: fakeUid,
        email,
        displayName: email.split('@')[0],
        isDemo: false
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentUser));
      authListeners.forEach(cb => cb(currentUser));
      return currentUser;
    }
  },

  async loginWithGoogle() {
    if (firebaseAvailable && auth) {
      const provider = new fbAuth.GoogleAuthProvider();
      const result = await fbAuth.signInWithPopup(auth, provider);
      currentUser = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        isDemo: false
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentUser));
      return currentUser;
    } else {
      throw new Error("Google Sign-In requires active Firebase network connectivity. Use Quick Demo or Email login.");
    }
  },

  async loginDemoUser() {
    const demoUid = 'demo_user_vox';
    currentUser = {
      uid: demoUid,
      email: "demo@vox.ai",
      displayName: "Saurabh (Demo)",
      isDemo: true
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentUser));

    // Seed demo data if not already existing
    const existing = dbService.getLocalData(demoUid);
    if (!existing || !existing.transactions || existing.transactions.length === 0) {
      const demoDataset = getDemoData(demoUid);
      dbService.saveLocalData(demoUid, demoDataset);
    }

    authListeners.forEach(cb => cb(currentUser));
    return currentUser;
  },

  async logout() {
    if (firebaseAvailable && auth && auth.currentUser) {
      try {
        await fbAuth.signOut(auth);
      } catch (e) {
        console.warn('Firebase signout warning', e);
      }
    }
    currentUser = null;
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    authListeners.forEach(cb => cb(null));
  }
};

// Firestore / Local Data Layer
export const dbService = {
  getLocalData(uid) {
    const raw = localStorage.getItem(LOCAL_DATA_PREFIX + uid);
    return raw ? JSON.parse(raw) : null;
  },

  saveLocalData(uid, data) {
    localStorage.setItem(LOCAL_DATA_PREFIX + uid, JSON.stringify(data));
  },

  async getUserData(uid) {
    if (!uid) return null;

    // Check Firebase Firestore first if connected and not demo mode
    if (firebaseAvailable && db && !currentUser?.isDemo) {
      try {
        const userDocRef = fbFirestore.doc(db, "users", uid);
        const userSnap = await fbFirestore.getDoc(userDocRef);
        
        if (userSnap.exists()) {
          const profile = userSnap.data();

          // Fetch subcollections in parallel
          const [accountsSnap, txSnap, billsSnap, subsSnap, budgetsSnap, goalsSnap, worthItSnap] = await Promise.all([
            fbFirestore.getDocs(fbFirestore.collection(db, `users/${uid}/accounts`)),
            fbFirestore.getDocs(fbFirestore.query(fbFirestore.collection(db, `users/${uid}/transactions`), fbFirestore.orderBy('timestamp', 'desc'), fbFirestore.limit(50))),
            fbFirestore.getDocs(fbFirestore.collection(db, `users/${uid}/bills`)),
            fbFirestore.getDocs(fbFirestore.collection(db, `users/${uid}/subscriptions`)),
            fbFirestore.getDocs(fbFirestore.collection(db, `users/${uid}/budgets`)),
            fbFirestore.getDocs(fbFirestore.collection(db, `users/${uid}/goals`)),
            fbFirestore.getDocs(fbFirestore.collection(db, `users/${uid}/worthItItems`))
          ]);

          const data = {
            profile,
            accounts: accountsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            transactions: txSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            bills: billsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            subscriptions: subsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            budgets: budgetsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            goals: goalsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            worthItItems: worthItSnap.docs.map(d => ({ id: d.id, ...d.data() }))
          };

          // Cache locally
          this.saveLocalData(uid, data);
          return data;
        }
      } catch (err) {
        console.warn("Firestore fetch error, falling back to local store:", err);
      }
    }

    // Local fallback
    let local = this.getLocalData(uid);
    if (!local) {
      // If newly registered, create clean user structure
      local = {
        profile: {
          userId: uid,
          name: currentUser?.displayName || 'User',
          email: currentUser?.email || '',
          monthlyIncome: 0,
          openingCash: 0,
          bankBalance: 0,
          savings: 0,
          rent: 0,
          monthlyBudget: 0,
          onboardingCompleted: false
        },
        accounts: [
          { id: "acc_cash", name: "Cash", type: "cash", balance: 0 },
          { id: "acc_bank", name: "Bank Account", type: "bank", balance: 0 },
          { id: "acc_upi", name: "UPI / PhonePe", type: "upi", balance: 0 }
        ],
        transactions: [],
        bills: [],
        subscriptions: [],
        budgets: [
          { id: "bgt_food", category: "Food", limit: 5000, spent: 0, icon: "🍔" },
          { id: "bgt_groceries", category: "Groceries", limit: 4000, spent: 0, icon: "🛒" },
          { id: "bgt_transport", category: "Transport", limit: 3000, spent: 0, icon: "🚇" },
          { id: "bgt_entertainment", category: "Entertainment", limit: 2000, spent: 0, icon: "🎬" }
        ],
        goals: [
          { id: "goal_emergency", name: "Emergency Fund", targetAmount: 50000, currentAmount: 0, targetDate: "2026-12-31", icon: "🛡️" }
        ],
        worthItItems: []
      };
      this.saveLocalData(uid, local);
    }
    return local;
  },

  async saveProfile(uid, profileData) {
    const fullData = await this.getUserData(uid);
    fullData.profile = { ...fullData.profile, ...profileData, updatedAt: new Date().toISOString() };
    this.saveLocalData(uid, fullData);

    if (firebaseAvailable && db && !currentUser?.isDemo) {
      try {
        await fbFirestore.setDoc(fbFirestore.doc(db, "users", uid), fullData.profile, { merge: true });
      } catch (e) {
        console.warn('Firestore profile write error:', e);
      }
    }
    return fullData.profile;
  },

  async addTransaction(uid, txData) {
    const fullData = await this.getUserData(uid);
    const newTx = {
      id: txData.id || 'tx_' + Date.now(),
      userId: uid,
      currency: "INR",
      source: txData.source || "voice",
      confidence: txData.confidence || 0.95,
      confirmed: true,
      timestamp: txData.timestamp || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      ...txData
    };

    // Update balances
    const amt = Number(newTx.amount);
    if (newTx.type === 'expense') {
      if (newTx.paymentMethod?.toLowerCase().includes('cash')) {
        const cashAcc = fullData.accounts.find(a => a.type === 'cash');
        if (cashAcc) cashAcc.balance = Math.max(0, cashAcc.balance - amt);
      } else {
        const digitalAcc = fullData.accounts.find(a => a.type === 'upi' || a.type === 'bank');
        if (digitalAcc) digitalAcc.balance = Math.max(0, digitalAcc.balance - amt);
      }
      // Update matching budget
      const bgt = fullData.budgets.find(b => b.category.toLowerCase() === (newTx.category || '').toLowerCase());
      if (bgt) bgt.spent = (bgt.spent || 0) + amt;
    } else if (newTx.type === 'income') {
      const digitalAcc = fullData.accounts.find(a => a.type === 'bank' || a.type === 'upi');
      if (digitalAcc) digitalAcc.balance = (digitalAcc.balance || 0) + amt;
    }

    fullData.transactions.unshift(newTx);
    this.saveLocalData(uid, fullData);

    if (firebaseAvailable && db && !currentUser?.isDemo) {
      try {
        await fbFirestore.setDoc(fbFirestore.doc(db, `users/${uid}/transactions`, newTx.id), newTx);
        // Sync accounts back
        for (const acc of fullData.accounts) {
          await fbFirestore.setDoc(fbFirestore.doc(db, `users/${uid}/accounts`, acc.id), acc, { merge: true });
        }
      } catch (e) {
        console.warn('Firestore tx write error:', e);
      }
    }

    return { transaction: newTx, updatedData: fullData };
  },

  async addBill(uid, bill) {
    const fullData = await this.getUserData(uid);
    const newBill = {
      id: bill.id || 'bill_' + Date.now(),
      status: 'upcoming',
      essential: true,
      ...bill
    };
    fullData.bills.push(newBill);
    this.saveLocalData(uid, fullData);

    if (firebaseAvailable && db && !currentUser?.isDemo) {
      try {
        await fbFirestore.setDoc(fbFirestore.doc(db, `users/${uid}/bills`, newBill.id), newBill);
      } catch (e) {
        console.warn('Firestore bill write error:', e);
      }
    }
    return newBill;
  },

  async updateBillStatus(uid, billId, status) {
    const fullData = await this.getUserData(uid);
    const target = fullData.bills.find(b => b.id === billId);
    if (target) {
      target.status = status;
      this.saveLocalData(uid, fullData);
      if (firebaseAvailable && db && !currentUser?.isDemo) {
        try {
          await fbFirestore.updateDoc(fbFirestore.doc(db, `users/${uid}/bills`, billId), { status });
        } catch (e) {
          console.warn('Firestore bill update error:', e);
        }
      }
    }
    return target;
  },

  async addSubscription(uid, sub) {
    const fullData = await this.getUserData(uid);
    const newSub = {
      id: sub.id || 'sub_' + Date.now(),
      billingCycle: 'monthly',
      ...sub
    };
    fullData.subscriptions.push(newSub);
    this.saveLocalData(uid, fullData);

    if (firebaseAvailable && db && !currentUser?.isDemo) {
      try {
        await fbFirestore.setDoc(fbFirestore.doc(db, `users/${uid}/subscriptions`, newSub.id), newSub);
      } catch (e) {
        console.warn('Firestore subscription write error:', e);
      }
    }
    return newSub;
  },

  async addGoal(uid, goal) {
    const fullData = await this.getUserData(uid);
    const newGoal = {
      id: goal.id || 'goal_' + Date.now(),
      currentAmount: 0,
      icon: '🎯',
      ...goal
    };
    fullData.goals.push(newGoal);
    this.saveLocalData(uid, fullData);

    if (firebaseAvailable && db && !currentUser?.isDemo) {
      try {
        await fbFirestore.setDoc(fbFirestore.doc(db, `users/${uid}/goals`, newGoal.id), newGoal);
      } catch (e) {
        console.warn('Firestore goal write error:', e);
      }
    }
    return newGoal;
  },

  async addWorthItItem(uid, item) {
    const fullData = await this.getUserData(uid);
    const newItem = {
      id: item.id || 'wi_' + Date.now(),
      purchaseDate: new Date().toISOString().split('T')[0],
      reviewDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      status: 'pending',
      rating: null,
      ...item
    };
    fullData.worthItItems.unshift(newItem);
    this.saveLocalData(uid, fullData);

    if (firebaseAvailable && db && !currentUser?.isDemo) {
      try {
        await fbFirestore.setDoc(fbFirestore.doc(db, `users/${uid}/worthItItems`, newItem.id), newItem);
      } catch (e) {
        console.warn('Firestore worth-it write error:', e);
      }
    }
    return newItem;
  },

  async reviewWorthItItem(uid, itemId, rating, notes = '') {
    const fullData = await this.getUserData(uid);
    const target = fullData.worthItItems.find(w => w.id === itemId);
    if (target) {
      target.status = 'reviewed';
      target.rating = rating;
      if (notes) target.notes = notes;
      this.saveLocalData(uid, fullData);

      if (firebaseAvailable && db && !currentUser?.isDemo) {
        try {
          await fbFirestore.updateDoc(fbFirestore.doc(db, `users/${uid}/worthItItems`, itemId), {
            status: 'reviewed',
            rating,
            notes
          });
        } catch (e) {
          console.warn('Firestore worth-it review error:', e);
        }
      }
    }
    return target;
  },

  async saveCashReconciliation(uid, reconData) {
    const fullData = await this.getUserData(uid);
    fullData.cashReconciliation = { ...fullData.cashReconciliation, ...reconData, updatedAt: new Date().toISOString() };
    
    // Update cash account balance to the reconciled counted amount
    if (reconData.countedCash !== undefined) {
      const cashAcc = fullData.accounts.find(a => a.type === 'cash');
      if (cashAcc) cashAcc.balance = Number(reconData.countedCash);
    }

    this.saveLocalData(uid, fullData);

    if (firebaseAvailable && db && !currentUser?.isDemo) {
      try {
        const reconId = 'recon_' + Date.now();
        await fbFirestore.setDoc(fbFirestore.doc(db, `users/${uid}/cashReconciliations`, reconId), {
          ...reconData,
          timestamp: fbFirestore.serverTimestamp()
        });
      } catch (e) {
        console.warn('Firestore cash reconciliation write error:', e);
      }
    }
    return fullData;
  },

  async saveDailyLog(uid, logData) {
    const fullData = await this.getUserData(uid);
    if (!fullData.dailyLogs) fullData.dailyLogs = [];
    const log = {
      id: 'log_' + (logData.date || new Date().toISOString().split('T')[0]),
      timestamp: new Date().toISOString(),
      ...logData
    };
    fullData.dailyLogs.unshift(log);
    this.saveLocalData(uid, fullData);

    if (firebaseAvailable && db && !currentUser?.isDemo) {
      try {
        await fbFirestore.setDoc(fbFirestore.doc(db, `users/${uid}/dailyLogs`, log.id), log);
      } catch (e) {
        console.warn('Firestore daily log write error:', e);
      }
    }
    return log;
  },

  async loadDemoData(uid) {
    const demo = getDemoData(uid);
    this.saveLocalData(uid, demo);

    if (firebaseAvailable && db && !currentUser?.isDemo) {
      try {
        // Upload demo collections to user's real Firestore profile
        await fbFirestore.setDoc(fbFirestore.doc(db, "users", uid), demo.profile);
        for (const acc of demo.accounts) {
          await fbFirestore.setDoc(fbFirestore.doc(db, `users/${uid}/accounts`, acc.id), acc);
        }
        for (const tx of demo.transactions) {
          await fbFirestore.setDoc(fbFirestore.doc(db, `users/${uid}/transactions`, tx.id), tx);
        }
        for (const b of demo.bills) {
          await fbFirestore.setDoc(fbFirestore.doc(db, `users/${uid}/bills`, b.id), b);
        }
        for (const s of demo.subscriptions) {
          await fbFirestore.setDoc(fbFirestore.doc(db, `users/${uid}/subscriptions`, s.id), s);
        }
        for (const bg of demo.budgets) {
          await fbFirestore.setDoc(fbFirestore.doc(db, `users/${uid}/budgets`, bg.id), bg);
        }
        for (const g of demo.goals) {
          await fbFirestore.setDoc(fbFirestore.doc(db, `users/${uid}/goals`, g.id), g);
        }
        for (const w of demo.worthItItems) {
          await fbFirestore.setDoc(fbFirestore.doc(db, `users/${uid}/worthItItems`, w.id), w);
        }
        console.log("✅ Demo data synced to Cloud Firestore under uid:", uid);
      } catch (e) {
        console.warn("Could not sync demo data to Firestore directly (local state used):", e);
      }
    }
    return demo;
  }
};
