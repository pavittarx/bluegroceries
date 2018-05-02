function toggle(x) { /* For Toggling the Sidebar in Mobile UI */
    if (x === 1) {
        document.getElementById('sidebar').style.transform = "translateX(0%)";
    } else {
        document.getElementById('sidebar').style.transform = "translateX(-120%)";
    }

}

let toggleexpander = (state) => {
    if (!state) {
        document.getElementById('expand').style.display = "none";
    } else {
        document.getElementById('expand').style.display = "initial";
    }
}

/* Sends Request & Data to the Server, in the form of XmlHttpRequest */
function xhrsend(method, url, data, cb) {
    let xhr = new XMLHttpRequest();
    /* Generates the url the request id to be sent to */
    url = 'http://' + window.location.host + url;
    /* Opens a XHR request using the given method */
    xhr.open(method, url);
    /* Sets the Request Header, that the data to be passed is JSON */
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    /* Logs the URL & Methd of Request onto the Console */
    console.log(`XHR Request sent on ${url} using ${method}`);
    /* Fires an onload event, when a response is recieved from the Server */
    xhr.onload = () => {
        /* The Response is passed to a callback function */
        console.log(`Response Received for request sent on ${url} using ${method}`)
        cb(xhr.response);
    }
    if (data instanceof FormData) {
        /* Converts the FormData Object to a JSON Object */
        let jsonObj = {};
        for (const [key, value] of data.entries()) {
            jsonObj[key] = value;
        }
        /* JSON object is converted to a string & sent to the Server */
        xhr.send(JSON.stringify(jsonObj));
    } else {
        xhr.send(JSON.stringify(data));
    }
}

async function submitform(e, parent, method, url) {
    /* Prevents the Form from Submission */
    e.preventDefault();
    console.log('Executing Submit');
    /* Selects all <input> elements in the form */
    let selector = document.querySelectorAll(parent + ' > input');
    /* Selects <span> elements in the form to provide user with errors */
    let error = document.querySelectorAll(parent + ' > span');
    /* Returns Number of <input> Elements present in the Form*/
    let n = selector.length;
    /* Loops through the <input> elements & logs them to console. */
    for (let i = 0; i < n; i++) {
        console.log(selector[i].name + ' - ' + selector[i].value);
    }
    /* Logs Number of Elements into the Console. */
    console.log(n);
    /* Returns true if the Form was validated succesfully, based on the type of method (put/post) */
    if (await method == "post" ? validatepost(selector, error) : validateput(selector, error) === true) {
        /* Converts the data from User into FormData() object */
        let fdata = await formdata(selector)
            /* Passes the data to be sent. */
        xhrsend(method, url, fdata, function(res) {
            /* Logs the Data recieved from Server into the console - a JSON Object */
            console.log(`The response is ${res}`);
            /* Passes the JSON object to Response function */
            (typeof res === 'string') ? response(JSON.parse(res)): document.write(res);
        })
    }

}


/* Validates Form Data, to be sent via POST Request Method */
function validatepost(data, err) {
    /* Sets Validation Status to true, i.e, NO Error */
    let valstatus = true;
    /* The number of elements in Data*/
    let n = data.length;
    /* Removes the old, error mesaages provided during last Validation*/
    for (let i = 0; i < n; i++) {
        err[i].innerHTML = "";
    }

    for (let i = 0; i < n; i++) {
        /* Perform Validation Checks on Submitted Elements */
        if (data[i].value.length === 0) {
            valstatus = false;
            err[i].innerHTML = `${data[i].placeholder} cannot be empty. \n`;
        } else if (data[i].type == "email" && data[i].value.search("@") == -1) {
            valstatus = false;
            err[i].innerHTML = `Email is not valid. \n`;
        } else if (data[i].type === "password" && data[i].value.length < 8) {
            valstatus = false;
            err[i].innerHTML = ` ${data[i].placeholder} should be at least 8 characters long.\n`;
        } else if (data[i].type === "password" && data[i - 1].type === "password" && data[i].value != data[i - 1].value) {
            valstaus = false;
            err[i].innerHTML = `${data[i-1].placeholder} & ${data[i].placeholder} does not match.`;
        } else if (data[i].name === "username" && data[i].value.length < 6) {
            valstatus = false;
            err[i].innerHTML = `${data[i].placeholder} must be at least 5 characters long.`;
        } else {
            data[i].style.color = "#1976d2f0";
        }
    }
    /* Returns a flag for, if the Form is valid, or has some error */
    return valstatus;
}


/* Validates Data to be sent using PUT Request Method */
function validateput(data, err) {
    let valstatus = true;
    console.log('Executing Valput()')
        /* Performs Validation for method 'put' type Requests */
    let n = data.length;
    let nochange = 0;
    for (let i = 0; i < n; i++) {
        if (data[i].value.length > 0) {
            console.log('Into Error Log');
            if (data[i].name == "email" && data[i].value.search('@') < 0) {
                valstatus = false;
                err[i].innerHTML = "The email provided is not valid.";
            } else if (data[i].name == "phone" && data[i].value.length < 10) {
                valstatus = false;
                err[i].innerHTML = "The phone number provided is not a valid one.";
            } else if (data[i].name == 'password' && data[i].value.length < 8) {
                valstatus = false;
                err[i].innerHTML = "Password must be atleast 8 characters long.";
            } else if (data[i].name == 'cpassword' && data[i - 1].name == "password" && data[i].value.length < 10) {
                valstatus = false;
                err[i].innerHTML = "The fields Password & Confirm Passwords do not match.";
            }
        } else {
            nochange++;
            if (nochange == n) return false;
        }
    }

    return valstatus;
}



/* Converts Data passed to it, into FormData() object */
async function formdata(data) {
    console.log('Converting Data to FormData() objects.');
    let fdata = new FormData();
    let n = data.length;
    for (let i = 0; i < n; i++) {
        /* Adds elements that are not emplty */
        if (data[i].name === "image" && data[i].value.length != 0) {
            fdata.append(data[i].name, await toBlob(data[i]));
        } else if (data[i].value.length != 0)
            fdata.append(data[i].name, data[i].value);
    }
    for (const [key, value] of fdata.entries()) {
        console.log(key + ' - ' + value);
    }
    console.log('Converted');
    return fdata;
}



/* Handles the Response Recieved from the Server */
function response(data) {
    console.log(data);
    for (let i in data) {
        if (data[i].type === 'err') {
            document.getElementById(data[i].options.id).innerHTML = data[i].data;
            console.log(data[i].data);
        } else if (data[i].type === 'url') {
            console.log(`${window.location.protocol}//${window.location.host}/${data[0].data}`);
            window.location = `${window.location.protocol}//${window.location.host}${data[0].data}`;
        }else if(data[i].type === 'message'){
            console.log(data[i].options.hide);
            let msgbox = document.getElementById(data[i].options.id);
            msgbox.style.display="inherit";
            msgbox.innerHTML = data[i].data;
            if(data[i].options.hide){
                document.getElementById(data[i].options.hide).style.display="none";
            }
        }
    }
}


/* Function for Making Delete Requests */
function makereq(method, url, data) {
    xhrsend(method, url, data, (res) => {
        /* Logs the Data recieved from Server into the console - a JSON Object */
        console.log(`The response is ${res}`);
        /* Passes the JSON object to Response function */
        (typeof res === 'string') ? response(JSON.parse(res)): document.write(res);
    })
}

function toBlob(image) {
    return new Promise((resolve, reject) => {
        var reader = new FileReader();
        reader.onloadend = function() {
            resolve(reader.result.split(',')[1]);

        }
        reader.onerror = function() {
            reject(reader.result);
        }
        reader.readAsDataURL(image.files[0]);
    });
}

function updateorder(id, max, e, method, url) {
    let quantity = document.getElementsByName('quantity')[0].value;
    let err = document.getElementById('yerr' + id);
    err.innerHTML = ' ';
    if (quantity < 1 || quantity > max) {
        qerr.innerHTML = `Please input a Quantity between 1-${max}`;
    }
}

function preventsubmit(event) {
    event.preventDefault();
}

/* Sourced from Max Chuhryaev's Codepen 'Input with Dynamic Width', resizes the text input feilds */
function resizable(id, factor) {
    let el = document.getElementById(id);
    let int = Number(factor) || 7.7;

    function resize() { el.style.width = ((el.value.length + 2) * int) + 'px' }
    let e = 'keyup,keypress,focus,blur,change'.split(',');
    for (var i in el) el.addEventListener(e[i], resize, false);
    resize();
}

/* function resizeinput() {
    let input = document.querySelectorAll('input');
    for (let i in input) {
        console.log(input[i].value);
    }
}

window.onload = resizeinput(); */

document.addEventListener("DOMContentLoaded", function() {
    let input = document.querySelectorAll('.process_form > input');
    if (input) {
        let n = input.length;
        for (let i = 0; i < n; i++) {
            input[i].style.width = (input[i].value.length + 2) * 7.7 + 'px';
        }
    }
});

function toggleinput(id, event, state) {
    if (state === 0) {
        event.preventDefault();
        let form = document.querySelector('#form' + id);
        form.className = 'inputOn';

        let input = form.querySelectorAll('input');
        let inputLength = input.length;
        console.log('Input Length', inputLength);
        for (let i = 0; i < inputLength; i++) {
            input[i].removeAttribute('disabled');
        }

        let button = document.getElementById('inputbtn'+id);
        button.innerHTML = "Update";
        button.removeAttribute('onclick');
        button.setAttribute('onclick', `toggleinput(${id},event,1)`);

    } else if (state === 1) {
        event.preventDefault();
        let form = document.querySelector('#form' + id);
        let input = form.querySelectorAll('input');
        let n = input.length;
        var data = {};
        for (let i = 0; i < n; i++) {
            data[`${input[i].name}`] = input[i].value;
        }
        data['orderId'] = id;
        console.log(location.pathname);
        xhrsend('put', location.pathname, data, function(res) {
            res = JSON.parse(res)[0];
            console.log(res);
            response([res]);
            if (res.type === 'err') {
                console.log(res.data);
                document.getElementById('err' + id).innerHTML = res.data;
                console.log('err' + id);
            }
        })
    }
}
