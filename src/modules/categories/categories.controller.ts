import { Request, Response } from "express";
import type { CategoriesService } from "./categories.service.js";
import { AppError } from "../../utils/AppError.js";
import type { CreateCategoryInput, UpdateCategoryInput } from "./categories.schema.js";

export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService){}

    getAll = async(req: Request, res: Response): Promise<void> => {
        const categories = await this.categoriesService.getAll(req.query)

        res.status(200).json({
            status: 'success',
            categories
        })
    }

    getById = async(req: Request<{ id: string }>, res: Response): Promise<void> => {
        const category = await this.categoriesService.getById(req.params.id);

        res.status(200).json({
            status: 'success',
            category
        })
    }

    create = async(req: Request<{}, {}, CreateCategoryInput>, res: Response): Promise<void> => {
        const category = await this.categoriesService.create(req.body)

        res.status(201).json({
            status: 'success',
            category
        })
    }

    update = async(req: Request<{ id: string }, {}, UpdateCategoryInput>, res: Response): Promise<void> => {
        const category = await this.categoriesService.update(req.body, req.params.id)

        res.status(200).json({
            status: 'success',
            category
        })
    }

    deactivate = async(req: Request<{ id: string }>, res: Response): Promise<void> => {
        await this.categoriesService.deactivate(req.params.id)

        res.status(204).send()
    } 
}