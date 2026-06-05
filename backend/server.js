require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const claimRoutes = require('./src/routes/claimRoutes');

// Establish Database Connection
connectDB();

const app = express();

// Standard Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/claims', claimRoutes);

// Health Check Route
app.get('/', (req, res) => {
  res.send('Plum Adjudication API is running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});