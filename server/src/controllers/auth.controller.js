const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login =async (req,res) => {
  try {
    const {email, password} = req.body;
    if(!email || ! password){
      return res.status(400).json({message: "Email and password are required"});
    }
    const user = await User.findOne({email});
    if(!user){
      return res.status(400).json({message: "Invalid credentials"});
    } 
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if(!isMatch){
      return res.status(400).json({message: "Invalid credentials"});
    } 
    const token =jwt.sign(
      {userId: user._id, role:user.role},
      process.env.JWT_SECRET,
      {expiresIn: "1h"}
    )
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  }catch (error) {
    res.status(500).json({message: error.message});
  }
};