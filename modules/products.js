`use strict`;

const router = require('express').Router();
const pagination = require('./../app_modules/pagination');
const sql = require('./../app_modules/dbQuery');
const bti = require('./../app_modules/blobToImage');

/* Displays the products information*/
router.get('/view/:id', (req, res) => {
    let query = `select * from categories;`;
    /*Fetches the prducts */
    query += `select * from products where id=${req.params.id};`;
    /* Fetches the user details only if logged in*/
    if (req.session.userId) {
        query += `select * from users where id=${req.session.userId};`;
    }

    /*Executes the queries */
    sql.fetch(query, (data) => {
        /*Convert blob image data to base64 Data URI */
        data[1].forEach(idata => {
            idata.image = bti.convert(idata.image);
        });
        /*Renders the view */
        res.render('view-product.ejs', {
            cat: data[0],
            prod: data[1],
            user: data[2],
            cart: req.session.cart,
            username: req.session.username
        })
    })

});

/*Maps unauthorized url to error page. */
router.get('/view/*', (req, res) => {
    res.redirect('/error');
});

/*Show products based on Categories name*/
router.get('/:name', async (req, res) => {
    /*Select the products in the given category. */
    let query = `select count(p.id) as pcount from products p, categories c
      where p.catId=c.id and c.name='${req.params.name}';`;
    /*Paginated the results by 12 per page */
    let page = await pagination.getdata(query, 0);
    /*Fetches other required details */

    query = `select * from categories;`;
    query += `select p.* from products p, categories c 
     where p.catId=c.id and c.name='${req.params.name}' limit 12;`;
    if (req.session.userId) {
        query += `select * from users where id=${req.session.userId};`;
    }
    sql.fetch(query, (data) => {
        /*Converts the blob data to base 64 encoded Data URI */
        data[1].forEach(idata => {
            idata.image = bti.convert(idata.image);
        });

        /*Renders the categories view */
        res.render('categories.ejs', {
            cat: data[0],
            prod: data[1],
            user: data[2],
            pagination: page,
            url: `products/${req.params.name}`,
            cart: req.session.cart,
            username: req.session.username
        });
    })

})

/*Displays products in a page in reference to the page number */
router.get('/:name/:no', async (req, res) => {
    let page, query;
    /*Gets count information for pagination*/
    query = `select count(p.id) as pcount 
            from products p, categories c 
            where p.catId=c.id and c.name='${req.params.name}';`;
    /*Gets pagination informaion based on given  */
    page = await pagination.getdata(query, req.params.no);

    if (!page) {
        /* Redirects the user if the parameter is not a number. */
        res.redirect('/error');
    } /* If the parameter is correct */
    else {
        /* Selects all the required details */
        query = `select * from users where id=${req.session.userId};`;
        query += `select * from categories;`;
        /* Selects 12 products based on pagination range. */
        query += `select p.* from products p, categories c 
     where p.catId=c.id and c.name='${req.params.name}' limit ${page.range},12;`;
      if(!isNaN(req.params.name)){  
          sql.fetch(query, (data) => {
            data[2].forEach(idata => {
                /*Converts the blob image data to base 64 DATA URI */
                idata.image = bti.convert(idata.image);
            });
            /*Renders the View */
            res.render('categories.ejs', {
                user: data[0],
                cat: data[1],
                prod: data[2],
                pagination: page,
                url: `products/${req.params.name}`,
                cart: req.session.cart,
                username: req.session.username
            })
        })
    }else{
        /*Renders Error View */
        res.render('error');
    }
    }

})

/* Maps all the unauthorized routes to error page.*/
router.get('*', (req, res) => {
    res.redirect('error');
});

module.exports = router;