import { z } from 'zod'

export const loginSchema = z.object({
    body: z.object({
        email: z    
            .string()
            .trim()
            .toLowerCase()
            .pipe(
                z.email({
                    message: 'Correo electronico no valido',
                }),
            ),  

        password: z
            .string()
            .min(1, 'Ingresa una contrasena valida')
            .refine((password) => 
                Buffer.byteLength(password, 'utf-8') <= 72,
                { message: 'La contrasena no debe superar los 72 bytes en UTF-8' }
            )
    })
});

export type LoginInput = z.infer<typeof loginSchema>['body']