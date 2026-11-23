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
const heroCard       = document.getElementById('hero-card');
const heroText       = document.getElementById('hero-text');
const heroAuthor     = document.getElementById('hero-author');
const heroCategory   = document.getElementById('hero-category');
const btnRandom      = document.getElementById('btn-random');
const searchInput    = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const btnClear       = document.getElementById('btn-clear');
const quotesGrid     = document.getElementById('quotes-grid');
const resultsSection = document.getElementById('results-section');
const resultsHeader  = document.getElementById('results-header');
const resultsCount   = document.getElementById('results-count');
const noResults      = document.getElementById('no-results');

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
 * Build and return a quote card DOM element.
 * Highlights `searchTerm` in both text and author if provided.
 */
function buildQuoteCard(quote, searchTerm = '') {
  const card = document.createElement('article');
  card.className = 'quote-card';

  const highlightedText   = highlight(quote.text,   searchTerm);
  const highlightedAuthor = highlight(quote.author, searchTerm);

  card.innerHTML = `
    <p class="card-text">${highlightedText}</p>
    <footer class="card-footer">
      <span class="card-author">${highlightedAuthor}</span>
      <span class="category-badge">${escapeHTML(quote.category)}</span>
    </footer>
  `;
  return card;
}

/** Render an array of quotes into the grid. */
function renderQuotes(quotes, searchTerm = '') {
  quotesGrid.innerHTML = '';

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

/** Read current form state and fetch matching quotes. */
async function runSearch() {
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
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (err) {
    console.error('Search failed:', err);
  }
}

function hideResults() {
  quotesGrid.innerHTML = '';
  resultsHeader.hidden = true;
  noResults.hidden = true;
}

function clearSearch() {
  searchInput.value      = '';
  categoryFilter.value   = '';
  hideResults();
  searchInput.focus();
}

// ── Event Listeners ────────────────────────────────────────────────

btnRandom.addEventListener('click', loadRandomQuote);
btnClear.addEventListener('click', clearSearch);

// Live search: debounced while typing
const debouncedSearch = debounce(runSearch, 300);
searchInput.addEventListener('input', debouncedSearch);

// Also run immediately on Enter key
searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    runSearch();
  }
});

// Auto-search when category changes
categoryFilter.addEventListener('change', runSearch);

// ── Init ───────────────────────────────────────────────────────────

(async function init() {
  await Promise.all([loadRandomQuote(), loadCategories()]);
})();
