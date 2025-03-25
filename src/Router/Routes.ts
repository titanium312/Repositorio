import { Router } from 'express';
import ContadorYDictadoController from '../Controller/Contador';

const router = Router();

// Ruta para obtener los valores actuales de los contadores
router.get('/contadores', ContadorYDictadoController.obtenerContadores);

// Ruta para obtener la orden dictada
router.get('/ordenDictada', ContadorYDictadoController.obtenerOrdenDictado);

// Ruta para enviar una nueva orden dictada
router.post('/enviarOrdenDictado', ContadorYDictadoController.enviarOrdenDictado);

// Rutas para actualizar los contadores
router.post('/actualizarContador1', ContadorYDictadoController.actualizarContador1);
router.post('/actualizarContador2', ContadorYDictadoController.actualizarContador2);
router.post('/actualizarContador3', ContadorYDictadoController.actualizarContador3);

// Ruta para la notificación SSE de cambios
router.get('/notificarCambioContadorSSE', ContadorYDictadoController.notificarCambioContadorSSE);

export default router;
