DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS cart;
CREATE TABLE cart (
    id INTEGER PRIMARY KEY,
    customer TEXT NOT NULL,
    paid BOOLEAN NOT NULL DEFAULT FALSE,
    paymentDate DATE NULL DEFAULT NULL,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    FOREIGN KEY (customer) REFERENCES users(username)
);
CREATE TABLE cart_items (
    id INTEGER PRIMARY KEY,
    cart INTEGER NOT NULL,
    model INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    category TEXT NOT NULL CHECK (
        category IN ('Smartphone', 'Laptop', 'Appliance')
    ),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0.00),
    FOREIGN KEY (cart) REFERENCES cart(ROWID),
    FOREIGN KEY (model) REFERENCES products(model)
);