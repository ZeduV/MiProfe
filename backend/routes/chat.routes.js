const router = require('express').Router();
const auth = require('../middleware/auth');
const { getConversaciones, getMessages, sendMessage } = require('../controllers/chat.controller');

router.get('/conversaciones', auth, getConversaciones);
router.get('/:reservaId', auth, getMessages);
router.post('/:reservaId', auth, sendMessage);

module.exports = router;
