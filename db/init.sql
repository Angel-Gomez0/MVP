-- ============================================
-- 1️⃣ Crear tablas principales
-- ============================================
CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    status INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS game (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS score (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_user INTEGER NOT NULL,
    id_game INTEGER NOT NULL,
    score INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    FOREIGN KEY (id_user) REFERENCES user (id),
    FOREIGN KEY (id_game) REFERENCES game (id)
);

-- ============================================
-- 2️⃣ Crear tablas de auditoría
-- ============================================
CREATE TABLE IF NOT EXISTS user_audit (
    id INTEGER,
    email TEXT,
    password TEXT,
    name TEXT,
    age INTEGER,
    status INTEGER,
    action TEXT,
    action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS game_audit (
    id INTEGER,
    name TEXT,
    description TEXT,
    status INTEGER,
    action TEXT,
    action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS score_audit (
    id INTEGER,
    id_user INTEGER,
    id_game INTEGER,
    score INTEGER,
    status INTEGER,
    action TEXT,
    action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3️⃣ Eliminar triggers antiguos que causan error
-- ============================================
DROP TRIGGER IF EXISTS user_insert;

DROP TRIGGER IF EXISTS user_update;

DROP TRIGGER IF EXISTS user_delete;

DROP TRIGGER IF EXISTS game_insert;

DROP TRIGGER IF EXISTS game_update;

DROP TRIGGER IF EXISTS game_delete;

DROP TRIGGER IF EXISTS score_insert;

DROP TRIGGER IF EXISTS score_update;

DROP TRIGGER IF EXISTS score_delete;

-- ============================================
-- 4️⃣ Crear triggers correctos de auditoría
-- ============================================

-- User
CREATE TRIGGER IF NOT EXISTS user_insert_audit
AFTER INSERT ON user
BEGIN
  INSERT INTO user_audit (id, email, password, name, age, status, action)
  VALUES (NEW.id, NEW.email, NEW.password, NEW.name, NEW.age, NEW.status, 'INSERT');
END;

CREATE TRIGGER IF NOT EXISTS user_update_audit
AFTER UPDATE ON user
BEGIN
  INSERT INTO user_audit (id, email, password, name, age, status, action)
  VALUES (NEW.id, NEW.email, NEW.password, NEW.name, NEW.age, NEW.status, 'UPDATE');
END;

CREATE TRIGGER IF NOT EXISTS user_delete_audit
AFTER DELETE ON user
BEGIN
  INSERT INTO user_audit (id, email, password, name, age, status, action)
  VALUES (OLD.id, OLD.email, OLD.password, OLD.name, OLD.age, OLD.status, 'DELETE');
END;

-- Game
CREATE TRIGGER IF NOT EXISTS game_insert_audit
AFTER INSERT ON game
BEGIN
  INSERT INTO game_audit (id, name, description, status, action)
  VALUES (NEW.id, NEW.name, NEW.description, NEW.status, 'INSERT');
END;

CREATE TRIGGER IF NOT EXISTS game_update_audit
AFTER UPDATE ON game
BEGIN
  INSERT INTO game_audit (id, name, description, status, action)
  VALUES (NEW.id, NEW.name, NEW.description, NEW.status, 'UPDATE');
END;

CREATE TRIGGER IF NOT EXISTS game_delete_audit
AFTER DELETE ON game
BEGIN
  INSERT INTO game_audit (id, name, description, status, action)
  VALUES (OLD.id, OLD.name, OLD.description, OLD.status, 'DELETE');
END;

-- Score
CREATE TRIGGER IF NOT EXISTS score_insert_audit
AFTER INSERT ON score
BEGIN
  INSERT INTO score_audit (id, id_user, id_game, score, status, action)
  VALUES (NEW.id, NEW.id_user, NEW.id_game, NEW.score, NEW.status, 'INSERT');
END;

CREATE TRIGGER IF NOT EXISTS score_update_audit
AFTER UPDATE ON score
BEGIN
  INSERT INTO score_audit (id, id_user, id_game, score, status, action)
  VALUES (NEW.id, NEW.id_user, NEW.id_game, NEW.score, NEW.status, 'UPDATE');
END;

CREATE TRIGGER IF NOT EXISTS score_delete_audit
AFTER DELETE ON score
BEGIN
  INSERT INTO score_audit (id, id_user, id_game, score, status, action)
  VALUES (OLD.id, OLD.id_user, OLD.id_game, OLD.score, OLD.status, 'DELETE');
END;

-- ============================================
-- 5️⃣ Insertar juegos iniciales
-- ============================================
INSERT
    OR IGNORE INTO game (id, name, description, status)
VALUES (
        1,
        'Ping Pong',
        'Juego de ping pong simple',
        1
    ),
    (
        2,
        'Space Invaders',
        'Juego estilo Space Invaders',
        1
    );