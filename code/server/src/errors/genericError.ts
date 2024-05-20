const BAD_REQUEST = 'Bad Request'

class BadRequestError extends Error {
    customMessage: string
    customCode: number

    constructor(message: string | null = null) {
        super()
        this.customMessage = message || BAD_REQUEST
        this.customCode = 400
    }
}

export { BadRequestError }
