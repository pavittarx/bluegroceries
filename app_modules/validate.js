/* Provides a validation function to validate input data.*/
exports.validate = (data) => {
    var err = [];
    /* The data is a JSON object */
    for (var key in data) {
        /* Prevents SQL Injection attacks */ 
        if (typeof data[key] == 'string' && data[key].match(/;/g)) {
            err.push({
                type: 'err',
                data: `Special Characters (;, :, ., #) are not allowed in ${key} `,
                options: { id: key }
            });   
        }  /* Performs re-validation of password fields */
        else if (key === 'password' && data[key].length < 8) {
            err.push({
                type: 'err',
                data: 'Password must be atleast 8 characters long.',
                options: { id: key }
            })
        } /* Checks the password and confirm password fields macth */ 
        else if (key === 'cpassword' && (key - 1) === 'password' && data[key] != data[key - 1]) {
            err.push({
                type: 'err',
                data: 'The password fields do not match.',
                options: { id: key }
            })
        }
    }
    return err;
}

/* Note : All other validation 
is performed at front end (client) before passing on the data.*/