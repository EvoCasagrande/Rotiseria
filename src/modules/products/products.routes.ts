import { Router } from "express";
import { ProductsService } from "./products.service.js";
import { ProductsController } from "./products.controller.js";
import { getProductsSchema, getByIdProductSchema, createProductSchema, updateProductSchema, deactivateProductSchema } from "./products.schema.js";
import { validate } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/requireAuth.js";

const productsService = new ProductsService();
const productsController = new ProductsController(productsService);

const router = Router()

router
    .route('/')
    .get(validate(getProductsSchema), productsController.getAll)
    .post(validate(createProductSchema), requireAuth, productsController.create);

router
    .route('/:id')
    .get(validate(getByIdProductSchema), productsController.getById)
    .patch(validate(updateProductSchema), requireAuth, productsController.update)
    .delete(validate(deactivateProductSchema), requireAuth, productsController.deactivate)

export default router
