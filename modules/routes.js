/*Provides utiltities to be used further */
const router = require('express').Router();
const sql = require('./../app_modules/dbQuery');
const val = require('./../app_modules/validate');
const bti = require('./../app_modules/blobToImage');
const pagination = require('./../app_modules/pagination');

/* Responds to the request made at 127.0.0.1:9227 route */
router.get("/", async (req, res) => {
    console.log(`[router:get] / `);
    /*Counts total products for pagination */
    let query = "select count(*) as pcount from products;";
    /* Returns Pagination Information */
    let page = await pagination.getdata(query,0);
    /* Selects products based on pagination range */
    query = `select * from categories;select * from products limit ${page.range},12;`;
    if (req.session.userId) query += `select * from users where id=${req.session.userId};`;

    sql.fetch(query, (data) => {
        data[1].forEach(idata => {
            /*Converts the binary encoded Data URI to base 64 Data URI */
            idata.image = bti.convert(idata.image);
        });
        /* Renders Index/Main Page*/
        res.render('index.ejs', {
            cat: data[0],
            prod: data[1],
            user: data[2],
            cart: req.session.cart,
            pagination: page,
            url : 'page'
        });
    });
});

/* Divides the products to be displayed onto main screen into pages */
router.get("/page/:no", async (req, res) => {
    console.log(`[router:get] /page/ `);
    /* Contains the number of the current page. */
    let now = req.params.no;
    /*Counts the total number of products for pagination. */
    let query = "select count(*) as pcount from products;";
    /* Creates iNdexes and Pages for pagination. */
    let page = await pagination.getdata(query,now);

    /* Checks if the page is possible, that is a valid index is provided. */
    if (!page) {
        /*Redirects the user to the error page. */
        res.redirect('/error');
    } else {
        let query = `select * from categories;`;
        /* Selects only 12 products to be displayed on a page, starting from a ceratin range.*/
        query += `select * from products limit ${page.range},12;`;
        /* Fetches user Data if the user is logged in. */
        if (req.session.userId) query += `select * from users where id=${req.session.userId};`;

        sql.fetch(query, (data) => {
            /* Converts the binary image buffer to base64 encoded Data URI */
            data[1].forEach(idata => {
                idata.image = bti.convert(idata.image);
            });
            console.log('Page', pagination);
            res.render('index.ejs', {
                cat: data[0],
                prod: data[1],
                user: data[2],
                cart: req.session.cart,
                pagination: page,
                url : 'page'
            });
        });
    }
});


router.post("/search", (req, res) => {

    /* Redirects user to a route based on the search term */
    res.redirect(`/search/${req.body.search}`);

});

router.get("/search/:term", (req, res) => {
    console.log(`[router:get] /search/${req.params.term}`);
    /*Selects the products whoose name or description matches the search term */
    let query = `select * from products where name like '%${req.params.term}%';`;
    query += `select * from categories;`;
    if (req.session.userId) query += `select * from users where id=${req.session.userId};`;

    sql.fetch(query, (data) => {
        /* Converts the blob image data to base 64 encoded string */
        data[0].forEach(idata => {
            idata.image = bti.convert(idata.image);
        });

        /* Renders the Search page */
        res.render('search.ejs', {
            prod: data[0],
            cat: data[1],
            user: data[2],
            cart: req.body.cart
        })
    });

});

/* Redirects any non existant routes to the Error Page */
router.get('/error', (req, res) => {
    console.log(`[router] The user has been redirected to /error `);
    /*Sets the response status to 404 */
    res.status(404);
    /*Renders Error Page */
    res.render('error.ejs');
});

module.exports = router;