from flask import Flask, request, jsonify, send_from_directory, render_template, redirect, abort
import json
import os

app = Flask(__name__, static_folder='static', static_url_path='')
qr_dir = 'static/qr_codes'
os.makedirs(qr_dir, exist_ok=True)

menu = [
    {"category": "SOUPS", "name": "Veg Manchow Soup", "price": 129},
    {"category": "SOUPS", "name": "Hot & Sour Soup", "price": 129},
    {"category": "SOUPS", "name": "Veg Noodles Soup", "price": 129},
    {"category": "SOUPS", "name": "Veg Clear Soup", "price": 129},
    {"category": "SOUPS", "name": "Cream of Mushroom Soup", "price": 119},
    {"category": "SOUPS", "name": "Tom Yum Soup", "price": 129},
    {"category": "STARTERS (DRY/GRAVY)", "name": "Veg Spring Roll", "price": 199},
    {"category": "STARTERS (DRY/GRAVY)", "name": "Crispy Potato Schezwan Style", "price": 199},
    {"category": "STARTERS (DRY/GRAVY)", "name": "Veg Manchurian Gravy/Dry", "price": 199},
    {"category": "STARTERS (DRY/GRAVY)", "name": "Crispy Vegetables", "price": 199},
    {"category": "STARTERS (DRY/GRAVY)", "name": "Chilli Paneer Gravy/Dry", "price": 229},
    {"category": "STARTERS (DRY/GRAVY)", "name": "Chilli Mushroom Gravy/Dry", "price": 219},
    {"category": "STARTERS (DRY/GRAVY)", "name": "Chilli Babycorn Gravy/Dry", "price": 219},
    {"category": "STARTERS (DRY/GRAVY)", "name": "Chilli Garlic Noodles", "price": 219},
    {"category": "STARTERS (DRY/GRAVY)", "name": "Honey Chilli Potato", "price": 219},
    {"category": "STARTERS (DRY/GRAVY)", "name": "Gobi Manchurian", "price": 199},
    {"category": "STARTERS (DRY/GRAVY)", "name": "Paneer 65", "price": 229},
    {"category": "STARTERS (DRY/GRAVY)", "name": "Mushroom 65", "price": 219},
    {"category": "STARTERS (DRY/GRAVY)", "name": "Gobi 65", "price": 199},
    {"category": "RICE & NOODLES", "name": "Veg Fried Rice", "price": 159},
    {"category": "RICE & NOODLES", "name": "Schezwan Fried Rice", "price": 179},
    {"category": "RICE & NOODLES", "name": "Hakka Noodles", "price": 159},
    {"category": "RICE & NOODLES", "name": "American Chopsuey", "price": 179},
    {"category": "RICE & NOODLES", "name": "Singapore Noodles", "price": 179},
    {"category": "MAIN COURSE", "name": "Kadai Paneer", "price": 249},
    {"category": "MAIN COURSE", "name": "Paneer Butter Masala", "price": 249},
    {"category": "MAIN COURSE", "name": "Malai Kofta", "price": 239},
    {"category": "MAIN COURSE", "name": "Veg Kolhapuri", "price": 239},
    {"category": "MAIN COURSE", "name": "Navratan Korma", "price": 239},
    {"category": "MAIN COURSE", "name": "Paneer Tikka Masala", "price": 249},
    {"category": "MAIN COURSE", "name": "Veg Masala", "price": 229},
    {"category": "MAIN COURSE", "name": "Veg Kofta Curry", "price": 239},
    {"category": "MAIN COURSE", "name": "Mushroom Masala", "price": 229},
    {"category": "TANDOOR APPETIZERS", "name": "Paneer Tikka", "price": 279},
    {"category": "TANDOOR APPETIZERS", "name": "Hara Bhara Kabab", "price": 269},
    {"category": "TANDOOR APPETIZERS", "name": "Veg Seekh Kabab", "price": 269},
    {"category": "AMMAS SOYA CHAAP SPECIALITY", "name": "Soya Chaap Butter Masala", "price": 249},
    {"category": "AMMAS SOYA CHAAP SPECIALITY", "name": "Soya Chaap Tikka Masala", "price": 249},
    {"category": "AMMAS SOYA CHAAP SPECIALITY", "name": "Soya Malai Chaap", "price": 249},
]

orders = []
payment_history = []

def store_order(order_data):
    with open('orders.json', 'a') as f:
        json.dump(order_data, f)
        f.write('\n')

def store_payment(payment_data):
    with open('payments.json', 'a') as f:
        json.dump(payment_data, f)
        f.write('\n')

@app.route('/')
def serve_index():
    table_number_str = request.args.get('table')
    if table_number_str:
        try:
            table_number = int(table_number_str)
            if not (1 <= table_number <= 10):
                abort(404)
        except ValueError:
            abort(404)
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/index.html')
def index_html_redirect():
    return redirect('/')

@app.route('/api/menu', methods=['GET'])
def get_menu():
    return jsonify(menu)

@app.route('/api/order', methods=['POST'])
def place_order():
    data = request.get_json()
    table_number = data.get('tableNumber')
    items = data.get('items')
    tip = data.get('tip', 0)

    if table_number and items:
        order = {
            'tableNumber': table_number,
            'items': items,
            'tip': tip
        }
        orders.append(order)
        store_order(order)  # Store the order data to the JSON file
        return jsonify({'message': 'Order placed successfully!', 'order': order}), 201
    else:
        return jsonify({'message': 'Invalid order data'}), 400

@app.route('/api/clear_order/<table_number>', methods=['POST'])
def clear_order(table_number):
    global orders
    cleared_order = None

    for order in orders:
        if order['tableNumber'] == table_number:
            cleared_order = order
            orders = [o for o in orders if o['tableNumber'] != table_number]
            break

    if cleared_order:
        store_payment(cleared_order)  # Store the cleared order to the payment JSON file
        return jsonify(cleared_order), 200
    else:
        return jsonify({'message': 'Order not found'}), 404

@app.route('/api/orders', methods=['GET'])
def get_orders():
    table_number = request.args.get('table')
    if table_number:
        filtered_orders = [order for order in orders if order['tableNumber'] == table_number]
        return jsonify(filtered_orders)
    return jsonify(orders)

@app.route('/api/order_details', methods=['GET'])
def get_order_details():
    table_number = request.args.get('table')
    if not table_number:
        return jsonify({"error": "Table number is required"}), 400

    order_details = next((order for order in orders if order['tableNumber'] == table_number), None)
    if not order_details:
        return jsonify({"error": "Order not found"}), 404

    total_amount = sum(item['price'] for item in order_details['items'])
    order_details['total'] = total_amount

    return jsonify(order_details)

@app.route('/api/save_payment', methods=['POST'])
def save_payment_route():
    data = request.json
    payment_history.append(data)
    store_payment(data)
    return jsonify({"message": "Payment recorded successfully!"}), 201

@app.route('/api/payment_history', methods=['GET'])
def get_payment_history():
    payment_history_data = []
    if os.path.exists('payments.json'):
        with open('payments.json', 'r') as f:
            payment_history_data = [json.loads(line) for line in f]
    return jsonify(payment_history_data)

@app.route('/kitchen')
def kitchen():
    if os.path.exists('orders.json'):
        with open('orders.json', 'r') as f:
            orders_data = [json.loads(line) for line in f]
            orders_by_table = {}
            for order in orders_data:
                table_number = order.get('tableNumber')
                if table_number:
                    if table_number not in orders_by_table:
                        orders_by_table[table_number] = []
                    orders_by_table[table_number].append(order)
            return render_template('kitchen.html', orders_by_table=orders_by_table)
    else:
        return render_template('kitchen.html', orders=[])

@app.route('/counter')
def counter():
    if os.path.exists('payments.json'):
        with open('payments.json', 'r') as f:
            payments_data = [json.loads(line) for line in f]
            payments_by_table = {}
            for payment in payments_data:
                table_number = payment.get('tableNumber')
                if table_number:
                    if table_number not in payments_by_table:
                        payments_by_table[table_number] = []
                    payments_by_table[table_number].append(payment)
            return render_template('counter.html', payments_by_table=payments_by_table)
    else:
        return render_template('counter.html', payments=[])

if __name__ == '__main__':
    app.run(debug=True)
