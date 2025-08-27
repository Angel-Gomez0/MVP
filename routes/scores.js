const express = require('express');
const db = require('../db/database');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// =======================================
// GET top 10 scores por juego (orden importante)
// =======================================
router.get('/top/:id_game', authMiddleware, (req, res) => {
  const id_game = req.params.id_game;
  db.all(
    `SELECT u.name AS username, MAX(s.score) AS best_score
     FROM score s
     JOIN user u ON s.id_user = u.id
     WHERE s.id_game = ? AND s.status = 1
     GROUP BY s.id_user
     ORDER BY best_score DESC
     LIMIT 10`,
    [id_game],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// =======================================
// POST nuevo score
// =======================================
router.post('/', authMiddleware, (req, res) => {
  const { id_game, score } = req.body;
  const id_user = req.user.id; // tomado del token

  if (!id_game || score == null) {
    return res.status(400).json({ error: 'Faltan parámetros: id_game o score' });
  }

  db.run(
    `INSERT INTO score (id_user, id_game, score, status) VALUES (?, ?, ?, 1)`,
    [id_user, id_game, score],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, id_user, id_game, score });
    }
  );
});

module.exports = router;
