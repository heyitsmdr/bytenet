const functions = require("firebase-functions");

// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin');
admin.initializeApp();

exports.initUserData = functions.https.onCall(async (data, context) => {
  const uid = context.auth.uid;

  if (!context.auth) {
    throw new functions.https.HttpsError('failed-precondition', 'You must be authenticated.');
  }

  // TODO: Check if user data already exists.

  await admin.firestore().collection('users').doc(uid).set({
    uid: uid,
    nick: data.nick,
    money: 100,
  });

  return { success: true };
});