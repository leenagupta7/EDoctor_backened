const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    password:{
        type:String,
        required:true,
    },
    picture: {
        type: String,
    },
    addmedicine: [{
        text: {
            type: String,
            required: true,
        },
        dateTime: {
            type: String,
            required: true,
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
    },
    cart: {
        type: [Number],
        default: () => new Array(61).fill(0) // Initialize cart with zeros
    },
    favourite: {
        type: [Boolean],
        default: () => new Array(61).fill(false) // Initialize favourite with false
    },
    meeting: [
        {patientId:{
            type:String,
            default:"",
        },
            doctorId: {
                type: String,
                default: "",
            },
            patientname: {
                type: String,
                default: '',
            },
            doctorname: {
                type: String,
                default: '',
            },
            date: {
                type: Date,
                default: '',
            },
            time: {
                type: String,
                default: '',
            }
        }
    ],

}, {
    timestamps: true,
});

const User = mongoose.model('User', UserSchema);
module.exports = User;
