require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize, User, RoomChat, Pesan, Peta, History } = require('./db');

const app = express();
app.use(express.json());

// Secret Key untuk JWT
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

// Middleware untuk autentikasi
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(403).json({ message: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Unauthorized' });
    req.user = decoded;
    next();
  });
};

// ------------------- ROUTES -------------------

// Register User
app.post('/register', async (req, res) => {
  try {
    const { name, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, password: hashedPassword, role });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login User
app.post('/login', async (req, res) => {
  try {
    const { name, password } = req.body;
    const user = await User.findOne({ where: { name } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CRUD for RoomChat
app.post('/room_chat', authenticate, async (req, res) => {
  try {
    const roomChat = await RoomChat.create(req.body);
    res.status(201).json(roomChat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/room_chat', authenticate, async (req, res) => {
  try {
    const roomChats = await RoomChat.findAll();
    res.json(roomChats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/room_chat/:id', authenticate, async (req, res) => {
  try {
    const roomChat = await RoomChat.findByPk(req.params.id);
    if (!roomChat) return res.status(404).json({ message: 'RoomChat not found' });

    await roomChat.update(req.body);
    res.json(roomChat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/room_chat/:id', authenticate, async (req, res) => {
  try {
    const roomChat = await RoomChat.findByPk(req.params.id);
    if (!roomChat) return res.status(404).json({ message: 'RoomChat not found' });

    await roomChat.destroy();
    res.json({ message: 'RoomChat deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ------------------- SERVER START -------------------

sequelize
  .authenticate()
  .then(() => {
    console.log('Database connected...');
    return sequelize.sync({ force: true }); // Ganti `force` ke `false` jika tidak ingin mereset data setiap kali
  })
  .then(() => {
    console.log('Database synced.');
    app.listen(3000, () => console.log('Server running on port 3000'));
  })
  .catch((err) => console.error('Database error:', err));
