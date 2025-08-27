const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db/database');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// GET all users (solo activos)
router.get('/', authMiddleware, (req, res) => {
  db.all(`SELECT id, email, name, age, status FROM user WHERE status = 1`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET user by ID
router.get('/:id', authMiddleware, (req, res) => {
  db.get(`SELECT id, email, name, age, status FROM user WHERE id = ? AND status = 1`, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(row);
  });
});

// UPDATE user
router.put('/:id', authMiddleware, async (req, res) => {
  const { name, age, password } = req.body;
  let query = `UPDATE user SET name = ?, age = ?`;
  const params = [name, age];

  if (password) {
    const hashed = await bcrypt.hash(password, 10);
    query += `, password = ?`;
    params.push(hashed);
  }
  query += ` WHERE id = ? AND status = 1`;
  params.push(req.params.id);

  db.run(query, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});

// DELETE (logical)
router.delete('/:id', authMiddleware, (req, res) => {
  db.run(`UPDATE user SET status = 0 WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

module.exports = router;
