javascript:(() => {
  // Apply styling first
  document.head.insertAdjacentHTML('beforeend','<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">');
  ['.wp','.m-read','body','html','#main1','.main'].forEach(s=>document.querySelectorAll(s).forEach(el=>{el.style.setProperty('margin','0','important');el.style.setProperty('padding','0','important');el.style.setProperty('width','100%','important');el.style.setProperty('max-width','100%','important');el.style.setProperty('background','#000','important');el.style.setProperty('color','#fff','important');el.style.setProperty('font-family','Inter, sans-serif','important');}));
  
  // Style .txt with minimal padding
  document.querySelectorAll('.txt').forEach(el=>{el.style.setProperty('padding','12px','important');el.style.setProperty('background','#000','important');el.style.setProperty('color','#fff','important');el.style.setProperty('font-family','Inter, sans-serif','important');});
  
  document.querySelectorAll('.txt p').forEach(el=>{el.style.setProperty('font-size','22px','important');el.style.setProperty('line-height','1.7','important');el.style.setProperty('font-family','Inter, sans-serif','important');el.style.setProperty('margin-bottom','1em','important');});

  // Then apply typing effect
  const container = document.querySelector('div.txt');
  if (!container) return alert('Target div (.txt) not found.');

  const paragraphs = Array.from(container.querySelectorAll('p'))
    .filter(p => p.textContent.trim());

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
        const span = document.createElement('span');
        span.textContent = text[i];
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