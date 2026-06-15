const router = require('express').Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { create, getByDocente } = require('../controllers/calificaciones.controller');

router.post('/', auth, roleCheck('Estudiante'), create);
router.get('/docente/:perfilId', getByDocente);

module.exports = router;
