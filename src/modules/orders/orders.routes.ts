import { Router } from "express";
import { OrdersService } from "./orders.service.js";
import { OrdersController } from "./orders.controller.js";
import { getOrdersSchema, getByIdOrderSchema, getStatisticsSchema, createOrderSchema, updateOrderStatusSchema } from "./orders.schema.js";
import { validate } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { rateLimit } from "../../middlewares/rateLimit.js";

const ordersService = new OrdersService();
const ordersController = new OrdersController(ordersService);

const router = Router()

router.get('/statistics', requireAuth, validate(getStatisticsSchema), ordersController.statistics)

router
    .route('/')
    .get(validate(getOrdersSchema), requireAuth, ordersController.getAll)
    .post(rateLimit(30, 15 * 60 * 1000), validate(createOrderSchema), ordersController.create);

router
    .route('/:id')
    .get(validate(getByIdOrderSchema), requireAuth, ordersController.getById)

router
    .route('/:id/status')
    .patch(validate(updateOrderStatusSchema), requireAuth, ordersController.updateStatus)

export default router
