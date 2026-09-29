import { describe, expect, it } from 'vitest'
import { AppError } from '../src/utils/AppError.js'

describe('AppError', () => {
    it('stores message and status code', () => {
        const error = new AppError('No autorizado', 401)

        expect(error.message).toBe('No autorizado')
        expect(error.statusCode).toBe(401)
    })
})
