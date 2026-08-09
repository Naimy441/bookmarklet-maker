javascript:(() => {
  // Load Google Fonts
  document.head.insertAdjacentHTML('beforeend', '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">');

  // Base styling
  ['.wp','.m-read','body','html','#main1','.main'].forEach(s => 
    document.querySelectorAll(s).forEach(el => {
      el.style.setProperty('margin','0','important');
      el.style.setProperty('padding','0','important');
      el.style.setProperty('width','100%','important');
      el.style.setProperty('max-width','100%','important');
      el.style.setProperty('background','#000','important');
      el.style.setProperty('color','#fff','important');
      el.style.setProperty('font-family','Inter, sans-serif','important');
    })
  );

  // Style .txt
  document.querySelectorAll('.txt').forEach(el => {
    el.style.setProperty('padding','12px','important');
    el.style.setProperty('background','#000','important');
    el.style.setProperty('color','#fff','important');
    el.style.setProperty('font-family','Inter, sans-serif','important');
  });

  document.querySelectorAll('.txt p').forEach(el => {
    el.style.setProperty('font-size','22px','important');
    el.style.setProperty('line-height','1.7','important');
    el.style.setProperty('margin-bottom','1em','important');
  });

  const container = document.querySelector('div.txt');
  if (!container) return alert('Target div (.txt) not found.');

  const paragraphs = Array.from(container.querySelectorAll('p')).filter(p => p.textContent.trim());

  // Wrap each word in a span
  paragraphs.forEach(p => {
    const words = p.textContent.split(/\s+/);
    p.textContent = '';
    words.forEach(word => {
      const span = document.createElement('span');
      span.textContent = word + ' ';
      p.appendChild(span);
    });
  });

  // Reading follow variables
  let currentWord = 0;
  let speed = 100; // milliseconds per word
  window.setReadingSpeed = s => speed = s; // call setReadingSpeed(100) to adjust

  function highlightWord() {
    paragraphs.forEach(p => p.querySelectorAll('span').forEach(span => span.style.color = '#fff'));
    
    let allWords = [];
    paragraphs.forEach(p => allWords.push(...p.querySelectorAll('span')));
    if (allWords.length === 0) return;

    allWords[currentWord].style.color = 'red';
    currentWord = (currentWord + 1) % allWords.length;

    setTimeout(highlightWord, speed);
  }

  highlightWord();
})();