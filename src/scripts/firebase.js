import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
//getDocs,
  query,
  collection,
  setDoc,
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

    onAuthStateChanged(this.auth, async user => {
      if(!user) {
        this.Game.Term.auth();
        return;
      }

      this.Game.Term.userUid = user.uid;

      onSnapshot(doc(this.db, 'users', user.uid), doc => {
        // User account (auth) was created, but cloud function didn't complete yet to initialize the user.
        if (!doc.exists()) {
          return;
        }

        this.Game.Term.user = doc.data();
        if (
          this.Game.Term.state == 'TERMINAL_STATE_PREAUTH' ||
          this.Game.Term.state == 'TERMINAL_STATE_LOGIN_PASSWORD' ||
          this.Game.Term.state == 'TERMINAL_STATE_LOGIN_CREATE')
        {
          this.Game.Term.loggedIn();
        }
      });

      onSnapshot(query(collection(this.db, 'servers')), async snapshot => {
        this.Game.VMs.servers = {};

        snapshot.forEach(async doc => {
          const data = doc.data();
          await this.Game.VMs.handleServerData(data);
        });
      });
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
  }

  async create(email, pass) {
    try {
      await createUserWithEmailAndPassword(this.auth, email, pass);
      this.Game.Term.write('{green}User created.{reset}');
      this.Game.Term.write('{green}Initializing user..{reset}');
      await this.Game.Funcs.initUserData({ nick: email.split('@')[0] });
    } catch (err) {
      console.log(err);
    }
  }

  async updateUser(userData) {
    try {
      await updateDoc(doc(this.db, 'users', this.auth.currentUser.uid), userData);
    } catch(err) {
      console.log(err);
    }
  }

  async getServerData(ip) {
    try {
      const ref = doc(this.db, 'servers', ip);
      const obj = await getDoc(ref);
  
      if (!obj.exists()) {
        return null;
      }

      const data = obj.data();
      data.owner = (await getDoc(data.owner)).data();

      return obj.data();
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async getUserData(user) {
    try {
      return (await getDoc(user)).data();
    } catch(err) {
      console.log(err);
    }
  }
  
  async initializeServer(ip) {
    try {
      const vm = {
        ip: ip,
        owner: doc(this.db, 'users/' + this.auth.currentUser.uid),
      };

      await setDoc(doc(this.db, 'servers', ip), vm);
      return this.getServerData(ip);
    } catch (err) {
      console.log(err);
      return null;
    }
  }
}