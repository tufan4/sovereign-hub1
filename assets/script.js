// Debounce function to limit the rate at which a function gets called
function debounce(func, wait = 10, immediate = true) {
  let timeout;
  return function() {
    const context = this, args = arguments;
    const later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

// ===== NAVIGATION =====
const sections = document.querySelectorAll('.section');
const navItems = document.querySelectorAll('.nav-item');
const sectionTitles = {
  'home': 'Genel Bakış',
  's1': 'Temel Komutlar & Lojik',
  's2': 'Hafıza Alanları',
  's3': 'Zaman Röleleri',
  's4': 'Sayıcılar',
  's5': 'STL Yığın İşlemleri',
  's6': 'Gelişmiş Operasyonlar',
  's7': 'Özel Hafıza (SM) Bitleri',
  'diagrams': 'Diyagramlar & Demo',
  'errors': 'Hata Referans Tablosu'
};

function showSection(id) {
  // Hide all sections
  sections.forEach(section => {
    section.classList.remove('active');
  });

  // Show the target section
  const activeSection = document.getElementById(id);
  if (activeSection) {
    activeSection.classList.add('active');
  }

  // Update nav item states
  navItems.forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('onclick').includes(`'${id}'`)) {
      item.classList.add('active');
    }
  });

  // Update breadcrumb
  document.getElementById('breadcrumb').textContent = '/ ' + (sectionTitles[id] || id);
  window.scrollTo(0, 0);

  // Mobil cihazlarda bir bölüme tıklandığında sidebar'ı otomatik kapat
  if (window.innerWidth < 900) {
    document.getElementById('sidebar').classList.remove('open');
  }
}


// ===== THEME =====
const themeToggle = document.getElementById('toggleTrack');
const themeLabel = document.getElementById('themeLabel');
const htmlEl = document.documentElement;

function toggleTheme() {
  const currentTheme = htmlEl.getAttribute('data-theme');
  if (currentTheme === 'dark') {
    htmlEl.setAttribute('data-theme', 'light');
    themeToggle.classList.remove('on');
    themeLabel.textContent = '🌙 Koyu Tema';
    localStorage.setItem('theme', 'light');
  } else {
    htmlEl.setAttribute('data-theme', 'dark');
    themeToggle.classList.add('on');
    themeLabel.textContent = '☀ Açık Tema';
    localStorage.setItem('theme', 'dark');
  }
}

// Check for saved theme in localStorage
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  htmlEl.setAttribute('data-theme', savedTheme);
  if (savedTheme === 'light') {
    themeToggle.classList.remove('on');
    themeLabel.textContent = '🌙 Koyu Tema';
  } else {
    themeToggle.classList.add('on');
    themeLabel.textContent = '☀ Açık Tema';
  }
} else {
  // Default to dark theme if no preference is saved
  htmlEl.setAttribute('data-theme', 'dark');
  themeToggle.classList.add('on');
  themeLabel.textContent = '☀ Açık Tema';
}


// ===== SIDEBAR TOGGLE =====
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ===== SEARCH =====
let searchableText = [];

function prepareSearch() {
  const elements = document.querySelectorAll('.section .card-title, .section h2, .section .callout-title, .section .table-wrap, .section .ladder-title, .section .code-lang');
  elements.forEach(el => {
    searchableText.push({
      text: el.innerText.toLowerCase(),
      element: el
    });
  });
}

function handleSearch(query) {
  const normalizedQuery = query.toLowerCase().trim();

  // Clear previous highlights
  const highlights = document.querySelectorAll('.search-highlight');
  highlights.forEach(h => {
    // Replace the highlight span with its original text content
    const parent = h.parentNode;
    parent.replaceChild(document.createTextNode(h.textContent), h);
    parent.normalize(); // Merges adjacent text nodes
  });

  if (normalizedQuery.length < 2) return;

  const mainContent = document.getElementById('main');
  const walker = document.createTreeWalker(mainContent, NodeFilter.SHOW_TEXT, null, false);
  let node;
  const nodesToWrap = [];

  while (node = walker.nextNode()) {
    if (node.parentNode.closest('pre, code, .nav-item')) continue; // Skip certain areas

    const nodeText = node.nodeValue.toLowerCase();
    let matchIndex = nodeText.indexOf(normalizedQuery);

    if (matchIndex !== -1) {
      nodesToWrap.push({ node, matchIndex, query: normalizedQuery });
    }
  }

  // Wrap matches to avoid modifying the DOM while iterating
  nodesToWrap.forEach(({ node, matchIndex, query }) => {
    const originalText = node.nodeValue;
    const before = originalText.substring(0, matchIndex);
    const matched = originalText.substring(matchIndex, matchIndex + query.length);
    const after = originalText.substring(matchIndex + query.length);

    const span = document.createElement('span');
    span.className = 'search-highlight';
    span.textContent = matched;

    const parent = node.parentNode;
    parent.insertBefore(document.createTextNode(before), node);
    parent.insertBefore(span, node);
    parent.insertBefore(document.createTextNode(after), node);
    parent.removeChild(node);
  });
}


// ===== LADDER LOGIC =====
function setupLadder(svgId, inputs, logic) {
  const svg = document.getElementById(svgId);
  if (!svg) return;

  const inputElements = {};
  inputs.forEach(id => {
    inputElements[id] = svg.querySelectorAll(`[data-input="${id}"]`);
  });

  function update() {
    const inputStates = {};
    inputs.forEach(id => {
      // Find the button state
      const btn = document.querySelector(`[onclick*="toggleInput('${svgId}', '${id}']`);
      inputStates[id] = btn ? btn.classList.contains('active') : false;
    });

    const outputStates = logic(inputStates);

    // Update wires and components based on outputStates
    Object.keys(outputStates).forEach(key => {
      const elements = svg.querySelectorAll(`[data-wire="${key}"], [data-component="${key}"]`);
      elements.forEach(el => {
        if (outputStates[key]) {
          el.classList.add('energized');
        } else {
          el.classList.remove('energized');
        }
      });
    });
  }

  return { update };
}

function toggleInput(svgId, inputId) {
  const btn = event.target;
  btn.classList.toggle('active');
  const ladder = window.ladders[svgId];
  if (ladder) {
    ladder.update();
  }
}

// ===== COUNTER LOGIC =====
function setupCounter(id, max) {
  const display = document.getElementById(`counter-val-${id}`);
  const bar = document.getElementById(`counter-bar-${id}`);
  let value = 0;

  function updateDisplay() {
    display.textContent = value;
    bar.style.width = `${(value / max) * 100}%`;
    if (value >= max) {
      display.classList.add('maxed');
    } else {
      display.classList.remove('maxed');
    }
  }

  return {
    up: () => {
      if (value < max) value++;
      updateDisplay();
    },
    down: () => {
      if (value > 0) value--;
      updateDisplay();
    },
    reset: () => {
      value = 0;
      updateDisplay();
    }
  };
}


// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {

  // Hash-based navigation
  if (window.location.hash) {
    const sectionId = window.location.hash.substring(1);
    showSection(sectionId);
  } else {
    showSection('home');
  }

  // Ladder animations
  window.ladders = {};

  window.ladders['lad-1'] = setupLadder('lad-1', ['I0.0'], (i) => ({
    out: i['I0.0']
  }));

  window.ladders['lad-2'] = setupLadder('lad-2', ['I0.0', 'I0.1'], (i) => {
    const mid = i['I0.0'] && i['I0.1'];
    return { w1: i['I0.0'], w2: mid, out: mid };
  });

  window.ladders['lad-3'] = setupLadder('lad-3', ['I0.0', 'I0.1'], (i) => {
    const out = i['I0.0'] || i['I0.1'];
    return { w1: i['I0.0'], w2: i['I0.1'], out: out };
  });

  // Initialize all ladders
  Object.values(window.ladders).forEach(l => l.update());


  // Counter demo
  const counter = setupCounter('c5', 10);
  document.getElementById('counter-up-c5').addEventListener('click', counter.up);
  document.getElementById('counter-down-c5').addEventListener('click', counter.down);
  document.getElementById('counter-reset-c5').addEventListener('click', counter.reset);
  counter.reset(); // Initial display
});