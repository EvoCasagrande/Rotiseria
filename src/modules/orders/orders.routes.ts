import { Router } from "express";
import { OrdersService } from "./orders.service.js";
import { OrdersController } from "./orders.controller.js";
import { getOrderSchema, getByIdOrderSchema, createOrderSchema, updateOrderStatusSchema } from "./orders.schema.js";
import { validate } from "../../middlewares/validate.js";

const ordersService = new OrdersService();
const ordersController = new OrdersController(ordersService);

const router = Router()

router
    .route('/')
    .get(validate(getOrderSchema), ordersController.getAll)
    .post(validate(createOrderSchema), ordersController.create);

router
    .route('/:id')
    .get(validate(getByIdOrderSchema), ordersController.getById)

router
    .route('/:id/status')
    .patch(validate(updateOrderStatusSchema), ordersController.updateStatus)

export default router