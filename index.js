const express = require('express');
const mongoose = require('mongoose');
const Blog = require('./Modal/BlogModal')
const cors = require('cors');
const app = express();
const fileupload = require('express-fileupload');
const User = require('./Modal/UserModal');
const cloudinary = require('cloudinary').v2;
const port = process.env.PORT || 4000;
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
app.post('/createblog', async (req, res) => {
    console.log(req.body);
    let image = null;

    // Check if a file is uploaded
    if (req.files && req.files.file) {
        const file = req.files.file;
        cloudinary.uploader.upload(file.tempFilePath, async (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error uploading file to Cloudinary.' });
            }
            console.log(result);
            image = result.secure_url; // Set the image URL
            createBlog();
        });
    } else {
        createBlog(); // No file uploaded, proceed to create the blog
    }
    const user= await User.findOne({userId:req.body.userId});
    if(user && user.picture){
        req.body.userImage=user.picture;
    }
    function createBlog() {
        const blog = new Blog({
            userId: req.body.userId,
            username: req.body.username,
            picture: req.body.userImage,
            title: req.body.title,
            description: req.body.description,
            image: image, // Use the image URL if available
        });

        blog.save()
            .then(result => {
                console.log(result);
                res.status(200).json({
                    new_blog: result,
                });
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({
                    error: 'Error in creating a blog.',
                });
            });
    }
});
app.get('/getblog', async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 });
        res.status(200).json(blogs);
    } catch (err) {
        console.log('error in fetching blogs:', err);
        res.status(500).json({ err: 'Internal Server Error' });
    }
})
app.delete('/blogdelete/:_id', async (req, res) => {
    //console.log("hey");
    const id = req.params._id;
    try {
        const data = await Blog.findByIdAndDelete(id);
        //console.log(data);
        res.json(data);
    } catch (err) {
        console.log({ "blogdelete in backened": err });
    }
})
app.put('/unlikeblog', async (req, res) => {
    try {
        const data = await Blog.findByIdAndUpdate(req.body._id, {
            $pull: { like: req.body.userId }
        }, { new: true });
        //console.log({'unlike':data})
        res.json(data);
    } catch (err) {
        console.log({ "error in backened like part": err })
    }
})
app.put('/dislikeblog', async (req, res) => {
    const { _id } = req.body;
    try {
        const data = await Blog.findByIdAndUpdate(_id, { $addToSet: { dislike: req.body.userId } }, { new: true });
        res.json(data);
    }
    catch (error) {
        console.log({ "error in backend dislike part": error })
    }
})
app.put('/undislikeblog', async (req, res) => {
    const { _id } = req.body;
    try {
        const data = await Blog.findByIdAndUpdate(_id, { $pull: { dislike: req.body.userId } }, { new: true });
        res.json(data);
    }
    catch (error) {
        console.log({ "error in backend dislike part": error })
    }
})
app.post('/updateProfile', async (req, res) => {
    const { userId } = req.body;
    console.log(req.files.file);
    const file = req.files.file ? req.files.file : null;
    if (file === null) {
        return res.status(500).json({ error: 'Error file is null' })
    }
    cloudinary.uploader.upload(file.tempFilePath, async (err, result) => {
        console.log(result);

        let user = await User.findOne({ userId });

        if (!user) {
            user = await User.create({
                userId: req.body.userId,
            });
        }
        user.picture = result.secure_url;
        let blogs = await Blog.find({ userId });
        if (blogs) {
            for (let i = 0; i < blogs.length; i++) {
                blogs[i].picture = result.secure_url;
                await blogs[i].save(); 
            }
        }
        await user.save()
            .then(result => {
                console.log(result);
                res.status(200).json({
                    user: user
                });
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({
                    error: 'Error in updating profile pic.',
                });
            });
    })
})
app.get('/getProfile/:id', async (req, res) => {
    const userId = req.params.id;
    console.log(userId);
    try {
        const user = await User.find({ userId: userId });
        console.log(user);
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
                $addToSet: { list: {
                    name:req.body.name,
                    relation:req.body.relation,
                    phonenumber:req.body.phonenumber,
                } }
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



mongoose.connect('mongodb+srv://leenagupta993:B0NqYpbQ3IviDJM3@cluster0.iextdh3.mongodb.net/EDoctor')
.then(()=>{
    console.log('website it run at 4000')
    app.listen(port, () => console.log(`Server is running on port ${port}`));
}).catch(err => console.log(err));