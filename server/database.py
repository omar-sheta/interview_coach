import sqlite3
import json
from pathlib import Path

def get_db_connection():
    """Establishes a connection to the SQLite database."""
    db_path = Path(__file__).parent / "data" / "hr_agent.db"
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def create_tables():
    """Creates the necessary tables in the database if they don't exist."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # User table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT,
        first_name TEXT,
        last_name TEXT,
        role TEXT NOT NULL,
        avatar_url TEXT,
        created_at TEXT NOT NULL
    )
    """)

    # Migration: Add avatar_url if it doesn't exist
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN avatar_url TEXT")
    except sqlite3.OperationalError:
        pass # Column likely already exists
    
    # Migration: Add first_name and last_name if they don't exist
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN first_name TEXT")
    except sqlite3.OperationalError:
        pass
    
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN last_name TEXT")
    except sqlite3.OperationalError:
        pass


    # Interviews table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS interviews (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        config TEXT,
        allowed_candidate_ids TEXT,
        deadline TEXT,
        active BOOLEAN NOT NULL,
        ai_recommendation TEXT
    )
    """)

    # Migration: Add ai_recommendation if it doesn't exist
    try:
        cursor.execute("ALTER TABLE interviews ADD COLUMN ai_recommendation TEXT")
    except sqlite3.OperationalError:
        pass  # Column likely already exists


    # Results table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS results (
        id TEXT PRIMARY KEY,
        session_id TEXT UNIQUE NOT NULL,
        interview_id TEXT,
        candidate_id TEXT,
        candidate_username TEXT,
        interview_title TEXT,
        timestamp TEXT,
        answers TEXT,
        feedback TEXT,
        scores TEXT,
        summary TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        status TEXT
    )
    """)

    # Learning Plans table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS learning_plans (
        user_id TEXT PRIMARY KEY,
        target_role TEXT,
        curriculum TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT
    )
    """)

    # Practice Sessions table (updated for Coaching/Interview modes)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS practice_sessions (
        session_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        module_id TEXT,
        mode TEXT DEFAULT 'coaching',
        code_snapshot TEXT,
        diagram_path TEXT,
        started_at TEXT,
        time_limit_minutes INTEGER,
        created_at TEXT NOT NULL
    )
    """)

    # Migrations for practice_sessions
    try:
        cursor.execute("ALTER TABLE practice_sessions ADD COLUMN mode TEXT DEFAULT 'coaching'")
    except sqlite3.OperationalError:
        pass
    try:
        cursor.execute("ALTER TABLE practice_sessions ADD COLUMN started_at TEXT")
    except sqlite3.OperationalError:
        pass
    try:
        cursor.execute("ALTER TABLE practice_sessions ADD COLUMN time_limit_minutes INTEGER")
    except sqlite3.OperationalError:
        pass

    # Chat Messages table (updated with context snapshot)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        context_snapshot TEXT,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES practice_sessions (session_id)
    )
    """)

    # Migration for chat_messages
    try:
        cursor.execute("ALTER TABLE chat_messages ADD COLUMN context_snapshot TEXT")
    except sqlite3.OperationalError:
        pass

    # Submissions table (updated for interview grading)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        mode TEXT DEFAULT 'coaching',
        final_code TEXT,
        final_diagram_path TEXT,
        ai_grade TEXT,
        interview_result TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES practice_sessions (session_id)
    )
    """)

    # Migrations for submissions
    try:
        cursor.execute("ALTER TABLE submissions ADD COLUMN mode TEXT DEFAULT 'coaching'")
    except sqlite3.OperationalError:
        pass
    try:
        cursor.execute("ALTER TABLE submissions ADD COLUMN interview_result TEXT")
    except sqlite3.OperationalError:
        pass

    conn.commit()
    conn.close()

if __name__ == "__main__":
    create_tables()
    print("Database tables created successfully.")
