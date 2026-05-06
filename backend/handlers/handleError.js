
const handleError =  async function handleError(res, req, error, accion, transaction) {

    transaction ? await transaction.rollback(): null;
    req ? await req.logAction({
        accion: accion,
        apartado: 'Gestion',
        userId: req.user?.id,
        username: req.user?.username,
        valor: error.message,
        type: 'error'
    })
    : null;
    return res ? res.status(500).json({ message: `Error interno del servidor: ${process.env.NODE_ENV === 'development' ? error.message : ''}` }): false;
}

export default handleError;

