'use strict'
const sql = require('./dbQuery');


/* Calculates the delivery charge for the payment,
all the orders to single location being charget at Rs. 50,
while the ones following at Rs. 30 per location.
*/
exports.calcCharge = (userId) => {
    let amount = {
        total: 0,
        discount: 0,
        net: 0,
        charge: 0
    }

    let query = `select quantity,charge, discount,
    orders.id as id, orders.price as oPrice, products.price as pPrice
    from orders,products 
    where userId=${userId} 
    and orders.prodId=products.id and orders.payStatus='pending';`;

    /*Returns a promise object that resolves into amount object containing 
    payment details.*/
    return new Promise((resolve, reject) => {
        sql.execute(query, (data) => {
            let dataLength = data.length;
            /* If no data is present it resolves the promise here only. */
            if (dataLength === 0) resolve(amount);
            if (data == null) reject(data);
            /* If there is data, it calculates the vaules for amount object.*/
            for (let i in data) {
                amount.discount += data[i].pPrice * (data[i].discount / 100) * data[i].quantity;
                amount.total += data[i].pPrice * data[i].quantity;
                amount.charge += data[i].charge;
                amount.net += data[i].oPrice * data[i].quantity + data[i].charge;
                if (i == dataLength - 1) {
                    /*Converts the numbers to fixed notation,
                    in order to deal with numerical floating point errors. */
                    amount.discount = (amount.discount).toFixed(2);
                    amount.net = (amount.net).toFixed(2);
                    /* Resolves amount during the last iteration of the loop.*/
                    resolve(amount);
                }
            };
        });
    });
}


/* It creates the charge as described in CalcCharge details above. */
exports.createCharge = (data, userId) => {
    let query;
    /*It sets the first order to have charge 50. */
    if (data[0].charge === 0) {
        query = `update orders set charge=50 where userId=${userId} and payStatus=0 limit 1`;
        sql.execute(query, (result) => {})
    }

    /*It adds the address of first order to the array. */
    let addressArray = [data[0].addressId];
    let dataLength = data.length;

    for (let i = 1; i < dataLength; i++) {
        /* Checks if the address is already present in the address array.*/
        if (!addressArray.includes(data[i].addressId)) {
            /* If not, sets the charge of order to 30.*/
            query = `update orders set charge=30 
            where userID=${userId} and addressId=${data[i].addressId} limit 1`;
            /* Adds the given address to the address array.*/
            addressArray.push(data[0].addressId);
            sql.execute(query, (data) => {})
        } else if (data[i].charge != 0) {
            /*Sets the charge to 0 if address is present in the Array.  */
            query = `update orders set charge=0 
            where userID=${userId} and addressId=${data[i].addressId} and id=${data[i].id}`;
            sql.execute(query, (data) => {})
        }
    }
    return true;
}

/* It fetches products from cart and converts then to orders. */
exports.createOrders = (userId) => {
    /* If there are products in the cart, it selects them. */
    let query = `select * from cart,products 
     where cart.userId=${userId} and cart.prodId=products.id;`;
    /* Selects the address provided by the user. */
    query += `select * from useraddress ua, address a 
     where ua.userId=${userId} and ua.addressId=a.id;`;

    sql.fetch(query, (data) => {
        let dataLength = data[0].length;
        /* Creates Orders, using default preferences from Products in the Cart */
        for (let i in data[0]) {
            /* Discounts the price, by given discount percent */
            data[0][i].price -= (data[0][i].price) * (data[0][i].discount / 100);
            /* Creates a new order. */
            query = `insert into 
                orders(quantity,date,charge,price,prodId,userId,addressId)
                values 
                (1,now(),50,${data[0][i].price},${data[0][i].id},
                ${userId},${data[1][0].id});`;

            query += `delete from cart where prodId=${data[0][i].id};`;
            query += `update products set stock=(stock-1) 
                where id=${data[0][i].id};`;

            sql.execute(query, (orderData) => {})
        };
    });
}