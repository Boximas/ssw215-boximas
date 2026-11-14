# Sprint 2: Flask and SQLite

The game now serves its frontend and JSON API from one Flask origin. Figure data is
seeded from `backend/seed_figures.json`; rounds, guesses, and session stats are stored
in `backend/mystery_figure.db`.

## Run locally

From `projects/backend`, install Flask and start the app:

```sh
python -m pip install -r requirements.txt
python app.py
```

Open `http://localhost:5000` in a browser. The SQLite database is created and seeded
on first start.

The frontend loads history and the current round from the API on page load. Round
creation, guessing, skipping clues, and history deletion are all handled by the
backend; the frontend contains no figure data or guess matcher.
