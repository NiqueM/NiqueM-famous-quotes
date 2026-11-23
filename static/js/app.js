/**
 * Famous Quotes — Frontend Logic
 * Vanilla JS, no frameworks or build tools required.
 */

// ── API helpers ────────────────────────────────────────────────────
const API = {
  randomQuote:  () => fetch('/api/quotes/random').then(r => r.json()),
  categories:   () => fetch('/api/categories').then(r => r.json()),
  authors:      () => fetch('/api/authors').then(r => r.json()),
  quotes:       (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return fetch(`/api/quotes${qs ? '?' + qs : ''}`).then(r => r.json());
  },
};

// ── DOM refs ───────────────────────────────────────────────────────
const heroCard        = document.getElementById('hero-card');
const heroText        = document.getElementById('hero-text');
const heroAuthor      = document.getElementById('hero-author');
const heroCategory    = document.getElementById('hero-category');
const btnRandom       = document.getElementById('btn-random');
const searchInput     = document.getElementById('search-input');
const categoryFilter  = document.getElementById('category-filter');
const btnClear        = document.getElementById('btn-clear');
const btnExport       = document.getElementById('btn-export');
const themeToggle     = document.getElementById('theme-toggle-input');
const quotesGrid      = document.getElementById('quotes-grid');
const resultsSection  = document.getElementById('results-section');
const resultsHeader   = document.getElementById('results-header');
const resultsCount    = document.getElementById('results-count');
const noResults       = document.getElementById('no-results');

// ── State ──────────────────────────────────────────────────────────
/** Tracks whatever quotes are currently visible in the grid. Used by Export CSV. */
let currentResults = [];

// ── Utilities ──────────────────────────────────────────────────────

/** Escape HTML to prevent XSS when inserting user data into innerHTML. */
function escapeHTML(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(str).replace(/[&<>"']/g, m => map[m]);
}

/**
 * Wrap every occurrence of `term` in the `text` with a <mark> tag.
 * Both text and term should be plain strings.
 */
function highlight(text, term) {
  if (!term) return escapeHTML(text);
  const escaped = escapeHTML(text);
  const escapedTerm = escapeHTML(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escaped.replace(new RegExp(`(${escapedTerm})`, 'gi'), '<mark>$1</mark>');
}

/** Return a debounced version of `fn`, firing after `delay` ms of silence. */
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ── Hero Quote ─────────────────────────────────────────────────────

/** Animate the hero card out, update content, then animate back in. */
function displayHeroQuote(quote) {
  heroCard.classList.add('fade-out');

  setTimeout(() => {
    heroText.textContent     = quote.text;
    heroAuthor.textContent   = `— ${quote.author}`;
    heroCategory.textContent = quote.category;
    heroCategory.setAttribute('data-category', quote.category);
    heroCategory.style.cursor = 'pointer';
    heroCategory.title = `Filter by category: ${quote.category}`;
    heroAuthor.setAttribute('data-author', quote.author);
    heroAuthor.style.cursor = 'pointer';
    heroAuthor.title = `Search quotes by ${quote.author}`;

    heroCard.classList.remove('fade-out', 'fade-in');
    // Trigger reflow so the animation restarts
    void heroCard.offsetWidth;
    heroCard.classList.add('fade-in');
  }, 250);
}

async function loadRandomQuote() {
  btnRandom.disabled = true;
  try {
    const quote = await API.randomQuote();
    displayHeroQuote(quote);
  } catch (err) {
    console.error('Failed to fetch random quote:', err);
    heroText.textContent = 'Could not load a quote. Is the server running?';
  } finally {
    btnRandom.disabled = false;
  }
}

// ── Category Dropdown ──────────────────────────────────────────────

async function loadCategories() {
  try {
    const categories = await API.categories();
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      categoryFilter.appendChild(opt);
    });
  } catch (err) {
    console.error('Failed to fetch categories:', err);
  }
}

// ── Quote Cards ────────────────────────────────────────────────────

/**
 * Copy a quote's text and author to the clipboard.
 * Shows a brief "✓ Copied!" state on the button, then resets.
 */
async function copyQuoteToClipboard(quote, btn) {
  const formatted = `"${quote.text}" — ${quote.author}`;
  try {
    await navigator.clipboard.writeText(formatted);
    btn.textContent = '✓';
    btn.classList.add('copied');
    btn.title = 'Copied!';
    setTimeout(() => {
      btn.textContent = '📋';
      btn.classList.remove('copied');
      btn.title = 'Copy to clipboard';
    }, 2000);
  } catch {
    // Fallback for browsers that block clipboard without user gesture
    btn.textContent = '✗';
    setTimeout(() => { btn.textContent = '📋'; }, 1500);
  }
}

/**
 * Build and return a quote card DOM element.
 * Highlights `searchTerm` in both text and author if provided.
 */
function buildQuoteCard(quote, searchTerm = '') {
  const card = document.createElement('article');
  card.className = 'quote-card';

  const highlightedText   = highlight(quote.text,   searchTerm);
  const highlightedAuthor = highlight(quote.author, searchTerm);

  card.innerHTML = `
    <button class="btn-copy" title="Copy to clipboard" aria-label="Copy quote to clipboard">📋</button>
    <p class="card-text">${highlightedText}</p>
    <footer class="card-footer">
      <span class="card-author clickable-filter" data-author="${escapeHTML(quote.author)}" title="Search quotes by ${escapeHTML(quote.author)}">${highlightedAuthor}</span>
      <span class="category-badge clickable-filter" data-category="${escapeHTML(quote.category)}" title="Filter by category: ${escapeHTML(quote.category)}">${escapeHTML(quote.category)}</span>
    </footer>
  `;

  // Attach copy listener directly to the button element (avoids re-querying)
  card.querySelector('.btn-copy').addEventListener('click', function () {
    copyQuoteToClipboard(quote, this);
  });

  return card;
}

/** Render an array of quotes into the grid. */
function renderQuotes(quotes, searchTerm = '') {
  quotesGrid.innerHTML = '';
  currentResults = quotes; // keep state for CSV export

  if (quotes.length === 0) {
    noResults.hidden = false;
    resultsHeader.hidden = true;
    return;
  }

  noResults.hidden = true;
  resultsHeader.hidden = false;
  resultsCount.innerHTML = `Showing <strong>${quotes.length}</strong> quote${quotes.length !== 1 ? 's' : ''}`;

  // Stagger card animations slightly for a nicer effect
  const fragment = document.createDocumentFragment();
  quotes.forEach((quote, i) => {
    const card = buildQuoteCard(quote, searchTerm);
    card.style.animationDelay = `${Math.min(i * 40, 400)}ms`;
    fragment.appendChild(card);
  });
  quotesGrid.appendChild(fragment);
}

// ── Search & Filter ────────────────────────────────────────────────

/** Read current form state and fetch matching quotes.
 * @param {boolean} shouldScroll - only scroll when explicitly requested (Enter, click filter/category, etc.)
 */
async function runSearch(shouldScroll = false) {
  const q        = searchInput.value.trim();
  const category = categoryFilter.value;

  // If nothing is entered, hide the results grid
  if (!q && !category) {
    hideResults();
    return;
  }

  try {
    const quotes = await API.quotes({ q, category });
    renderQuotes(quotes, q);
    if (shouldScroll) {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  } catch (err) {
    console.error('Search failed:', err);
  }
}

/** Helper to filter directly by an author name */
function filterByAuthor(authorName) {
  searchInput.value = authorName;
  categoryFilter.value = '';
  runSearch(true);
}

/** Helper to filter directly by a category */
function filterByCategory(categoryName) {
  categoryFilter.value = categoryName;
  searchInput.value = '';
  runSearch(true);
}

function hideResults() {
  quotesGrid.innerHTML = '';
  resultsHeader.hidden = true;
  noResults.hidden = true;
  currentResults = [];
}

function clearSearch() {
  searchInput.value     = '';
  categoryFilter.value  = '';
  hideResults();
  searchInput.focus();
}

// ── Export CSV ─────────────────────────────────────────────────────

/**
 * Convert an array of quote objects to a CSV string and trigger a download.
 * If the grid has results, export those; otherwise fetch and export all 100.
 */
async function exportToCSV() {
  let quotes = currentResults.length > 0 ? currentResults : null;

  if (!quotes) {
    try {
      quotes = await API.quotes();
    } catch {
      alert('Could not fetch quotes for export. Is the server running?');
      return;
    }
  }

  const escape = val => `"${String(val).replace(/"/g, '""')}"`;
  const header = ['ID', 'Author', 'Category', 'Quote'].map(escape).join(',');
  const rows   = quotes.map(q =>
    [q.id, q.author, q.category, q.text].map(escape).join(',')
  );
  const csv    = [header, ...rows].join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const filename = currentResults.length > 0
    ? `quotes-filtered-${Date.now()}.csv`
    : 'famous-quotes-all.csv';

  a.href     = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Theme Toggle ───────────────────────────────────────────────────

function applyTheme(isLight) {
  document.documentElement.setAttribute('data-theme', isLight ? 'light' : 'dark');
  themeToggle.checked = isLight;
  localStorage.setItem('fq-theme', isLight ? 'light' : 'dark');
}

function initTheme() {
  const saved = localStorage.getItem('fq-theme');
  // Default to dark; respect saved preference or OS preference
  const preferLight = saved
    ? saved === 'light'
    : window.matchMedia('(prefers-color-scheme: light)').matches;
  applyTheme(preferLight);
}

// ── Event Listeners ────────────────────────────────────────────────

btnRandom.addEventListener('click', loadRandomQuote);
btnClear.addEventListener('click', clearSearch);
btnExport.addEventListener('click', exportToCSV);
themeToggle.addEventListener('change', () => applyTheme(themeToggle.checked));

// Live search: debounced while typing (no scroll)
const debouncedSearch = debounce(() => runSearch(false), 300);
searchInput.addEventListener('input', debouncedSearch);

// Also run immediately on Enter key (scroll to results)
searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    runSearch(true);
  }
});

// Auto-search when category changes (scroll to results)
categoryFilter.addEventListener('change', () => runSearch(true));

// Clickable author & category tags delegation on results and hero
heroCategory.addEventListener('click', () => {
  const cat = heroCategory.getAttribute('data-category');
  if (cat && cat !== '—') filterByCategory(cat);
});

heroAuthor.addEventListener('click', () => {
  const auth = heroAuthor.getAttribute('data-author');
  if (auth && auth !== '—') filterByAuthor(auth);
});

quotesGrid.addEventListener('click', e => {
  const target = e.target.closest('.clickable-filter');
  if (!target) return;
  if (target.dataset.author) {
    filterByAuthor(target.dataset.author);
  } else if (target.dataset.category) {
    filterByCategory(target.dataset.category);
  }
});

// ── Init ───────────────────────────────────────────────────────────

(async function init() {
  initTheme();
  await Promise.all([loadRandomQuote(), loadCategories()]);
})();
