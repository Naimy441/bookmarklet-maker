(function () {
    // Remove existing railgun if it exists
    if (window.railgun) {
        window.railgun.remove();
        window.railgun = null;
        document.removeEventListener('mousemove', window.railgunMove);
        document.removeEventListener('mousedown', window.railgunDown);
        document.removeEventListener('mouseup', window.railgunUp);
        cancelAnimationFrame(window.railgunFrame);
        if (window.railgunBeams) window.railgunBeams.forEach(function (b) { b.remove(); });
        window.railgunBeams = null;
        return;
    }

    // Sprite sheet is 23 frames of 64x64px laid out horizontally:
    // 0-6   idle hum (loops forever)
    // 7-15  charge-up (an energy ring builds at the muzzle)
    // 16-21 fires a dissipating beam, then falls back to idle.
    // The gun art sits centered in each frame (bbox x:20-42, y:27-37), with
    // its muzzle tip at roughly (42, 31) - just right of, and slightly above,
    // that center.
    var FRAME_SIZE = 64;
    var FRAME_COUNT = 23;
    var SCALE = 1.5;
    var DISPLAY_SIZE = FRAME_SIZE * SCALE;
    var IDLE_FRAMES = [0, 1, 2, 3, 4, 5, 6];
    var CHARGE_FRAMES = [7, 8, 9, 10, 11, 12, 13, 14, 15];
    var FIRE_FRAMES = [16, 17, 18, 19, 20, 21];
    var IDLE_FRAME_MS = 110;
    var CHARGE_FRAME_MS = 70;
    var FIRE_FRAME_MS = 50;
    // Follow-up shots (fired while the mouse stays held down) play faster
    // than the initial spin-up, so holding down the button rapid-fires.
    var RAPID_CHARGE_FRAME_MS = 25;
    var RAPID_FIRE_FRAME_MS = 18;
    var MUZZLE_LOCAL_X = (42 - 32) * SCALE;
    var MUZZLE_LOCAL_Y = (31 - 32) * SCALE;

    // Unlike the nyan cat (which rides right under the cursor), the railgun
    // hovers a fixed distance behind it, like a turret tracking a target.
    var FOLLOW_DISTANCE = 170;
    var POS_EASE = 0.08;
    var ROTATION_EASE = 0.15;

    var gun = document.createElement('div');
    gun.style.cssText = 'position:fixed;' +
        'width:' + DISPLAY_SIZE + 'px;' +
        'height:' + DISPLAY_SIZE + 'px;' +
        'pointer-events:none;' +
        'z-index:999999;' +
        'transition:none;' +
        'image-rendering:pixelated;' +
        'background-image:url(https://raw.githubusercontent.com/Naimy441/bookmarklet-maker/main/assets/RailGun-Sheet.png);' +
        'background-repeat:no-repeat;' +
        'background-size:' + (FRAME_SIZE * FRAME_COUNT * SCALE) + 'px ' + DISPLAY_SIZE + 'px;';

    document.body.appendChild(gun);
    window.railgun = gun;
    window.railgunBeams = [];

    // Initialize position and movement variables
    var targetX = 0,
        targetY = 0,
        gunX = 0,
        gunY = 0,
        currentAngle = 0,
        spriteState = 'idle',
        frameIndex = 0,
        frameTimer = 0,
        isHeld = false,
        rapidFire = false,
        lastTime = null;

    // Mouse event handlers
    window.railgunMove = function (e) {
        targetX = e.clientX;
        targetY = e.clientY;
    };
    window.railgunDown = function () {
        isHeld = true;
        if (spriteState === 'idle') {
            spriteState = 'charging';
            frameIndex = 0;
            frameTimer = 0;
        }
    };
    window.railgunUp = function () {
        isHeld = false;
        rapidFire = false;
    };

    // Same upright-preserving mirror trick used for the nyan cat: rotate a
    // local point around the gun's own center, mirroring it (and adding
    // 180deg to the rotation) whenever the gun is facing generally leftward,
    // so a point like the muzzle tip stays correctly placed at any aim angle.
    function rotateAndFlip(lx, ly, angleDeg, flip) {
        var effAngle = flip >= 0 ? angleDeg : angleDeg + 180;
        var rad = effAngle * Math.PI / 180;
        var x = flip >= 0 ? lx : -lx;
        return {
            x: x * Math.cos(rad) - ly * Math.sin(rad),
            y: x * Math.sin(rad) + ly * Math.cos(rad)
        };
    }

    var BEAM_TRAVEL_MS = 90; // time for the bolt to shoot out to its target
    var BEAM_FADE_MS = 160; // time for it to fade once it lands

    // Fire a laser bolt from the muzzle to wherever the cursor was at the
    // moment the shot went off. It's built as two stacked layers - a wider
    // red glow plus a thin bright core running down its centerline, both
    // staying solid almost the whole way and only tapering right at the tip
    // - rather than one strip that fades to transparent (which just reads as
    // fading to black against a dark page). Colors are sampled directly from
    // the sprite sheet's own beam (#f4f4f4 hot core, #dc3251 body).
    //
    // The bolt animates its own width out from the muzzle to the target
    // instead of just appearing at full length - since the gun keeps chasing
    // the cursor, a full-length bolt that only fades in place reads as a
    // static leftover mark rather than a shot that actually traveled there.
    function spawnBeam(muzzleX, muzzleY, toX, toY) {
        var dx = toX - muzzleX;
        var dy = toY - muzzleY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var angle = Math.atan2(dy, dx) * (180 / Math.PI);
        var common = 'position:fixed;left:' + muzzleX + 'px;width:0px;' +
            'pointer-events:none;transform-origin:0% 50%;transform:rotate(' + angle + 'deg);' +
            'opacity:1;transition:width ' + BEAM_TRAVEL_MS + 'ms linear, opacity ' + BEAM_FADE_MS + 'ms ease-out;';

        var glow = document.createElement('div');
        glow.style.cssText = common +
            'top:' + (muzzleY - 4) + 'px;height:8px;z-index:999998;' +
            'background:linear-gradient(to right, #dc3251, #dc3251 82%, rgba(220,50,81,0));' +
            'box-shadow:0 0 18px 4px rgba(220,50,81,0.9);';

        var core = document.createElement('div');
        core.style.cssText = common +
            'top:' + (muzzleY - 1) + 'px;height:2px;z-index:999999;' +
            'background:linear-gradient(to right, #fff, #f4f4f4 82%, rgba(244,244,244,0));' +
            'box-shadow:0 0 6px 1px rgba(255,255,255,0.95);';

        document.body.appendChild(glow);
        document.body.appendChild(core);
        window.railgunBeams.push(glow, core);

        // Double rAF so the browser paints the initial (zero-width) state
        // before we grow it, otherwise the transition can get skipped.
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                glow.style.width = dist + 'px';
                core.style.width = dist + 'px';
            });
        });
        setTimeout(function () {
            glow.style.opacity = '0';
            core.style.opacity = '0';
        }, BEAM_TRAVEL_MS);
        setTimeout(function () {
            [glow, core].forEach(function (el) {
                el.remove();
                var idx = window.railgunBeams.indexOf(el);
                if (idx >= 0) window.railgunBeams.splice(idx, 1);
            });
        }, BEAM_TRAVEL_MS + BEAM_FADE_MS + 40);
    }

    function framesFor(state) {
        return state === 'idle' ? IDLE_FRAMES : state === 'charging' ? CHARGE_FRAMES : FIRE_FRAMES;
    }

    function frameMsFor(state) {
        if (state === 'idle') return IDLE_FRAME_MS;
        if (state === 'charging') return rapidFire ? RAPID_CHARGE_FRAME_MS : CHARGE_FRAME_MS;
        return rapidFire ? RAPID_FIRE_FRAME_MS : FIRE_FRAME_MS;
    }

    // Steps the idle/charge/fire state machine forward by dt milliseconds
    // and returns which sheet frame should currently be shown. Firing a shot
    // is triggered the instant charging finishes; holding the mouse down
    // loops straight back into another charge afterwards, faster than the
    // initial spin-up, so it rapid-fires the longer you hold.
    function advanceSprite(dt, flip) {
        frameTimer += dt;
        var frames = framesFor(spriteState);
        var frameMs = frameMsFor(spriteState);

        while (frameTimer >= frameMs) {
            frameTimer -= frameMs;
            frameIndex++;
            if (frameIndex >= frames.length) {
                frameIndex = 0;
                if (spriteState === 'charging') {
                    spriteState = 'firing';
                    var muzzle = rotateAndFlip(MUZZLE_LOCAL_X, MUZZLE_LOCAL_Y, currentAngle, flip);
                    spawnBeam(gunX + muzzle.x, gunY + muzzle.y, targetX, targetY);
                } else if (spriteState === 'firing') {
                    spriteState = isHeld ? 'charging' : 'idle';
                    if (spriteState === 'charging') rapidFire = true;
                }
                frames = framesFor(spriteState);
                frameMs = frameMsFor(spriteState);
            }
        }
        return frames[frameIndex];
    }

    // Update gun position, rotation and animation frame
    function updateGun(now) {
        var dt = lastTime === null ? 16 : now - lastTime;
        lastTime = now;

        // Aim at the cursor
        var aimDX = targetX - gunX;
        var aimDY = targetY - gunY;
        if (Math.abs(aimDX) > 0.5 || Math.abs(aimDY) > 0.5) {
            var newAngle = Math.atan2(aimDY, aimDX) * (180 / Math.PI);
            var angleDiff = newAngle - currentAngle;
            if (angleDiff > 180) angleDiff -= 360;
            else if (angleDiff < -180) angleDiff += 360;
            currentAngle += angleDiff * ROTATION_EASE;
            if (currentAngle < 0) currentAngle += 360;
            if (currentAngle >= 360) currentAngle -= 360;
        }

        // Hover a fixed distance behind the cursor along the aim line,
        // rather than sitting on top of it
        var rad = currentAngle * Math.PI / 180;
        var desiredX = targetX - FOLLOW_DISTANCE * Math.cos(rad);
        var desiredY = targetY - FOLLOW_DISTANCE * Math.sin(rad);
        gunX += (desiredX - gunX) * POS_EASE;
        gunY += (desiredY - gunY) * POS_EASE;

        var flip = Math.cos(rad) >= 0 ? 1 : -1;
        var displayAngle = flip >= 0 ? currentAngle : currentAngle + 180;

        var frame = advanceSprite(dt, flip);

        // Apply transforms
        gun.style.backgroundPosition = (-frame * DISPLAY_SIZE) + 'px 0px';
        gun.style.transform = 'rotate(' + displayAngle + 'deg) scaleX(' + flip + ')';
        gun.style.left = (gunX - DISPLAY_SIZE / 2) + 'px';
        gun.style.top = (gunY - DISPLAY_SIZE / 2) + 'px';

        // Request next frame
        window.railgunFrame = requestAnimationFrame(updateGun);
    }

    // Start the animation
    document.addEventListener('mousemove', window.railgunMove);
    document.addEventListener('mousedown', window.railgunDown);
    document.addEventListener('mouseup', window.railgunUp);
    window.railgunFrame = requestAnimationFrame(updateGun);
})();
