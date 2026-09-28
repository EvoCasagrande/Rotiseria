import { Request, Response } from "express";
import type { CategoriesService } from "./categories.service.js";
import { AppError } from "../../utils/AppError.js";
import type { CategoriesQueryInput, CreateCategoryInput, UpdateCategoryInput } from "./categories.schema.js";

type ValidatedLocals<T> = {
    validated: T
}

export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService){}

    getAll = async(
        _req: Request,
        res: Response<unknown, ValidatedLocals<{ query: CategoriesQueryInput }>>,
    ): Promise<void> => {
        const categories = await this.categoriesService.getAll(res.locals.validated.query)

        res.status(200).json({
            status: 'success',
            categories
        })
    }

    getById = async(_req: Request, res: Response<unknown, ValidatedLocals<{ params: { id: string } }>>,): Promise<void> => {
        const category = await this.categoriesService.getById(res.locals.validated.params.id);

        if(!category) {
            throw new AppError('Categoria no encontrada', 404)
        }

        res.status(200).json({
            status: 'success',
            category
        })
    }

    create = async(
        _req: Request,
        res: Response<unknown, ValidatedLocals<{ body: CreateCategoryInput }>>,
    ): Promise<void> => {
        const category = await this.categoriesService.create(res.locals.validated.body)

        res.status(201).json({
            status: 'success',
            category
        })
    }

    update = async(
        _req: Request,
        res: Response<unknown, ValidatedLocals<{ params: { id: string }, body: UpdateCategoryInput }>>,
    ): Promise<void> => {
        const category = await this.categoriesService.update(
            res.locals.validated.body,
            res.locals.validated.params.id,
        )

        res.status(200).json({
            status: 'success',
            category
        })
    }

    deactivate = async(
        _req: Request,
        res: Response<unknown, ValidatedLocals<{ params: { id: string } }>>,
    ): Promise<void> => {
        await this.categoriesService.deactivate(res.locals.validated.params.id)

        res.status(204).send()
    } 
}
