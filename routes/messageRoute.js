const express = require('express');
const router = express.Router();
const fetchUser = require('../middleware/middleware')
const Message=require('../Modal/ChatModal')
const Conversation=require('../Modal/Conversation.model');
const { getReceiverSocketId } = require('../Socket');
const {io} = require('../Socket')


router.post('/send/:id', fetchUser, async (req, res) => {
    try {
        const { message } = req.body;
        const { id: receiverId } = req.params; // Use camelCase
        const senderId = req.user.id;

        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
            });
        }

        const newMessage = new Message({
            senderId,
            receiverId, // Use camelCase to match schema
            message,
        });

        conversation.messages.push(newMessage);

        await Promise.all([conversation.save(), newMessage.save()]);
        const recieverSocketId=getReceiverSocketId(receiverId);
        if(recieverSocketId){
            io.to(recieverSocketId).emit('newMessage',newMessage);
        }
        console.log(conversation);
        res.status(201).json(newMessage);
    } catch (err) {
        console.error('Error in message routes:', err); // Use console.error for logging errors
        res.status(500).json({ error: 'An error occurred while sending the message', details: err.message });
    }
});

router.get('/:id',fetchUser,async(req,res)=>{
    try{
        const {id:recieverId} = req.params;
        const senderId=req.user.id;
        const conversation = await Conversation.findOne({
            participants:{$all:[senderId,recieverId]}
        }).populate("messages")
        if(!conversation)return res.status(200).json([]);
        const messages = conversation.messages;
        console.log("messages",messages);
        res.status(201).json(messages);
    }catch(err){
        console.log('error in get message routes')
        res.status(500).json('error',err);
    }
})


module.exports = router;