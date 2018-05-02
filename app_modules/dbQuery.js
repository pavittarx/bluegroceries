/*  #Configures Database, Creates connection to it & defines functions for the ease of makinf queries. */

/* Fetches packages & configurations to connect to the database. */
var mysql = require('mysql');
var dbConfig = require('./../config/dbConfig.json');
/* Sets the option to execute multiple statements at once. */
dbConfig['multipleStatements'] = true;

/* Creates an connection object using the provided configurations*/
var con = mysql.createConnection(dbConfig);

/* It tries to establish a connection. */
con.connect(function(err) {
    /* Checks is there was an error while trying to establish the connection. */
    if (err) {
        console.error('[app:err] Connection refused by server, Please check if the server is running');
    } /* If there is no connection. */
    if(!con.threadId){
        console.log('[app:err] Please try starting/restarting it.')
        /* Exits the NodeJs app with an error flag. */
        process.exit(1);
    }/* If the connection was successfully established*/
    else{
    console.log(`[app:db] Connection established with the Database, Connection ID ${con.threadId}.`);
    }

});

/* Fetches the data from the database */
exports.fetch = (query, callback) => {
    con.query(query, function(err, result, fields) {
        if (err) {
            console.log(err);
        }
        callback(result, fields);
    });
}

/* Same as Fetch, except used when making empty result queries, 
where it is needed to execute the query, while the result doesn't matter.*/
exports.execute = (query, callback) => {
    con.query(query, function(err, result, fields) {
        if (err) {
            console.log(err);
        }
        callback(result, fields);
    });
}

/* It executes query using custom query syntax provided with the package.*/
exports.customquery = (query, params, callback) => {
    con.query(query, params, function(err, result, fields) {
        if (err) {
            throw err;
        }
        callback(result, fields);
    });
}

/* It executes delete queries*/
exports.deletethis = (id, table) => {
    query = `delete ignore from ${table} where id=${id};`;
    con.query(query, function(err, result, fields) {
        if (err) {
            console.log('The record is currently being used.')
            console.log(err);
        } else
            console.log('Record Deleted Successfully');
    });
}


/*  For the following code snippets 
They end MySql Connection when the Express app process gets killed, restarted, aborted etc. */
process.on('exit', function() {
    con.end();
});

process.on('kill', function() {
    con.end();
})

process.on('abort', function() {
    con.end();
})

process.once('SIGUSR2', function() {
    con.end();
});