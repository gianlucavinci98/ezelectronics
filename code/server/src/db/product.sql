DROP TABLE IF EXISTS product;
CREATE TABLE product (
    model TEXT PRIMARY KEY,
    sellingPrice INTEGER NOT NULL,
    arrivalDate DATE NOT NULL,
    details TEXT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    category TEXT NOT NULL CHECK (
        category IN ('Smartphone', 'Laptop', 'Appliance')
    )
);
