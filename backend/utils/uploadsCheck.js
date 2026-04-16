import multer from "multer";

const TYPE_MIME_MAP = {
    image: ["image/jpeg", "image/png", "image/webp", "image/gif"]
};

function uploadsCheck({ type = "image", field = "file", maxSizeMb = 5, allowedMimes } = {}) {
    const configuredMimes = Array.isArray(allowedMimes) && allowedMimes.length > 0
        ? allowedMimes
        : TYPE_MIME_MAP[type] || [];

    const upload = multer({
        storage: multer.memoryStorage(),
        limits: {
            fileSize: maxSizeMb * 1024 * 1024,
        },
        fileFilter: (req, file, cb) => {
            const fileType = file?.mimetype || "";

            // If explicit allowlist exists, enforce exact match.
            if (configuredMimes.length > 0) {
                if (!configuredMimes.includes(fileType)) {
                    return cb(new Error(`Tipo de archivo no permitido: ${fileType || "desconocido"}`));
                }
                return cb(null, true);
            }

            // Generic fallback by top-level type (image/*, video/*, etc.)
            if (!fileType.startsWith(`${type}/`)) {
                return cb(new Error(`Solo se permiten archivos de tipo ${type}`));
            }

            return cb(null, true);
        }
    });

    return (req, res, next) => {
        upload.single(field)(req, res, (error) => {
            if (error) {
                if (error instanceof multer.MulterError) {
                    if (error.code === "LIMIT_FILE_SIZE") {
                        return res.status(400).json({ message: `El archivo supera el límite de ${maxSizeMb}MB` });
                    }
                    return res.status(400).json({ message: `Error de carga: ${error.message}` });
                }

                return res.status(400).json({ message: error.message || "Archivo inválido" });
            }

            if (!req.file) {
                return res.status(400).json({ message: "No se ha proporcionado ningún archivo" });
            }

            return next();
        });
    };
}

export { uploadsCheck };
