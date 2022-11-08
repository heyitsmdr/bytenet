const functions = require("firebase-functions");

// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin');
admin.initializeApp();

exports.initUserData = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('failed-precondition', 'You must be authenticated.');
  }

  const uid = context.auth.uid;
  // TODO: Check if user data already exists.

  await admin.firestore().collection('users').doc(uid).set({
    uid: uid,
    nick: data.nick,
    money: 100,
    network: '25.240'
  });

  return { success: true };
});

exports.buyServer = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('failed-precondition', 'You must be authenticated.');
  }

  const uid = context.auth.uid;
  const user = await admin.firestore().collection('users').doc(uid).get();

  if (data.ip.substr(0, user.data().network.length) != user.data().network) {
    throw new functions.https.HttpsError('failed-precondition', 'You can only buy VMs in your current network.');
  }

  if (user.data().money < 100) {
    throw new functions.https.HttpsError('failed-precondition', 'You do not have enough money to buy a VM.');
  }

  await admin.firestore().collection('users').doc(uid).update({
    money: (user.data().money - 100)
  });

  // TODO: Validate IP address (beyond just being in the same network)

  await admin.firestore().collection('servers').doc(data.ip).create({
    ip: data.ip,
    owner: `/users/${uid}`
  });

  return { success: true };
});