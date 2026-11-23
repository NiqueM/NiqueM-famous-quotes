import json
import random
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# Load quotes once at startup
with open("quotes.json", encoding="utf-8") as f:
    QUOTES = json.load(f)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/quotes/random")
def random_quote():
    """Return a single random quote."""
    return jsonify(random.choice(QUOTES))


@app.route("/api/quotes")
def get_quotes():
    """
    Return filtered quotes.
    Query params:
      - author   : case-insensitive partial match on author name
      - category : exact category match
      - q        : full-text search across text and author
    """
    results = QUOTES

    author = request.args.get("author", "").strip().lower()
    category = request.args.get("category", "").strip()
    q = request.args.get("q", "").strip().lower()

    if author:
        results = [r for r in results if author in r["author"].lower()]
    if category:
        results = [r for r in results if r["category"] == category]
    if q:
        results = [
            r for r in results
            if q in r["text"].lower() or q in r["author"].lower()
        ]

    return jsonify(results)


@app.route("/api/authors")
def get_authors():
    """Return a sorted list of unique author names."""
    return jsonify(sorted({q["author"] for q in QUOTES}))


@app.route("/api/categories")
def get_categories():
    """Return a sorted list of unique category names."""
    return jsonify(sorted({q["category"] for q in QUOTES}))


if __name__ == "__main__":
    app.run(debug=True)
