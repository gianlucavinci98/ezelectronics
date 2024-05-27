DROP TABLE IF EXISTS review;
CREATE TABLE review (
    model TEXT NOT NULL,
    user TEXT NOT NULL,
    score INT NOT NULL CHECK (
        score >= 0
        AND score <= 5
    ),
    date DATE NOT NULL,
    comment TEXT NOT NULL,
    PRIMARY KEY (model, user),
    FOREIGN KEY (model) REFERENCES product(model) ON DELETE CASCADE,
    FOREIGN KEY (user) REFERENCES users(username) ON DELETE CASCADE
);