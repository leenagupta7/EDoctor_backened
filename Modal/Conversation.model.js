const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants:[{
            type:String,
            require:true,
        }
    ],
    messages:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'Message',
            default:[],
        }
    ],
}, {
    timestamps: true,
});

const Conversation = mongoose.model('Conversation', conversationSchema);
module.exports = Conversation;
