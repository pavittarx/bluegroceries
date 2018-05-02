/* #Encodes and Decodes Base 64 string to binary and vice versa. */
/* It is used to encode and decode Image Data URI */
const b64 = require('base-64');

/* Converts Binary Image Buffer to Base64 encoded Data URI */
exports.convert = function(buffer) {
    if (buffer) return 'data:image/png;base64,' + buffer.toString('base64');
    else return 0;
}


/* Converts Base 64 Encoded Data URI  String to binary Buffer, to be stored in DB */
exports.toblob = (a) => {
    return new Buffer(b64.decode(a), 'binary');
};