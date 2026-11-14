import json
import logging
import random
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, abort, jsonify, request, send_from_directory

import db
from matcher import check_guess, normalize


FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
app = Flask(__name__, static_folder=None)
app.logger.setLevel(logging.INFO)
db.init_db()


def error_response(code: str, message: str, status: int, field=None):
    return jsonify(
        {"error": {"code": code, "message": message, "field": field}}
    ), status


def timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_round_record(round_id: int):
    with db.connect() as connection:
        row = connection.execute(
            "SELECT * FROM rounds WHERE id = ?", (round_id,)
        ).fetchone()
        if row is None:
            return None
        round_data = db.round_from_row(row)
        figure_row = connection.execute(
            "SELECT * FROM figures WHERE id = ?", (round_data["figure_id"],)
        ).fetchone()
    round_data["figure"] = db.figure_from_row(figure_row)
    return round_data


def public_round(round_data: dict) -> dict:
    playing = round_data["status"] == "playing"
    figure = round_data["figure"]
    clues = figure["clues"][: round_data["clues_revealed"]]
    if not playing:
        clues = figure["clues"]
    return {
        "id": round_data["id"],
        "status": round_data["status"],
        "clues_revealed": round_data["clues_revealed"],
        "total_clues": len(figure["clues"]),
        "clues": clues,
        "guesses": round_data["guesses"],
        "score": round_data["score"],
        "correct": None if playing else round_data["status"] == "won",
        "figure": (
            None
            if playing
            else {
                "slug": figure["slug"],
                "name": figure["name"],
                "reveal": figure["reveal"],
            }
        ),
        "created_at": round_data["created_at"],
        "finished_at": round_data["finished_at"],
    }


def stats_and_history():
    with db.connect() as connection:
        rows = connection.execute(
            "SELECT * FROM rounds WHERE status != 'playing' ORDER BY id DESC"
        ).fetchall()
    rounds = [get_round_record(row["id"]) for row in rows]
    stats = {
        "played": len(rounds),
        "correct": sum(round_data["status"] == "won" for round_data in rounds),
        "streak": 0,
    }
    for round_data in rounds:
        if round_data["status"] != "won":
            break
        stats["streak"] += 1
    return [public_round(round_data) for round_data in rounds], stats


def find_round(round_id: int):
    round_data = get_round_record(round_id)
    if round_data is None:
        return None, error_response(
            "round_not_found", "That round does not exist.", 404
        )
    return round_data, None


@app.get("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.get("/api/rounds")
def rounds():
    finished_rounds, stats = stats_and_history()
    return jsonify({"rounds": finished_rounds, "stats": stats}), 200


@app.get("/api/rounds/current")
def current_round():
    with db.connect() as connection:
        row = connection.execute(
            "SELECT id FROM rounds WHERE status = 'playing' ORDER BY id DESC LIMIT 1"
        ).fetchone()
    round_data = get_round_record(row["id"]) if row else None
    return jsonify({"round": public_round(round_data) if round_data else None}), 200


@app.get("/api/rounds/<int:round_id>")
def round_detail(round_id: int):
    round_data, error = find_round(round_id)
    if error:
        return error
    return jsonify(public_round(round_data)), 200


@app.post("/api/rounds")
def create_round():
    now = timestamp()
    with db.connect() as connection:
        connection.execute(
            """
            UPDATE rounds
            SET status = 'lost', score = 0, finished_at = ?
            WHERE status = 'playing'
            """,
            (now,),
        )
        figures = connection.execute(
            """
            SELECT figures.*, COUNT(rounds.id) AS played_count
            FROM figures
            LEFT JOIN rounds ON rounds.figure_id = figures.id
            GROUP BY figures.id
            """
        ).fetchall()
        if not figures:
            raise RuntimeError("No figures are available to start a round.")
        least_played = min(figure["played_count"] for figure in figures)
        candidates = [
            db.figure_from_row(figure)
            for figure in figures
            if figure["played_count"] == least_played
        ]
        figure = random.choice(candidates)
        cursor = connection.execute(
            """
            INSERT INTO rounds (figure_id, status, clues_revealed, guesses_json,
                                score, created_at, finished_at)
            VALUES (?, 'playing', 1, '[]', NULL, ?, NULL)
            """,
            (figure["id"], now),
        )
        round_id = cursor.lastrowid
    return jsonify(public_round(get_round_record(round_id))), 201


@app.post("/api/rounds/<int:round_id>/guesses")
def submit_guess(round_id: int):
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return error_response("invalid_body", "A JSON object is required.", 400)
    guess = body.get("guess")
    if not isinstance(guess, str):
        return error_response(
            "invalid_guess", "Guess must be a string.", 400, "guess"
        )
    guess = guess.strip()
    if not guess:
        return error_response("empty_guess", "Enter a name first.", 400, "guess")
    if len(guess) > 60:
        return error_response(
            "guess_too_long", "Guess must be 60 characters or fewer.", 400, "guess"
        )

    round_data, error = find_round(round_id)
    if error:
        return error
    if round_data["status"] != "playing":
        return error_response("round_finished", "This round is already finished.", 400)
    normalized_guess = normalize(guess)
    if any(
        normalize(existing) == normalized_guess
        for existing in round_data["guesses"]
    ):
        return error_response(
            "duplicate_guess", "You already guessed that.", 400, "guess"
        )

    match = check_guess(guess, round_data["figure"])
    app.logger.info("Round %s guess %r match=%s", round_id, guess, match)
    guesses = [*round_data["guesses"], guess]
    new_status = round_data["status"]
    clues_revealed = round_data["clues_revealed"]
    score = round_data["score"]
    finished_at = round_data["finished_at"]
    if match:
        new_status = "won"
        score = 7 - clues_revealed
        finished_at = timestamp()
    elif clues_revealed == 6:
        new_status = "lost"
        score = 0
        finished_at = timestamp()
    else:
        clues_revealed += 1

    with db.connect() as connection:
        connection.execute(
            """
            UPDATE rounds
            SET status = ?, clues_revealed = ?, guesses_json = ?, score = ?,
                finished_at = ?
            WHERE id = ?
            """,
            (
                new_status,
                clues_revealed,
                json.dumps(guesses, ensure_ascii=False),
                score,
                finished_at,
                round_id,
            ),
        )
    updated_round = get_round_record(round_id)
    return jsonify({"match": match, "round": public_round(updated_round)}), 200


@app.post("/api/rounds/<int:round_id>/skip")
def skip_clue(round_id: int):
    round_data, error = find_round(round_id)
    if error:
        return error
    if round_data["status"] != "playing":
        return error_response("round_finished", "This round is already finished.", 400)
    if round_data["clues_revealed"] >= 6:
        return error_response("no_more_clues", "No more clues are available.", 400)
    with db.connect() as connection:
        connection.execute(
            "UPDATE rounds SET clues_revealed = clues_revealed + 1 WHERE id = ?",
            (round_id,),
        )
    return jsonify(public_round(get_round_record(round_id))), 200


@app.delete("/api/rounds/<int:round_id>")
def delete_round(round_id: int):
    round_data, error = find_round(round_id)
    if error:
        return error
    if round_data["status"] == "playing":
        return error_response(
            "round_in_progress", "A round in progress cannot be removed.", 400
        )
    with db.connect() as connection:
        connection.execute("DELETE FROM rounds WHERE id = ?", (round_id,))
    return "", 204


@app.get("/favicon.ico")
def favicon():
    return "", 204


@app.route("/<path:filename>")
def frontend_file(filename: str):
    if filename.startswith("api/"):
        abort(404)
    return send_from_directory(FRONTEND_DIR, filename)


@app.errorhandler(404)
def handle_not_found(_error):
    return error_response("not_found", "The requested resource was not found.", 404)


@app.errorhandler(405)
def handle_method_not_allowed(_error):
    return error_response(
        "method_not_allowed", "This method is not allowed for this resource.", 405
    )


@app.errorhandler(Exception)
def handle_unexpected_error(error):
    app.logger.exception("Unhandled server error: %s", error)
    return error_response(
        "internal_server_error",
        "Something went wrong on the server. Please try again.",
        500,
    )


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
