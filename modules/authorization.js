/* #This file contains routes for authorization and handling them. */
const router = require('express').Router();
const sql = require('./../app_modules/dbQuery');

/* Displays a login form */
router.get('/login', (req, res) => {
    console.log("[app] /login");
    /* Selects all the categories */
    let query=`select * from categories;`;
    sql.fetch(query, (data) => {
        res.render('login.ejs', {
            user: null,
            cat: data
        });
    });

});

/* Authorizes the login operation i.e. user */
router.post('/login', async function (req, res) {
    console.log('[app:post] /login');
    /* Fetches the user information based on the email/username provided. */
    let query = `select id,email,username,CAST(aes_decrypt(password,unhex(sha2('itsanothersecret',512))) AS CHAR(50)) as pass
                 from users
                 where email='${req.body.username}' or username='${req.body.username}';`;

    sql.fetch(query, (data) => {
        if (!data.length) {
            /* Sends an error JSON Object*/
            res.send([{
                type: 'err',
                data: 'The user does not exist',
                options: {
                    id: 'err'
                }
            }]);
        } /* If authentication is successfull*/ 
        else if (data[0].pass === req.body.password) {
            /* Sends the JSON object with redirection url as data */
            res.send([{
                type: 'url',
                data: '/'
            }]);
            /* Creates Session Variables */
            req.session.userId = data[0].id;
            req.session.username = data[0].username;
            /* Saves the session details*/
            req.session.save((err) => {})
        }/* If authentication is unsuccessfull */ 
        else if (data[0].pass != req.body.password) {
            /* An erro JSON object, with error message as data. */
            res.send([{
                type: 'err',
                data: 'The email/password you provided is incorrect.',
                options: {
                    id: 'username'
                }
            }]);
        }
    });

});

/* Displays the Signup Page */
router.get('/signup', (req, res) => {

    let query = 'select * from categories';
    sql.fetch(query, (data) => {
        /* Renders the Signup EJS page,using provided parameters */
        res.render('signup.ejs', {
            cat: data[0],
            user: null
        });
    })
});

/* Get the information required for user to successfully Sign up */
router.post('/signup', (req, res) => {
    console.log('[app:post] /signup');
    /*Stores all the submitted values */
    let value = req.body;
    let query;
    /* Only fills the query when all the details are provided. */
    if (Object.keys(req.body).length === 11) {
        /* Checks if a user with given email or username already exists. */
        query = `select * from users where email='${req.body.email}'
     or username='${req.body.username}';`;
    }

    /* Executes query only if all the details are provided. */
    if (query) sql.fetch(query, (data) => {
        /* If the user does not exits. */
        if (!data.length) {
            /* Generate values part of the query for the user data to be inserted. */
            let values = `values('${value.fName}','${value.lName}','${value.email}',
            '${value.username}','${value.phone}',`;

            values += `aes_encrypt('${value.password}',
            unhex(sha2('itsanothersecret',512))));`;

            let query = `insert into 
            users(fName,lName,email,username,phone,password)` + values;
            sql.fetch(query, (userData) => {

                /* Assign the role of Customer to the User */
                query = `insert into userrole 
                values(${userData.insertId},1);`;
                sql.execute(query, () => {});

                /* Inserts the address into the address table,
                 if the address already exists the database flags an error,
                  which is ignored. */
                query = `insert ignore into address(street,block) 
                values('${req.body.street}','${req.body.block}');`;
                
                /* Select the address with having the provided details */
                query += `select * from address 
                where street='${req.body.street}' and block='${req.body.block}';`;
                sql.fetch(query, (addressData) => {
                    /* Assigns the address to the user. */
                    query = `insert into useraddress 
                    values(${userData.insertId},${addressData[1][0].id})`;
                    sql.execute(query, () => {});
                });
            });

            /* Send a redirection message to the Login Page*/
            res.send([{
                type: 'url',
                data: '/login'
            }]);

        } else {
            /* Executes if the username or email already exists */
            let err = [];
            if (req.body.email === data[0].email) err.push({
                type: 'err',
                data: 'The email already exists',
                options: {
                    id: 'email'
                }
            });
            if (req.body.username) err.push({
                type: 'err',
                data: 'The username already exists',
                options: {
                    id: 'username'
                }
            });
            /* Sends the error to the user, 
            about the already existing value i.e, email or username. */
            res.send(err);
        }
    });

    if(!query){
        /* Sends an error message if the provided fields are empty. */
        res.send([{
            type:'err',
            data:'One or more fields are empty, Please provide all the fields.'
        }])
    }
});


/* Logs the user out of a particular session. */
router.get('/logout', (req, res) => {
    console.log('[app] /logout');
    /*Destroys the Session */
    req.session.destroy(function (err) {
        if (err) console.log('Session not Destroyed - ', err);
    });
    /* Redirects the user to the Login Page */
    res.redirect('/login');
})

/* Displays the Account Recovery Page */
router.get('/recovery', (req, res) => {
    let query = `select * from categories;`;
    sql.fetch(query, (data) => {
        /* Renders Recovery EJS file using the given parameters*/
        res.render('recovery.ejs', {
            cat: data,
            user: null,
            status: 'start',
            key: null
        })
    });
});

/* Handles the Recovery information */
router.post('/recovery', (req, res) => {
    /* Selects the users with given email or username. */
    let query = `select * from users where username = '${req.body.username}' or email='${req.body.username}';`;

    sql.fetch(query, async (data) => {
        /* If the result is empty, i.e, incorrect information */
        if (!data.length) {
            /*Sends the error object */
            res.send([{
                type: 'err',
                data: 'The user does not exist.',
                options: {
                    id: 'username'
                }
            }])
            /* Sets the response status to 404 */
            res.status(404);
        } /* If the user exists*/ 
        else {
            /* Generates a random verification Key */
            let verifkey = require('uuid/v4')();
            /* Stores the verification Key along with the user. */
            query = `update users set verifkey="${verifkey}" where id=${data[0].id};`
            /* Executes the Query */
            sql.execute(query, () => {})

            /* Creates an instance of MailGun Module */
            let mgun = require('./../app_modules/mailgun');
            /* The email data to be sent, 
            it contains url created using the verification Key */
            let maildata = {
                to: data[0].email,
                subject: 'Blue Groceries Account Recovery',
                html: `Please use this link to verify, and reset your password. <br/>
                    <a href="http://127.0.01:9227/recovery/${verifkey}"> Reset Password </a>`
            }

            try {
                /* Sends the email and awaits for the reponse. */
                let resp = await mgun.mail(maildata, data[0].email);
            } catch (error) {
                /* If an error occured while sending the email, logs it. */
                console.log('Mailing Error', error)
            }
            
            /* Informs the user that a recovery email has beens sent to his registered email.*/
            res.send([{
                type: 'message',
                data: 'A recovery email has been sent to your registered email. <br/> Please check it in order to proceed.',
                options: {
                    id: 'msgbox',
                    hide: 'form'
                }
            }]);
        }
    })

})

/* Authenticates Verification Key*/
router.get('/recovery/:vkey', (req, res) => {
    /*Select the user with the given  verification Key */
    let query = `select id from users where verifkey='${req.params.vkey}';`;
    query += `select * from categories;`;
    sql.fetch(query, (data) => {
        /*If the verification key exists and correct */
        if (data[0].length) {
            /* Renders Recovery pages displaying form to change password.*/
            res.render('recovery.ejs', {
                user: null,
                cat: data[1],
                status: 'verified',
                key: req.params.vkey
            })
        } /* If the verification key is Fake/Expired.*/ 
        else {
            /* Sets the response status to Error 404*/
            res.status(404);
            /* Displays recovery page along with the error message.*/
            res.render('recovery.ejs', {
                user: null,
                cat: data[1],
                status: 'expired',
                key: null
            })
           
        }
    })

})

/* Sets the new password, authenticating the Key*/
router.post('/recovery/:vkey', (req, res) => {
    /* Selects the user possesing the verification key*/
    let query = `select id from users where verifkey='${req.params.vkey}';`;
    query += `select * from categories;`;
    sql.fetch(query, (data) => {
        /* If user has the following verification Key*/
        if (data[0].length) {
            /* Udates the users passowrd, and destroys the key.*/
            query = `update users 
            set password=aes_encrypt('${req.body.password}',
            unhex(sha2('itsanothersecret',512))),verifkey=null
            where id=${data[0][0].id}`;
            sql.execute(query, () => {});
            /* Sends the message indicating successful recovery*/
            res.send([{
                type: 'message',
                data: '<i class="material-icons check"> </i> <br/> Your Passwords has successfully been reset.',
                options: {
                    id: 'msgbox',
                    hide: 'form'
                }
            }])
        } /* If the verfication key is incorrect, redirects the user to authentication route,
        that displays error message.*/ 
        else {
            res.send([{
                type: 'url',
                data: `/recovery/${req.body.vkey}`
            }])
        }
    })
});

/* A middleware to restrict mapping to unconfigured routes */
router.get("/:check", (req, res, next) => {
    /* checks if the parameter is username of current logged in user.*/
    if (req.session.username === req.params.check) {
        next();
    } /* If the user is not logged in */
     else if(!req.session.username){
        res.render('not-logged.ejs');
    } else{
        /* Redirects the user to error page, if not.*/
        res.redirect('/error');
    }
})


module.exports = router;