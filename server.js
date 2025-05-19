// Node.js/Express backend with JWT authentication and MongoDB
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Models
const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
});
const GameSchema = new mongoose.Schema({
  name: String,
  html: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  published: Boolean,
  updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', UserSchema);
const Game = mongoose.model('Game', GameSchema);

const JWT_SECRET = 'supersecretkey'; // Use env var in production

// Auth middleware
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// User registration
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({ username, password: hash });
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: 'Username taken' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET);
  res.json({ token });
});

// Create new game
app.post('/api/games', auth, async (req, res) => {
  const { name, html } = req.body;
  const game = await Game.create({
    name,
    html,
    author: req.user.id,
    published: true,
  });
  res.json(game);
});

// Update game
app.put('/api/games/:id', auth, async (req, res) => {
  const game = await Game.findById(req.params.id);
  if (!game || game.author.toString() !== req.user.id)
    return res.status(403).json({ error: 'Forbidden' });
  game.name = req.body.name || game.name;
  game.html = req.body.html || game.html;
  game.updatedAt = new Date();
  await game.save();
  res.json(game);
});

// Delete game
app.delete('/api/games/:id', auth, async (req, res) => {
  const game = await Game.findById(req.params.id);
  if (!game || game.author.toString() !== req.user.id)
    return res.status(403).json({ error: 'Forbidden' });
  await game.remove();
  res.json({ success: true });
});

// Get all published games
app.get('/api/games', async (req, res) => {
  const games = await Game.find({ published: true }).populate('author', 'username');
  res.json(games);
});

// Get a single game
app.get('/api/games/:id', async (req, res) => {
  const game = await Game.findById(req.params.id).populate('author', 'username');
  res.json(game);
});

// Connect and start
mongoose
  .connect('mongodb://localhost:27017/htmlplayground', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => app.listen(4000, () => console.log('Server started on port 4000')));
