const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config(); // ✅ Load env variables
const app = express();

// Security
app.use(helmet());

// ✅ Dynamic CORS using env
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

app.use(express.json());
app.use(morgan('dev'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected!');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Health check endpoint
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ====== ROUTES ======
const authRoutes = require('./routes/auth');
const depositRoutes = require('./routes/deposit');
const withdrawalRoutes = require('./routes/withdrawal');
const userRoutes = require('./routes/user');

app.use('/api/auth', authRoutes);
app.use('/api/withdrawal', withdrawalRoutes);
app.use('/api/deposit', depositRoutes);
app.use('/api/user', userRoutes);

// ====== ERROR HANDLING ======
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

module.exports = app;
