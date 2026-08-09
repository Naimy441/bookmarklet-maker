(function () {
    // Remove existing nyan cat if it exists
    if (window.nyanCat) {
        window.nyanCat.remove();
        window.nyanCat = null;
        document.removeEventListener('mousemove', window.nyanMove);
        cancelAnimationFrame(window.nyanFrame);
        return;
    }

    // The gif's actual frame is 1750x800px. The cat's body only occupies the
    // right ~23% of that frame (x: 1351-1569, y: 268-531) - the rest is empty
    // space that the rainbow trail sweeps through. We rotate/position around
    // a point just ahead of the cat's face/nose (not its body-center, and not
    // the frame's center) so the cursor leads the cat instead of sitting on
    // its face, while the trail swings out behind it.
    var CAT_WIDTH = 80;
    var CAT_HEIGHT = CAT_WIDTH * (800 / 1750); // preserve the gif's aspect ratio
    var NOSE_X = CAT_WIDTH * (1569 / 1750); // right edge of the cat's face
    var LOOKAHEAD_PX = 10; // gap so the cursor sits ahead of the nose, not on it
    var PIVOT_X = NOSE_X + LOOKAHEAD_PX;
    var PIVOT_Y = CAT_HEIGHT * ((268 + 531) / 2 / 800);

    // Create and configure the nyan cat element
    var cat = document.createElement('img');
    cat.src = 'https://raw.githubusercontent.com/gist/brudnak/aba00c9a1c92d226f68e8ad8ba1e0a40/raw/e1e4a92f6072d15014f19aa8903d24a1ac0c41a4/nyan-cat.gif';
    cat.style.cssText = 'position:fixed;' +
        'width:' + CAT_WIDTH + 'px;' +
        'height:' + CAT_HEIGHT + 'px;' +
        'pointer-events:none;' +
        'z-index:999999;' +
        'transition:none;' +
        'transform-origin:' + PIVOT_X + 'px ' + PIVOT_Y + 'px;';

    // Initialize position and movement variables
    var targetX = 0,
        targetY = 0,
        catX = 0,
        catY = 0,
        currentAngle = 0,
        lastCatX = 0,
        lastCatY = 0,
        catScale = 1;

    var SCALE_STEP = 0.15; // size change per full 360 turn
    var MIN_SCALE = 0.3;
    var MAX_SCALE = 4;

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

            // Update angle with smooth rotation
            currentAngle += angleDiff * 0.15;

            // Normalize current angle, growing the cat each time it completes
            // a full clockwise turn and shrinking it each time it completes a
            // full counterclockwise turn.
            if (currentAngle < 0) {
                currentAngle += 360;
                catScale = Math.max(MIN_SCALE, catScale - SCALE_STEP);
            }
            if (currentAngle >= 360) {
                currentAngle -= 360;
                catScale = Math.min(MAX_SCALE, catScale + SCALE_STEP);
            }
        }

        // The base sprite only faces right, so rotating it past +-90deg to
        // point left would flip it upside down along the way (worst exactly
        // at 180deg). Instead, mirror the sprite horizontally whenever it's
        // facing generally leftward and rotate the mirrored version by +180deg,
        // which points the nose the same direction while keeping it upright.
        var flip = Math.cos(currentAngle * Math.PI / 180) >= 0 ? 1 : -1;
        var displayAngle = flip >= 0 ? currentAngle : currentAngle + 180;

        // Apply transforms
        cat.style.transform = 'rotate(' + displayAngle + 'deg) scaleX(' + flip + ') scale(' + catScale + ')';
        cat.style.left = (catX - PIVOT_X) + 'px';
        cat.style.top = (catY - PIVOT_Y) + 'px';

        // Request next frame
        window.nyanFrame = requestAnimationFrame(updateCat);
    }

    // Start the animation
    document.addEventListener('mousemove', window.nyanMove);
    updateCat();
})();;