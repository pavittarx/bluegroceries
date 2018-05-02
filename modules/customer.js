/* #This module deals with the users/customers */
/* An Express router Middleware that express app to these routes */
const router = require('express').Router();
/* A database middleware that, connects and performs queries on the database. */
const sql = require('./../app_modules/dbQuery');
/* A middleware that endcodes and decodes base 64 strings & data.  */
const bti = require('./../app_modules/blobToImage');
/* A middlewar that facilitates pagination services. */
const pagination = require('./../app_modules/pagination');

/* Displays user details. */
router.get("/", (req, res) => {
    /* Fetches user details */
    let query = `select id,username,fName,lName,email,phone,image from users 
               where id=${req.session.userId};`;
    /* Fetches user address*/
    query += `select address.* from address,useraddress ua
               where  address.id=ua.addressId
               and ua.userId=${req.session.userId};`;
    /* Fetches Categories details*/
    query += `select * from categories;`;

    sql.fetch(query, async (data) => {
        /*Converts the binary image to Base64 encoded image. */
        data[0][0].image = bti.convert(data[0][0].image);
        /*Rebders the user profile view */
        res.render('profile.ejs', {
            user: data[0],
            address: data[1],
            cat: data[2],
            cart: req.session.cart,
            role: req.session.role
        });
    })

});

/* Display products in user's cart */
router.get('/cart', (req, res) => {

    /* Mysql Queries for fetching data from the Database */
    var query = `select id,username,fName,lName from users where id=${req.session.userId};`;
    /* Slect the details of products in user's cart */
    query += `select * from products,cart where cart.prodId=products.id and cart.userId=${req.session.userId};`;
    query += `select * from categories;`;
    /* Fetches Data from MySql Database */
    sql.fetch(query, (data) => {
        data[1].forEach(data => {
            /* Converts Image Buffer to Base64 encoded Image URI */
            data.image = bti.convert(data.image);
        });
        /* Passes data to EJS engine for Rendering the View */
        res.render('cart.ejs', {
            user: data[0],
            prod: data[1],
            cat: data[2],
            cart: req.session.cart
        });
    })

});

/* Adds the selected product into user's cart. */
router.put('/cart', (req, res) => {
    /* Selects the products in user's cart. */
    let query = `select * from cart 
    where userId=${req.session.userId} and prodId=${req.body.prodId}`;

    sql.fetch(query, (data) => {
        /* Checks if the product is present in user's cart already,
         to aviod re-insertion.*/
        if (!data.length) {
            /*If not, inserts the product into user's cart. */
            query = `insert into cart 
            values('${req.session.userId}','${req.body.prodId}');`;
            sql.execute(query, (data) => {});
        }
    });
    /* Redirects user to the main page..*/
    res.send([{
        type: 'url',
        data: '/'
    }]);
});

/* Removes a product from the cart. */
router.delete('/cart', (req, res) => {
    /*Removes product with given product id from the cart */
    let query = `delete from cart where cart.userID=${req.session.userId} and cart.prodId=${req.body.prodId}`;
    sql.fetch(query, (data) => {
        /*Sends a JSON object with redirection URL as data. */
        res.send([{
            type: 'url',
            data: `/${req.session.username}/cart`
        }]);
    });
});


/* Displays page for editing user information */
router.get("/edit", (req, res) => {
    /* Fetches the details of the user.*/
    let query = `select username,fName,lName,email,phone from users where id=${req.session.userId};`;
    query += `select * from address a,useraddress ua where ua.userId=${req.session.userId} and a.id=ua.addressId; `;
    query += `select * from categories;`;

    sql.fetch(query, data => {
        /* Renders the view of profie to be edited. */
        res.render('profile-edit.ejs', {
            user: data[0],
            address: data[1],
            cat: data[2],
            cart: req.session.cart
        });
    })

})

/* Edits the user information */
router.put("/edit", async (req, res) => {
    /* Helps edit User Personal & Address Information  */
    let reqData = req.body;
    /*Variables/Objects to be used, during the process. */
    let query = '',
        updateUser = '',
        updateAddress = '',
        addressData = {},
        userimage = false;
    /* Loops through the properties that are sent. */
    for (let key in reqData) {
        /* Adds street and block data to addressData object */
        if (key === 'street' || key === 'block') {
            addressData[key] = reqData[key];
        }/*Checks if the profile imag is to be changed. */
         else if (key === 'image') {
            userimage = true;
         } /*Checks if user's personal information is to be updated. */ 
        else {
            updateUser += `${key}='${reqData[key]}',`;
        }
    }

    /*If the image is to be updated. */
    if (userimage) {
        let query = 'update users set image=? where id=?';
        /*It converst the Base64 encoded Data URI to blob data */
        let params = [await bti.toblob(reqData.image), req.session.userId];
        /* Executes query using MySql Custom Syntax */
        sql.customquery(query, params, (data) => {})
    }

    /* Updates User Data in the Database, only if user requests a change. */
    if (updateUser) {
        query = `update users set ${updateUser.slice(0,-1)} where id=${req.session.userId};`;
        sql.execute(query, (data) => {});
    }

    /*Checks if addressData is not empty */
    if (Object.getOwnPropertyNames(addressData).length > 0) {
        /* Fetches the old address, that was being used by user. */
        query = `select * from address a, useraddress ua where ua.addressId=a.id and ua.userId=${req.session.userId};`;
        sql.fetch(query, (fetchedData) => {

            /* Builds Condition based on value that is to be updated, either first, second or both */
            if (!addressData.street) addressData['street'] = `${fetchedData[0].street}`;
            if (!addressData.block) addressData['block'] = `${fetchedData[0].block}`;
            /* Selects New Address, if that already exists in the records. */

            query = `select * from address where address.street='${addressData.street}' and address.block='${addressData.block}';`;
            /* Checks if an address with values to be updated already exist.*/
            sql.fetch(query, (data) => {
                /* If a record already exist. */
                if (data.length) {

                    /* Updates the Junction table to reference this new adress in the records. */
                    query = `update useraddress set addressId=${data[0].id} where userId=${req.session.userId};`;
                    sql.fetch(query, (newData) => {
                        sql.deletethis(fetchedData[0].id, 'address');
                    });

                } else {

                    /* In case, the one does exist, it creates a new one.*/
                    query = `insert into address(street,block) values('${addressData.street}','${addressData.block}');`;
                    sql.fetch(query, (newData) => {
                        /* Updates the new address*/
                        query = `update useraddress set addressId=${newData.insertId} where userId=${req.session.userId};`;
                        sql.fetch(query, (data) => {
                            /*Deletes the old address */ 
                            sql.deletethis(fetchedData[0].id, 'address');
                        });
                    });
                }
            });

        });
    }
    /* Sends the redirection message with URL as its data.*/
    res.send([{
        type: 'url',
        data: `/${req.session.username}`
    }]);
});

/*Processes Orders in users cart, and creates orders from them. */
router.get("/process", (req, res) => {
    require('../app_modules/payments').createOrders(req.session.userId);
    /*Redirets the user */
    res.redirect('orders/pending');
});

module.exports = router;