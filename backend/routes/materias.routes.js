const router = require('express').Router();
const { getAll } = require('../controllers/materias.controller');

router.get('/', getAll);

module.exports = router;
