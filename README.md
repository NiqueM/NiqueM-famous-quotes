# 📖 NiqueM Famous Quotes

A single-page web application that displays 100 timeless famous quotes. Built with **Python Flask** (backend API) and **vanilla JavaScript + HTML/CSS** (frontend) — no frameworks, no build tools.

![Python](https://img.shields.io/badge/Python-3.8+-blue?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.0+-black?logo=flask&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

- 🎲 **Random quote hero** — a fresh quote greets you on every visit, with a smooth fade animation
- 🔍 **Live search** — results update as you type (debounced, 300 ms), searching across both quote text and author name
- 📂 **Category filter** — filter by 9 categories: Courage, Humor, Leadership, Life, Literature, Motivation, Philosophy, Science, Wisdom
- 🔗 **Combinable filters** — mix keyword search with a category for precise results
- ✨ **Search highlighting** — matched terms are highlighted in the results grid
- 📱 **Responsive design** — mobile-first, adapts from 1 column to 3 columns
- 🔒 **XSS-safe** — all dynamic content is HTML-escaped before DOM insertion

---

## 🗂️ Project Structure

```
famous-quotes/
├── app.py                  # Flask application & REST API
├── quotes.json             # 100 curated famous quotes
├── requirements.txt        # Python dependencies
├── templates/
│   └── index.html          # Single-page HTML shell
└── static/
    ├── css/
    │   └── style.css       # Dark theme, responsive layout
    └── js/
        └── app.js          # All frontend logic (vanilla JS)
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- pip

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/NiqueM/NiqueM-famous-quotes.git
cd NiqueM-famous-quotes

# 2. (Optional) Create a virtual environment
python -m venv .venv
source .venv/bin/activate      # macOS/Linux
.venv\Scripts\activate         # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start the development server
flask --app app run --debug
```

Then open your browser at **http://127.0.0.1:5000**

> **Tip:** Use `--port 8080` if port 5000 is already in use.

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Serves the HTML shell |
| `GET` | `/api/quotes/random` | Returns one random quote |
| `GET` | `/api/quotes` | Returns filtered quotes (see params below) |
| `GET` | `/api/authors` | Sorted list of unique authors |
| `GET` | `/api/categories` | Sorted list of unique categories |

### Query Parameters for `/api/quotes`

| Param | Example | Description |
|-------|---------|-------------|
| `q` | `?q=opportunity` | Full-text search in quote text and author |
| `author` | `?author=Einstein` | Case-insensitive partial match on author |
| `category` | `?category=Wisdom` | Exact category match |

**Example:**
```
GET /api/quotes?q=life&category=Wisdom
```

---

## 📊 Quotes Data

- **100 quotes** across **9 categories**
- **66 unique authors** including Einstein, Shakespeare, Twain, Gandhi, Angelou, Churchill, Mandela, Wilde, and many more

| Category | Count |
|----------|-------|
| Motivation | 15 |
| Philosophy | 12 |
| Literature | 10 |
| Wisdom | 9 |
| Life | 8 |
| Courage | 8 |
| Leadership | 9 |
| Science | 10 |
| Humor | 8 |
| Misc | 11 |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, Flask |
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES6+) |
| Data | JSON |
| Styling | CSS Custom Properties, Grid, Flexbox |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
