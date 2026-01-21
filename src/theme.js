javascript:(() => {
  document.head.insertAdjacentHTML(
    "beforeend",
    '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">'
  );

  [".wp", ".m-read", "body", "html", "#main1", ".main"].forEach(s =>
    document.querySelectorAll(s).forEach(el => {
      el.style.setProperty("margin", "0", "important");
      el.style.setProperty("padding", "0", "important");
      el.style.setProperty("width", "100%", "important");
      el.style.setProperty("max-width", "100%", "important");
      el.style.setProperty("background", "#282c34", "important");
      el.style.setProperty("color", "#abb2bf", "important");
      el.style.setProperty("font-family", "Inter, sans-serif", "important");
    })
  );

  document.querySelectorAll(".txt").forEach(el => {
    el.style.setProperty("padding", "12px", "important");
    el.style.setProperty("background", "#282c34", "important");
    el.style.setProperty("color", "#abb2bf", "important");
    el.style.setProperty("font-family", "Inter, sans-serif", "important");
  });

  document.querySelectorAll(".txt p").forEach(el => {
    el.style.setProperty("font-size", "22px", "important");
    el.style.setProperty("line-height", "1.7", "important");
    el.style.setProperty("margin-bottom", "1em", "important");
  });

  const WORD_COLORS = ["#e06c75", "#98c379", "#61afef", "#c678dd", "#56b6c2"];
  const PUNCT_COLOR = "#d19a66"; // Atom One Dark numbers / punctuation
  const BRACKET_COLOR = "#e5c07b";

  let colorIndex = 0;
  let wordsInColor = 0;
  let wordsPerColor = Math.floor(Math.random() * 3) + 3;

  function nextWordColor() {
    if (++wordsInColor >= wordsPerColor) {
      colorIndex = (colorIndex + 1) % WORD_COLORS.length;
      wordsInColor = 0;
      wordsPerColor = Math.floor(Math.random() * 3) + 3;
    }
    return WORD_COLORS[colorIndex];
  }

  function resetOnPunctuation() {
    colorIndex = (colorIndex + 1) % WORD_COLORS.length;
    wordsInColor = 0;
    wordsPerColor = Math.floor(Math.random() * 3) + 3;
  }

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
      if (!entry.isIntersecting || index !== paragraphs.indexOf(entry.target)) return;
      observer.unobserve(entry.target);

      const p = entry.target;
      const text = p.textContent;
      p.textContent = "";
      p.style.opacity = 1;
      p.style.transform = "translateY(0)";
      p.style.transition = "opacity 0.4s ease, transform 0.4s ease";

      const tokens = text.split(/(\s+)/);
      let t = 0;
      let inBracket = false;

      (function typeToken() {
        if (t >= tokens.length) {
          index++;
          if (index < paragraphs.length) observer.observe(paragraphs[index]);
          return;
        }

        const token = tokens[t++];

        if (!/\S/.test(token)) {
          p.append(token);
          return setTimeout(typeToken, 10);
        }

        if (/[\[({]/.test(token)) inBracket = true;
        const wordColor = inBracket ? BRACKET_COLOR : nextWordColor();
        if (/[\])}]/.test(token)) inBracket = false;

        let c = 0;
        (function typeChar() {
          if (c >= token.length) {
            if (/[.!?,;:]/.test(token)) resetOnPunctuation();
            return setTimeout(typeToken, 30);
          }

          const ch = token[c++];
          const span = document.createElement("span");

          const isPunct = /[.!?,;:]/.test(ch);
          const isBracket = /[\[\]{}()]/.test(ch);

          span.textContent = ch;
          span.style.color = isPunct
            ? PUNCT_COLOR
            : isBracket
            ? BRACKET_COLOR
            : wordColor;

          span.style.opacity = 0;
          span.style.transform = "translateY(-3px)";
          span.style.filter = "blur(1px)";
          span.style.transition = "opacity .2s, transform .2s, filter .2s";

          p.appendChild(span);

          requestAnimationFrame(() => {
            span.style.opacity = 1;
            span.style.transform = "translateY(0)";
            span.style.filter = "blur(0)";
          });

          setTimeout(typeChar, 2 + Math.random() * 4);
        })();
      })();
    });
  }, { threshold: 0.1 });

  observer.observe(paragraphs[0]);
})();
