"""Small SQLite helpers shared by the two database exercises."""
import sqlite3
from pathlib import Path
from flask import current_app, g


def get_db():
    """Open one connection for this request; rows can be read by column name."""
    if "db" not in g:
        g.db = sqlite3.connect(current_app.config["DATABASE"])
        g.db.row_factory = sqlite3.Row
    return g.db


def close_db(error=None):
    """Flask calls this after the request/app context ends."""
    connection = g.pop("db", None)
    if connection is not None:
        connection.close()


def init_db():
    """Create the tables without deleting any previously saved records."""
    schema = Path(__file__).with_name("schema.sql").read_text(encoding="utf-8")
    connection = get_db()
    connection.executescript(schema)
    connection.commit()
