const token = localStorage.getItem('token');
if(!token){
    alert('No estás autenticado');
    window.location.href='login.html';
}

// ==========================
// Conectar socket.io
// ==========================
const socket = io();

// ==========================
// Mostrar top 10 scores
// ==========================
function showTopScores(id_game){
    const container = document.getElementById('topScores');
    container.innerHTML = '<h3>Top 10 Scores</h3>';

    fetch(`/api/scores/top/${id_game}`,{
        headers:{'Authorization':'Bearer '+token}
    })
    .then(res=>{
        if(!res.ok) throw new Error('Error al obtener scores');
        return res.json();
    })
    .then(scores=>{
        if(!scores.length){
            container.innerHTML += '<p>No hay scores aún</p>';
            return;
        }
        let table = '<table border="1" style="margin:auto"><tr><th>Jugador</th><th>Score</th></tr>';
        scores.forEach(s => table += `<tr><td>${s.username}</td><td>${s.best_score}</td></tr>`);
        table += '</table>';
        container.innerHTML += table;
    })
    .catch(err => console.error(err));
}

// ==========================
// Ping Pong clásico
// ==========================
function startPingPong() {
    const container = document.getElementById('gameContainer');
    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 400;
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let ballX = 250, ballY = 200, ballDX = 3, ballDY = 3;
    let paddleWidth = 80, paddleHeight = 10;
    let playerX = 210, cpuX = 210;
    const keys = { left: false, right: false };
    let score = 0;
    let cpuBaseSpeed = 3;
    let hitCount = 0;
    let gameOver = false; // flag para evitar guardar score varias veces

    function draw() {
        if (gameOver) return; // detener dibujo si terminó el juego

        ctx.fillStyle = '#aaa'; // fondo gris
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.beginPath();
        ctx.arc(ballX, ballY, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'black';
        ctx.fill();
        ctx.closePath();

        ctx.fillStyle = 'blue';
        ctx.fillRect(playerX, canvas.height - paddleHeight - 10, paddleWidth, paddleHeight);
        ctx.fillStyle = 'red';
        ctx.fillRect(cpuX, 10, paddleWidth, paddleHeight);

        ballX += ballDX;
        ballY += ballDY;

        if (ballX < 10 || ballX > canvas.width - 10) ballDX = -ballDX;

        if (ballY > canvas.height - paddleHeight - 20 && ballX > playerX && ballX < playerX + paddleWidth) {
            ballDY = -ballDY;
            score += 10;
            ballDX *= 1.02;
            ballDY *= 1.02;
            hitCount++;
            if (hitCount % 3 === 0) cpuBaseSpeed += 0.5;
        }

        if (ballY < paddleHeight + 20 && ballX > cpuX && ballX < cpuX + paddleWidth) {
            ballDY = -ballDY;
            ballDX *= 1.02;
            ballDY *= 1.02;
        }

        // Condición de fin de juego
        if (!gameOver && (ballY > canvas.height || ballY < 0)) {
            gameOver = true;
            clearInterval(interval);
            saveScore(1, score);
            if (ballY > canvas.height) alert('Perdiste! Score: ' + score);
            else alert('Ganaste contra la CPU! Score: ' + score);
        }

        let cpuCenter = cpuX + paddleWidth / 2;
        if (ballX > cpuCenter) cpuX += Math.min(cpuBaseSpeed, ballX - cpuCenter);
        if (ballX < cpuCenter) cpuX -= Math.min(cpuBaseSpeed, cpuCenter - ballX);
        if (cpuX < 0) cpuX = 0;
        if (cpuX + paddleWidth > canvas.width) cpuX = canvas.width - paddleWidth;

        if (keys.left) playerX -= 5;
        if (keys.right) playerX += 5;
        if (playerX < 0) playerX = 0;
        if (playerX + paddleWidth > canvas.width) playerX = canvas.width - paddleWidth;
    }

    const interval = setInterval(draw, 16);

    document.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft') keys.left = true;
        if (e.key === 'ArrowRight') keys.right = true;
    });
    document.addEventListener('keyup', e => {
        if (e.key === 'ArrowLeft') keys.left = false;
        if (e.key === 'ArrowRight') keys.right = false;
    });

    showTopScores(1);
}

// ==========================
// Ping Pong vs Amigo
// ==========================
function startPingPongVS(){
    const container = document.getElementById('gameContainer');
    container.innerHTML='';
    const canvas = document.createElement('canvas');
    canvas.width=500;
    canvas.height=400;
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let paddleWidth = 80, paddleHeight = 10;
    let paddles = {}; 
    let ball = { x: 250, y: 200, dx: 3, dy: 3 };
    const keys = { left:false, right:false };
    let roomId = prompt("Ingresa un ID de sala para jugar con tu amigo:");
    let userName = prompt("Ingresa tu nombre:");

    socket.emit('joinRoom', { roomId, userName });

    socket.on('roomFull', ()=> alert('La sala ya está llena'));
    socket.on('startGame', players => {
        players.forEach(p => paddles[p.id] = 210);
        draw();
    });

    socket.on('updatePaddle', ({ playerId, position }) => {
        paddles[playerId] = position;
    });

    socket.on('updateBall', (newBall) => {
        ball = newBall;
    });

    socket.on('showWinner', (winnerName) => {
        alert('¡Ganador: ' + winnerName + '!');
    });

    function draw(){
        ctx.fillStyle='#aaa';
        ctx.fillRect(0,0,canvas.width,canvas.height);

        ctx.beginPath();
        ctx.arc(ball.x, ball.y, 10, 0, Math.PI*2);
        ctx.fillStyle='black';
        ctx.fill();
        ctx.closePath();

        let i=0;
        for(const pid in paddles){
            ctx.fillStyle = i===0 ? 'blue' : 'red';
            ctx.fillRect(paddles[pid], i===0 ? canvas.height-paddleHeight-10 : 10, paddleWidth, paddleHeight);
            i++;
        }

        // Movimiento de pelota
        ball.x += ball.dx;
        ball.y += ball.dy;

        if(ball.x<10 || ball.x>canvas.width-10) ball.dx=-ball.dx;

        let playerIds = Object.keys(paddles);
        if(ball.y>canvas.height-paddleHeight-20 && ball.x>paddles[playerIds[0]] && ball.x<paddles[playerIds[0]]+paddleWidth){
            ball.dy=-ball.dy;
            ball.dx*=1.05;
            ball.dy*=1.05;
        }
        if(ball.y<paddleHeight+20 && ball.x>paddles[playerIds[1]] && ball.x<paddles[playerIds[1]]+paddleWidth){
            ball.dy=-ball.dy;
            ball.dx*=1.05;
            ball.dy*=1.05;
        }

        if(ball.y>canvas.height) socket.emit('gameOver',{roomId, winnerId:playerIds[1]});
        if(ball.y<0) socket.emit('gameOver',{roomId, winnerId:playerIds[0]});

        requestAnimationFrame(draw);
        socket.emit('ballUpdate', { roomId, ball });
    }

    document.addEventListener('keydown', e=>{
        if(e.key==='ArrowLeft') keys.left=true;
        if(e.key==='ArrowRight') keys.right=true;
    });
    document.addEventListener('keyup', e=>{
        if(e.key==='ArrowLeft') keys.left=false;
        if(e.key==='ArrowRight') keys.right=false;
    });

    setInterval(()=>{
        const localId = socket.id;
        if(keys.left) paddles[localId]-=5;
        if(keys.right) paddles[localId]+=5;
        if(paddles[localId]<0) paddles[localId]=0;
        if(paddles[localId]+paddleWidth>canvas.width) paddles[localId]=canvas.width-paddleWidth;
        socket.emit('paddleMove',{ roomId, position: paddles[localId] });
    },16);
}

// ==========================
// Space Invaders
// ==========================
function startSpaceInvaders() {
    const container = document.getElementById('gameContainer');
    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 400;
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    // Fondo gris
    ctx.fillStyle = '#aaa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let player = { x: 225, y: 350, width: 50, height: 20 };
    let bullets = [], enemyBullets = [], enemies = [], obstacles = [];
    let score = 0, lastShotTime = 0, lastEnemyShot = Date.now();
    let gameOver = false; // flag para evitar guardar score varias veces

    // Imágenes
    const playerImg = new Image(); playerImg.src = 'img/player.png';
    const enemyImg = new Image(); enemyImg.src = 'img/enemy.png';
    const bulletImg = new Image(); bulletImg.src = 'img/bullet.png';
    const obstacleImg = new Image(); obstacleImg.src = 'img/obstacle.png';

    // Generar enemigos
    function generateEnemies() {
        enemies = [];
        for (let i = 0; i < 5; i++) {
            let x = Math.random() * (canvas.width - 50);
            enemies.push({ x, y: 30, width: 40, height: 20, dx: (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 2) });
        }
    }
    generateEnemies();

    // Obstáculos
    for (let i = 0; i < 4; i++) obstacles.push({ x: 60 + i * 100, y: 250, width: 40, height: 20, life: 3 });

    const keys = { left: false, right: false, up: false };

    function draw() {
        if (gameOver) return; // detener dibujado si terminó el juego

        // Fondo gris
        ctx.fillStyle = '#aaa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Player
        ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

        // Movimiento player
        if (keys.left) player.x -= 5;
        if (keys.right) player.x += 5;
        if (player.x < 0) player.x = 0;
        if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

        // Enemigos
        enemies.forEach(e => {
            e.x += e.dx;
            if (e.x < 0 || e.x + e.width > canvas.width) e.dx *= -1;
            ctx.drawImage(enemyImg, e.x, e.y, e.width, e.height);
        });

        // Obstáculos
        obstacles.forEach(o => ctx.drawImage(obstacleImg, o.x, o.y, o.width, o.height));

        // Balas del jugador
        bullets.forEach((b, bi) => {
            ctx.drawImage(bulletImg, b.x, b.y, 5, 10);
            b.y -= 5;

            // Colisión enemigos
            enemies.forEach((e, ei) => {
                if (b.x < e.x + e.width && b.x + 5 > e.x && b.y < e.y + e.height && b.y + 10 > e.y) {
                    bullets.splice(bi, 1);
                    enemies.splice(ei, 1);
                    score += 100;
                }
            });

            // Colisión obstáculos
            obstacles.forEach((o, oi) => {
                if (b.x < o.x + o.width && b.x + 5 > o.x && b.y < o.y + o.height && b.y + 10 > o.y) {
                    bullets.splice(bi, 1);
                    o.life--;
                    if (o.life <= 0) obstacles.splice(oi, 1);
                }
            });
        });

        // Balas enemigas
        enemyBullets.forEach((b, bi) => {
            ctx.fillStyle = 'purple';
            ctx.fillRect(b.x, b.y, 5, 10);
            b.y += 4 + score / 500;

            // Colisión player
            if (!gameOver && b.x < player.x + player.width && b.x + 5 > player.x && b.y < player.y + player.height && b.y + 10 > player.y) {
                gameOver = true;
                clearInterval(interval);
                saveScore(2, score);
                alert('¡Fuiste alcanzado! Score guardado: ' + score);
            }

            // Colisión obstáculos
            obstacles.forEach((o, oi) => {
                if (b.x < o.x + o.width && b.x + 5 > o.x && b.y < o.y + o.height && b.y + 10 > o.y) {
                    enemyBullets.splice(bi, 1);
                    o.life--;
                    if (o.life <= 0) obstacles.splice(oi, 1);
                }
            });

            if (b.y > canvas.height) enemyBullets.splice(bi, 1);
        });

        if (enemies.length === 0) generateEnemies();

        requestAnimationFrame(draw);
    }

    const interval = setInterval(() => {
        if (gameOver) return; // detener lógica si terminó el juego

        // Disparo jugador
        if (keys.up) {
            const now = Date.now();
            if (now - lastShotTime > 500) {
                bullets.push({ x: player.x + player.width / 2 - 2.5, y: player.y });
                lastShotTime = now;
            }
        }

        // Disparo enemigo
        if (enemies.length > 0 && Date.now() - lastEnemyShot > 2000) {
            const shooter = enemies[Math.floor(Math.random() * enemies.length)];
            enemyBullets.push({ x: shooter.x + shooter.width / 2 - 2.5, y: shooter.y + 10 });
            lastEnemyShot = Date.now();
        }
    }, 30);

    document.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft') keys.left = true;
        if (e.key === 'ArrowRight') keys.right = true;
        if (e.key === 'ArrowUp') keys.up = true;
    });

    document.addEventListener('keyup', e => {
        if (e.key === 'ArrowLeft') keys.left = false;
        if (e.key === 'ArrowRight') keys.right = false;
        if (e.key === 'ArrowUp') keys.up = false;
    });

    draw();
    showTopScores(2);
}



// ==========================
// startGame global
// ==========================
window.startGame=function(game){
    if(game==='pingpong') startPingPong();
    else if(game==='spaceinvaders') startSpaceInvaders();
    else if(game==='pingpongVS') startPingPongVS();
};

// ==========================
// save Score
// ==========================
function saveScore(gameId, score) {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('/api/scores', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ id_game: gameId, score }) 
    })
    .then(res => {
        if (!res.ok) throw new Error('Error guardando el score');
        return res.json();
    })
    .then(data => {
        console.log('Score guardado:', data);
        showTopScores(gameId); // actualizar tabla de top scores
    })
    .catch(err => console.error(err));
}
