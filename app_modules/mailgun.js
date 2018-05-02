'use strict';
/*Enable the app to send recovery mails using MailGun API */
const Mailgun = require('mailgun-js');
const config = require('./../config/mailgun.json');

/* Sends the data (message) to the given email. */
exports.mail = (data, email) => {
    /* Creates an instance of MailGun Object*/
    var mailgun = new Mailgun({
        apiKey: config.key,
        domain: config.domain
    });

    /* Adds the address for 'From' field in the email. */
    data['from']=config.from;

    /* Returns a promise */
    return new Promise((resolve,reject)=>{
        mailgun.messages().send(data, function (err, body) {
            if(!err) resolve(body)
            else reject(err);
        });
    })
   
}