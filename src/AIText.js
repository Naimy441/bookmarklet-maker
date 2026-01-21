javascript:(() => {
  const container = document.querySelector('div.txt');
  if (!container) return alert('Target div (.txt) not found.');

  const paragraphs = Array.from(container.querySelectorAll('p'))
    .filter(p => p.textContent.trim());

  // hide all paragraphs with initial transform
  paragraphs.forEach(p => {
    p.style.opacity = 0;
    p.style.transform = 'translateY(10px)';
  });

  let pIndex = 0;

  function typeParagraph(p, callback) {
    const text = p.textContent;
    p.textContent = '';
    p.style.opacity = 1;
    p.style.transform = 'translateY(0)';
    p.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';

    let i = 0;

    function typeCharChunk() {
      if (i < text.length) {
        const char = text[i];
        const span = document.createElement('span');
        span.textContent = char;
        span.style.opacity = 0;
        span.style.transition = 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
        span.style.transform = 'translateY(-3px)';
        span.style.filter = 'blur(1px)';
        
        p.appendChild(span);

        requestAnimationFrame(() => {
          setTimeout(() => {
            span.style.opacity = 1;
            span.style.transform = 'translateY(0)';
            span.style.filter = 'blur(0)';
          }, 5);
        });

        i++;
        setTimeout(typeCharChunk, 3 + Math.random()*5);
      } else if (callback) {
        setTimeout(callback, 100);
      }
    }

    typeCharChunk();
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && pIndex === paragraphs.indexOf(entry.target)) {
        obs.unobserve(entry.target);
        typeParagraph(paragraphs[pIndex], () => {
          pIndex++;
          if (pIndex < paragraphs.length) observer.observe(paragraphs[pIndex]);
        });
      }
    });
  }, { threshold: 0.1 });

  if (paragraphs.length) observer.observe(paragraphs[0]);
})();