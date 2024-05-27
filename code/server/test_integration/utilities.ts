import TestAgent from "supertest/lib/agent"

export async function login(username: string, password: string, agent: TestAgent) {
    await agent.post("/ezelectronics/sessions").send({ username, password })
}

export async function logout(agent: TestAgent) {
    await agent.delete("/ezelectronics/sessions/current")
}