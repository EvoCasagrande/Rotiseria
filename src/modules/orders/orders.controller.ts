import { Request, Response } from "express";
import type { OrdersService } from "./orders.service.js";
import { AppError } from "../../utils/AppError.js";
import { getStatistics } from './orders.statistics.js'
import type { OrderQueryInput, CreateOrderInput, UpdateOrderStatusInput } from "./orders.schema.js"

type ValidatedLocals<T> = {
    validated: T
}

export class OrdersController {
    constructor(private readonly ordersService: OrdersService){}
    statistics = async (_req: Request, res: Response): Promise<void> => {
        const { query } = res.locals.validated as { query: { from?: string; to?: string; timeZone: string } }
        const statistics = await getStatistics({ from: query.from, to: query.to }, query.timeZone)
        res.status(200).json({ status: 'success', statistics })
    }
    getAll = async(
        _req: Request,
        res: Response<unknown, ValidatedLocals<{ query: OrderQueryInput }>>,
    ): Promise<void> => {
        const orders = await this.ordersService.getAll(res.locals.validated.query)

        res.status(200).json({
            status: 'success',
            orders
        })
    }

    getById = async(
        _req: Request, 
        res: Response<unknown, ValidatedLocals<{ params: { id: string } }>>,
    ): Promise<void> => {
        const order = await this.ordersService.getById(res.locals.validated.params.id);

        if(!order) {
            throw new AppError('Pedido no encontrado', 404)
        }

        res.status(200).json({
            status: 'success',
            order
        })
    }

    create = async(
        _req: Request,
        res: Response<unknown, ValidatedLocals<{ body: CreateOrderInput }>>,
    ): Promise<void> => {
        const order = await this.ordersService.create(res.locals.validated.body)

        res.status(201).json({
            status: 'success',
            order
        })
    }

    updateStatus = async(
        _req: Request,
        res: Response<unknown, ValidatedLocals<{ params: { id: string }, body: UpdateOrderStatusInput }>>,
    ): Promise<void> => {
        const order = await this.ordersService.updateStatus(
            res.locals.validated.params.id,
            res.locals.validated.body
        )

        res.status(200).json({
            status: 'success',
            order
        })
    }
}
