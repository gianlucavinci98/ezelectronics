"use strict"

import { cleanup as asyncCleanup } from "../../test_integration/utilities"

/**
 * Deletes all data from the database.
 * This function must be called before any integration test, to ensure a clean database state for each test run.
 */

export function cleanup() {
    return asyncCleanup()
}
