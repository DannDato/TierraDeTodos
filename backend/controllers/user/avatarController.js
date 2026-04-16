import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
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

    uploadAvatar = async (req, res) => {
        try {
            const file = req.file;
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ message: 'Usuario no autenticado' });
            }

            if (!file) {
                return res.status(400).json({ message: 'No se recibió ninguna imagen' });
            }

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

            const row = await models.UserProfileImages.create({
                userId,
                og_filename: safeOriginalName,
                img: imageUrl
            });

            return res.status(201).json({
                message: 'Avatar subido correctamente',
                avatar: row
            });

        } catch (error) {
            return handleError(res, req, error, `Error al subir el avatar`);
        }
    }
}

const ctrlAvatar = new AvatarController();
export { ctrlAvatar };