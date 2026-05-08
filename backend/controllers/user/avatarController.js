import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import path from "path";
import handleError from '../../handlers/handleError.js';
import { models } from '../../models/index.js';

class AvatarController {
    s3 = () => {
        const s3 = new S3Client({
            region: "auto",
            endpoint: process.env.R2_ENDPOINT,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY,
                secretAccessKey: process.env.R2_SECRET_KEY,
            },
        });
        return s3;
    };

    parseNumber = (value, fallback) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    };

    clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    getLatestAvatarRow = async (userId) => {
        return models.user_profile_images.findOne({
            where: { userId },
            order: [['id', 'DESC']]
        });
    };

    getAvatarRows = async (userId) => {
        return models.user_profile_images.findAll({
            where: { userId },
            order: [['id', 'DESC']]
        });
    };

    getPublicBases = () => {
        const bases = [];

        if (process.env.R2_PUBLIC_URL) {
            bases.push(process.env.R2_PUBLIC_URL.replace(/\/$/, ''));
        }

        if (process.env.R2_ENDPOINT && process.env.R2_BUCKET) {
            bases.push(`${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}`.replace(/\/$/, ''));
        }

        return [...new Set(bases)];
    };

    extractR2KeyFromUrl = (fileUrl) => {
        const rawUrl = String(fileUrl || '').trim();
        if (!rawUrl) return null;

        const publicBases = this.getPublicBases();
        const matchedBase = publicBases.find((base) => rawUrl.startsWith(base));
        if (matchedBase) {
            const key = rawUrl.slice(matchedBase.length + 1);
            return key || null;
        }

        try {
            const parsed = new URL(rawUrl);
            return parsed.pathname.replace(/^\//, '') || null;
        } catch {
            return null;
        }
    };

    deleteAvatarObjectByUrl = async (fileUrl) => {
        const key = this.extractR2KeyFromUrl(fileUrl);
        if (!key) return false;

        await this.s3().send(new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET,
            Key: key,
        }));

        return true;
    };

    uploadAvatar = async (req, res) => {
        try {
            const file = req.file;
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ message: 'Usuario no autenticado' });
            }

            if (!file) {
                return res.status(400).json({ message: 'No se recibiÃ³ ninguna imagen' });
            }

            const previousRows = await this.getAvatarRows(userId);

            const extByMime = {
                'image/jpeg': 'jpg',
                'image/png': 'png',
                'image/webp': 'webp',
                'image/gif': 'gif'
            };

            const extension = extByMime[file.mimetype] || 'webp';
            const folder = process.env.R2_FOLDER || 'tdt3';
            const key = `${folder}/avatars/${userId}/avatar_${Date.now()}.${extension}`;

            await this.s3().send(new PutObjectCommand({
                Bucket: process.env.R2_BUCKET,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
            }));

            const normalizedPublicBase = process.env.R2_PUBLIC_URL
                ? process.env.R2_PUBLIC_URL.replace(/\/$/, '')
                : `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}`.replace(/\/$/, '');

            const imageUrl = `${normalizedPublicBase}/${key}`;
            const safeOriginalName = path
                .basename(file.originalname || "upload")
                .replace(/[^a-zA-Z0-9._-]/g, "_")
                .slice(0, 180);

            const posX = this.clamp(this.parseNumber(req.body?.posX, 50), 0, 100);
            const posY = this.clamp(this.parseNumber(req.body?.posY, 50), 0, 100);
            const zoom = this.clamp(this.parseNumber(req.body?.zoom, 1), 1, 3);

            const row = await models.user_profile_images.create({
                userId,
                og_filename: safeOriginalName,
                img: imageUrl,
                pos_x: posX,
                pos_y: posY,
                zoom
            });

            // Limpieza: borrar avatares antiguos del S3 y limpiar filas viejas
            for (const previousRow of previousRows) {
                if (!previousRow?.img) continue;
                try {
                    await this.deleteAvatarObjectByUrl(previousRow.img);
                } catch (cleanupError) {
                    console.warn(`No se pudo borrar avatar anterior en S3 para user ${userId}: ${cleanupError.message}`);
                }
            }

            if (previousRows.length > 0) {
                await models.user_profile_images.destroy({
                    where: { userId, id: previousRows.map((r) => r.id) }
                });
            }

            await req.logAction({
                accion: 'Avatar subido correctamente',
                apartado: 'Avatar',
                userId,
                username: req.user?.username,
                valor: `avatarId=${row.id}; replaced=${previousRows.length}`,
                type: 'info'
            });

            return res.status(201).json({
                message: 'Avatar subido correctamente',
                avatar: row
            });

        } catch (error) {
            return handleError(res, req, error, `Error al subir el avatar`);
        }
    };

    updateAvatarPosition = async (req, res) => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ message: 'Usuario no autenticado' });
            }

            const row = await this.getLatestAvatarRow(userId);
            if (!row) {
                return res.status(404).json({ message: 'No hay avatar para actualizar' });
            }

            const posX = this.clamp(this.parseNumber(req.body?.posX, row.pos_x), 0, 100);
            const posY = this.clamp(this.parseNumber(req.body?.posY, row.pos_y), 0, 100);
            const zoom = this.clamp(this.parseNumber(req.body?.zoom, row.zoom), 1, 3);

            await row.update({ pos_x: posX, pos_y: posY, zoom });

            await req.logAction({
                accion: 'Posicion de avatar actualizada',
                apartado: 'Avatar',
                userId,
                username: req.user?.username,
                valor: `avatarId=${row.id}; posX=${posX}; posY=${posY}; zoom=${zoom}`,
                type: 'info'
            });

            return res.status(200).json({
                message: 'Posicion de avatar actualizada',
                avatar: row
            });
        } catch (error) {
            return handleError(res, req, error, 'Error al actualizar la posicion del avatar');
        }
    };

    deleteAvatar = async (req, res) => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ message: 'Usuario no autenticado' });
            }

            const rows = await this.getAvatarRows(userId);
            if (!rows || rows.length === 0) {
                return res.status(404).json({ message: 'No hay avatar para eliminar' });
            }

            // Borrar todos los objetos vinculados en S3 para evitar basura
            for (const row of rows) {
                if (!row?.img) continue;
                try {
                    await this.deleteAvatarObjectByUrl(row.img);
                } catch (cleanupError) {
                    console.warn(`No se pudo borrar avatar en S3 para user ${userId}: ${cleanupError.message}`);
                }
            }

            await models.user_profile_images.destroy({ where: { userId } });

            await req.logAction({
                accion: 'Avatar eliminado correctamente',
                apartado: 'Avatar',
                userId,
                username: req.user?.username,
                valor: `deletedRows=${rows.length}`,
                type: 'info'
            });

            return res.status(200).json({
                message: 'Avatar eliminado correctamente'
            });
        } catch (error) {
            return handleError(res, req, error, 'Error al eliminar el avatar');
        }
    };
}

const ctrlAvatar = new AvatarController();
export { ctrlAvatar };
