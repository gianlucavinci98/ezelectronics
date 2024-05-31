import TestAgent from "supertest/lib/agent"

import db from "../src/db/db"

export async function login(username: string, password: string, agent: TestAgent) {
    await agent.post("/ezelectronics/sessions").send({ username, password })
}

export async function logout(agent: TestAgent) {
    await agent.delete("/ezelectronics/sessions/current")
}

export function dbGet(sql: string, params: any[]) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err)
            } else {
                resolve(row)
            }
        })
    })
}

export function dbRun(sql: string, params: any[]) {
    return new Promise<void>((resolve, reject) => {
        db.run(sql, params, (err) => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}

export function dbAll(sql: string, params: any[]) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err)
            } else {
                resolve(rows)
            }
        })
    })
}

export async function cleanup() {
    await dbRun("DELETE FROM review", [])
    await dbRun("DELETE FROM cart_items", [])
    await dbRun("DELETE FROM cart", [])
    await dbRun("DELETE FROM product", [])
    await dbRun("DELETE FROM users", [])
}
