const Hospital = require('../models/hospital.model');


exports.createHospital = async(req , res) => {
    try {
        const {name, address, contactNumber, totalBeds, location } = req.body;
        if(!name || !address || !contactNumber || !location || !totalBeds){
            return res.status(400).json({message : "All fields are required"});
        }

        const existingHospital = await Hospital.findOne({name,
            "location.coordinates" : location
        });
        if(existingHospital){
            return res.status(400).json({message : "Hospital with this name already exists"});
        }

        const hospital = await Hospital.create({
            name,
            address,
            contactNumber,
            totalBeds,
            availableBeds : totalBeds,
            location : {
                type : "Point",
                coordinates : location
            }
        });
        res.status(201).json({
            message : "Hospital created successfully",
            hospital : hospital
        });
    }catch(error){
        res.status(500).json({message :error.message});
    }
};

exports.updateBeds = async(req, res) =>{
    try {
        console.log("User object from token:", req.user);
        const id = req.user.hospitalId || req.user.id;
        if (!id) {
            return res.status(400).json({ message: "No Hospital ID found in token" });
        }
        const availableBeds = req.body.availableBeds ;
        const action = req.body.action;
        if( availableBeds <= 0){
            return res.status(400).json({message : "Quantity must be greater than zero"});
        }
        const hospital = await Hospital.findById(id);
        if(!hospital){
            return res.status(404).json({message : "Hospital not found"});
        }
        if(action === "increment"){
            if(hospital.availableBeds + availableBeds > hospital.totalBeds){
                return res.status(400).json({message : "Available beds cannot exceed total beds"});
            }
            hospital.availableBeds += availableBeds ;
        }else if(action === "decrement"){
            if(hospital.availableBeds - availableBeds < 0){
                return res.status(400).json({message : "Not enough beds available"});
            }
            hospital.availableBeds -= availableBeds ;
        }
        await hospital.save();
        res.status(200).json({
            message : "Beds updated successfully",
            hospital : hospital
        });

    }catch(error){
        res.status(500).json({message :error.message});
    }
};

exports.getHospitals = async(req, res) => {
    try {
        const {lng, lat } = req.query;
        if(!lng || !lat){
            return res.status(400).json({message : "Longitude and latitude are required"});
        }
        const hospitals = await Hospital.find({
            location : {
                $near :{
                    $geometry :{
                        type : "Point",
                        coordinates :[parseFloat(lng), parseFloat(lat)]
                    },
                }
            },availableBeds : {$gt : 0}
        });
        res.status(200).json({
            message : "Hospitals retrieved successfully",
            hospitals :hospitals
        });
    }catch(error){
        res.status(500).json({message :error.message});
    }
}

exports.getMyHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.user.hospitalId);
    if (!hospital) return res.status(404).json({ message: "Hospital not found" });
    res.status(200).json(hospital);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};