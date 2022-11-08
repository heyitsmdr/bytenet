import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
//getDocs,
  query,
  collection,
//  setDoc,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA2qhifXmyniOlmj7byorgIc1Ek71JoxOI",
  authDomain: "bytenet-1ae2e.firebaseapp.com",
  projectId: "bytenet-1ae2e",
  storageBucket: "bytenet-1ae2e.appspot.com",
  messagingSenderId: "463778527382",
  appId: "1:463778527382:web:b7053120b0aab8e986aab7",
  measurementId: "G-PP831X98S2"
};

export class Firebase {
  constructor(game) {
    this.Game = game;

    // Initialize Firebase
    this.app = initializeApp(firebaseConfig);
    this.db = getFirestore(this.app);
    this.auth = getAuth(this.app);
    this.subs = { user: null, servers: null };

    onAuthStateChanged(this.auth, async user => {
      if(!user) {
        this.Game.Term.auth();
        return;
      }

      this.Game.Term.userUid = user.uid;

      this.subs['user'] = onSnapshot(doc(this.db, 'users', user.uid), doc => {
        // User account (auth) was created, but cloud function didn't complete yet to initialize the user.
        if (!doc.exists()) {
          return;
        }

        this.Game.Term.user = doc.data();
        this.Game.VMs.setNetwork(doc.data()['network']);

        if (
          this.Game.Term.state == 'TERMINAL_STATE_PREAUTH' ||
          this.Game.Term.state == 'TERMINAL_STATE_LOGIN_PASSWORD' ||
          this.Game.Term.state == 'TERMINAL_STATE_LOGIN_CREATE')
        {
          this.Game.Term.loggedIn();
        }
      });
    });

    this.subs['servers'] = onSnapshot(query(collection(this.db, 'servers')), async snapshot => {
      // First, determine if any servers were removed.
      const existingIPs = snapshot.docs.map(doc => doc.data()['ip']);
      Object.keys(this.Game.VMs.servers).forEach(async ip => {
        if (existingIPs.indexOf(ip) == -1) {
          await this.Game.VMs.handleServerData(ip, null);
        }
      });

      this.Game.VMs.servers = {};
      snapshot.forEach(async doc => {
        const data = doc.data();
        this.Game.VMs.servers[data.ip] = data;
      });

      this.Game.VMs.resync();
    });
  }

  async login(user, pass) {
    try {
      await setPersistence(this.auth, browserLocalPersistence);
      await signInWithEmailAndPassword(this.auth, user, pass);
    } catch (err) {
      switch(err.code) {
        case 'auth/user-not-found':
          this.Game.Term.promptCreateAccount();
          break;
        case 'auth/wrong-password':
          this.Game.Term.write('{red}Invalid password.{reset}');
          this.Game.Term.auth();
          break;
        case 'auth/invalid-email':
          this.Game.Term.write('{red}Email address is invalid.{reset}');
          this.Game.Term.auth();
          break;
        case 'auth/weak-password':
          this.Game.Term.write('{red}Password should be stronger.{reset}');
          this.Game.Term.auth();
          break;
        default:
          this.Game.Term.write('{red}Unknown problem. Check console.{reset}');
          this.Game.Term.auth();
          console.log(err);
          break;
      }
    }
  }

  async logout() {
    await signOut(this.auth);
    this.subs['user']();
    this.subs['servers']();
  }

  async create(email, pass) {
    try {
      await createUserWithEmailAndPassword(this.auth, email, pass);
      this.Game.Term.write('{green}User created.{reset}');
      this.Game.Term.write('{green}Initializing user..{reset}');
      await this.Game.CloudFuncs.initUserData({ nick: email.split('@')[0] });
    } catch (err) {
      console.log(err);
    }
  }

  async updateUser(data) {
    try {
      await updateDoc(doc(this.db, 'users', this.auth.currentUser.uid), data);
    } catch(err) {
      console.log(err);
    }
  }

  async getUserData(ref) {
    try {
      if (!ref.type || ref.type != 'document') {
        // If not a DocumentReference, it must be already expanded, so just return it.
        return ref;
      }
      return (await getDoc(ref)).data();
    } catch(err) {
      console.log(err);
    }
  }
}