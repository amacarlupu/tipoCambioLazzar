const router = require('express').Router();
const { getLast5Days, getTipoCambio } = require('../controllers/tipoCambioCtrl');
const { Op } = require('sequelize');
// const TIPOCAMBIO = require('../models/tipoCambio');
const TIPOCAMBIO = require('../models/T_cambio');

require('../config/db');


router.get('/cloud/:id', async(req, res) =>{
    
    const fecha = req.params.id;
    const cambio = await TIPOCAMBIO.findOne({
        where:{
            FEC_CMB: fecha
        }
    });

    if(!cambio){
        return res.status(400).json({
            error:'Fecha no encontrada'
        });
    }

    res.json(cambio);
})




// Obtener tipo de cambio
router.get('/dolares/:id', async (req, res) => {

    const fechaAnterior = getLast5Days(req.params.id);
    const tipoCambioDB = await TIPOCAMBIO.findOne({
        where: {
            fecha: (fechaAnterior[0]).toString()
        }
    });

    if (!tipoCambioDB) {

        const fecha = (req.params.id).toString();
        const arregloFechas = getLast5Days(fecha);
        if (!arregloFechas) {
            return res.status(400).json({
                message: 'Fecha no encontrada'
            });
        }

        const tipoCambio = await getTipoCambio(arregloFechas);
        if (!tipoCambio) {
            return res.status(400).json({
                error: 'Tipo de cambio no encontrado'
            });
        }

        const validarNuevaFecha = await TIPOCAMBIO.findOne({
            where: {
                fecha: tipoCambio.fecha
            }
        });

        if (!validarNuevaFecha) {
            TIPOCAMBIO.create({
                fecha: tipoCambio.fecha,
                moneda: tipoCambio.moneda,
                compra: tipoCambio.compra,
                venta: tipoCambio.venta
            });
        }
        return res.json(tipoCambio);
    }
    res.json(tipoCambioDB);
})

module.exports = router;