"use strict"

import db from "../db/db";

/**
 * Deletes all data from the database.
 * This function must be called before any integration test, to ensure a clean database state for each test run.
 */

function runInPromise(query: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        db.run(query, (err: Error | null) => {
            if (err) reject(err)
            resolve()
        })
    })

}

export function cleanup(callback: () => void | null = null) {
    db.serialize(() => {
        let promises = [];
        // Delete all data from the database.
        promises.push(runInPromise("DELETE FROM users"));
        //Add delete statements for other tables here
        promises.push(runInPromise("DELETE FROM product"))
        promises.push(runInPromise("DELETE FROM cart_items"))
        promises.push(runInPromise("DELETE FROM cart"))
        promises.push(runInPromise("DELETE FROM review"))
        if (callback) {
            Promise.all(promises).then(() => callback())
        }
    })
}
