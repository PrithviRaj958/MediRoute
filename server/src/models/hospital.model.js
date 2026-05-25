const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema(
    {
        name : {
            type:String,
            required:true,
            trim:true
        },

        
        address : {
            type :String,
            required:true,
            trim:true
        },
        contactNumber : {
            type : String,
            required:true,
            trim:true
        },
        totalBeds : {
            type : Number,
            default : 0
        },
        availableBeds : {
            type : Number,
            default : 0
        },
        icuBeds : {
            type: Number,
            default: 0
        },
        bloodSupplyStatus : {
            type: String,
            enum: ['Stable', 'Low', 'Critical'],
            default: 'Stable'
        },
        traumaTeamAvailable : {
            type: Boolean,
            default: true
        },
        location : {
            type : {
                type : String ,
                enum : ["Point"], //enum to specify that the type must be "Point" and only "Point"
                required : true
            },
            coordinates : {
                type : [Number],
                required : true
            }
        }
    },{ timestamps : true  }
);
hospitalSchema.index({ location : "2dsphere" });

module.exports = mongoose.model("Hospital", hospitalSchema);