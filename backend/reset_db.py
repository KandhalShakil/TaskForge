import os
import psycopg2
from decouple import config

def reset_database():
    try:
        # Read the environment variables the same way Django does!
        db_name = config('DB_NAME')
        db_user = config('DB_USER')
        db_password = config('DB_PASSWORD')
        db_host = config('DB_HOST')
        db_port = config('DB_PORT', default='6543')

        print(f"Connecting to {db_host}...")
        
        # Connect to Supabase
        conn = psycopg2.connect(
            dbname=db_name,
            user=db_user,
            password=db_password,
            host=db_host,
            port=db_port
        )
        conn.autocommit = True
        
        with conn.cursor() as cur:
            print("Dropping public schema (including all conflicting tables and migration history)...")
            cur.execute("DROP SCHEMA public CASCADE;")
            
            print("Recreating clean public schema...")
            cur.execute("CREATE SCHEMA public;")
            cur.execute("GRANT ALL ON SCHEMA public TO postgres;")
            cur.execute("GRANT ALL ON SCHEMA public TO public;")
            
        conn.close()
        print("Database fully reset! You can now safely run your migrations.")
        
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    reset_database()
