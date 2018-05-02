'use strict';
const express = require('express');
const config = require('./app_modules/config');

let app = express();
/* Configures Static Files/Routes to be served alongwith Requests */
app.use('/assests', express.static('assests'));

/* Binds the express app instance to different configurations. */
config.set(app);

/* Configures the app to listen at port 9227 */
app.listen(9227); 

console.log('[app:log] The app is running on port 9227');

/* For Testing Purposes */
exports.app = app;