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

exports.updateNick = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('failed-precondition', 'You must be authenticated.');
  }

  await admin.firestore().collection('users').doc(context.auth.uid).update({
    nick: data.nick
  });

  return { success: true };
});