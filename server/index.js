const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

const equipmentRoutes = require('./routes/equipmentRoutes');
const teamRoutes = require('./routes/teamRoutes');
const requestRoutes = require('./routes/requestRoutes');

app.use('/api/equipment', equipmentRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/requests', requestRoutes);

app.get('/', (req, res) => {
  res.send('GearGuard Server is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
