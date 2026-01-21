javascript:(() => {
  /* ------------------ Fonts ------------------ */
  document.head.insertAdjacentHTML(
    "beforeend",
    '<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@100;200;300;400;500;600;700;800&display=swap" rel="stylesheet">'
  );

  /* ------------------ Page Reset ------------------ */
  [".wp", ".m-read", "body", "html", "#main1", ".main"].forEach(sel =>
    document.querySelectorAll(sel).forEach(el => {
      el.style.setProperty("margin", "0", "important");
      el.style.setProperty("padding", "0", "important");
      el.style.setProperty("width", "100%", "important");
      el.style.setProperty("max-width", "100%", "important");
      el.style.setProperty("background", "#282c34", "important");
      el.style.setProperty("color", "#abb2bf", "important");
      el.style.setProperty("font-family", "'JetBrains Mono', monospace", "important");
    })
  );

  document.querySelectorAll(".txt").forEach(el => {
    el.style.setProperty("padding", "12px", "important");
    el.style.setProperty("background", "#282c34", "important");
    el.style.setProperty("color", "#abb2bf", "important");
    el.style.setProperty("font-family", "'JetBrains Mono', monospace", "important");
  });

  document.querySelectorAll(".txt p").forEach(p => {
    p.style.setProperty("font-size", "22px", "important");
    p.style.setProperty("line-height", "1.7", "important");
    p.style.setProperty("margin-bottom", "1em", "important");
    p.style.setProperty("font-family", "'JetBrains Mono', monospace", "important");
  });

  /* ------------------ Line Third Coloring ------------------ */
  const LINE_COLORS = [
    "#e06c75", // left
    "#98c379", // middle
    "#61afef"  // right
  ];

  function colorizeParagraph(p) {
    const text = p.textContent;
    p.textContent = "";

    let lastTop = null;
    let currentLine = [];
    const lines = [];

    [...text].forEach(ch => {
      const span = document.createElement("span");
      span.textContent = ch;
      span.style.transition = "color .25s ease";
      p.appendChild(span);

      const rect = span.getBoundingClientRect();
      const top = Math.round(rect.top);

      if (lastTop === null || top === lastTop) {
        currentLine.push({ span, rect });
      } else {
        lines.push(currentLine);
        currentLine = [{ span, rect }];
      }

      lastTop = top;
    });

    if (currentLine.length) lines.push(currentLine);

    lines.forEach(line => {
      const left = Math.min(...line.map(c => c.rect.left));
      const right = Math.max(...line.map(c => c.rect.right));
      const width = right - left || 1;

      line.forEach(({ span, rect }) => {
        if (!span.textContent.trim()) return;

        const x = rect.left - left;
        const index = Math.min(2, Math.floor((x / width) * 3));
        span.style.color = LINE_COLORS[index];
      });
    });
  }

  /* ------------------ Reveal on Scroll ------------------ */
  const container = document.querySelector("div.txt");
  if (!container) return alert("Target div (.txt) not found.");

  const paragraphs = [...container.querySelectorAll("p")].filter(p =>
    p.textContent.trim()
  );

  paragraphs.forEach(p => {
    p.style.opacity = 0;
    p.style.transform = "translateY(10px)";
  });

  let index = 0;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || entry.target !== paragraphs[index]) return;

      observer.unobserve(entry.target);
      const p = entry.target;

      p.style.opacity = 1;
      p.style.transform = "translateY(0)";
      p.style.transition = "opacity .4s ease, transform .4s ease";

      requestAnimationFrame(() => colorizeParagraph(p));

      index++;
      if (index < paragraphs.length) observer.observe(paragraphs[index]);
    });
  }, { threshold: 0.1 });

  observer.observe(paragraphs[0]);
})();
