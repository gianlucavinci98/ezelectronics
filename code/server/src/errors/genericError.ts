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

export { EzError }
