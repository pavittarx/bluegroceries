/* <#-- Contains app specific Configurations --#> */
const bodyParser = require('body-parser');
const ejs = require('ejs');
const session = require('./session');

/* Sets a custom Delimiter for EJS Templating Engine */
ejs.delimiter = ".";

let config = (app) => {
    /* Sets the Express rendering engine to EJS */
    app.set('view engine', 'ejs');
    /* Parses URL Encoded (POST) Requests */
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    /* Parses post/put requests with JSON data. */
    app.use(bodyParser.json({
        limit: '15mb'
    }));
    /* Adds Session Middleware to the app, facilitates sessions. */
    app.use(session.config);


    /* Configures Middlewares to be used before moving onto routes. */
    require('../modules/middleware').attachto(app); 

    /* Configures different routes, for the app. */
    app.use("",require('../modules/routes'));
    app.use("", require('../modules/authorization'));
    app.use('/data', require('../modules/data'));
    app.use('/products', require('../modules/products'));
    app.use('/:username', require('../modules/customer'));
    app.use('/:username/orders', require('../modules/orders'));
    app.use('/:username', require('../modules/payments'));
}

/* Exposes the module, as a set function. */
module.exports = {
    set: config
}