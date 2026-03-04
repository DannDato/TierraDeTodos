import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export const login = async (req, res) => {
    const { email, password } = req.body;

    // const user = await User.findOne({ where: { email } });

    const user ={id:24, usuario: "danndato", email: "danieltova97@gmail.com"};
    if (!user) { return res.status(401).json({ message: 'Credenciales inválidas' }); }
    
    if(user.email !== email) { return res.status(401).json({ message: 'Credenciales inválidas' }); }

    const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );

    res.json({ token });
}