const express = require('express');
const mongoose = require('mongoose');
const Blog = require('./Modal/BlogModal')
const cors = require('cors');
const app = express();
const fileupload = require('express-fileupload');
const User = require('./Modal/UserModal');
const cloudinary = require('cloudinary').v2;
const port = process.env.PORT || 4200;
require('dotenv').config();

app.use(express.json());
app.use(cors());
app.use(fileupload({
    useTempFiles: true
}));

cloudinary.config({
    cloud_name: 'dckp3ubkg',
    api_key: '954137826352828',
    api_secret: 'lF3OAF50khe4Qwn4gbhtlm34xns',
});
const stripe = require("stripe")(process.env.secret_key);

app.post('/checkout-session', async (req, res) => {
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
            success_url: 'http://localhost:5173/success',
            cancel_url: 'http://localhost:5173/cancel',
        });
        
        res.send({ id: session.id }); // Ensure the session ID is sent in the response
    } catch (err) {
        console.error('Error in checkout-session:', err); // Log the error for debugging
        res.status(500).send('Error in checkout-session');
    }
});
app.listen(4000, () => {
    console.log('Server running on port 4000');
});
app.post('/updateProfile', async (req, res) => {
    const { userId } = req.body;
    const file = req.files.file;

    if (!file) {
        return res.status(500).json({ error: 'Error: File is missing' });
    }

    try {
        const result = await cloudinary.uploader.upload(file.tempFilePath);

        let user = await User.findOne({ userId });

        if (!user) {
            user = await User.create({
                userId: req.body.userId,
                list: [],
                addmedicine: [],
            });
        }

        user.picture = result.secure_url;

        // Update profile picture for related blogs
        await Blog.updateMany({ userId }, { $set: { picture: result.secure_url } });

        // Save the updated user
        await user.save();

        console.log('Profile picture updated:', result.secure_url);
        res.status(200).json({ user });
    } catch (err) {
        console.error('Error in updating profile pic:', err);
        res.status(500).json({ error: 'Error in updating profile pic.' });
    }
});
app.get('/getProfile/:id', async (req, res) => {
    const userId = req.params.id;
    //console.log(userId);
    try {
        const user = await User.find({ userId: userId });
        //console.log(user);
        res.status(200).json({
            user: user
        });
    } catch (err) {
        console.log(err);
    }
})
app.put('/likeblog', async (req, res) => {
    console.log(req.body);
    try {
        const data = await Blog.findByIdAndUpdate(req.body._id, {
            $addToSet: { like: req.body.userId }
        }, { new: true });
        //console.log({'like':data})
        res.json(data);
    } catch (err) {
        console.log({ "error in backened like part": err })
    }
})
app.post('/postcontact', async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.body.userId });
        if (user) {
            const data = await User.findByIdAndUpdate(user._id, {
                $addToSet: {
                    list: {
                        name: req.body.name,
                        relation: req.body.relation,
                        phonenumber: req.body.phonenumber,
                    }
                }
            }, { new: true });
            console.log(data);
            res.status(200).json({
                new_user: data,
            });
        } else {
            const newUser = new User({
                userId: req.body.userId,
                list: [{
                    name: req.body.name,
                    relation: req.body.relation,
                    phonenumber: req.body.phonenumber,
                }],addmedicin:[],
                picture:''
            });
            const savedUser = await newUser.save();
            console.log(savedUser);
            res.status(200).json({
                new_user: savedUser,
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Error in updating user.',
        });
    }
});
app.get('/getcontact/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        const data = await User.find({ userId: userId });
        //console.log(data);
        res.status(200).json({
            data,
        });
    } catch (err) {
        console.log(err);
    }
});
app.post('/addmedicine', async (req, res) => {
    try {
        console.log(req.body);
        const user = await User.findOne({ userId: req.body.userId });
        if (user) {
            const data = await User.findByIdAndUpdate(user._id,
                {
                    $addToSet: {
                        addmedicine: {
                            text: req.body.task,
                            dateTime: req.body.dateTime
                        }
                    }
                },
                { new: true }
            );
            console.log(data);
            res.status(200).json({
                updated_user: data,
            });
        } else {
            const newUser = new User({
                userId: req.body.userId,
                list:[],
                addmedicine: [{
                    text: req.body.task,
                    dateTime: req.body.dateTime
                }]
            });
            const savedUser = await newUser.save();
            console.log(savedUser);
            res.status(200).json({
                new_user: savedUser,
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Error in updating user.',
        });
    }
});
app.get('/getmedicine/:id',async(req,res)=>{
   // console.log('hey');
    const userId= req.params.id;
    try{
        const data = await User.findOne({userId:userId});
        res.status(200).json(data);
    }catch(err){
        console.log('error in getmedicine backened',err);
    }
})
app.delete('/deletemedicine/:id/:index/:task', async (req, res) => {
    const userId = req.params.id;
    const index = req.params.index;
    const task = req.params.task;
    console.log('task',task);
    console.log('index',index);
    try {
        const user = await User.findOne({ userId: userId });
        if (!user) {
            return res.status(404).send('User not found');
        }
        // Check if the index is valid
        if (index < 0 || index >= user.addmedicine.length) {
            return res.status(400).send('Invalid index');
        }
        let updatedaddmedicine = []; // Initialize as an empty array
        for (let i = 0; i < user.addmedicine.length; i++) {
            if (i != index) { 
                updatedaddmedicine.push(user.addmedicine[i]);
            }
        }
        user.addmedicine = updatedaddmedicine;
        if(task==="c"){
            user.task.complete+=1;
        }else{
            user.task.remove+=1;
        }
        await user.save(); // Save the updated user
        console.log('Updated user:', user);
        
        res.status(200).json({ user: user });
    } catch (err) {
        console.log('erorr',err);
        res.status(500).send('Error deleting medicine');
    }
});
app.put('/updatemedicine/:id', async (req, res) => {
    const userId = req.params.id;
    const index = req.body.index;
    const dateTime = req.body.dateTime;
    


    console.log(dateTime);
    console.log('hey');
    try {
        const user = await User.findOne({ userId: userId });
        if (!user) {
            return res.status(404).send('User not found');
        }
        if (index < 0 || index >= user.addmedicine.length) {
            return res.status(400).send('Invalid index');
        }
        user.addmedicine[index].dateTime = dateTime;
        user.task.snooze+=1;
        console.log(user);
        await user.save(); // Corrected to call user.save() as a function
        res.status(200).json(user);
    } catch (err) {
        console.log('Error updating medicine on the backend side:', err);
        res.status(500).send('Error updating medicine');
    }
});
app.post('/addproduct', async (req, res) => {
    const { userId, index } = req.body;

    try {
        const user = await User.findOne({ userId });

        if (!user) {
            return res.status(404).send('User not found');
        }

        user.cart = user.cart || [];

        user.cart[index] = (user.cart[index] || 0) + 1;

        await user.save();

        res.status(200).json(user);
    } catch (err) {
        console.error('Error adding product:', err);
        res.status(500).send('Error adding product');
    }
});
app.post('/removeproduct', async (req, res) => {
    const { userId, index } = req.body;

    console.log('Received index:', index);

    try {
        const user = await User.findOne({ userId });

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Ensure the cart array exists
        if (!Array.isArray(user.cart)) {
            user.cart = [];
        }

        // Ensure the cart array has a number at the specified index
        if (typeof user.cart[index] !== 'number') {
            user.cart[index] = 0;
        }

        // Increment the value at the specified index
        if(user.cart[index]>0){
        user.cart[index]--;
        await user.save();
}
        console.log('Updated user cart:', user.cart);
        res.status(200).json(user);
    } catch (err) {
        console.error('Error remove product:', err);
        res.status(500).send('Error remove product');
    }
});
app.post('/favproduct', async (req, res) => {
    const { userId, index } = req.body;
    console.log('favproduct');
    try {
        const user = await User.findOne({ userId });

        if (!user) {
            return res.status(404).send('User not found');
        }
        user.favourite[index]=true;
        console.log(user.favourite);
        await user.save();

        res.status(200).json(user);
    } catch (err) {
        console.error('Error adding product:', err);
        res.status(500).send('Error adding product');
    }
});
app.post('/nonfavproduct', async (req, res) => {
    const { userId, index } = req.body;
    try {
        const user = await User.findOne({ userId });

        if (!user) {
            return res.status(404).send('User not found');
        }
        user.favourite[index]=false;
        await user.save();
        console.log('Updated user cart:', user.favourite);
        res.status(200).json(user);
    } catch (err) {
        console.error('Error remove product:', err);
        res.status(500).send('Error remove product');
    }
});
app.get('/getproduct/:id', async (req, res) => {
    const userId = req.params.id;
    console.log('getproduct');
    try {
        const user = await User.findOne({ userId });

        if (!user) {
            return res.status(404).send('User not found');
        }
        // if (!Array.isArray(user.cart) || user.cart.length !== 61) {
        //     user.cart = new Array(61).fill(0);
        // }

        // if (!Array.isArray(user.favourite) || user.favourite.length !== 61) {
        //     user.favourite = new Array(61).fill(false);
        // }
        console.log(user);
        res.status(200).json(user);
    } catch (err) {
        console.error('Error remove product:', err);
        res.status(500).send('Error remove product');
    }
});
app.delete('/deladdcontact/:id/:index', async (req, res) => {
    try {
        const { id, index } = req.params;
        const user = await User.findOne({ userId: id });
        if (!user) {
            return res.status(404).send('User not found');
        }
        let updatelist=[];
        for (let i = 0; i < user.list.length; i++) {
            if (i != index) { 
                updatelist.push(user.list[i]);
            }
        }
        user.list=updatelist;
        console.log(user.list);
        await user.save();
        res.send(user);
    } catch (err) {
        console.error('Error in backend:', err);
        res.status(500).send('Error in backend');
    }
});


mongoose.connect('mongodb+srv://leenagupta993:B0NqYpbQ3IviDJM3@cluster0.iextdh3.mongodb.net/EDoctor')
    .then(() => {
        console.log('website it run at 4000')
        app.listen(port, () => console.log(`Server is running on port ${port}`));
    }).catch(err => console.log(err));
    