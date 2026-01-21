# recommender.py

import sys
import json
import numpy as np
from collections import defaultdict
import random
from pymongo import MongoClient

# --- 1. CONNECT TO MONGODB ---
# Read the URI from command line arguments
if len(sys.argv) > 3:
    MONGO_URI = sys.argv[3]
else:
    MONGO_URI = "mongodb://localhost:27017/nexusMarketDB"

try:
    # 5 second timeout to fail fast if connection is bad
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    
    # Force a connection check
    client.admin.command('ping')
    
    # --- FIX IS HERE: Explicitly select the database name ---
    # We do not rely on get_database() without arguments anymore.
    db = client['nexusMarketDB'] 
    
    users_collection = db.users
    # print(f"Connected to MongoDB Atlas: {db.name}") 
except Exception as e:
    print(f"Error connecting to MongoDB: {e}", file=sys.stderr)
    sys.exit(1)

# --- 2. DATA PREPARATION & HELPERS ---

def flatten_products(nested_data):
    """
    Flattens the specific nested structure used in NexusMarket.
    Structure: [ { category: [ { items: [PRODUCT, PRODUCT] } ] } ]
    """
    flat_list = []
    
    if not isinstance(nested_data, list):
        return []

    for section in nested_data:
        if isinstance(section, dict) and 'category' in section and isinstance(section['category'], list):
            for cat in section['category']:
                if isinstance(cat, dict) and 'items' in cat and isinstance(cat['items'], list):
                    flat_list.extend(cat['items'])
        elif isinstance(section, dict) and 'name' in section:
            flat_list.append(section)
            
    return flat_list

def get_brand(product_name):
    if not product_name: return ""
    return product_name.split(' ')[0].lower()

def get_gender(product_name):
    if not product_name: return "unisex"
    name_lower = product_name.lower()
    if 'men' in name_lower or "men's" in name_lower or 'boy' in name_lower:
        return 'male'
    if 'women' in name_lower or "women's" in name_lower or 'girl' in name_lower:
        return 'female'
    return 'unisex'

def calculate_name_similarity(name1, name2):
    if not name1 or not name2: return 0
    set1 = set(name1.lower().split())
    set2 = set(name2.lower().split())
    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))
    return intersection / union if union > 0 else 0

# --- 3. TIERED RECOMMENDATION LOGIC ---
def get_tiered_recommendations(user, all_products_flat):
    
    viewed_items = user.get('viewedItems', [])
    cart_items = user.get('cart', [])
    wishlist_items = user.get('wishlist', [])
    
    chronological_interactions = viewed_items + cart_items[::-1] + wishlist_items[::-1]

    if not chronological_interactions:
        return []

    ordered_unique_categories = []
    interactions_by_category = defaultdict(list)
    
    for item in chronological_interactions:
        category = item.get('category')
        if category:
            interactions_by_category[category].append(item)
            if category not in ordered_unique_categories:
                ordered_unique_categories.append(category)

    final_recommendations = []
    interacted_names = {item['name'] for item in chronological_interactions}

    for category in ordered_unique_categories:
        if len(final_recommendations) >= 100:
            break

        interacted_items_in_cat = interactions_by_category[category]

        candidate_products = [
            p for p in all_products_flat 
            if p.get('category') == category and p.get('name') not in interacted_names
        ]

        if not candidate_products:
            continue

        recs_for_this_category = []
        for product in candidate_products:
            max_score = 0
            for trigger_item in interacted_items_in_cat:
                score = 0
                if get_brand(product.get('name')) == get_brand(trigger_item.get('name')):
                    score += 0.5
                score += calculate_name_similarity(product.get('name'), trigger_item.get('name')) * 0.5
                
                if category in ['laptop', 'mobile']:
                    try:
                        trigger_price = float(trigger_item.get('price', 0))
                        product_price = float(product.get('price', 0))
                        if trigger_price > 0:
                            price_diff = abs(product_price - trigger_price) / trigger_price
                            score += 0.3 * (1 - min(price_diff, 1.0))
                    except (ValueError, TypeError):
                        pass
                elif category == 'fashion':
                    if get_gender(product.get('name')) == get_gender(trigger_item.get('name')):
                        score += 0.4
                
                if score > max_score:
                    max_score = score
            
            recs_for_this_category.append({'product': product, 'score': max_score})

        sorted_recs = sorted(recs_for_this_category, key=lambda x: x['score'], reverse=True)
        top_20_for_tier = [rec['product'] for rec in sorted_recs[:20]]
        
        for rec in top_20_for_tier:
            final_recommendations.append(rec)
            interacted_names.add(rec['name'])

    return final_recommendations

# --- 4. MAIN EXECUTION BLOCK ---
if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python recommender.py <phone> <products_file> <mongo_uri>", file=sys.stderr)
        sys.exit(1)

    phone = sys.argv[1]
    products_filename = sys.argv[2]

    try:
        with open(products_filename, 'r', encoding='utf-8') as f:
            raw_data = json.load(f)
            all_products_flat = flatten_products(raw_data)
    except FileNotFoundError:
        print(f"Error: The file '{products_filename}' was not found.", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: '{products_filename}' is not valid JSON.", file=sys.stderr)
        sys.exit(1)

    user = users_collection.find_one({"phone": phone})
    
    if user:
        new_recommendations = get_tiered_recommendations(user, all_products_flat)

        viewed_items = user.get('viewedItems', [])
        cart_items = user.get('cart', [])
        wishlist_items = user.get('wishlist', [])
        
        chronological_interactions = viewed_items + cart_items[::-1] + wishlist_items[::-1]
        
        user_interacted_items = []
        seen_names = set()
        for item in chronological_interactions:
            if item.get('name') not in seen_names:
                user_interacted_items.append(item)
                seen_names.add(item['name'])

        final_recs = (user_interacted_items + new_recommendations)[:100]
        
        result = users_collection.update_one(
            {"phone": phone}, 
            {"$set": {"recommendations": final_recs}}
        )
        
        if result.modified_count > 0:
            print(f"SUCCESS: Updated recommendations for {phone}. Count: {len(final_recs)}")
        elif result.matched_count > 0:
            print(f"Calculated recommendations but DB already had same data for {phone}.")
        else:
            print(f"User {phone} found but update failed.")
    else:
        print(f"User with phone {phone} not found.")