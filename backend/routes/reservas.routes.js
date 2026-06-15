const router = require('express').Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { create, getMisReservas, confirmar, cancelar, completar } = require('../controllers/reservas.controller');

router.post('/', auth, roleCheck('Estudiante'), create);
router.get('/mis-reservas', auth, getMisReservas);
router.put('/:id/confirmar', auth, roleCheck('Docente', 'Auxiliar'), confirmar);
router.put('/:id/cancelar', auth, cancelar);
router.put('/:id/completar', auth, roleCheck('Docente', 'Auxiliar'), completar);

module.exports = router;
