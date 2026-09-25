import { Router } from "express";
import { CategoriesController } from "./categories.controller.js";
import { CategoriesService } from "./categories.service.js";
import { createCategorySchema, deleteCategorySchema, getByIdCategorySchema, getCategoriesSchema, updateCategorySchema } from "./categories.schema.js";

const categoriesService = new CategoriesService();
const categoriesController = new CategoriesController(categoriesService);

const router = Router()

router
    .route('/')
    .get(validate(getCategoriesSchema), categoriesController.getAll)
    .post(validate(createCategorySchema), categoriesController.create);

router
    .route('/:id')
    .get(validate(getByIdCategorySchema), categoriesController.getById)
    .patch(validate(updateCategorySchema), categoriesController.update)
    .patch(validate(deleteCategorySchema), categoriesController.deactivate)