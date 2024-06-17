const express = require('express');
const router = express.Router();
const Doctor = require('../Modal/Doctor');

router.post('/adddoctor', async (req, res) => {
    const file = req.files?.file ?? null;
    if (!file) {
        return res.status(500).json({ error: 'Error file is null' });
    }
    cloudinary.uploader.upload(file.tempFilePath, async (err, result) => {
        if (err) {
            console.error('Error uploading to Cloudinary:', err);
            return res.status(500).json({ error: 'Error uploading to Cloudinary' });
        }
        const newDoctor = new Doctor({
            name: req.body.name,
            specialization: req.body.specialization,
            college_name: req.body.college,
            experience: req.body.experience,
            image: result.secure_url,
        });
        newDoctor.save()
            .then(result => {
                console.log({ "your Doctor is saved": result });
                res.status(200).json({
                    new_product: result,
                });
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({
                    error: 'Error saving doctor to the database.',
                });
            });
    });
});
router.get('/listdoctor',async (req,res)=>{
    try{
      const allDoctor = await Doctor.find();
      res.status(200).json(allDoctor);
    }catch(error){
      console.log(error);
      res.status(500).json({error:'Error in fetching Doctor from the database.'})
    }
})

module.exports = router;