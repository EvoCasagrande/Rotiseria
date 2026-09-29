import { Router } from "express";
import { OrdersService } from "./orders.service.js";
import { OrdersController } from "./orders.controller.js";
import { getOrdersSchema, getByIdOrderSchema, createOrderSchema, updateOrderStatusSchema } from "./orders.schema.js";
import { validate } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/requireAuth.js";

const ordersService = new OrdersService();
const ordersController = new OrdersController(ordersService);

const router = Router()

router
    .route('/')
    .get(validate(getOrdersSchema), requireAuth, ordersController.getAll)
    .post(validate(createOrderSchema), ordersController.create);

router
    .route('/:id')
    .get(validate(getByIdOrderSchema), requireAuth, ordersController.getById)

router
    .route('/:id/status')
    .patch(validate(updateOrderStatusSchema), requireAuth, ordersController.updateStatus)

export default router
