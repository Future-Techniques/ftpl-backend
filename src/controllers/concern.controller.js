import { query } from '../config/db.js';
import { serializeConcerns } from '../helpers/serializers.js';

export async function getConcerns(req, res, next) {
    try {
        const { rows: concerns } = await query(
            `SELECT * FROM public."concerns" WHERE status = 1 ORDER BY "order" ASC, "id" ASC`
        );

        const serialized = serializeConcerns(concerns);

        return res.json({
            result: 'success',
            concerns: serialized
        });
    } catch (err) {
        next(err);
    }
}
