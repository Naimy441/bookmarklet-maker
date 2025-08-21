(function () {
    // Toggle sparkle mode off if it's already active
    if (window.sparkleMode) {
        document.removeEventListener('click', window.sparkleClick);
        window.sparkleMode = false;
        document.querySelectorAll('.sparkle-particle').forEach(s => s.remove());
        return;
    }

    // Enable sparkle mode
    window.sparkleMode = true;

    // Define colors and emojis for particles
    const colors = [
        '#ff69b4', // hot pink
        '#ffd700', // gold
        '#ff1493', // deep pink
        '#00ffff', // cyan
        '#ff6347', // tomato
        '#98fb98', // pale green
        '#dda0dd', // plum
        '#f0e68c'  // khaki
    ];

    // Decoded emojis for better readability
    const emojis = [
        '✨', '⭐', '🌟', '💫', '🎆', '🎇', '💖', '💕',
        '🦄', '🌈', '🧚‍♀️', '🧚‍♂️', '🔮', '💎', '🌸',
        '🌺', '🦋', '🎀', '💝', '🌙'
    ];

    // Click handler to create sparkle effect
    window.sparkleClick = function (e) {
        for (let i = 0; i < 8; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle-particle';
            sparkle.innerHTML = emojis[Math.floor(Math.random() * emojis.length)];

            // Style the sparkle particle
            sparkle.style.cssText =
                'position: fixed;' +
                'font-size: ' + (Math.random() * 12 + 8) + 'px;' +
                'color: ' + colors[Math.floor(Math.random() * colors.length)] + ';' +
                'pointer-events: none;' +
                'z-index: 999999;' +
                'animation: sparkleFloat 1.5s ease-out forwards;' +
                'user-select: none;';

            // Position at click location
            sparkle.style.left = e.clientX + 'px';
            sparkle.style.top = e.clientY + 'px';

            // Calculate particle trajectory
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 60 + 30;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity - 30;

            // Set CSS variables for animation
            sparkle.style.setProperty('--vx', vx + 'px');
            sparkle.style.setProperty('--vy', vy + 'px');

            // Add to document and remove after animation
            document.body.appendChild(sparkle);
            setTimeout(function () {
                if (sparkle.parentNode) sparkle.remove();
            }, 1500);
        }
    };

    // Add sparkle animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes sparkleFloat {
            0% {
                transform: translate(0, 0) scale(1) rotate(0deg);
                opacity: 1;
            }
            50% {
                transform: translate(calc(var(--vx)*0.8), calc(var(--vy)*0.8)) scale(1.2) rotate(180deg);
                opacity: 0.8;
            }
            100% {
                transform: translate(var(--vx), var(--vy)) scale(0) rotate(360deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // Add click event listener
    document.addEventListener('click', window.sparkleClick);

    // Create and show activation notification
    const notification = document.createElement('div');
    notification.innerHTML = '✨ Sparkle mode activated! Click anywhere! ✨';
    notification.style.cssText =
        'position: fixed;' +
        'top: 20px;' +
        'left: 50%;' +
        'transform: translateX(-50%);' +
        'background: linear-gradient(45deg, #ff69b4, #ffd700);' +
        'color: white;' +
        'padding: 10px 20px;' +
        'border-radius: 20px;' +
        'font-family: Arial, sans-serif;' +
        'font-weight: bold;' +
        'z-index: 1000000;' +
        'box-shadow: 0 4px 15px rgba(255,105,180,0.5);' +
        'animation: sparkleNotify 3s ease-out forwards;';
    document.body.appendChild(notification);

    // Add notification animation styles
    const notifyStyle = document.createElement('style');
    notifyStyle.textContent = `
        @keyframes sparkleNotify {
            0% {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px) scale(0.8);
            }
            10% {
                opacity: 1;
                transform: translateX(-50%) translateY(0) scale(1);
            }
            90% {
                opacity: 1;
                transform: translateX(-50%) translateY(0) scale(1);
            }
            100% {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px) scale(0.8);
            }
        }
    `;
    document.head.appendChild(notifyStyle);

    // Remove notification after animation
    setTimeout(function () {
        if (notification.parentNode) notification.remove();
    }, 3000);
})();;