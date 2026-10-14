from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import sqlite3
import json
from datetime import datetime
import os

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'
UPLOAD_FOLDER = 'static/images/ingredients'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Database initialization
def init_db():
    conn = sqlite3.connect('restaurant_inventory.db')
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create ingredients table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ingredients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            stock REAL NOT NULL DEFAULT 0,
            unit TEXT NOT NULL,
            cost REAL NOT NULL DEFAULT 0,
            category TEXT NOT NULL DEFAULT 'Other',
            image_url TEXT,
            min_stock REAL DEFAULT 5,
            supplier TEXT DEFAULT 'Local',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create dishes table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS dishes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            sale_price REAL NOT NULL DEFAULT 0,
            image_url TEXT,
            category TEXT NOT NULL DEFAULT 'Other',
            prep_time INTEGER DEFAULT 10,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create recipe ingredients table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS recipe_ingredients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dish_id INTEGER NOT NULL,
            ingredient_id INTEGER NOT NULL,
            quantity REAL NOT NULL,
            FOREIGN KEY (dish_id) REFERENCES dishes (id) ON DELETE CASCADE,
            FOREIGN KEY (ingredient_id) REFERENCES ingredients (id) ON DELETE CASCADE
        )
    ''')
    
    # Create cart table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cart (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dish_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (dish_id) REFERENCES dishes (id) ON DELETE CASCADE
        )
    ''')
    
    # Create orders table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            total_amount REAL NOT NULL,
            status TEXT DEFAULT 'completed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create order items table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            dish_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
            FOREIGN KEY (dish_id) REFERENCES dishes (id) ON DELETE CASCADE
        )
    ''')
    
    # Create distributors table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS distributors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            contact_person TEXT,
            phone TEXT,
            email TEXT,
            website TEXT,
            specialty TEXT,
            rating REAL DEFAULT 5.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

# Database helper functions
def get_db_connection():
    conn = sqlite3.connect('restaurant_inventory.db')
    conn.row_factory = sqlite3.Row
    return conn

def dict_from_row(row):
    return dict(zip(row.keys(), row)) if row else None

# Load comprehensive sample data
def load_sample_data():
    conn = get_db_connection()
    
    # Check if data already exists
    existing = conn.execute('SELECT COUNT(*) as count FROM ingredients').fetchone()
    if existing['count'] > 0:
        conn.close()
        return
    
    # 25+ Sample ingredients for comprehensive dashboard
    sample_ingredients = [
        # Meats
        ("Ground Beef", 15.0, "kg", 8.50, "Meat", "images/ingredients/ground_beef.jpg", 3, "Sysco Food Service"),
        ("Chicken Breast", 12.0, "kg", 6.00, "Meat", "static/images/chicken_breast.jpg", 3, "PriceSmart"),
        ("Pork Shoulder", 8.0, "kg", 7.20, "Meat", "static/images/pork_shoulder.jpg", 2, "Sysco Food Service"),
        ("Bacon Strips", 10.0, "pack", 5.50, "Meat", "static/images/bacon_strips.jpg", 3, "Prolacsa"),
        ("Hot Dogs", 25.0, "pack", 3.20, "Meat", "static/images/hot_dogs.jpg", 5, "PriceSmart"),
        ("Chorizo", 6.0, "kg", 9.80, "Meat", "static/images/chorizo.jpg", 2, "Local Supplier"),
        ("Fish Fillet", 4.0, "kg", 12.50, "Meat", "static/images/fish_fillet.jpg", 1, "Panama Gourmet Foods"),

        # Vegetables
        ("Lettuce", 5.0, "kg", 2.50, "Vegetables", "static/images/lettuce.jpg", 2, "Local Farm"),
        ("Tomatoes", 8.0, "kg", 3.20, "Vegetables", "static/images/tomatoes.jpg", 2, "Local Farm"),
        ("Onions", 6.0, "kg", 1.80, "Vegetables", "static/images/onions.jpg", 2, "Local Farm"),
        ("Bell Peppers", 4.0, "kg", 4.50, "Vegetables", "static/images/bell_peppers.jpg", 1, "Local Farm"),
        ("Mushrooms", 3.0, "kg", 6.80, "Vegetables", "static/images/mushrooms.jpg", 1, "Panama Gourmet Foods"),
        ("Avocados", 2.0, "kg", 8.90, "Vegetables", "static/images/avocados.jpg", 1, "Local Farm"),
        ("Corn", 5.0, "kg", 3.40, "Vegetables", "static/images/corn.jpg", 2, "Unilever Food Solutions"),

        # Dairy & Cheese
        ("Cheese Slices", 20.0, "pack", 4.20, "Dairy", "images/ingredients/cheese_slices.jpg", 5, "Nestle"),
        ("Mozzarella Cheese", 8.0, "kg", 7.60, "Dairy", "images/ingredients/mozzarella_cheese.jpg", 2, "Prolacsa"),
        ("Cheddar Cheese", 6.0, "kg", 8.90, "Dairy", "images/ingredients/cheddar_cheese.jpg", 2, "PriceSmart"),
        ("Milk", 8.0, "l", 1.20, "Dairy", "images/ingredients/milk.jpg", 2, "Prolacsa"),
        ("Butter", 4.0, "kg", 5.40, "Dairy", "static/images/butter.jpg", 1, "Nestle"),

        # Bread & Grains
        ("Burger Buns", 30.0, "pack", 2.80, "Bread", "static/images/burger_buns.jpg", 10, "Local Bakery"),
        ("Hot Dog Buns", 30.0, "pack", 2.40, "Bread", "static/images/hot_dog_buns.jpg", 10, "Local Bakery"),
        ("Pizza Dough", 12.0, "pack", 3.60, "Bread", "static/images/pizza_dough.jpg", 4, "Local Bakery"),
        ("Tortillas", 15.0, "pack", 2.20, "Bread", "static/images/tortillas.jpg", 6, "Local Supplier"),
        ("Bread Crumbs", 2.0, "kg", 4.80, "Bread", "static/images/bread_crumbs.jpg", 1, "Sysco Food Service"),

        # Condiments & Sauces
        ("Mayonnaise", 4.0, "l", 3.80, "Condiments", "images/ingredients/mayonnaise.jpg", 1, "Unilever Food Solutions"),
        ("Ketchup", 6.0, "l", 2.90, "Condiments", "static/images/ketchup.jpg", 1, "Nestle"),
        ("Mustard", 3.0, "l", 2.40, "Condiments", "static/images/mustard.jpg", 1, "Sysco Food Service"),
        ("BBQ Sauce", 4.0, "l", 4.20, "Condiments", "static/images/bbq_sauce.jpg", 1, "Unilever Food Solutions"),
        ("Caesar Dressing", 2.0, "l", 5.60, "Condiments", "static/images/caesar_dressing.jpg", 1, "Panama Gourmet Foods"),
        ("Hot Sauce", 1.0, "l", 6.80, "Condiments", "static/images/hot_sauce.jpg", 0.5, "Local Supplier"),

        # Sides & Others
        ("French Fries", 8.0, "kg", 3.50, "Sides", "static/images/french_fries.jpg", 2, "PriceSmart"),
        ("Coleslaw Mix", 3.0, "kg", 4.20, "Sides", "static/images/coleslaw_mix.jpg", 1, "Local Farm"),
        ("Pickles", 2.0, "kg", 4.50, "Vegetables", "static/images/pickles.jpg", 1, "Sysco Food Service"),
        ("Olives", 1.5, "kg", 7.80, "Vegetables", "static/images/olives.jpg", 0.5, "Panama Gourmet Foods"),

        # Beverages
        ("Coca Cola", 24.0, "bottles", 1.50, "Beverages", "static/images/coca_cola.jpg", 12, "PriceSmart"),
        ("Orange Juice", 12.0, "bottles", 2.00, "Beverages", "static/images/orange_juice.jpg", 6, "Local Supplier"),
        ("Coffee Beans", 2.0, "kg", 15.00, "Beverages", "static/images/coffee_beans.jpg", 0.5, "Panama Gourmet Foods"),
        ("Sugar", 5.0, "kg", 1.00, "Condiments", "static/images/sugar.jpg", 1, "PriceSmart"),
        
        # Spices & Seasonings
        ("Salt", 3.0, "kg", 0.80, "Spices", "static/images/salt.jpg", 1, "Local Supplier"),
        ("Black Pepper", 0.5, "kg", 12.00, "Spices", "static/images/black_pepper.jpg", 0.2, "Panama Gourmet Foods"),
        ("Garlic Powder", 0.8, "kg", 8.50, "Spices", "static/images/garlic_powder.jpg", 0.3, "Sysco Food Service"),
        ("Paprika", 0.6, "kg", 9.20, "Spices", "static/images/paprika.jpg", 0.2, "Panama Gourmet Foods")
    ]
    
    for name, stock, unit, cost, category, image_url, min_stock, supplier in sample_ingredients:
        conn.execute(
            'INSERT INTO ingredients (name, stock, unit, cost, category, image_url, min_stock, supplier) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            (name, stock, unit, cost, category, image_url, min_stock, supplier)
        )
    
    # 15+ Sample dishes with detailed recipes
    sample_dishes = [
        ("Classic Burger", "Juicy beef patty with lettuce, tomato, cheese and special sauce", 12.99, "Burgers", "static/images/classic_burger.jpg", 8),
        ("Chicken Wrap", "Grilled chicken breast wrapped in tortilla with fresh vegetables", 8.50, "Wraps", "static/images/chicken_wrap.jpg", 6),
        ("Veggie Pizza Slice", "Fresh pizza slice with mozzarella, peppers and olives", 6.25, "Pizza", "static/images/veggie_pizza_slice.jpg", 5),
        ("BBQ Ribs Plate", "Tender BBQ ribs served with fries and coleslaw", 16.75, "Main Course", "static/images/bbq_ribs_plate.jpg", 15),
        ("Caesar Salad", "Fresh romaine lettuce with chicken, croutons and caesar dressing", 9.00, "Salads", "static/images/caesar_salad.jpg", 7),
        ("Cheeseburger Deluxe", "Double cheese burger with bacon and all the fixings", 15.99, "Burgers", "static/images/cheeseburger_deluxe.jpg", 10),
        ("Fish Tacos", "Fresh fish tacos with avocado and spicy sauce", 11.50, "Mexican", "static/images/fish_tacos.jpg", 8),
        ("Hot Dog Special", "Gourmet hot dog with chorizo and special toppings", 7.99, "Hot Dogs", "static/images/hot_dog_special.jpg", 5),
        ("Mushroom Pizza", "Wood-fired pizza with mushrooms and mozzarella", 13.50, "Pizza", "static/images/mushroom_pizza.jpg", 10),
        ("Pork Sandwich", "Slow-cooked pork shoulder sandwich with BBQ sauce", 10.75, "Sandwiches", "static/images/pork_sandwich.jpg", 8),
        ("Chicken Caesar Wrap", "Caesar salad wrapped in a fresh tortilla", 9.25, "Wraps", "static/images/chicken_caesar_wrap.jpg", 6),
        ("Bacon Cheeseburger", "Classic burger with crispy bacon and melted cheese", 13.75, "Burgers", "static/images/bacon_cheeseburger.jpg", 9),
        ("Veggie Wrap", "Fresh vegetables and avocado in a healthy wrap", 7.50, "Wraps", "static/images/veggie_wrap.jpg", 5),
        ("Spicy Chicken Pizza", "Pizza with spicy chicken and hot sauce", 14.25, "Pizza", "static/images/spicy_chicken_pizza.jpg", 12),
        ("Fish & Chips", "Beer-battered fish with golden fries", 12.50, "Main Course", "static/images/fish_and_chips.jpg", 10)
    ]
    
    for name, description, price, category, image_url, prep_time in sample_dishes:
        cursor = conn.execute(
            'INSERT INTO dishes (name, description, sale_price, category, image_url, prep_time) VALUES (?, ?, ?, ?, ?, ?)',
            (name, description, price, category, image_url, prep_time)
        )
        dish_id = cursor.lastrowid
        
        # Add detailed recipes for each dish
        if name == "Classic Burger":
            recipes = [(1, 0.15), (20, 1), (15, 1), (8, 0.02), (9, 0.03), (25, 0.01)]  # Beef, Buns, Cheese, Lettuce, Tomatoes, Mayo
        elif name == "Chicken Wrap":
            recipes = [(2, 0.12), (23, 1), (8, 0.02), (9, 0.03), (14, 0.05)]  # Chicken, Tortillas, Lettuce, Tomatoes, Corn
        elif name == "Veggie Pizza Slice":
            recipes = [(22, 0.2), (16, 0.08), (11, 0.03), (34, 0.02)]  # Pizza Dough, Mozzarella, Bell Peppers, Olives
        elif name == "BBQ Ribs Plate":
            recipes = [(3, 0.25), (28, 0.03), (31, 0.15), (32, 0.08)]  # Pork, BBQ Sauce, Fries, Coleslaw
        elif name == "Caesar Salad":
            recipes = [(2, 0.1), (8, 0.1), (24, 0.02), (29, 0.02)]  # Chicken, Lettuce, Bread Crumbs, Caesar Dressing
        elif name == "Cheeseburger Deluxe":
            recipes = [(1, 0.2), (20, 1), (15, 2), (4, 2), (8, 0.03)]  # Beef, Buns, Cheese, Bacon, Lettuce
        elif name == "Fish Tacos":
            recipes = [(7, 0.12), (23, 2), (13, 0.05), (30, 0.01)]  # Fish, Tortillas, Avocados, Hot Sauce
        elif name == "Hot Dog Special":
            recipes = [(5, 1), (21, 1), (6, 0.05), (10, 0.02)]  # Hot Dogs, Buns, Chorizo, Onions
        elif name == "Mushroom Pizza":
            recipes = [(22, 0.2), (16, 0.1), (12, 0.06)]  # Pizza Dough, Mozzarella, Mushrooms
        elif name == "Pork Sandwich":
            recipes = [(3, 0.18), (20, 1), (28, 0.02)]  # Pork, Buns, BBQ Sauce
        elif name == "Chicken Caesar Wrap":
            recipes = [(2, 0.1), (23, 1), (8, 0.03), (29, 0.02)]  # Chicken, Tortillas, Lettuce, Caesar Dressing
        elif name == "Bacon Cheeseburger":
            recipes = [(1, 0.15), (20, 1), (4, 2), (17, 0.05)]  # Beef, Buns, Bacon, Cheddar
        elif name == "Veggie Wrap":
            recipes = [(23, 1), (8, 0.03), (9, 0.03), (13, 0.05), (11, 0.02)]  # Tortillas, Lettuce, Tomatoes, Avocados, Peppers
        elif name == "Spicy Chicken Pizza":
            recipes = [(22, 0.2), (2, 0.12), (16, 0.08), (30, 0.01)]  # Pizza Dough, Chicken, Mozzarella, Hot Sauce
        elif name == "Fish & Chips":
            recipes = [(7, 0.15), (31, 0.2)]  # Fish, Fries
        else:
            recipes = []
        
        for ingredient_id, quantity in recipes:
            conn.execute(
                'INSERT INTO recipe_ingredients (dish_id, ingredient_id, quantity) VALUES (?, ?, ?)',
                (dish_id, ingredient_id, quantity)
            )
    
    # Sample distributors
    sample_distributors = [
        ("Sysco Food Service Market", "Carlos Rodriguez", "+507 6789-1234", "carlos@syscopanama.com", "syscopanama.com", "Food Service & Restaurant Supplies", 4.8),
        ("PriceSmart", "Maria Gonzalez", "+507 2345-6789", "wholesale@pricesmart.com", "pricesmart.com", "Wholesale Club - Bulk Products", 4.5),
        ("Nestle Professional", "Juan Perez", "+507 3456-7890", "foodservice@nestle.com", "nestle.com", "Professional Food Solutions", 4.7),
        ("Unilever Food Solutions", "Ana Martinez", "+507 4567-8901", "panama@ufs.com", "ufs.com", "Food Service Solutions", 4.6),
        ("Panama Gourmet Foods", "Roberto Silva", "+507 5678-9012", "info@panamgourmet.com", "panamgourmet.com", "Gourmet & Specialty Foods", 4.9),
        ("Prolacsa", "Carmen Lopez", "+507 6789-0123", "ventas@prolacsa.com", "prolacsa.com", "Dairy Products & Distribution", 4.4),
        ("Distribuidora Central", "Miguel Torres", "+507 7890-1234", "central@distcentral.com", "distcentral.com", "General Food Distribution", 4.2),
        ("Fresh Market Suppliers", "Sofia Herrera", "+507 8901-2345", "fresh@fmsuppliers.com", "fmsuppliers.com", "Fresh Produce & Vegetables", 4.6)
    ]
    
    for name, contact, phone, email, website, specialty, rating in sample_distributors:
        conn.execute(
            'INSERT INTO distributors (name, contact_person, phone, email, website, specialty, rating) VALUES (?, ?, ?, ?, ?, ?, ?)',
            (name, contact, phone, email, website, specialty, rating)
        )
    
    conn.commit()
    conn.close()

# Main route
@app.route('/')
def index():
    return render_template('index.html')

# Ingredients API
@app.route('/api/ingredients')
def get_ingredients():
    conn = get_db_connection()
    ingredients = conn.execute('SELECT * FROM ingredients ORDER BY name').fetchall()
    conn.close()
    
    return jsonify([dict_from_row(row) for row in ingredients])

@app.route('/api/ingredients/low-stock')
def get_low_stock_ingredients():
    conn = get_db_connection()
    ingredients = conn.execute('SELECT * FROM ingredients WHERE stock <= min_stock ORDER BY stock ASC').fetchall()
    conn.close()
    
    return jsonify([dict_from_row(row) for row in ingredients])

@app.route('/api/ingredients/out-of-stock')
def get_out_of_stock_ingredients():
    conn = get_db_connection()
    ingredients = conn.execute('SELECT * FROM ingredients WHERE stock = 0 ORDER BY name').fetchall()
    conn.close()
    
    return jsonify([dict_from_row(row) for row in ingredients])

@app.route('/api/ingredients', methods=['POST'])
def add_ingredient():
    name = request.form.get('name', '').strip()
    stock = float(request.form.get('stock', 0))
    unit = request.form.get('unit', '').strip()
    cost = float(request.form.get('cost', 0))
    category = request.form.get('category', 'Other').strip()
    min_stock = float(request.form.get('min_stock', 5))
    supplier = request.form.get('supplier', 'Local').strip()
    
    if not all([name, unit]) or stock < 0 or cost < 0:
        return jsonify({'success': False, 'message': 'Invalid data'})

    image_file = request.files.get('image_file')
    image_url = ''
    if image_file and image_file.filename != '':
        image_path = os.path.join(app.config['UPLOAD_FOLDER'], image_file.filename)
        image_file.save(image_path)
        image_url = f"/static/images/ingredients/{image_file.filename}"

    conn = get_db_connection()

    try:
        cursor = conn.execute(
            'INSERT INTO ingredients (name, stock, unit, cost, category, image_url, min_stock, supplier) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            (name, stock, unit, cost, category, image_url, min_stock, supplier)
        )
        ingredient_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'id': ingredient_id, 'message': 'Ingredient added successfully'})
    except Exception as e:
        conn.close()
        return jsonify({'success': False, 'message': 'Error adding ingredient'})

@app.route('/api/ingredients/<int:ingredient_id>', methods=['PUT'])
def update_ingredient(ingredient_id):
    data = request.get_json()
    name = data.get('name', '').strip()
    stock = float(data.get('stock', 0))
    unit = data.get('unit', '').strip()
    cost = float(data.get('cost', 0))
    category = data.get('category', 'Other').strip()
    image_url = data.get('image_url', '').strip()
    min_stock = float(data.get('min_stock', 5))
    supplier = data.get('supplier', 'Local').strip()
    
    if not all([name, unit]) or stock < 0 or cost < 0:
        return jsonify({'success': False, 'message': 'Invalid data'})
    
    conn = get_db_connection()
    try:
        conn.execute(
            'UPDATE ingredients SET name = ?, stock = ?, unit = ?, cost = ?, category = ?, image_url = ?, min_stock = ?, supplier = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            (name, stock, unit, cost, category, image_url, min_stock, supplier, ingredient_id)
        )
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Ingredient updated successfully'})
    except Exception as e:
        conn.close()
        return jsonify({'success': False, 'message': 'Error updating ingredient'})

@app.route('/api/ingredients/<int:ingredient_id>', methods=['DELETE'])
def delete_ingredient(ingredient_id):
    conn = get_db_connection()
    try:
        conn.execute('DELETE FROM ingredients WHERE id = ?', (ingredient_id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Ingredient deleted successfully'})
    except Exception as e:
        conn.close()
        return jsonify({'success': False, 'message': 'Error deleting ingredient'})

# Dishes API
@app.route('/api/dishes')
def get_dishes():
    conn = get_db_connection()
    
    dishes = conn.execute('SELECT * FROM dishes ORDER BY name').fetchall()
    dishes_list = []
    
    for dish in dishes:
        dish_dict = dict_from_row(dish)
        
        recipe_ingredients = conn.execute('''
            SELECT ri.quantity, i.id as ingredient_id, i.name as ingredient_name, i.unit, i.cost
            FROM recipe_ingredients ri
            JOIN ingredients i ON ri.ingredient_id = i.id
            WHERE ri.dish_id = ?
        ''', (dish['id'],)).fetchall()
        
        dish_dict['recipe'] = [dict_from_row(row) for row in recipe_ingredients]
        dishes_list.append(dish_dict)
    
    conn.close()
    return jsonify(dishes_list)

@app.route('/api/dishes', methods=['POST'])
def add_dish():
    data = request.get_json()
    name = data.get('name', '').strip()
    description = data.get('description', '').strip()
    sale_price = float(data.get('sale_price', 0))
    category = data.get('category', 'Other').strip()
    image_url = data.get('image_url', '').strip()
    prep_time = int(data.get('prep_time', 10))
    recipe = data.get('recipe', [])
    
    if not name or sale_price < 0:
        return jsonify({'success': False, 'message': 'Invalid data'})
    
    conn = get_db_connection()
    try:
        cursor = conn.execute(
            'INSERT INTO dishes (name, description, sale_price, category, image_url, prep_time) VALUES (?, ?, ?, ?, ?, ?)',
            (name, description or None, sale_price, category, image_url or None, prep_time)
        )
        dish_id = cursor.lastrowid
        
        for ingredient in recipe:
            conn.execute(
                'INSERT INTO recipe_ingredients (dish_id, ingredient_id, quantity) VALUES (?, ?, ?)',
                (dish_id, ingredient['ingredient_id'], ingredient['quantity'])
            )
        
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'id': dish_id, 'message': 'Dish added successfully'})
    except Exception as e:
        conn.close()
        return jsonify({'success': False, 'message': 'Error adding dish'})

@app.route('/api/dishes/<int:dish_id>', methods=['PUT'])
def update_dish(dish_id):
    data = request.get_json()
    name = data.get('name', '').strip()
    description = data.get('description', '').strip()
    sale_price = float(data.get('sale_price', 0))
    category = data.get('category', 'Other').strip()
    image_url = data.get('image_url', '').strip()
    prep_time = int(data.get('prep_time', 10))
    recipe = data.get('recipe', [])
    
    if not name or sale_price < 0:
        return jsonify({'success': False, 'message': 'Invalid data'})
    
    conn = get_db_connection()
    try:
        conn.execute(
            'UPDATE dishes SET name = ?, description = ?, sale_price = ?, category = ?, image_url = ?, prep_time = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            (name, description or None, sale_price, category, image_url or None, prep_time, dish_id)
        )
        
        conn.execute('DELETE FROM recipe_ingredients WHERE dish_id = ?', (dish_id,))
        
        for ingredient in recipe:
            conn.execute(
                'INSERT INTO recipe_ingredients (dish_id, ingredient_id, quantity) VALUES (?, ?, ?)',
                (dish_id, ingredient['ingredient_id'], ingredient['quantity'])
            )
        
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Dish updated successfully'})
    except Exception as e:
        conn.close()
        return jsonify({'success': False, 'message': 'Error updating dish'})

@app.route('/api/dishes/<int:dish_id>', methods=['DELETE'])
def delete_dish(dish_id):
    conn = get_db_connection()
    try:
        conn.execute('DELETE FROM dishes WHERE id = ?', (dish_id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Dish deleted successfully'})
    except Exception as e:
        conn.close()
        return jsonify({'success': False, 'message': 'Error deleting dish'})

@app.route('/api/dishes/<int:dish_id>/prepare', methods=['POST'])
def prepare_dish(dish_id):
    conn = get_db_connection()
    
    try:
        # Get dish and recipe
        dish = conn.execute('SELECT * FROM dishes WHERE id = ?', (dish_id,)).fetchone()
        if not dish:
            return jsonify({'success': False, 'message': 'Dish not found'})
        
        recipe_ingredients = conn.execute('''
            SELECT ri.quantity, i.id, i.name, i.stock, i.unit
            FROM recipe_ingredients ri
            JOIN ingredients i ON ri.ingredient_id = i.id
            WHERE ri.dish_id = ?
        ''', (dish_id,)).fetchall()
        
        # Check if we have enough ingredients
        missing_ingredients = []
        for ingredient in recipe_ingredients:
            if ingredient['stock'] < ingredient['quantity']:
                missing_ingredients.append(
                    f"{ingredient['name']} (need {ingredient['quantity']} {ingredient['unit']}, have {ingredient['stock']} {ingredient['unit']})"
                )
        
        if missing_ingredients:
            return jsonify({
                'success': False, 
                'message': f"Cannot prepare {dish['name']}. Missing ingredients: {', '.join(missing_ingredients)}"
            })
        
        # Consume ingredients
        for ingredient in recipe_ingredients:
            new_stock = ingredient['stock'] - ingredient['quantity']
            conn.execute(
                'UPDATE ingredients SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                (new_stock, ingredient['id'])
            )
        
        # Create order record
        cursor = conn.execute('INSERT INTO orders (total_amount) VALUES (?)', (dish['sale_price'],))
        order_id = cursor.lastrowid
        
        conn.execute(
            'INSERT INTO order_items (order_id, dish_id, quantity, price) VALUES (?, ?, ?, ?)',
            (order_id, dish_id, 1, dish['sale_price'])
        )
        
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': f'{dish["name"]} prepared successfully! Order #{order_id} created.'})
        
    except Exception as e:
        conn.close()
        return jsonify({'success': False, 'message': 'Error preparing dish'})

# Distributors API
@app.route('/api/distributors')
def get_distributors():
    conn = get_db_connection()
    distributors = conn.execute('SELECT * FROM distributors ORDER BY rating DESC').fetchall()
    conn.close()
    
    return jsonify([dict_from_row(row) for row in distributors])

# Dashboard API
@app.route('/api/dashboard')
def get_dashboard_data():
    conn = get_db_connection()
    
    total_ingredients = conn.execute('SELECT COUNT(*) as count FROM ingredients').fetchone()['count']
    total_dishes = conn.execute('SELECT COUNT(*) as count FROM dishes').fetchone()['count']
    low_stock = conn.execute('SELECT COUNT(*) as count FROM ingredients WHERE stock <= min_stock').fetchone()['count']
    out_of_stock = conn.execute('SELECT COUNT(*) as count FROM ingredients WHERE stock = 0').fetchone()['count']
    
    inventory_value = conn.execute('SELECT SUM(stock * cost) as total FROM ingredients').fetchone()['total'] or 0
    
    low_stock_items = conn.execute(
        'SELECT name, stock, unit, min_stock FROM ingredients WHERE stock <= min_stock ORDER BY stock ASC LIMIT 10'
    ).fetchall()
    
    category_stats = conn.execute('''
        SELECT category, COUNT(*) as count, SUM(stock * cost) as value
        FROM ingredients 
        GROUP BY category
    ''').fetchall()
    
    # Get recent orders
    recent_orders = conn.execute('''
        SELECT o.id, o.total_amount, o.created_at,
            COUNT(oi.id) as item_count
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT 5
    ''').fetchall()
    
    # Get top selling dishes
    top_dishes = conn.execute('''
        SELECT d.name, d.sale_price, COUNT(oi.id) as orders_count, SUM(oi.quantity) as total_sold
        FROM dishes d
        LEFT JOIN order_items oi ON d.id = oi.dish_id
        GROUP BY d.id
        ORDER BY total_sold DESC
        LIMIT 5
    ''').fetchall()
    
    conn.close()
    
    return jsonify({
        'total_ingredients': total_ingredients,
        'total_dishes': total_dishes,
        'low_stock_count': low_stock,
        'out_of_stock_count': out_of_stock,
        'inventory_value': inventory_value,
        'low_stock_items': [dict_from_row(row) for row in low_stock_items],
        'category_stats': [dict_from_row(row) for row in category_stats],
        'recent_orders': [dict_from_row(row) for row in recent_orders],
        'top_dishes': [dict_from_row(row) for row in top_dishes]
    })

if __name__ == '__main__':
    init_db()
    load_sample_data()
    app.run(debug=True, host='0.0.0.0', port=5000)
