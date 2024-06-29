const express = require('express');
const router = express.Router();
const stripe = require("stripe")(process.env.secret_key);

router.post('/checkout-session', async (req, res) => {
    console.log(req.body.totalAmount);
    try {
        const { cart, Allproduct } = req.body;
        console.log(Allproduct);

        const lineItems = Allproduct.map((product, index) => {
            if (cart[index]) {
                return {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: product.name, // Assuming each product has a 'name' property
                        },
                        unit_amount: Math.round(product.newprice * 100), // Amount in cents
                    },
                    quantity: 1, // Quantity is 1 since cart is an array of booleans
                };
            }
        }).filter(item => item !== undefined); // Filter out undefined items

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: 'https://edoctor-eight.vercel.app/success',
            cancel_url: 'https://edoctor-eight.vercel.app/cancel',
        });
        
        res.send({ id: session.id }); // Ensure the session ID is sent in the response
    } catch (err) {
        console.error('Error in checkout-session:', err); // Log the error for debugging
        res.status(500).send('Error in checkout-session');
    }
});

module.exports = router;