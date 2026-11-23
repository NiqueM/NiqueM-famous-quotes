import sys, json, random
sys.path.insert(0, '.')

# Validate quotes.json
with open('quotes.json', encoding='utf-8') as f:
    quotes = json.load(f)
print(f"quotes.json: {len(quotes)} quotes loaded")

# Check required fields
for q in quotes:
    assert all(k in q for k in ('id','text','author','category')), f"Bad quote: {q}"
print("All quotes have required fields.")

# Simulate API filter logic
def api_quotes(qs, author='', category='', q=''):
    r = qs
    if author:   r = [x for x in r if author.lower() in x['author'].lower()]
    if category: r = [x for x in r if x['category'] == category]
    if q:        r = [x for x in r if q.lower() in x['text'].lower() or q.lower() in x['author'].lower()]
    return r

einstein = api_quotes(quotes, author='Einstein')
ids = [str(x['id']) for x in einstein]
print(f"author=Einstein -> {len(einstein)} quotes: {', '.join(ids)}")

humor = api_quotes(quotes, category='Humor')
print(f"category=Humor -> {len(humor)} quotes")

opp = api_quotes(quotes, q='opportunity')
snippets = [x['text'][:40] for x in opp]
print(f"q=opportunity -> {len(opp)} quotes")
for s in snippets:
    print(f"  - {s}")

cats = sorted({q['category'] for q in quotes})
print(f"Categories ({len(cats)}): {cats}")

authors = sorted({q['author'] for q in quotes})
print(f"Unique authors: {len(authors)}")

rnd = random.choice(quotes)
print(f"Random sample: [{rnd['id']}] {rnd['author']}: {rnd['text'][:50]}")
print("All checks passed.")
