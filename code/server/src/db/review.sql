DROP TABLE IF EXISTS review;
CREATE TABLE review (
    id INT PRIMARY KEY,
    model TEXT NOT NULL,
    user TEXT NOT NULL,
    score INT NOT NULL CHECK (
        score >= 0
        AND score <= 5
    ),
    date DATE NOT NULL,
    comment TEXT NOT NULL,
    FOREIGN KEY (model) REFERENCES product(model),
    FOREIGN KEY (user) REFERENCES users(username)
);