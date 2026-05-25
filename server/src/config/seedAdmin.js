/**
 * Run this script ONCE to create the initial admin user:
 *   node src/config/seedAdmin.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ role: 'ADMIN' });
    if (existing) {
      console.log('Admin already exists:', existing.email);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Admin@123', salt);

    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@mediroute.com',
      passwordHash,
      role: 'ADMIN'
    });

    console.log('✅ Admin user created successfully!');
    console.log('   Email:   ', admin.email);
    console.log('   Password: Admin@123');
    console.log('   ⚠️  Change the password after first login!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seedAdmin();
