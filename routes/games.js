const express = require('express');
const db = require('../db/database');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// GET all games
router.get('/', authMiddleware, (req, res) => {
  db.all(`SELECT * FROM game WHERE status = 1`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET game by ID
router.get('/:id', authMiddleware, (req, res) => {
  db.get(`SELECT * FROM game WHERE id = ? AND status = 1`, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Juego no encontrado' });
    res.json(row);
  });
});

// CREATE game
router.post('/', authMiddleware, (req, res) => {
  const { name, description } = req.body;
  db.run(`INSERT INTO game (name, description, status) VALUES (?, ?, 1)`, [name, description], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, name, description });
  });
});

// UPDATE game
router.put('/:id', authMiddleware, (req, res) => {
  const { name, description } = req.body;
  db.run(`UPDATE game SET name = ?, description = ? WHERE id = ? AND status = 1`, [name, description, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});

// DELETE (logical)
router.delete('/:id', authMiddleware, (req, res) => {
  db.run(`UPDATE game SET status = 0 WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

module.exports = router;
