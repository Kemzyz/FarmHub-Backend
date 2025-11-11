const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

// import your DB connection
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(express.json());

// Route imports
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const commentRoutes = require('./routes/commentRoutes');
const authRoutes = require('./routes/authRoutes');
const farmerRoutes = require('./routes/farmerRoutes');


// Use routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/farmers', farmerRoutes);
app.use(express.json());


// serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Default route
app.get('/', (req, res) => {
  res.send('Welcome to FarmHub API');
});

// Start server
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
