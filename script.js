/* =========================================================
   SALONI PORTFOLIO — script.js
   Single script for all pages. Page-specific logic only
   runs when the relevant elements exist in the DOM.

   SHARED (all pages):
     T           → toggle theme
     H           → show keyboard shortcuts hint

   INDEX PAGE:
     J / ↓       → next section
     K / ↑       → previous section
     1–5         → jump to section by number
     G G         → scroll to top
     G E         → scroll to bottom
     Escape      → clear focus

   WRITING PAGE:
     J / ↓       → next writing row
     K / ↑       → previous row
     Enter       → open focused row's link
     B/Backspace → back to index
     1–9         → jump to year group
     Escape      → clear focus

   CRAFT PAGE:
     J / ↓       → next craft item
     K / ↑       → previous craft item
     Enter       → open focused item's link
     B/Backspace → back to index
     Escape      → clear focus
   ========================================================= */

(function () {
  'use strict';

  /* =========================================================
     THEME
     ========================================================= */
  const html = document.documentElement;
  const toggleBtn = document.getElementById('themeToggle');

  const savedTheme = localStorage.getItem('theme') || 'dark';
  setTheme(savedTheme);

  function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (toggleBtn) {
      toggleBtn.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      );
    }
  }

  function toggleTheme() {
    const current = html.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
    flashHint('Theme toggled  [T]');
  }

  if (toggleBtn) toggleBtn.addEventListener('click', toggleTheme);

  /* =========================================================
     KEYBOARD HINT TOAST  (shared)
     ========================================================= */
  const hint = document.getElementById('kbdHint');
  let hintTimer = null;

  function flashHint(msg) {
    if (!hint) return;
    clearTimeout(hintTimer);
    hint.textContent = msg;
    hint.classList.add('visible');
    hintTimer = setTimeout(() => hint.classList.remove('visible'), 1800);
  }

  /* =========================================================
     SHARED KEY GUARD
     ========================================================= */
  function isTyping() {
    const tag = document.activeElement.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  }

  /* =========================================================
     SCROLL-EDGE FADES  (shared)
     ========================================================= */
  function updateScrollFades() {
    const scrollTop = window.scrollY;
    const scrollBottom = document.documentElement.scrollHeight - window.innerHeight - scrollTop;
    html.classList.toggle('fade-top', scrollTop > 12);
    html.classList.toggle('fade-bottom', scrollBottom > 12);
  }

  window.addEventListener('scroll', updateScrollFades, { passive: true });
  updateScrollFades();

  /* =========================================================
     INDEX PAGE
     ========================================================= */
  const sections = Array.from(document.querySelectorAll('main .section'));

  if (sections.length) {
    let currentIndex = -1;
    let lastKey = '';
    let lastKeyTime = 0;
    let showingHelp = false;

    const SHORTCUTS = [
      'J / ↓  — next section',
      'K / ↑  — previous section',
      '1–4    — jump to section',
      'G G    — top',
      'G E    — bottom',
      'T      — toggle theme',
      'H      — hide this',
      'Tab    — cycle links',
    ];

    function focusSection(index) {
      sections.forEach(s => {
        s.classList.remove('keyboard-focused');
        s.removeAttribute('tabindex');
      });
      if (index < 0 || index >= sections.length) return;
      currentIndex = index;
      const sec = sections[index];
      sec.setAttribute('tabindex', '-1');
      sec.classList.add('keyboard-focused');
      sec.focus({ preventScroll: false });
      const offset = 72;
      const top = sec.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      const label = sec.getAttribute('aria-label') || `Section ${index + 1}`;
      flashHint(`${label}  [${index + 1}/${sections.length}]`);
    }

    function showHelp() {
      showingHelp = true;
      clearTimeout(hintTimer);
      hint.innerHTML = SHORTCUTS.join('  ·  ');
      hint.classList.add('visible');
    }

    function hideHelp() {
      showingHelp = false;
      hint && hint.classList.remove('visible');
    }

    document.addEventListener('keydown', function (e) {
      if (isTyping()) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key;
      const now = Date.now();

      if (key === 'g' || key === 'G') {
        if (lastKey === 'g' && now - lastKeyTime < 600) {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          currentIndex = -1;
          sections.forEach(s => s.classList.remove('keyboard-focused'));
          flashHint('Top  [G G]');
          lastKey = '';
          return;
        }
        lastKey = 'g';
        lastKeyTime = now;
        return;
      }

      if ((key === 'e' || key === 'E') && lastKey === 'g' && now - lastKeyTime < 600) {
        e.preventDefault();
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        flashHint('Bottom  [G E]');
        lastKey = '';
        return;
      }

      lastKey = key;
      lastKeyTime = now;

      switch (key) {
        case 'j': case 'ArrowDown':
          e.preventDefault();
          focusSection(Math.min(currentIndex + 1, sections.length - 1));
          break;
        case 'k': case 'ArrowUp':
          e.preventDefault();
          focusSection(Math.max(currentIndex - 1, 0));
          break;
        case '1': case '2': case '3': case '4': case '5': {
          const idx = parseInt(key) - 1;
          if (idx < sections.length) { e.preventDefault(); focusSection(idx); }
          break;
        }
        case 't': case 'T': toggleTheme(); break;
        case 'h': case 'H': showingHelp ? hideHelp() : showHelp(); break;
        case 'Escape':
          hideHelp();
          sections.forEach(s => s.classList.remove('keyboard-focused'));
          currentIndex = -1;
          break;
      }
    });

    sections.forEach((sec, i) => {
      sec.addEventListener('focusin', () => { currentIndex = i; });
    });

    if (!localStorage.getItem('hintShown')) {
      setTimeout(() => {
        flashHint('Keyboard shortcuts: H for help, J/K to navigate');
        localStorage.setItem('hintShown', '1');
      }, 1200);
    }
  }

  /* =========================================================
     WRITING PAGE
     ========================================================= */
  const rows = Array.from(document.querySelectorAll('.writing-row'));

  if (rows.length) {
    let rowIndex = -1;

    /* Row focus */
    function focusRow(index) {
      rows.forEach(r => r.classList.remove('row-focused'));
      if (index < 0 || index >= rows.length) return;
      rowIndex = index;
      const row = rows[index];
      row.classList.add('row-focused');
      const PADDING = 100;
      const rect = row.getBoundingClientRect();
      if (rect.top < PADDING) {
        window.scrollBy({ top: rect.top - PADDING, behavior: 'smooth' });
      } else if (rect.bottom > window.innerHeight - PADDING) {
        window.scrollBy({ top: rect.bottom - window.innerHeight + PADDING, behavior: 'smooth' });
      }
      const titleEl = row.querySelector('.writing-title');
      const dateEl = row.querySelector('.writing-date');
      if (titleEl) flashHint(`${titleEl.textContent.trim()}  ${dateEl ? dateEl.textContent : ''}`);
    }

    /* Year groups for number-key jumps */
    const yearGroups = rows
      .map((row, i) => ({ row, i, year: row.dataset.year }))
      .filter(item => item.year);

    document.addEventListener('keydown', function (e) {
      if (isTyping()) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = document.activeElement.tagName;

      switch (e.key) {
        case 'j': case 'ArrowDown':
          e.preventDefault();
          focusRow(Math.min(rowIndex + 1, rows.length - 1));
          break;
        case 'k': case 'ArrowUp':
          e.preventDefault();
          focusRow(Math.max(rowIndex - 1, 0));
          break;
        case 'Enter':
          if (rowIndex >= 0) {
            const link = rows[rowIndex].querySelector('.writing-title');
            if (link) link.click();
          }
          break;
        case 'b': case 'B': case 'Backspace':
          if (tag === 'A') break;
          e.preventDefault();
          window.location.href = 'index.html';
          break;
        case 'Escape':
          rows.forEach(r => r.classList.remove('row-focused'));
          rowIndex = -1;
          hint && hint.classList.remove('visible');
          break;
        case 't': case 'T': toggleTheme(); break;
        case 'h': case 'H': flashHint('J/K navigate · Enter open · B back · T theme'); break;
        case '1': case '2': case '3': case '4': case '5':
        case '6': case '7': case '8': case '9': {
          const num = parseInt(e.key);
          if (num <= yearGroups.length) {
            e.preventDefault();
            const target = yearGroups[num - 1];
            focusRow(target.i);
            flashHint(`Jump to ${target.year}  [${e.key}]`);
          }
          break;
        }
      }
    });

    rows.forEach((row, i) => {
      row.addEventListener('focusin', () => {
        rows.forEach(r => r.classList.remove('row-focused'));
        row.classList.add('row-focused');
        rowIndex = i;
      });
      row.addEventListener('focusout', () => row.classList.remove('row-focused'));
    });

    if (!localStorage.getItem('writingHintShown')) {
      setTimeout(() => {
        flashHint('J/K navigate · Enter open · B back to index · H help');
        localStorage.setItem('writingHintShown', '1');
      }, 900);
    }
  }

  /* =========================================================
     CRAFT PAGE
     ========================================================= */
  const craftItems = Array.from(document.querySelectorAll('.craft-item-title'));

  if (craftItems.length) {
    let itemIndex = -1;

    function focusItem(index) {
      craftItems.forEach(el => el.classList.remove('craft-focused'));
      if (index < 0 || index >= craftItems.length) return;
      itemIndex = index;
      const el = craftItems[index];
      el.classList.add('craft-focused');
      el.focus({ preventScroll: false });
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      flashHint(`${el.textContent.trim()}  [${index + 1}/${craftItems.length}]`);
    }

    document.addEventListener('keydown', function (e) {
      if (isTyping()) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = document.activeElement.tagName;

      switch (e.key) {
        case 'j': case 'ArrowDown':
          e.preventDefault();
          focusItem(Math.min(itemIndex + 1, craftItems.length - 1));
          break;
        case 'k': case 'ArrowUp':
          e.preventDefault();
          focusItem(Math.max(itemIndex - 1, 0));
          break;
        case 'Enter':
          if (itemIndex >= 0) craftItems[itemIndex].click();
          break;
        case 'b': case 'B': case 'Backspace':
          if (tag === 'A') break;
          e.preventDefault();
          window.location.href = 'index.html';
          break;
        case 'Escape':
          craftItems.forEach(el => el.classList.remove('craft-focused'));
          itemIndex = -1;
          hint && hint.classList.remove('visible');
          break;
        case 't': case 'T': toggleTheme(); break;
        case 'h': case 'H': flashHint('J/K navigate · Enter open · B back · T theme'); break;
      }
    });

    craftItems.forEach((el, i) => {
      el.addEventListener('focus', () => { itemIndex = i; });
    });

    if (!localStorage.getItem('craftHintShown')) {
      setTimeout(() => {
        flashHint('J/K navigate · Enter open · B back to index');
        localStorage.setItem('craftHintShown', '1');
      }, 900);
    }
  }

})();