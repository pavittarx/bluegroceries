const router = require('express').Router();

/* Redirects an empty /data request to error page. */
router.get("",(req,res)=>{
    res.redirect('/error');
})

/*Sends the stripe public key */
router.get('/stripe-public-key',(req,res)=>{
    
    res.sendFile(require('path').join(__dirname,"../config/stripe_publickey.json"));

})

module.exports=router;