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
        
        // Reserve space for UI (80px from top)
        var uiHeightInGrids = Math.ceil(80 / gridSize);

        for (var i = uiHeightInGrids; i < rows; i++) {  // Start after UI height
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
            
            // Calculate actual pixel distance between Pac-Man and dot centers
            var dotX = dot.gridX * gridSize + gridSize / 2;
            var dotY = dot.gridY * gridSize + gridSize / 2;
            var dx = dotX - pacmanX;
            var dy = dotY - pacmanY;
            var distance = Math.sqrt(dx * dx + dy * dy);
            
            // Collection radius (more forgiving than the visual size of the dot)
            var collectionRadius = 25; // Generous radius for easier collection
            
            if (distance < collectionRadius) {
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
            // Calculate actual pixel distance between Pac-Man and ghost centers
            var dx = ghost.x - pacmanX;
            var dy = ghost.y - pacmanY;
            var distance = Math.sqrt(dx * dx + dy * dy);
            
            // Collision radius (slightly smaller than sprite size for fair gameplay)
            var collisionRadius = 15; // Sprites are 40x40, using smaller radius for precise collisions
            
            if (distance < collisionRadius * 2) { // Multiply by 2 since we're checking distance between centers
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

        // Calculate distances for possible moves
        var possibleMoves = [];
        
        // Add horizontal move if possible
        if (dx !== 0) {
            var horizontalMove = {
                x: pacmanGridX + (dx > 0 ? 1 : -1),
                y: pacmanGridY
            };
            if (horizontalMove.x >= 0 && horizontalMove.x < maxCols) {
                var horizontalDist = Math.pow(horizontalMove.x - mouseGridX, 2) + Math.pow(horizontalMove.y - mouseGridY, 2);
                possibleMoves.push({ move: horizontalMove, dist: horizontalDist });
            }
        }
        
        // Add vertical move if possible
        if (dy !== 0) {
            var verticalMove = {
                x: pacmanGridX,
                y: pacmanGridY + (dy > 0 ? 1 : -1)
            };
            if (verticalMove.y >= 0 && verticalMove.y < maxRows) {
                var verticalDist = Math.pow(verticalMove.x - mouseGridX, 2) + Math.pow(verticalMove.y - mouseGridY, 2);
                possibleMoves.push({ move: verticalMove, dist: verticalDist });
            }
        }
        
        // Choose the move that minimizes distance
        if (possibleMoves.length > 0) {
            var bestMove = possibleMoves.reduce((a, b) => a.dist < b.dist ? a : b);
            targetX = bestMove.move.x;
            targetY = bestMove.move.y;
        }

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

    // Create UI container
    var uiContainer = document.createElement('div');
    uiContainer.style.cssText = 'position:fixed;top:0;left:0;right:0;padding:20px;display:flex;justify-content:space-between;align-items:center;z-index:1000000;background:linear-gradient(180deg,rgba(0,0,0,0.8) 0%,rgba(0,0,0,0) 100%);font-family:"Segoe UI",Arial,sans-serif;';
    document.body.appendChild(uiContainer);
    window.pacmanUI.push(uiContainer);

    // Left section - Score
    var scoreSection = document.createElement('div');
    scoreSection.style.cssText = 'display:flex;align-items:center;gap:15px;';
    
    scoreDisplay = document.createElement('div');
    scoreDisplay.textContent = 'Score: 0/100';
    scoreDisplay.style.cssText = 'color:#ffff00;font-size:24px;font-weight:600;text-shadow:0 2px 4px rgba(0,0,0,0.5);padding:10px 20px;background:rgba(0,0,0,0.6);border-radius:15px;backdrop-filter:blur(5px);border:2px solid rgba(255,255,0,0.3);transition:all 0.3s ease;';
    scoreSection.appendChild(scoreDisplay);
    uiContainer.appendChild(scoreSection);

    // Center section - Instructions
    instructions = document.createElement('div');
    instructions.innerHTML = '🎮 Move mouse to control Pac-Man<br>🟡 Collect dots • 👻 Avoid ghosts';
    instructions.style.cssText = 'color:#fff;font-size:18px;font-weight:500;text-align:center;line-height:1.5;text-shadow:0 2px 4px rgba(0,0,0,0.5);padding:10px 25px;background:rgba(0,0,0,0.6);border-radius:15px;backdrop-filter:blur(5px);animation:fadeOut 6s ease-out forwards;border:2px solid rgba(255,255,255,0.3);';
    uiContainer.appendChild(instructions);

    // Right section - Restart button
    var buttonSection = document.createElement('div');
    buttonSection.style.cssText = 'display:flex;align-items:center;gap:15px;';
    
    restartBtn = document.createElement('button');
    restartBtn.innerHTML = '🔄 New Game';
    restartBtn.style.cssText = 'color:#fff;font-size:18px;font-weight:600;padding:12px 24px;background:linear-gradient(135deg,#4a90e2,#2ecc71);border:none;border-radius:15px;cursor:pointer;transition:all 0.3s ease;text-shadow:0 1px 2px rgba(0,0,0,0.3);box-shadow:0 4px 15px rgba(0,0,0,0.2);';
    restartBtn.onmouseover = function() { this.style.transform = 'translateY(-2px)'; this.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'; };
    restartBtn.onmouseout = function() { this.style.transform = 'translateY(0)'; this.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)'; };
    restartBtn.onclick = restartGame;
    buttonSection.appendChild(restartBtn);
    uiContainer.appendChild(buttonSection);
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