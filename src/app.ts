import express, { type Request, type Response, type Application } from "express";

const app: Application = express()

//Middlewares

//Routes
app.use('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok'
    })
})


export default app