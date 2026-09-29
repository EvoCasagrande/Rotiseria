import express, { type Request, type Response, type Application, type NextFunction } from "express";
import { AppError } from "./utils/AppError.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import categoriesRouter from "./modules/categories/categories.routes.js";
import productsRouter from "./modules/products/products.routes.js";
import ordersRouter from "./modules/orders/orders.routes.js"
import authRouter from "./modules/auth/auth.routes.js"

const app: Application = express()

//Middlewares
app.use(express.json())
//Routes
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/auth', authRouter);

//ENDPOINT DE SALUD
app.use('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok'
    })
})

//ENDPOINT COMODIN
app.use((_req , _res, next: NextFunction): void => {
    const error = new AppError('Lo sentimos, esta pagina no existe', 404);
    next(error);
});

//ERROR HANDLER
app.use(errorHandler)

export default app
