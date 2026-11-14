import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator


BACKEND_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BACKEND_DIR / "mystery_figure.db"
SEED_PATH = BACKEND_DIR / "seed_figures.json"
SCHEMA_PATH = BACKEND_DIR / "schema.sql"


@contextmanager
def connect() -> Iterator[sqlite3.Connection]:
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        with connection:
            yield connection
    finally:
        connection.close()


def init_db() -> None:
    with connect() as connection:
        connection.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
        figure_count = connection.execute("SELECT COUNT(*) FROM figures").fetchone()[0]
        if figure_count == 0:
            figures = json.loads(SEED_PATH.read_text(encoding="utf-8"))
            connection.executemany(
                """
                INSERT INTO figures
                    (id, slug, name, clues_json, reveal, aliases_json)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                [
                    (
                        figure["id"],
                        figure["slug"],
                        figure["name"],
                        json.dumps(figure["clues"], ensure_ascii=False),
                        figure["reveal"],
                        json.dumps(figure["aliases"], ensure_ascii=False),
                    )
                    for figure in figures
                ],
            )


def figure_from_row(row: sqlite3.Row) -> dict:
    figure = dict(row)
    figure["clues"] = json.loads(figure.pop("clues_json"))
    figure["aliases"] = json.loads(figure.pop("aliases_json"))
    return figure


def round_from_row(row: sqlite3.Row) -> dict:
    round_data = dict(row)
    round_data["guesses"] = json.loads(round_data.pop("guesses_json"))
    return round_data
