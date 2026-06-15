const router = require('express').Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  getAll, getById, getDisponibilidad,
  addDisponibilidad, updatePerfil, deleteDisponibilidad
} = require('../controllers/docentes.controller');

// Public routes
router.get('/', getAll);
router.get('/:id', getById);
router.get('/:id/disponibilidad', getDisponibilidad);

// Protected routes (Docente/Auxiliar only)
router.post('/disponibilidad', auth, roleCheck('Docente', 'Auxiliar'), addDisponibilidad);
router.put('/perfil', auth, roleCheck('Docente', 'Auxiliar'), updatePerfil);
router.delete('/disponibilidad/:id', auth, roleCheck('Docente', 'Auxiliar'), deleteDisponibilidad);

module.exports = router;
