(function () {
    // Remove existing nyan cat if it exists
    if (window.nyanCat) {
        window.nyanCat.remove();
        window.nyanCat = null;
        document.removeEventListener('mousemove', window.nyanMove);
        cancelAnimationFrame(window.nyanFrame);
        return;
    }

    // Create and configure the nyan cat element
    var cat = document.createElement('img');
    cat.src = 'https://raw.githubusercontent.com/gist/brudnak/aba00c9a1c92d226f68e8ad8ba1e0a40/raw/e1e4a92f6072d15014f19aa8903d24a1ac0c41a4/nyan-cat.gif';
    cat.style.cssText = 'position:fixed;' +
        'width:80px;' +
        'height:auto;' +
        'pointer-events:none;' +
        'z-index:999999;' +
        'transition:none;' +
        'transform-origin:80% 50%;';

    // Initialize position and movement variables
    var targetX = 0,
        targetY = 0,
        catX = 0,
        catY = 0,
        currentAngle = 0,
        lastCatX = 0,
        lastCatY = 0;

    // Add cat to the document and store reference
    document.body.appendChild(cat);
    window.nyanCat = cat;

    // Mouse move event handler
    window.nyanMove = function (e) {
        targetX = e.clientX;
        targetY = e.clientY;
    };

    // Update cat position and rotation
    function updateCat() {
        // Calculate movement
        var dx = targetX - catX;
        var dy = targetY - catY;

        // Store last position
        lastCatX = catX;
        lastCatY = catY;

        // Update position with smooth movement
        catX += (dx * 0.1);
        catY += (dy * 0.1);

        // Calculate velocity (unused variables removed)
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
            // Calculate new angle
            var newAngle = Math.atan2(dy, dx) * (180 / Math.PI);
            var angleDiff = newAngle - currentAngle;

            // Normalize angle difference
            if (angleDiff > 180) angleDiff -= 360;
            else if (angleDiff < -180) angleDiff += 360;

            // Debug logging
            console.log(
                'cursor:(' + targetX + ',' + targetY + ')',
                'cat:(' + catX.toFixed(1) + ',' + catY.toFixed(1) + ')',
                'angle:' + currentAngle.toFixed(1)
            );

            // Update angle with smooth rotation
            currentAngle += angleDiff * 0.15;

            // Normalize current angle
            if (currentAngle < 0) currentAngle += 360;
            if (currentAngle >= 360) currentAngle -= 360;
        }

        // Apply transforms
        cat.style.transform = 'rotate(' + currentAngle + 'deg)';
        cat.style.left = (catX - 64) + 'px';
        cat.style.top = (catY - 32) + 'px';

        // Request next frame
        window.nyanFrame = requestAnimationFrame(updateCat);
    }

    // Start the animation
    document.addEventListener('mousemove', window.nyanMove);
    updateCat();
})();;