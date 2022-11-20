exports.cleanOldMessages = functions.pubsub.schedule('every hour').onRun(async () => {
  const col = admin.firestore().collection('networks');
  const fiveMinsAgo = new Date(Date.now() - (5 * 60000));
  const networks = await col.get();
  networks.forEach(async network => {
    const messages = await col.doc(network.id).collection('messages').where('created', '<', fiveMinsAgo).get();
    messages.forEach(async msg => {
      console.log(`Deleting message ${msg.id}`);
      await col.doc(network.id).collection('messages').doc(msg.id).delete();
    });
  });

  return null;
});