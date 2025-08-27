const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
require('dotenv').config();

const router = express.Router();

// registro
router.post('/register', async (req, res) => {
  const { email, password, name, age } = req.body;

  // VALIDACIONES
  if (!email || !password || !name || !age) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  if (!Number.isInteger(age) || age < 1 || age > 120) {
    return res.status(400).json({ error: 'Edad inválida' });
  }

  // Hashear contraseña
  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    `INSERT INTO user (email, password, name, age, status) VALUES (?, ?, ?, ?, 1)`,
    [email, hashedPassword, name, age],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ id: this.lastID, email, name, age });
    }
  );
});

// login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // VALIDACIONES
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  db.get(`SELECT * FROM user WHERE email = ? AND status = 1`, [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ token });
  });
});

module.exports = router;
