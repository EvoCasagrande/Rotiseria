import { z } from 'zod'

export const registerSchema = z.object({
    body: z.object({
        name: z
            .string()
            .trim()
            .min(2, "El nombre debe tener al menos 2 caracteres")
            .max(50, "El nombre no puede superar los 50 caracteres"),
    
        email: z    
            .string()
                .trim()
            .toLowerCase()
            .pipe(
                z.email({
                    message: 'Correo electrónico no válido',
                }),
            ),    

        password: z
            .string()
            .min(8, 'La contraseña debe contener minimo 8 caracteres')
            .max(64, 'La contraseña es demasiado larga')
            .regex( /^(?=.*[A-Z]).{8,}$/ , { 
                message: 'Debe contener al menos una letra mayúscula y tener una longitud mínima de 8 caracteres.', 
            })
            .refine((password) => 
                Buffer.byteLength(password, 'utf-8') <= 72,
                { message: 'La contraseña no debe superar los 72 bytes en UTF-8' }
            )
    })
})

export const loginSchema = z.object({
    body: z.object({
        email: z    
            .string()
            .trim()
            .toLowerCase()
            .pipe(
                z.email({
                    message: 'Correo electrónico no válido',
                }),
            ),  

        password: z
            .string()
            .min(1, 'Ingresa una contraseña valida')
            .refine((password) => 
                Buffer.byteLength(password, 'utf-8') <= 72,
                { message: 'La contraseña no debe superar los 72 bytes en UTF-8' }
            )
    })
});

export type RegisterInput = z.infer<typeof registerSchema>['body']
export type LoginInput = z.infer<typeof loginSchema>['body']