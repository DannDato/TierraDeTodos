import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if(!authHeader) { return res.status(401).json({ message: 'JWT no authorizado' }); }

    const token = authHeader.split(' ')[1];

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    }
    catch(error){
        return res.status(403).json({ message: 'JWT no valido' });
    }
}
