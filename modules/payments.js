const router = require('express').Router();
const bti = require('./../app_modules/blobToImage');
const sql = require('./../app_modules/dbQuery');

/* Displays Checkout Information */
router.get('/checkout', (req, res) => {
    let query = `select * from categories;`;
    query += `select id,username,fName,lName 
    from users where id=${req.session.userId};`;

    /* Selects all the orders and their required details to be displayed. */
    query += `select orders.id as id,prodId,name, quantity,charge,addressId,
    orders.price as oPrice, products.price as pPrice, discount
    from orders,products 
    where userId=${req.session.userId} and orders.prodId=products.id 
    and orders.payStatus='pending' and orders.status='active';`;

    sql.fetch(query, async (data) => {

        let payments = require('../app_modules/payments');
        /* Creates delivery charge for the orders. */
        if(data[2].length) payments.createCharge(data[2], req.session.userId);

        res.render('checkout.ejs', {
            cat: data[0],
            user: data[1],
            order: data[2],
            cart: req.session.cart,
            amount: await payments.calcCharge(req.session.userId),
            formAction:'/'+req.session.username+'/charge'
        });

    })

});

/* If user hits refresh while charging them, 
redirects them to checkout pages, instead of throwing error */
router.get('/charge', (req, res) => {
    res.redirect('checkout');
})


/* Charges the customer, using the token provided in the request.*/
router.post('/charge', async (req, res) => {
    
    /* Initializes an instance of Stripe, 
    used to charge the customer, with a specific amount. */
    const stripe = require("stripe")
        (require('../config/stripe_secretkey.json').secretkey);
    /* Token used to identify the payment information at Stripe*/
    var token = req.body.stripeToken;
    let payments = require('../app_modules/payments');
    /* Calculates the net charge.*/
    let net =(await payments.calcCharge(req.session.userId)).net;
    net=(net*100).toFixed(0);

    stripe.charges.create({
        /* Stripe accepts INR payments in Paisas,
         so the amount needs to be converted. */
        amount: net,
        currency: "inr",
        description:`The user ${req.session.username} has been charged`,
        source: token,
    }, function (err, charge) {
        /* If the charge doesn't succeeds. */
        if (err){
            console.log(err.message);
            res.render('pay-status.ejs', {msg:err.message, err:true});
        } /* If the charge succeeds. */
        else{
            console.log('This is the Charge',charge);
            let amount=charge.amount/100;
            let msg=`You payment for amount ${amount}
            has successfully been processed.`;
            /* The view to be rendered with the message and error set to null. */
            res.render('pay-status.ejs', {msg:msg, err:null});
            
            /* Sets that the current product has been paid for*/
            query=`update orders set payStatus='paid' 
            where userID=${req.session.userId} 
            and payStatus='pending' and status='active';`;
            sql.execute(query,()=>{})
        } 
    }); 

});

/* Creates an order for a single product.*/
router.get('/buy/:prodId',(req,res)=>{
    /* Selects the product and user's address.*/
    let query=`select * from products where id=${req.params.prodId};`;
    query+=`select * from useraddress where userId=${req.session.userId};`;

    sql.fetch(query,(data)=>{
        /* Redirects user to the error page, if the product doesn't exist,
        avoids tinkering of URLs.*/
        if(!data.length){ res.redirect('/error')}
        else{
            let net=data[0][0].price-(data[0][0].price*(data[0][0].discount/100));
            /* Creates a new order */
            query=`insert into 
            orders(quantity,date,charge,price,prodId,userId,addressId)
            values 
            (1,now(),50,${net},${data[0][0].id},
            ${data[1][0].userId},${data[1][0].addressId});`;
            sql.fetch(query,(data)=>{
                console.log(data);
                res.redirect('/'+req.session.username+'/pay/'+data.insertId);
            });
            
        }
    });
});

/* Displays the checkout information for single product/order. */
router.get('/pay/:orderId',(req,res)=>{
    query=`select * from categories;`;
    query+=`select * from users where id=${req.session.userId};`;
    query+=`select * from orders where id=${req.params.orderId}
    and payStatus='pending';`;
    /* Selects the order and all its required details. */
    query+=`select o.id as id,prodId,name, quantity,charge,addressId,
    o.price as oPrice, p.price as pPrice, discount
    from orders o,products p
    where o.userId=${req.session.userId} and o.id=${req.params.orderId} 
    and o.prodId=p.id and o.payStatus='pending' 
    and o.status='active'`;
    sql.fetch(query,(data)=>{
        if(data[3].length){
            /*Calculates the amount details */
        amount={
            total: data[3][0].pPrice,
            discount:data[3][0].pPrice*(data[3][0].discount/100),
            charge:50,
        }
        amount['net']=amount.total-amount.discount+50;
        /* Converts the values to fixed notation, for handling numerical errors. */
        amount.discount=(amount.discount).toFixed(2);
        amount.net=(amount.net).toFixed(2);
        res.render('checkout.ejs', {
            cat:data[0],
            user:data[1],
            order:data[3],
            cart:req.session.cart,
            amount:amount,
            formAction:'/'+req.session.username+'/charge/'+req.params.orderId
        });
    }else{
        /* A dummy amount object*/
        amount={
            total:0,
            discount:0,
            charge:0,
            net:0
        }
        /* Renders a message since all the orders are null.*/
        res.render('checkout.ejs', {
            cat:data[0],
            user:data[1],
            order:data[3],
            cart:req.session.cart,
            amount:amount,
            formAction:'/'+req.session.username+'/charge/'+req.params.orderId
        });
    } 
    })
    
})

/* Redirects user to the pay page, if he reloads the page while being charged. */
router.get('/charge/:orderId',(req,res)=>{
    res.redirect('/'+req.session.username+'/pay/'+req.params.orderId);
})

/* Charges the user for his current order. */
router.post('/charge/:orderId',(req,res)=>{
    /* Initializes an instance of Stripe, 
    used to charge the customer, with a specific amount. */
    const stripe = require("stripe")
        (require('../config/stripe_secretkey.json').secretkey);
    
    var token = req.body.stripeToken;

    let query=`select price,charge from orders where id=${req.params.orderId};`;
    sql.fetch(query,(data)=>{
        stripe.charges.create({
            /* Stripe accepts INR payments in Paisas,
             so the amount needs to be converted. */
            amount: ((data[0].price+data[0].charge) * 100).toFixed(0),
            currency: "inr",
            description:`The user ${req.session.username} has been charged 
            for order ${data[0].id}`,
            source: token,
        }, function (err, charge) {
            /*If error occurs  */
            if (err){
                console.log(err.message);
                res.render('pay-status.ejs', {msg:err.message, err:true});
            }
            else{
                console.log('This is the Charge',charge);
                let amount=charge.amount/100;
                let msg=`You payment for amount ${amount}
                has successfully been processed.`;
    
                res.render('pay-status.ejs', {msg:msg, err:null});
                /* Updates that the current order has been paid for */
                query=`update orders set payStatus='paid' 
                where id=${req.params.orderId} 
                and payStatus='pending' and status='active';`;
                sql.execute(query,()=>{})
            } 
        }); 

    })
    
})

/* Redirects all the other unconfigured URL's to the error page. */
router.get('*', (req, res) => {
    console.log("Dead end MiddleWare");
    res.redirect('/error');
})

module.exports = router;