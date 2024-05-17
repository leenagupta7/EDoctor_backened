const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    picture: {
        type: String,
    },
    addmedicine:[{
        text:{
            type:String,
            required:true,
        },
        dateTime:{
            type:String,
            required:true,
        }
    }
    ],
    list: [{
        name: { // Changed from Name to name
            type: String,
            required: true
        },
        relation: { // Changed from Relation to relation
            type: String,
            required: true,
        },
        phonenumber: { // Changed from phoneNumber to phonenumber
            type: String,
            required: true,
        }
    }],
    task: {
        complete: {
            type: Number, // Change to Number type
            default: 0
        },
        remove: {
            type: Number, // Change to Number type
            default: 0
        },
        snooze: {
            type: Number, // Change to Number type
            default: 0
        }
    }
}, {
    timestamps: true,
});

const User = mongoose.model('User', UserSchema);
module.exports = User;
