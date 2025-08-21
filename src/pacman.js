(function () {
    if (window.pacmanGame) {
        window.pacmanGame.remove();
        window.pacmanGame = null;
        document.removeEventListener('mousemove', window.pacmanMove);
        cancelAnimationFrame(window.pacmanFrame);
        if (window.pacmanUI) window.pacmanUI.forEach(el => el.remove());
        if (window.pacmanDots) window.pacmanDots.forEach(el => el.remove());
        if (window.pacmanGhosts) window.pacmanGhosts.forEach(el => el.remove());
        return;
    }

    var pacman = document.createElement('img');
    pacman.src = 'https://raw.githubusercontent.com/Naimy441/other_projects/refs/heads/main/pacman.gif';
    pacman.style.cssText = 'position:fixed;width:40px;height:40px;pointer-events:none;z-index:999999;transition:none;transform-origin:50% 50%;';

    var gridSize = 60;
    var pacmanGridX = 5, pacmanGridY = 5;
    var pacmanX = 300, pacmanY = 300;
    var mouseX = 300, mouseY = 300;
    var score = 0, dots = [], ghosts = [], gameOver = false, lastAngle = 0;
    var scoreDisplay, instructions, restartBtn;

    document.body.appendChild(pacman);
    window.pacmanGame = pacman;
    window.pacmanUI = [];
    window.pacmanDots = [];
    window.pacmanGhosts = [];

    function createGhost(src, startX, startY, behavior, color) {
        var ghost = document.createElement('div');
        ghost.style.cssText = 'position:fixed;width:40px;height:40px;pointer-events:none;z-index:999998;transition:none;display:flex;align-items:center;justify-content:center;';
        ghost.gridX = startX;
        ghost.gridY = startY;
        ghost.x = startX * gridSize + gridSize / 2;
        ghost.y = startY * gridSize + gridSize / 2;
        ghost.targetX = startX;
        ghost.targetY = startY;
        ghost.behavior = behavior;
        ghost.moveTimer = 0;
        ghost.style.left = (ghost.x - 20) + 'px';
        ghost.style.top = (ghost.y - 20) + 'px';

        var img = document.createElement('img');
        img.src = src;
        img.style.cssText = 'width:100%;height:100%;';
        img.onload = function () { ghost.innerHTML = ''; ghost.appendChild(img); };
        img.onerror = function () {
            ghost.innerHTML = color === 'red' ? '🔴' : (color === 'pink' ? '🩷' : '🔵');
            ghost.style.fontSize = '30px';
        };
        ghost.innerHTML = color === 'red' ? '🔴' : (color === 'pink' ? '🩷' : '🔵');
        ghost.style.fontSize = '30px';

        document.body.appendChild(ghost);
        ghosts.push(ghost);
        window.pacmanGhosts.push(ghost);
        setTimeout(function () { ghost.appendChild(img); }, 100);
        return ghost;
    }

    function createDots() {
        var rows = Math.floor(window.innerHeight / gridSize);
        var cols = Math.floor(window.innerWidth / gridSize);
        var totalCells = rows * cols;
        var dotPositions = [];

        for (var i = 0; i < rows; i++) {
            for (var j = 0; j < cols; j++) {
                if (Math.abs(j - 5) > 2 || Math.abs(i - 5) > 2) {
                    dotPositions.push({ x: j, y: i });
                }
            }
        }

        for (var i = dotPositions.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = dotPositions[i];
            dotPositions[i] = dotPositions[j];
            dotPositions[j] = temp;
        }

        var dotsToCreate = Math.min(100, dotPositions.length);
        for (var i = 0; i < dotsToCreate; i++) {
            var pos = dotPositions[i];
            var dot = document.createElement('div');
            dot.style.cssText = 'position:fixed;width:10px;height:10px;background:#ffff00;border-radius:50%;pointer-events:none;z-index:999997;box-shadow:0 0 10px #ffff00;';
            dot.style.left = (pos.x * gridSize + gridSize / 2 - 5) + 'px';
            dot.style.top = (pos.y * gridSize + gridSize / 2 - 5) + 'px';
            dot.gridX = pos.x;
            dot.gridY = pos.y;
            dots.push(dot);
            window.pacmanDots.push(dot);
            document.body.appendChild(dot);
        }
    }

    function checkCollisions() {
        if (gameOver) return;

        dots.forEach(function (dot, index) {
            if (!dot.parentNode) return;
            if (dot.gridX === pacmanGridX && dot.gridY === pacmanGridY) {
                dot.remove();
                dots.splice(index, 1);
                score++;
                scoreDisplay.textContent = 'Score: ' + score + '/100';
                if (dots.length === 0) {
                    gameOver = true;
                    setTimeout(function () {
                        alert('🏆 You won! Final Score: ' + score + '/100 🏆');
                    }, 100);
                }
            }
        });

        ghosts.forEach(function (ghost) {
            if (Math.abs(ghost.gridX - pacmanGridX) <= 0 && Math.abs(ghost.gridY - pacmanGridY) <= 0) {
                if (!gameOver) {
                    gameOver = true;
                    setTimeout(function () {
                        alert('👻 Game Over! Final Score: ' + score + '/100 👻');
                    }, 100);
                }
            }
        });
    }

    function getTargetGrid() {
        var mouseGridX = Math.round((mouseX - gridSize / 2) / gridSize);
        var mouseGridY = Math.round((mouseY - gridSize / 2) / gridSize);
        var maxCols = Math.floor(window.innerWidth / gridSize);
        var maxRows = Math.floor(window.innerHeight / gridSize);

        mouseGridX = Math.max(0, Math.min(mouseGridX, maxCols - 1));
        mouseGridY = Math.max(0, Math.min(mouseGridY, maxRows - 1));

        var dx = mouseGridX - pacmanGridX;
        var dy = mouseGridY - pacmanGridY;
        var targetX = pacmanGridX;
        var targetY = pacmanGridY;

        if (Math.abs(dx) > Math.abs(dy)) {
            targetX = pacmanGridX + (dx > 0 ? 1 : -1);
        } else if (Math.abs(dy) > 0) {
            targetY = pacmanGridY + (dy > 0 ? 1 : -1);
        }

        targetX = Math.max(0, Math.min(targetX, maxCols - 1));
        targetY = Math.max(0, Math.min(targetY, maxRows - 1));

        return { x: targetX, y: targetY };
    }

    function updateGhosts() {
        ghosts.forEach(function (ghost) {
            ghost.moveTimer++;
            var moveDelay = ghost.behavior === 'chase' ? 25 : (ghost.behavior === 'vertical' ? 20 : 35);

            if (ghost.moveTimer >= moveDelay) {
                ghost.moveTimer = 0;
                var maxCols = Math.floor(window.innerWidth / gridSize);
                var maxRows = Math.floor(window.innerHeight / gridSize);
                var possibleMoves = [];

                if (ghost.gridX > 0) possibleMoves.push({ x: ghost.gridX - 1, y: ghost.gridY, dir: 'left' });
                if (ghost.gridX < maxCols - 1) possibleMoves.push({ x: ghost.gridX + 1, y: ghost.gridY, dir: 'right' });
                if (ghost.gridY > 0) possibleMoves.push({ x: ghost.gridX, y: ghost.gridY - 1, dir: 'up' });
                if (ghost.gridY < maxRows - 1) possibleMoves.push({ x: ghost.gridX, y: ghost.gridY + 1, dir: 'down' });

                if (ghost.behavior === 'chase') {
                    var bestMove = possibleMoves[0];
                    var bestDistance = 999;
                    possibleMoves.forEach(function (move) {
                        var dist = Math.abs(move.x - pacmanGridX) + Math.abs(move.y - pacmanGridY);
                        if (dist < bestDistance) {
                            bestDistance = dist;
                            bestMove = move;
                        }
                    });
                    if (bestMove) {
                        ghost.targetX = bestMove.x;
                        ghost.targetY = bestMove.y;
                    }
                } else if (ghost.behavior === 'vertical') {
                    var verticalMoves = possibleMoves.filter(function (move) {
                        return move.dir === 'up' || move.dir === 'down';
                    });
                    var horizontalMoves = possibleMoves.filter(function (move) {
                        return move.dir === 'left' || move.dir === 'right';
                    });
                    var chosenMoves = verticalMoves.length > 0 && Math.random() < 0.8 ? verticalMoves : horizontalMoves;

                    if (chosenMoves.length > 0) {
                        var bestMove = chosenMoves[0];
                        var bestDistance = 999;
                        chosenMoves.forEach(function (move) {
                            var dist = Math.abs(move.x - pacmanGridX) + Math.abs(move.y - pacmanGridY);
                            if (dist < bestDistance) {
                                bestDistance = dist;
                                bestMove = move;
                            }
                        });
                        ghost.targetX = bestMove.x;
                        ghost.targetY = bestMove.y;
                    }
                } else if (ghost.behavior === 'ambush') {
                    var pacmanFutureX = pacmanGridX;
                    var pacmanFutureY = pacmanGridY;
                    if (Math.abs(mouseX - pacmanX) > 5) pacmanFutureX += mouseX > pacmanX ? 3 : -3;
                    if (Math.abs(mouseY - pacmanY) > 5) pacmanFutureY += mouseY > pacmanY ? 3 : -3;
                    pacmanFutureX = Math.max(0, Math.min(pacmanFutureX, maxCols - 1));
                    pacmanFutureY = Math.max(0, Math.min(pacmanFutureY, maxRows - 1));

                    var bestMove = possibleMoves[0];
                    var bestDistance = 999;
                    possibleMoves.forEach(function (move) {
                        var dist = Math.abs(move.x - pacmanFutureX) + Math.abs(move.y - pacmanFutureY);
                        if (dist < bestDistance) {
                            bestDistance = dist;
                            bestMove = move;
                        }
                    });
                    if (bestMove) {
                        ghost.targetX = bestMove.x;
                        ghost.targetY = bestMove.y;
                    }
                }
            }

            var targetPixelX = ghost.targetX * gridSize + gridSize / 2;
            var targetPixelY = ghost.targetY * gridSize + gridSize / 2;
            var dx = targetPixelX - ghost.x;
            var dy = targetPixelY - ghost.y;
            var distance = Math.sqrt(dx * dx + dy * dy);
            var speed = ghost.behavior === 'vertical' ? 0.1 : (ghost.behavior === 'ambush' ? 0.06 : 0.08);

            if (distance > 3) {
                ghost.x += dx * speed;
                ghost.y += dy * speed;
            } else {
                ghost.gridX = ghost.targetX;
                ghost.gridY = ghost.targetY;
                ghost.x = targetPixelX;
                ghost.y = targetPixelY;
            }

            ghost.style.left = (ghost.x - 20) + 'px';
            ghost.style.top = (ghost.y - 20) + 'px';
        });
    }

    function updatePacman() {
        if (gameOver) return;

        var target = getTargetGrid();
        var targetPixelX = target.x * gridSize + gridSize / 2;
        var targetPixelY = target.y * gridSize + gridSize / 2;
        var dx = targetPixelX - pacmanX;
        var dy = targetPixelY - pacmanY;
        var distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {
            pacmanX += dx * 0.12;
            pacmanY += dy * 0.12;

            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                var angle = Math.atan2(dy, dx) * 180 / Math.PI;
                var angleDiff = angle - lastAngle;
                if (angleDiff > 180) angleDiff -= 360;
                if (angleDiff < -180) angleDiff += 360;
                lastAngle += angleDiff * 0.2;
                pacman.style.transform = 'rotate(' + lastAngle + 'deg)';
            }
        } else {
            pacmanGridX = target.x;
            pacmanGridY = target.y;
            pacmanX = targetPixelX;
            pacmanY = targetPixelY;
        }

        pacman.style.left = (pacmanX - 20) + 'px';
        pacman.style.top = (pacmanY - 20) + 'px';

        checkCollisions();
        updateGhosts();
        window.pacmanFrame = requestAnimationFrame(updatePacman);
    }

    function restartGame() {
        score = 0;
        gameOver = false;
        pacmanGridX = 5;
        pacmanGridY = 5;
        pacmanX = 300;
        pacmanY = 300;
        lastAngle = 0;

        dots.forEach(function (dot) { if (dot.parentNode) dot.remove(); });
        ghosts.forEach(function (ghost) { if (ghost.parentNode) ghost.remove(); });
        dots = [];
        ghosts = [];
        window.pacmanDots = [];
        window.pacmanGhosts = [];

        pacman.style.left = (pacmanX - 20) + 'px';
        pacman.style.top = (pacmanY - 20) + 'px';
        pacman.style.transform = 'rotate(0deg)';

        scoreDisplay.textContent = 'Score: 0/100';

        createDots();
        var maxCols = Math.floor(window.innerWidth / gridSize);
        var maxRows = Math.floor(window.innerHeight / gridSize);
        createGhost('https://raw.githubusercontent.com/Naimy441/other_projects/refs/heads/main/redghost.gif', 2, 2, 'chase', 'red');
        createGhost('https://raw.githubusercontent.com/Naimy441/other_projects/refs/heads/main/pinkghost.gif', maxCols - 3, 2, 'ambush', 'pink');
        createGhost('https://raw.githubusercontent.com/Naimy441/other_projects/refs/heads/main/blueghost.gif', Math.floor(maxCols / 2), maxRows - 3, 'vertical', 'blue');

        cancelAnimationFrame(window.pacmanFrame);
        updatePacman();
    }

    window.pacmanMove = function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    };

    scoreDisplay = document.createElement('div');
    scoreDisplay.textContent = 'Score: 0/100';
    scoreDisplay.style.cssText = 'position:fixed;top:20px;right:20px;background:rgba(0,0,0,0.9);color:#ffff00;padding:12px 18px;border-radius:12px;font-family:Arial,sans-serif;font-weight:bold;font-size:20px;z-index:1000000;border:2px solid #ffff00;';
    document.body.appendChild(scoreDisplay);
    window.pacmanUI.push(scoreDisplay);

    restartBtn = document.createElement('button');
    restartBtn.textContent = '🔄 Restart';
    restartBtn.style.cssText = 'position:fixed;top:20px;right:180px;background:linear-gradient(45deg,#ff6b35,#f7931e);color:white;padding:12px 18px;border:none;border-radius:12px;font-family:Arial,sans-serif;font-weight:bold;font-size:16px;z-index:1000000;cursor:pointer;border:2px solid #fff;';
    restartBtn.onclick = restartGame;
    document.body.appendChild(restartBtn);
    window.pacmanUI.push(restartBtn);

    instructions = document.createElement('div');
    instructions.innerHTML = '🟡 Collect all 100 dots! Avoid the ghosts! 👻<br>Move your mouse to control Pac-Man';
    instructions.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:linear-gradient(45deg,#800080,#ff1493);color:#ffff00;padding:12px 24px;border-radius:15px;font-family:Arial,sans-serif;font-weight:bold;z-index:1000000;animation:fadeOut 6s ease-out forwards;border:2px solid #ffff00;text-align:center;';
    document.body.appendChild(instructions);
    window.pacmanUI.push(instructions);

    var fadeStyle = document.createElement('style');
    fadeStyle.textContent = '@keyframes fadeOut{0%,70%{opacity:1;}100%{opacity:0;}}';
    document.head.appendChild(fadeStyle);

    setTimeout(function () {
        if (instructions.parentNode) instructions.remove();
    }, 6000);

    createDots();
    var maxCols = Math.floor(window.innerWidth / gridSize);
    var maxRows = Math.floor(window.innerHeight / gridSize);
    createGhost('https://raw.githubusercontent.com/Naimy441/other_projects/refs/heads/main/redghost.gif', 2, 2, 'chase', 'red');
    createGhost('https://raw.githubusercontent.com/Naimy441/other_projects/refs/heads/main/pinkghost.gif', maxCols - 3, 2, 'ambush', 'pink');
    createGhost('https://raw.githubusercontent.com/Naimy441/other_projects/refs/heads/main/blueghost.gif', Math.floor(maxCols / 2), maxRows - 3, 'vertical', 'blue');

    document.addEventListener('mousemove', window.pacmanMove);
    updatePacman();
})();