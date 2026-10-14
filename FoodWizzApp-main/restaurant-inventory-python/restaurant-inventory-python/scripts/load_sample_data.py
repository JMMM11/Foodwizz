#!/usr/bin/env python3
"""
Sample data loader for FoodWizz Restaurant Management System
This script loads comprehensive sample data including ingredients, dishes, and distributors
"""

import sqlite3
import sys
import os
import json

def load_sample_data():
    """Load comprehensive sample data into the database"""
    
    # Add the parent directory to the path to import from app.py
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    try:
        from app import init_db, load_sample_data as app_load_sample_data
        
        print("Initializing database...")
        init_db()
        
        print("Loading sample data...")
        app_load_sample_data()
        
        print("✅ Sample data loaded successfully!")
        print("\nSample data includes:")
        print("- 40+ ingredients with suppliers")
        print("- 15+ dishes with complete recipes")
        print("- 8 distributors from Panama")
        print("- Complete inventory management system")
        
    except ImportError as e:
        print(f"❌ Error importing app module: {e}")
        print("Make sure you're running this script from the project root directory")
        return False
    except Exception as e:
        print(f"❌ Error loading sample data: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("FoodWizz Sample Data Loader")
    print("=" * 40)
    
    success = load_sample_data()
    
    if success:
        print("\n🚀 Ready to start the application!")
        print("Run: python app.py")
    else:
        print("\n❌ Failed to load sample data")
        sys.exit(1)
