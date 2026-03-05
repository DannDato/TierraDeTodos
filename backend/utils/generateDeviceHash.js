import crypto from "crypto";

function generateDeviceHash(req){

    const raw = `${req.ip}-${req.headers['user-agent']}`;

    return crypto
        .createHash('sha256')
        .update(raw)
        .digest('hex');
}

export default generateDeviceHash;