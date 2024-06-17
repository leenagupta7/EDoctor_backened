const express = require('express');
const router = express.Router();
const User = require('../Modal/UserModal');
const Doctor = require('../Modal/Doctor');


router.post('/updateProfile', async (req, res) => {
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
                name:req.body.name,
                list: [],
                addmedicine: [],
            });
        }

        user.picture = result.secure_url;
        await user.save();

        console.log('Profile picture updated:', result.secure_url);
        res.status(200).json({ user });
    } catch (err) {
        console.error('Error in updating profile pic:', err);
        res.status(500).json({ error: 'Error in updating profile pic.' });
    }
});
router.get('/getProfile/:id/:name', async (req, res) => {
    const userId = req.params.id;
    const name=req.params.name;
    //console.log(userId);
    try {
        const user = await User.find({ userId: userId });
        user.name=name;
        //console.log(user);
        res.status(200).json({
            user: user
        });
    } catch (err) {
        console.log(err);
    }
})
router.post('/postcontact', async (req, res) => {
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
router.get('/getcontact/:id', async (req, res) => {
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
router.post('/addmedicine', async (req, res) => {
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
router.get('/getmedicine/:id',async(req,res)=>{
   // console.log('hey');
    const userId= req.params.id;
    try{
        const data = await User.findOne({userId:userId});
        res.status(200).json(data);
    }catch(err){
        console.log('error in getmedicine backened',err);
    }
})
router.delete('/deletemedicine/:id/:index/:task', async (req, res) => {
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
router.put('/updatemedicine/:id', async (req, res) => {
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
router.post('/addproduct', async (req, res) => {
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
router.post('/removeproduct', async (req, res) => {
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
router.post('/favproduct', async (req, res) => {
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
router.post('/nonfavproduct', async (req, res) => {
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
router.get('/getproduct/:id', async (req, res) => {
    const userId = req.params.id;
    console.log('getproduct');
    try {
        const user = await User.findOne({ userId });

        if (!user) {
            return res.status(404).send('User not found');
        }
        console.log(user);
        res.status(200).json(user);
    } catch (err) {
        console.error('Error remove product:', err);
        res.status(500).send('Error remove product');
    }
});
router.delete('/deladdcontact/:id/:index', async (req, res) => {
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
router.post('/handlemeeting',async(req,res)=>{
    const {doctorId,userId,date,time} = req.body;
    try{
        const doctor =await Doctor.findOne({_id:doctorId});
        const user =await User.findOne({userId:userId});
        if (!doctor) {
            return res.status(404).send('Doctor not found');
        }

        if (!user) {
            return res.status(404).send('User not found');
        }
        doctor.meeting.push({
            doctorId:doctor._id,
            patientname:user.name,
            doctorname:doctor.name,
            date:date,
            time:time
        })
        user.meeting.push({
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
router.get('/getmeeting/:id',async(req,res)=>{
    const userId= req.params.id;
    try{
        const user =await User.findOne({userId:userId});
        console.log(user);
        res.send(user);
    }catch(err){
        res.send('error in list meeting backened',err);
    } 
})
router.delete('/deletemeeting/:index/:id/:userId',async(req,res)=>{
    const { id, index,userId } = req.params;
    console.log("hey");
    try{
        const user = await User.findOne({ userId: userId });
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