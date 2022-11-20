const functions = require("firebase-functions");

// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin');
admin.initializeApp();

exports.user = require('./user');
exports.cron = require('./cron');
exports.game = require('./game');