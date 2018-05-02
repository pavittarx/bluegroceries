/* This file implements the Stripe elements on the browser client, 
that tokenizes card payment information
from the send the token to the server.*/

/* Creates an instance of Stripe Object,on the client browser
using Publishale Key provided by Stripe*/

fetch('/data/stripe-public-key')
    .then(function (response) {
        return response.json();
    })
    .then(function (stripeKey) {
        let stripe = Stripe(stripeKey.publickey);
        /* This method creates an instance of Stripe elements,
which manages a group of Elements. */
        let elements = stripe.elements();

        /* The classes to be used by different states of Stripe Input elements, 
        passed to elements.create() as an optional onject parameter.*/
        let classes = {
            base: 'stripe_base',
            empty: 'stripe_empty',
            focus: 'stripe_focus',
            invalid: 'stripe_invalid',
            complete: 'stripe_complete'
        }

        let style = {
            complete: {
                color: '#00e676'
            }
        }

        /* Creates an instance of specific element */
        let cardNumber = elements.create('cardNumber', {
            classes: classes,
            style: style
        });
        /* Mounts the element instance to the HTML element with provided id. */
        cardNumber.mount('#card-number');

        let cardExpiry = elements.create('cardExpiry', {
            classes: classes,
            style: style
        });
        cardExpiry.mount('#card-expiry');

        let cardCvc = elements.create('cardCvc', {
            classes: classes,
            style: style
        });
        cardCvc.mount('#card-cvc');


        /* Adds an event listener to the stripe elements,
         to real-time error validation messages. */
        function error(elementInstance) {
            elementInstance.addEventListener('change', function (event) {
                let err = document.getElementById('stripe-error');
                if (event.error) err.innerHTML = event.error.message;
                else err.innerHTML = '';
            })
        }


        /* Binds the event listener to stripe elements. */
        error(cardNumber);
        error(cardExpiry);
        error(cardCvc);

        var form = document.getElementById('stripe-form');
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            /* Creates a token for the provided card information */
            stripe.createToken(cardNumber).then(function (result) {
                if (result.error) {
                    /* Inform the user, if there was an error */
                    var errorElement = document.getElementById('stripe-errors');
                    errorElement.textContent = result.error.message;
                } else {
                    /* Send the token to your server. */
                    stripeTokenHandler(result.token);
                }
            });
        });

        /* Sends the token to the server. */
        function stripeTokenHandler(token) {
            /* Insert the token ID into the form so it gets submitted to the server */
            var form = document.getElementById('stripe-form');
            var hiddenInput = document.createElement('input');
            hiddenInput.setAttribute('type', 'hidden');
            hiddenInput.setAttribute('name', 'stripeToken');
            hiddenInput.setAttribute('value', token.id);
            form.appendChild(hiddenInput);

            // Submit the form to the Server
            form.submit();
        }

        /* Reloads the page, if user hits back button after or while payments. */
        if (performance.navigation.type == 2) {
            location.reload(true);
        }


    });