const express = require('express');
const router = express.Router();
const User = require('../Modal/UserModal');
const Doctor = require('../Modal/Doctor');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const fetchUser = require('../middleware/middleware')

const saltRounds = 10;

async function hashPassword(password){
    try{
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(password,salt);
        return hashedPassword;
    }catch(error){
        console.log(error);
    }
}
router.post('/signup',async(req,res)=>{
    const {name,email,password} = req.body;
    try{
        const found = await User.findOne({email:email});
        if(found){
            return res.status(400).json({message:'user already exist'})
        }
        const hashedPassword = await hashPassword(password);
        let cart={};
        for(let i=0;i<300;i++){
            cart[i]=0;
        }
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            addmedicine: [],
            picture: '',
            cart: new Array(61).fill(0),
            list: [],
            task: { complete: 0, remove: 0, snooze: 0 },
            favourite: new Array(61).fill(false),
            meeting: []
        });
        await newUser.save();
        const data={
            user:{
                id:newUser._id,
                name:newUser.name,
                email:newUser.email,
           
            }
        }
        const token = jwt.sign(data,process.env.secret_key)
        res.json({
            success:true,
            token,data
        })
    }catch(error){
        console.log(error);
        res.status(500);
    }
})

router.post('/login',async(req,res)=>{
    const {email,password}=req.body;
    try{
        const found = await User.findOne({email:email});
        if(!found){
            return res.status(400).json({message:"user not found"})
        }
        const passwordMatch = await bcrypt.compare(password,found.password);
        if(passwordMatch){
            const data={
                user:{
                    id:found._id,
                    name:found.name,
                    email:found.email,
               
                }
            }
           const token = jwt.sign(data,process.env.secret_key);
          // console.log(token);
           res.json({success:true,token,data});
        }else {
            res.status(401).json({message:'Invalid credential'})
        }
    }catch(error){
        console.log(error);
        res.status(500).json({message:"error", details: error });
    }
})
router.post('/updateProfile',fetchUser, async (req, res) => {
    const userId = req.user.id;
    const file = req.files.file;
    console.log('hey');
    if (!file) {
        return res.status(500).json({ error: 'Error: File is missing' });
    }

    try {
        const result = await cloudinary.uploader.upload(file.tempFilePath);

        let user = await User.findById({_id:userId});

        user.picture = result.secure_url;
        await user.save();

        //console.log('Profile picture updated:', result.secure_url);
        res.status(200).json({ user });
    } catch (err) {
        console.error('Error in updating profile pic:', err);
        res.status(500).json({ error: 'Error in updating profile pic.' });
    }
});
router.get('/getProfile',fetchUser, async (req, res) => {
    const userId = req.user.id;
    try {
        const user = await User.find({ _id: userId });
        res.status(200).json({
            user: user
        });
    } catch (err) {
        console.log(err);
    }
})
router.post('/postcontact', fetchUser, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.user.id });

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const updatedUser = await User.findByIdAndUpdate(req.user.id, {
            $addToSet: {
                list: {
                    name: req.body.name,
                    relation: req.body.relation,
                    phonenumber: req.body.phonenumber,
                }
            }
        }, { new: true });
        console.log('postcontact',updatedUser);
        res.status(200).json({ new_user: updatedUser });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error in updating user.' });
    }
});

router.get('/getcontact', fetchUser,async (req, res) => {
    const userId = req.user.id;
    console.log(userId);
    try {
        const data = await User.find({ _id: userId });
        //console.log(data);
        res.status(200).json({
            data,
        });
    } catch (err) {
        console.log(err);
    }
});
router.post('/addmedicine', fetchUser,async (req, res) => {
    try {
        console.log(req.body);

            const data = await User.findByIdAndUpdate({_id:req.user.id},
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
            const savedUser = await data.save();
            console.log(savedUser);
            res.status(200).json({
                new_user: savedUser,
            });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Error in updating user.',
        });
    }
});
router.get('/getmedicine',fetchUser,async(req,res)=>{
   // console.log('hey');
    const userId= req.user.id;
    try{
        const data = await User.findById({_id:userId});
        res.status(200).json(data);
    }catch(err){
        console.log('error in getmedicine backened',err);
    }
})
router.delete('/deletemedicine/:index/:task',fetchUser, async (req, res) => {
    const userId = req.user.id;
    const index = req.params.index;
    const task = req.params.task;
    console.log('task',task);
    console.log('index',index);
    try {
        const user = await User.findById({ _id: userId });
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
router.put('/updatemedicine',fetchUser, async (req, res) => {
    const userId = req.user.id;
    const index = req.body.index;
    const dateTime = req.body.dateTime;
    


    console.log(dateTime);
    console.log('hey');
    try {
        const user = await User.findOne({ _id: userId });
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
router.post('/addproduct',fetchUser, async (req, res) => {
    const { index } = req.body;
    const userId=req.user.id;
    try {
        const user = await User.findById({_id:userId});

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
router.post('/removeproduct', fetchUser,async (req, res) => {
    const {  index } = req.body;
    const userId=req.user.id;
    console.log('Received index:', index);

    try {
        const user = await User.findById({_id: userId });

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
router.post('/favproduct', fetchUser,async (req, res) => {
    const {  index } = req.body;
    const userId=req.user.id
    console.log('favproduct');
    try {
        const user = await User.findById({ _id:userId });

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
router.post('/nonfavproduct', fetchUser,async (req, res) => {
    const {  index } = req.body;
    const {userId}  = req.user.id
    try {
        const user = await User.findById({ _id:userId });

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
router.get('/getproduct',fetchUser, async (req, res) => {
    const userId = req.user.id;
    //console.log('getproduct');
    try {
        const user = await User.findById({_id: userId });

        if (!user) {
            return res.status(404).send('User not found');
        }
       // console.log(user);
        res.status(200).json(user);
    } catch (err) {
        console.error('Error remove product:', err);
        res.status(500).send('Error remove product');
    }
});
router.delete('/deladdcontact/:index', fetchUser,async (req, res) => {
    try {
        const {index } = req.params;
        const user = await User.findById({_id: req.user.id });
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
router.post('/handlemeeting',fetchUser,async(req,res)=>{
    console.log('hey');
    const {doctorId,date,time} = req.body;
    const userId=req.user.id;
    console.log('doctor');
    try{
        const doctor =await Doctor.findById({_id:doctorId});
        const user =await User.findById({_id:userId});
        if (!doctor) {
            return res.status(404).send('Doctor not found');
        }

        if (!user) {
            return res.status(404).send('User not found');
        }
        doctor.meeting.push({
            patientId:user._id,
            doctorId:doctor._id,
            patientname:user.name,
            doctorname:doctor.name,
            date:date,
            time:time
        })
        user.meeting.push({
            patientId:user._id,
            doctorId:doctor._id,
            patientname:user.name,
            doctorname:doctor.name,
            date:date,
            time:time
        })
        await user.save();
        await doctor.save();
        console.log(doctor);
        console.log(user);
        res.send('meeting will be update successfully',doctor);
    }catch(err){
        console.log('err in handlemeeting',err);
    }
})
router.get('/getmeeting',fetchUser,async(req,res)=>{
    const userId= req.user.id;
    try{
        const user =await User.findById({_id:userId});
        //console.log(user);
        res.send(user);
    }catch(err){
        res.send('error in list meeting backened',err);
    } 
})
router.delete('/deletemeeting/:index/:id',fetchUser,async(req,res)=>{
    const { id, index } = req.params;
    const userId= req.user.id
    console.log("hey");
    try{
        const user = await User.findOne({ _id: userId });
        const doctor = await Doctor.findOne({_id:id})
        if (!user) {
            return res.status(404).send('User not found');
        }
        let updatelist=[];
        for (let i = 0; i < user.meeting.length; i++) {
            if (i != index) { 
                updatelist.push(user.meeting[i]);
            }
        }
        user.meeting=updatelist;
        await user.save();
        let updatedoctor=[];
        for (let i = 0; i < doctor.meeting.length; i++) {
            if (i != index) { 
                updatedoctor.push(doctor.meeting[i]);
            }
        }
        doctor.meeting=updatedoctor;
        await doctor.save();
        res.send(doctor.meeting);
    }catch(err){
        console.log(err);
        res.send(err);
    }
})

module.exports = router;