"""
EngCoach Database Schema

Provides database connection and table creation for the EngCoach platform.
"""

import sqlite3
import json
from pathlib import Path

def get_db_connection():
    """Establishes a connection to the SQLite database."""
    db_path = Path(__file__).parent / "data" / "engcoach.db"
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def create_tables():
    """Creates the necessary tables in the database if they don't exist."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT,
        password TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        role TEXT NOT NULL DEFAULT 'candidate',
        avatar_url TEXT,
        created_at TEXT NOT NULL
    )
    """)

    # Learning Tracks table (dynamic curriculum for any role)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS learning_tracks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        target_role TEXT NOT NULL,
        cv_summary TEXT,
        curriculum_json TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)

    # Practice Sessions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS practice_sessions (
        id TEXT PRIMARY KEY,
        track_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        module_topic TEXT,
        mode TEXT DEFAULT 'coaching',
        chat_history TEXT,
        code_snapshot TEXT,
        whiteboard_snapshot TEXT,
        started_at TEXT,
        time_limit_minutes INTEGER,
        created_at TEXT NOT NULL,
        FOREIGN KEY (track_id) REFERENCES learning_tracks (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)

    # Chat Messages table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        context_snapshot TEXT,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES practice_sessions (id)
    )
    """)

    # Submissions table (graded results)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        mode TEXT DEFAULT 'coaching',
        final_code TEXT,
        final_whiteboard TEXT,
        ai_grade TEXT,
        strengths TEXT,
        weaknesses TEXT,
        next_steps TEXT,
        score INTEGER,
        created_at TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES practice_sessions (id)
    )
    """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    create_tables()
    print("EngCoach database tables created successfully.")
