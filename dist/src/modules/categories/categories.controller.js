import { AppError } from "../../utils/AppError.js";
export class CategoriesController {
    categoriesService;
    constructor(categoriesService) {
        this.categoriesService = categoriesService;
    }
    getAll = async (req, res) => {
        const categories = await this.categoriesService.getAll(req.params);
        res.status(200).json({
            status: 'success',
            categories
        });
    };
    getById = async (req, res) => {
        const category = await this.categoriesService.getById(req.params.id);
        if (!category) {
            throw new AppError('No se encontro categoria con ese id', 404);
        }
        res.status(200).json({
            status: 'success',
            category
        });
    };
    create = async (req, res) => {
        const category = await this.categoriesService.create(req.body);
        res.status(201).json({
            status: 'success',
            category
        });
    };
    update = async (req, res) => {
        const category = await this.categoriesService.update(req.body, req.params.id);
        res.status(200).json({
            status: 'success',
            category
        });
    };
    deactivate = async (req, res) => {
        await this.categoriesService.deactivate(req.params.id);
        res.status(204).send();
    };
}
//# sourceMappingURL=categories.controller.js.map