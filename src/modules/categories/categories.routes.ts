import { Router } from "express";
import { CategoriesController } from "./categories.controller.js";
import { CategoriesService } from "./categories.service.js";
import { createCategorySchema, deactivateCategorySchema, getByIdCategorySchema, getCategoriesSchema, updateCategorySchema } from "./categories.schema.js";
import { validate } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/requireAuth.js";

const categoriesService = new CategoriesService();
const categoriesController = new CategoriesController(categoriesService);

const router = Router()

router
    .route('/')
    .get(validate(getCategoriesSchema), categoriesController.getAll)
    .post(validate(createCategorySchema), requireAuth, categoriesController.create);

router
    .route('/:id')
    .get(validate(getByIdCategorySchema), categoriesController.getById)
    .patch(validate(updateCategorySchema), requireAuth, categoriesController.update)
    .delete(validate(deactivateCategorySchema), requireAuth, categoriesController.deactivate)

export default router
