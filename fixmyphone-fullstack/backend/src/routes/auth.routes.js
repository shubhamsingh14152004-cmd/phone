const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Demo credential, read from env. For real production use, replace this with
// a users table where each admin has their own hashed password.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@fixmyphone.com';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Sagar@123', 10);

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password || email !== ADMIN_EMAIL || !bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  const token = jwt.sign({ email }, process.env.JWT_SECRET || 'dev-secret-change-me', { expiresIn: '12h' });
  res.json({ token, email });
});

module.exports = router;
