import { Request, Response } from "express";
import type { ProductsService } from "./products.service.js";
import { AppError } from "../../utils/AppError.js";
import type { ProductsQueryInput, CreateProductInput, UpdateProductInput } from "./products.schema.js"

type ValidatedLocals<T> = {
    validated: T
}


export class ProductsController {
    constructor(private readonly productsService: ProductsService){}
    getAll = async(
        _req: Request,
        res: Response<unknown, ValidatedLocals<{ query: ProductsQueryInput }>>,
    ): Promise<void> => {
        const products = await this.productsService.getAll(res.locals.validated.query)

        res.status(200).json({
            status: 'success',
            products
        })
    }

    getById = async(
        _req: Request, 
        res: Response<unknown, ValidatedLocals<{ params: { id: string } }>>,
    ): Promise<void> => {
        const product = await this.productsService.getById(res.locals.validated.params.id);

        if(!product) {
            throw new AppError('Producto no encontrado', 404)
        }

        res.status(200).json({
            status: 'success',
            product
        })
    }

    create = async(
        _req: Request,
        res: Response<unknown, ValidatedLocals<{ body: CreateProductInput }>>,
    ): Promise<void> => {
        const product = await this.productsService.create(res.locals.validated.body)

        res.status(201).json({
            status: 'success',
            product
        })
    }

    update = async(
        _req: Request,
        res: Response<unknown, ValidatedLocals<{ params: { id: string }, body: UpdateProductInput }>>,
    ): Promise<void> => {
        const product = await this.productsService.update(
            res.locals.validated.body,
            res.locals.validated.params.id,
        )

        res.status(200).json({
            status: 'success',
            product
        })
    }

    deactivate = async(
        _req: Request,
        res: Response<unknown, ValidatedLocals<{ params: { id: string } }>>,
    ): Promise<void> => {
        await this.productsService.deactivate(res.locals.validated.params.id)

        res.status(204).send()
    } 
}