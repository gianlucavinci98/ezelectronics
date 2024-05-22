const BAD_REQUEST = 'Bad Request'

class EzError extends Error {
    customMessage: string
    customCode: number

    constructor(code: number | null = null, message: string | null = null) {
        super()
        this.customMessage = message || 'Internal Server Error'
        this.customCode = code || 503
    }

}

class BadRequestError extends Error {
    customMessage: string
    customCode: number

    constructor(message: string | null = null) {
        super()
        this.customMessage = message || BAD_REQUEST
        this.customCode = 400
    }
}

export { EzError, BadRequestError }
