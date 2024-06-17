"use strict"

import db from "../db/db";

/**
 * Deletes all data from the database.
 * This function must be called before any integration test, to ensure a clean database state for each test run.
 */

export function cleanup() {
    db.serialize(() => {
        // Delete all data from the database.
        db.run("DELETE FROM users")
        db.run("DELETE FROM product")
        db.run("DELETE FROM cart_items")
        db.run("DELETE FROM cart")
        db.run("DELETE FROM review")
    })
}
