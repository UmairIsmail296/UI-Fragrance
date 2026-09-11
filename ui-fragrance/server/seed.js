const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const Perfume = require('./models/Perfume');
const Admin = require('./models/Admin');
const Counter = require('./models/Counter');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding...');

    // --- Seed Admin ---
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const existingAdmin = await Admin.findOne({ username: adminUsername });

    if (existingAdmin) {
      existingAdmin.password = hashedPassword;
      await existingAdmin.save();
      console.log('Admin credentials synchronized from environment');
    } else {
      await Admin.create({
        username: adminUsername,
        password: hashedPassword,
      });
      console.log('Admin created from environment');
    }

    // --- Seed Default Perfume ---
    const existingPerfume = await Perfume.findOne({ name: 'Velvet Oud Royale' });

    if (!existingPerfume) {
      await Perfume.create({
        name: 'Velvet Oud Royale',
        brand: 'UI Fragrance Exclusive',
        actualPrice: 8000, // FIXED: was price: 'Rs. 4,500' — now real Numbers
        discountPrice: 4500,
        size: '100ml',
        description:
          'A majestic blend of rich oud, warm amber, and delicate rose petals. Velvet Oud Royale is the epitome of luxury — designed for those who command attention without saying a word.',
        topNotes: 'Bergamot, Saffron',
        middleNotes: 'Rose, Oud Wood',
        baseNotes: 'Amber, Musk, Sandalwood',
        photos: [
          'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80',
        ],
        videos: [],
      });
      console.log('Default perfume "Velvet Oud Royale" created');
    } else {
      console.log('Default perfume already exists, skipping...');
    }

    // --- Seed Order Counter ---
    const existingCounter = await Counter.findById('orderId');
    if (!existingCounter) {
      await Counter.create({ _id: 'orderId', seq: 1000 });
      console.log('Order ID counter initialized at UIF-1000');
    }

    console.log('Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error.message);
    process.exit(1);
  }
};

seedData();