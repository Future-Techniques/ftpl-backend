import { query } from '../config/db.js';
import {
    serializeAssociates,
    serializeAssociateCategories
} from '../helpers/serializers.js';

export async function getAssociates(req, res, next) {
    try {
        const { rows: associates } = await query(
            `SELECT * FROM public."associates" WHERE status = 1 AND category_id = 1 ORDER BY "order" ASC, "id" ASC`
        );

        const serialized = serializeAssociates(associates);

        return res.json({
            result: 'success',
            associates: serialized
        });
    } catch (err) {
        next(err);
    }
}

export async function getAssociateList(req, res, next) {
    try {
        const { rows: categories } = await query(
            `SELECT * FROM public."association_categories" WHERE status = 1 ORDER BY "id" ASC`
        );

        const { rows: associates } = await query(
            `SELECT * FROM public."associates" WHERE status = 1`
        );

        const serialized = serializeAssociateCategories(categories, associates);

        return res.json({
            result: 'success',
            associates: serialized
        });
    } catch (err) {
        next(err);
    }
}
