/* Grabs the Session Module to be used, for implementing Sessions */
const session = require('express-session');
/* Grabs the Module that will help in storage, of Sessions to Mysql Database */
const mysqlStore = require('express-mysql-session')(session);
/* Grabs the Configuration options for the Session */
var sessionConfig = require('./../config/session.json');
/* Grabs the COnfiguration options for the Session Store */
var storeOptions = require("./../config/dbConfig.json");

/* Adds Store information to be used as Session storage, into Session options. */
sessionConfig['store'] = new mysqlStore(storeOptions);

/* Contains Configurations for Session Cookies & their Storage */
exports.config = (session(sessionConfig));