const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
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
const userRoutes = require('./routes/user');           // <--- add this line

app.use('/api/auth', authRoutes);
app.use('/api/withdrawal', withdrawalRoutes);
app.use('/api/deposit', depositRoutes);
app.use('/api/user', userRoutes);                      // <--- and this line

// ====== ERROR HANDLING ======
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

module.exports = app;