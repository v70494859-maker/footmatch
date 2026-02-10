#!/usr/bin/env python3
"""
Apply seed.sql to Supabase via the Management API.
Reads seed.sql, splits into SQL statements, and executes them in batches.
"""

import json
import ssl
import sys
import urllib.request
import urllib.error

SEED_FILE = "/Users/atdevz/Desktop/footmatch/supabase/seed.sql"
API_URL = "https://api.supabase.com/v1/projects/glvuyedwuzwkdocrcpng/database/query"
API_TOKEN = "sbp_85ca1ca4e37ab09d38a08c2fad30d1862f2deb23"
MAX_BATCH_SIZE = 50_000  # ~50KB per batch

# Create SSL context that doesn't verify certificates (macOS Python issue)
SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE


def split_sql_statements(sql_text: str) -> list:
    """
    Split SQL text into individual statements on semicolons,
    properly handling single-quoted strings (including escaped quotes '').
    """
    statements = []
    current = []
    in_single_quote = False
    i = 0
    length = len(sql_text)

    while i < length:
        ch = sql_text[i]

        if in_single_quote:
            current.append(ch)
            if ch == "'":
                # Check for escaped quote ''
                if i + 1 < length and sql_text[i + 1] == "'":
                    current.append(sql_text[i + 1])
                    i += 2
                    continue
                else:
                    in_single_quote = False
        else:
            if ch == "'":
                in_single_quote = True
                current.append(ch)
            elif ch == ";":
                stmt = "".join(current).strip()
                if stmt:
                    statements.append(stmt)
                current = []
            elif ch == "-" and i + 1 < length and sql_text[i + 1] == "-":
                # Line comment: skip to end of line
                while i < length and sql_text[i] != "\n":
                    current.append(sql_text[i])
                    i += 1
                if i < length:
                    current.append(sql_text[i])  # append the newline
            else:
                current.append(ch)

        i += 1

    # Handle any remaining text
    remaining = "".join(current).strip()
    if remaining:
        statements.append(remaining)

    return statements


def is_meaningful_statement(stmt: str) -> bool:
    """Check if a statement is meaningful (not just comments or whitespace)."""
    lines = stmt.strip().split("\n")
    for line in lines:
        stripped = line.strip()
        if stripped and not stripped.startswith("--"):
            return True
    return False


def execute_query(query: str):
    """Send a SQL query to the Supabase Management API."""
    body = json.dumps({"query": query}).encode("utf-8")
    req = urllib.request.Request(
        API_URL,
        data=body,
        headers={
            "Authorization": "Bearer " + API_TOKEN,
            "Content-Type": "application/json",
            "User-Agent": "FootMatch-SeedScript/1.0",
            "Accept": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120, context=SSL_CTX) as resp:
            resp_body = resp.read().decode("utf-8")
            if resp.status != 200 and resp.status != 201:
                return {"error": "HTTP {}: {}".format(resp.status, resp_body)}
            try:
                data = json.loads(resp_body)
                # Check for error in the response body
                if isinstance(data, list) and len(data) > 0:
                    for item in data:
                        if isinstance(item, dict) and "error" in item:
                            return {"error": item["error"]}
                elif isinstance(data, dict) and "error" in data:
                    return {"error": data["error"]}
                return data
            except json.JSONDecodeError:
                return None
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        return {"error": "HTTP {}: {}".format(e.code, error_body)}
    except urllib.error.URLError as e:
        return {"error": "URL Error: {}".format(e.reason)}


def main():
    # 1. Read seed.sql
    print("Reading {}...".format(SEED_FILE))
    try:
        with open(SEED_FILE, "r", encoding="utf-8") as f:
            sql_content = f.read()
    except FileNotFoundError:
        print("ERROR: File not found: {}".format(SEED_FILE))
        sys.exit(1)

    print("  Read {:,} characters".format(len(sql_content)))

    # 2. Execute cleanup statements
    cleanup_statements = [
        "DELETE FROM notifications",
        "DELETE FROM match_messages",
        "DELETE FROM match_player_stats",
        "DELETE FROM player_career_stats",
        "DELETE FROM match_results",
        "DELETE FROM match_registrations",
        "DELETE FROM matches",
        "DELETE FROM operator_payouts",
        "DELETE FROM operator_applications",
        "DELETE FROM operators",
        "DELETE FROM subscriptions",
        "DELETE FROM profiles",
        "DELETE FROM platform_config",
        "DELETE FROM auth.identities",
        "DELETE FROM auth.users",
    ]

    print("\n--- CLEANUP PHASE ---")
    cleanup_query = ";\n".join(cleanup_statements) + ";"
    print("Executing cleanup (all tables)... ", end="", flush=True)
    result = execute_query(cleanup_query)
    if result and isinstance(result, dict) and "error" in result:
        print("ERROR")
        print("  {}".format(result["error"]))
        sys.exit(1)
    print("done")

    # 3. Parse seed.sql into statements
    print("\n--- SEED PHASE ---")
    print("Parsing SQL statements... ", end="", flush=True)
    statements = split_sql_statements(sql_content)
    # Filter out comments-only and empty statements
    statements = [s for s in statements if is_meaningful_statement(s)]
    print("found {} statements".format(len(statements)))

    # 4. Batch statements together (up to MAX_BATCH_SIZE)
    batches = []
    current_batch = []
    current_size = 0

    for stmt in statements:
        stmt_with_semicolon = stmt + ";"
        stmt_size = len(stmt_with_semicolon)

        if current_size + stmt_size > MAX_BATCH_SIZE and current_batch:
            batches.append(current_batch)
            current_batch = []
            current_size = 0

        current_batch.append(stmt_with_semicolon)
        current_size += stmt_size

    if current_batch:
        batches.append(current_batch)

    print("Organized into {} batches".format(len(batches)))

    # 5. Execute each batch
    for i, batch in enumerate(batches, 1):
        batch_query = "\n".join(batch)
        batch_size_kb = len(batch_query) / 1024
        print(
            "Executing batch {}/{} ({} stmts, {:.1f}KB)... ".format(
                i, len(batches), len(batch), batch_size_kb
            ),
            end="",
            flush=True,
        )

        result = execute_query(batch_query)

        if result and isinstance(result, dict) and "error" in result:
            print("ERROR")
            print("  {}".format(result["error"]))
            print("\n  Failed batch content (first 500 chars):")
            print("  {}".format(batch_query[:500]))
            sys.exit(1)

        print("done")

    print(
        "\nSeed applied successfully! ({} statements in {} batches)".format(
            len(statements), len(batches)
        )
    )


if __name__ == "__main__":
    main()
