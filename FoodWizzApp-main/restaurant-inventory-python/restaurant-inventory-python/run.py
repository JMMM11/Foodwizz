#!/usr/bin/env python3
"""
FoodWizz - Restaurant Inventory Management System
Complete English version with beautiful orange design

To run the application:
1. Install dependencies: pip install -r requirements.txt
2. Run: python run.py
3. Open browser at: http://localhost:5000
"""

import os
import sys
from app import app, init_db

def main():
    print("FoodWizz - Restaurant Inventory Management System")
    print("=" * 60)
    
    # Initialize database
    print("Initializing database...")
    init_db()
    
    # Load sample data if database is empty
    try:
        from scripts.load_sample_data import load_sample_data
        import sqlite3
        
        conn = sqlite3.connect('restaurant_inventory.db')
        cursor = conn.cursor()
        
        # Check if we have any ingredients
        cursor.execute('SELECT COUNT(*) FROM ingredients')
        ingredient_count = cursor.fetchone()[0]
        
        if ingredient_count == 0:
            print("Loading sample data...")
            load_sample_data()
        
        conn.close()
        
    except Exception as e:
        print(f"⚠️  Error loading sample data: {e}")
    
    print("\nStarting server...")
    print("Application available at: http://localhost:5000")
    print("Create an account or use existing credentials to access")
    print("\nPress Ctrl+C to stop the server")
    print("=" * 60)

if __name__ == '__main__':
    main()
