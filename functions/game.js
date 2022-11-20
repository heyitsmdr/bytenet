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
  // TODO: See if the IP is already owned.

  await admin.firestore().collection('networks').doc(user.data().network).collection('servers').doc(data.ip).create({
    ip: data.ip,
    owner: admin.firestore().collection('users').doc(uid)
  });

  return { success: true };
});

exports.broadcastMessage = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('failed-precondition', 'You must be authenticated.');
  }

  const uid = context.auth.uid;
  const user = await admin.firestore().collection('users').doc(uid).get();

  // TODO: Validate message
  
  await admin.firestore().collection('networks').doc(user.data().network).collection('messages').add({
    nick: user.data().nick,
    message: data.message,
    created: new Date()
  });

  return { success: true };
});