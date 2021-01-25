const router = require('express').Router();
const { sequelize } = require('../config/db');

const { getLast5Days,
    getTipoCambio,
    setFecha,
    setFechaNow,
    setHoraActual
} = require('../controllers/tipoCambioCtrl');
const TIPOCAMBIO = require('../models/T_cambio');

require('../config/db');


router.get('/cloud/:id', async (req, res) => {

    const fecha = req.params.id;
    const cambio = await TIPOCAMBIO.findOne({
        where: {
            FEC_CMB: fecha
        }
    });

    if (!cambio) {
        return res.status(400).json({
            error: 'Fecha no encontrada'
        });
    }

    res.json(cambio);
})


// Obtener tipo de cambio
router.get('/dolares/:id', async (req, res) => {

    const fechaAnterior = getLast5Days(req.params.id);
    const formatoYYMMDD = setFecha(fechaAnterior[0]);
    const convertToDate = new Date(formatoYYMMDD);
    const diaSemana = convertToDate.getDay(); // Obtener dia de semana
    let fechaActual; // 5=sabado y 6=domingo
        if( diaSemana === 5 ){
            fechaActual = fechaAnterior[1];
        }else if ( diaSemana === 6 ){
            fechaActual = fechaAnterior[2];
        }else{
            fechaActual = fechaAnterior[0]
        }
        
    const tipoCambioDB = await TIPOCAMBIO.findOne({
        attributes: ['FEC_CMB', 'TIP_CMB', 'TIP_CMBC'],
        where: {
            // FEC_CMB: setFecha(fechaAnterior[0])
            FEC_CMB: setFecha(fechaActual)
        }
    }); 

    // Si no está en DB, hacer la búsqueda
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
                FEC_CMB: setFecha(tipoCambio.fecha)
            }
        });

        if (!validarNuevaFecha) {

            const fechaFormatoDB = setFecha(tipoCambio.fecha);
            const fechaHoyFormatDB = setFechaNow(new Date());
            const horaFormatDB = setHoraActual(new Date());

            const guardarFechaDB = await sequelize.query(`INSERT INTO T_cambio VALUES (
                '${fechaFormatoDB}',
                ${tipoCambio.venta},
                ${tipoCambio.compra},
                'SUPERVISOR',
                '${fechaHoyFormatDB}',
                '${horaFormatDB}',
                0,0
            )`);

            // TIPOCAMBIO.create({
            //     FEC_CMB: moment(`"${fechaFormatoDB}"`,  "YYYY-MM-DD"),
            //     // moneda: tipoCambio.moneda,
            //     TIP_CMB: Number(tipoCambio.venta),
            //     TIP_CMBC: Number(tipoCambio.compra),
            //     CDG_USU: 'SUPERVISOR',
            //     FEC_USU: moment(`"${fechaHoyFormatDB}"`, "YYYY-MM-DD"),
            //     HOR_USU: horaFormatDB,
            //     TCV_VENTA: 0,
            //     TCC_VENTA: 0
            // });
        }
        return res.json({
            FEC_CMB: setFecha(tipoCambio.fecha),
            TIP_CMB: Number(tipoCambio.venta),
            TIP_CMBC: Number(tipoCambio.compra),
        });
    }
    res.json(tipoCambioDB); // devuelve si está en la base de datos
})

module.exports = router;