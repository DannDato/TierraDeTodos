import express from "express";

const router = express.Router();

router.get('/', (req, res) => {
    res.send(`
        <title>Backend | TDT 3</title>
        <body style="background-color: #f0f0f0; display: flex; justify-content: center; align-items: center; height: 100vh;">
            <center>
                <h1 style="color: #333; font-family: Arial, sans-serif;">
                    Tierra de todos 3
                </h1>
                <h2 style="color: green; font-family: Arial, sans-serif;">
                    Backend funcionando correctamente
                </h2>
            </center>
        </body>`);
});

export default router