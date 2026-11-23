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

export const changePasswordSchema = z.object({
    body: z.object({
        currentPassword: z.string().min(1).refine((value) => Buffer.byteLength(value, 'utf-8') <= 72),
        newPassword: z.string().min(8, 'La nueva contrasena debe tener al menos 8 caracteres').refine((value) => Buffer.byteLength(value, 'utf-8') <= 72, 'La contrasena no debe superar 72 bytes'),
    }).refine((value) => value.currentPassword !== value.newPassword, { message: 'La nueva contrasena debe ser distinta', path: ['newPassword'] }),
})
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body']
