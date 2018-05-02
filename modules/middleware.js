/* #This file contains global muddleware that 
runs at the top of every requests of a kind or other.*/

/*Provides validation utilities */
const val = require('./../app_modules/validate');
/*Provides MySql Query Utilities */
const sql = require('./../app_modules/dbQuery');

let middleware = (app) => {

    /*This middleware runs before ever route. */
    app.use((req, res, next) => {
        console.log('Middleware Caught');

        /*Checks if the session for the user exists */
        if (!req.session.id) {
            /*Provides him with guest role if not */
            req.session.role = 'guest';
        }

        /*Checks if the user is not logged in, or wants to logout */
        if (!req.session.userId || req.url === '/logout') {
            next();
        } /*If the user is logged in. */
         else {
             /*It displays the user Id */
            console.log('The given user ID  ', req.session.userId)
            /*Fetches the number of product in users cart. */
            let query = `select count(prodID) as count from cart 
            where userId=${req.session.userId};`;
            /*Checks users roles, and permissions*/
            query += `select uroles.id,uroles.role,rperms.perm 
                       from uroles,rperms where uroles.role=rperms.role
                      and uroles.id=${req.session.userId};`;

            sql.fetch(query, (data) => {
                /* The result of the SQL function is returned as 
                an array of JSON objets rather than,a single json object. */
                /*Assigns some session variables and values to them. */
                req.session.cart = data[0][0].count;
                req.session.role = data[1][0].role;
                req.session.perms = [];
                data[1].forEach((data) => {
                    /*pushes the permission to perm array. */
                    req.session.perms.push(data.perm);
                });
            });
            /*Tells the middleware to pass to the next route */
            next();
        }
    });

    /*Runs before all post requests, and after middleware above */
    app.post('*', async function (req, res, next) {
        console.log('[app:middleware] POST');

        /*Validates the input details, checks for injection attacks etc. */
        var err = await val.validate(req.body);

        /*If error exists */
        if (err.length) {
            res.send(err);
            /*Ends the response here only. */
            res.end();
        } else {
            /*If not,passes the control to next route/middleware */
            next();
        }

    });

    app.put('*', async function (req, res, next) {
        console.log('[app:middleware] POST');
        /*Validates the input details, checks for injection attacks etc. */
        var err = await val.validate(req.body);
        /*If error exists */
        if (err.length) {
            res.send(err);
            /*Ends the response here only. */
            res.end();
        } else {
             /*If not,passes the control to next route/middleware */
            next();
        }

    });

}


module.exports = {
    attachto: middleware
}