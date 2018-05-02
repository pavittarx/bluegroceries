'use strict';
/* Provides Data for faciliating Pagination Services */
const sql = require('./dbQuery');

/* Wraps the result from the query, into a promise & returns it. */
function getcount(query) {
    return new Promise((resolve, reject) => {
        sql.fetch(query, data => {
            if (data) resolve(data[0].pcount);
            if (!data) reject('Cannot Fetch Count');
        });
    });
};

exports.getdata = async(query,now) => {
    now = parseInt(now);
    let count, last, prev, next;
    /* Gets the total Number of Products in the Database */
    count = await getcount(query);
    /* Calculates the index of last possible page, from the count of products. */
    last = parseInt(count / 12);
    /* Check if the provided index is possible, if not returns null, and terminates the currrent process from further execution.  */
    if (now > last || now < 0) return null;

    /* Calculates, the range to start selecting products from, for a certain page number. */
    let range = 12 * now;
    /* Calculates the Indexes to be shown in the pagination bar. */
    let index = [];
    for (let i = 0; i < last && i < 7; i++) {
        index.push(now + i);
    }

    /* Calculate Indexes of Prev & Next pages, if they exist, or sets them to null. */
    (now > 0 && now <= last) ? prev = now - 1: prev = null;
    (now < last && now >= 0) ? next = now + 1: next = null;

    return {
        prev: prev,
        next: next,
        range: range,
        index: index
    };
}