import express from "express";
const app = express();
//Middlewares
//Routes
app.use('/api/health', (_req, res) => {
    res.status(200).json({
        status: 'ok'
    });
});
export default app;
//# sourceMappingURL=app.js.map