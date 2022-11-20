global.functions = require("firebase-functions");

// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin');
admin.initializeApp();
global.admin = admin;

exports.user = require('./user');
exports.cron = require('./cron');
exports.game = require('./game');