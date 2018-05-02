const router = require('express').Router();
const bti = require('./../app_modules/blobToImage');
const sql = require('./../app_modules/dbQuery');


router.get('/',(req,res)=>{
    /* Redirects the user to /usrname/orders/active route */
    res.redirect('/'+req.session.username+'/orders/active');
})

/* Displays the orders that are pending. */
router.get('/pending', (req, res) => {
    /* Displays the prnding orders to the user &  lets them edit/cancel them.*/
    query = `select * from orders 
        where userId=${req.session.userId} 
        and payStatus='pending' and status='active'
        order by date desc;`;
    /* Fetches product details of the orders that are pending */
    query += `select * from products p,orders o 
        where o.userId=${req.session.userId} 
        and o.payStatus='pending' and status='active' 
        and o.prodId=p.id
        order by o.date desc;`;
    /*Fetches the address details of the orders */
    query += `select * from address a,orders o 
        where o.userId=${req.session.userId} and 
        o.payStatus='pending' and o.addressId=a.id
        order by o.date desc;`;

    query += `select * from users where id=${req.session.userId};`;
    query += `select * from categories;`;

    sql.fetch(query, (data) => {
        /*Convert binary image data to base64 encoded Data URI */
        data[1].forEach((imagedata) => {
            imagedata.image = bti.convert(imagedata.image);
        })

        /*Renders the pending order details */
        res.render('orders-pending.ejs', {
            order: data[0],
            prod: data[1],
            address: data[2],
            user: data[3],
            cat: data[4],
            cart: req.session.cart,
            username: req.session.username
        });
    });
});

/*Edits the pending order details */
router.put('/pending', (req, res) => {
    let reqData = req.body;
    let err = '';
    /*Checks if empty values are being sent. */
    for (let key in reqData) {
        if (!reqData[key]) err += `The field ${key} cannot be empty. \n`;
    }
    /*Sneds error message if there is any. */
    if (err.length) res.send([{
        type: 'err',
        data: err
    }]);

    /* Fetches the order details */
    let query = `select * from orders where id=${reqData.orderId}`;
    sql.fetch(query, (updateData) => {
        /*There is data that needs to be updated. */
        if (updateData.length) {
            /*If quatity needs to be updated.*/
            if (reqData.quantity && updateData[0].quantity != reqData.quantity) {
                /*Updates the orders quantity */
                query = `update orders 
                set quantity=${reqData.quantity} 
                where id=${updateData[0].id};`;

                /*Checks the stock value*/
                let quantity = updateData[0].quantity - reqData.quantity;
                /*Updates the product stock */
                query += `update products set stock =(stock+${quantity})
                where id=${updateData[0].prodId};`;

                sql.execute(query, (data) => {});

            }

            /*If address is needed to be updated */
            if (reqData.street && reqData.block) {
                /*Adds if the given data does not already exists */
                query = `insert ignore into address(street,block)
                 values('${reqData.street}','${reqData.block}');`;
                 /*Selects the new address from the table */
                query += `select * from address 
                 where street='${reqData.street}' and block='${reqData.block}'`;
                sql.fetch(query, (data) => {
                    /*Updates the orders address */
                    query = `update orders set addressId=${data[1][0].id} 
                    where id=${updateData[0].id};`;
                    sql.execute(query, (data) => {})
                })
            }
            /* Sends an redirection object with redirection URL as data */
            res.send([{
                type: 'url',
                data: '/' + req.session.username + '/process'
            }]);
        }
    })

});

/* Lets the user cancel an order, before payment */
router.get('/cancel/:id', (req, res) => {
    /* Sets the status of order as cancelled. */
    let query = `update orders set status='cancelled' ,payStatus='unpaid'
    where id=${req.params.id}`;
    sql.execute(query, () => {});
    /*Shows user his orders pending payment. */
    res.redirect('/' + req.session.username + '/orders/pending');
});

/* Displays the active orders to the user &  lets them edit/cancel them.*/
router.get('/active', (req, res) => {
    /*Selects the paid orders that are yet to dispatch or dispatched. */
    query = `select * from orders 
        where userId=${req.session.userId} 
        and payStatus='paid' and status='active' or 
        status='dispatched'
        order by date desc;`;
     
    /*Fetches product details for the orders */    
    query += `select * from products p,orders o 
        where o.userId=${req.session.userId} 
        and o.payStatus='paid' 
        and (status='active' or status='dispatched')
        and o.prodId=p.id
        order by o.date desc;`;
    
    /*Selects the address details for the orders */
    query += `select * from address a,orders o 
        where o.userId=${req.session.userId} and 
        o.payStatus='paid' and o.addressId=a.id
        order by o.date desc;`;

    query += `select * from users where id=${req.session.userId};`;
    query += `select * from categories;`;

    sql.fetch(query, (data) => {
        if (data.length) {
            data[1].forEach((imagedata) => {
                /*Converts blob data to base 64 Data URI */
                imagedata.image = bti.convert(imagedata.image);
            })
        }

        /* Renders the orders view, with provided data */
        res.render('orders.ejs', {
            order: data[0],
            prod: data[1],
            address: data[2],
            user: data[3],
            cat: data[4],
            cart: req.session.cart,
            username: req.session.username
        });
    });
});

/* Displays the active orders to the user &  lets them edit/cancel them.*/
router.get('/cancelled', (req, res) => {
    
    query = `select * from orders 
        where userId=${req.session.userId} 
        and status='cancelled'
        order by date desc;`;

    /* Fetches product details of the orders */ 
    query += `select * from products p,orders o 
        where o.userId=${req.session.userId} and
        status='cancelled' and o.prodId=p.id
        order by o.date desc;`;
    
    /* Fetches address details of the orders */
    query += `select * from address a,orders o 
        where o.userId=${req.session.userId} and 
        o.status='cancelled' and o.addressId=a.id
        order by o.date desc;`;
    
    query += `select * from users where id=${req.session.userId};`;
    query += `select * from categories;`;

    sql.fetch(query, (data) => {
        if (data.length) {
            data[1].forEach((imagedata) => {
                /*Converts blob data to base 64 Data URI */
                imagedata.image = bti.convert(imagedata.image);
            })
        }

        /* Renders the orders view, with provided data */
        res.render('orders.ejs', {
            order: data[0],
            prod: data[1],
            address: data[2],
            user: data[3],
            cat: data[4],
            cart: req.session.cart,
            username: req.session.username
        });
    });
});

/*Displays the delivered orders */
router.get('/delivered', (req, res) => {
    /*Selects the delivered orders */
    query = `select * from orders 
        where userId=${req.session.userId} 
        and status='delivered'
        order by date desc;`;

    /* Fetches product details of the orders */
    query += `select * from products p,orders o 
        where o.userId=${req.session.userId} and
        status='delivered' and o.prodId=p.id
        order by o.date desc;`;

    /* Fetched address details of the orders */
    query += `select * from address a,orders o 
        where o.userId=${req.session.userId} and 
        o.status='delivered' and o.addressId=a.id
        order by o.date desc;`;

    query += `select * from users where id=${req.session.userId};`;
    query += `select * from categories;`;

    sql.fetch(query, (data) => {
        if (data.length) {
             /*Converts blob data to base 64 Data URI */
            data[1].forEach((imagedata) => {
                imagedata.image = bti.convert(imagedata.image);
            })
        }

        /*Renders order view with privided parameters */
        res.render('orders.ejs', {
            order: data[0],
            prod: data[1],
            address: data[2],
            user: data[3],
            cat: data[4],
            cart: req.session.cart,
            username: req.session.username
        });
    });
});

/*Redirects all unauthorized routes to error page. */
router.get('/*', (req,res)=>{
 res.redirect('/error');
})

module.exports = router;