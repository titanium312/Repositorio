"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Contador_1 = __importDefault(require("../Controller/Contador"));
const router = (0, express_1.Router)();
// Ruta para obtener los valores actuales de los contadores
router.get('/contadores', Contador_1.default.obtenerContadores);
// Ruta para obtener la orden dictada
router.get('/ordenDictada', Contador_1.default.obtenerOrdenDictado);
// Ruta para enviar una nueva orden dictada
router.post('/enviarOrdenDictado', Contador_1.default.enviarOrdenDictado);
// Rutas para actualizar los contadores
router.post('/actualizarContador1', Contador_1.default.actualizarContador1);
router.post('/actualizarContador2', Contador_1.default.actualizarContador2);
router.post('/actualizarContador3', Contador_1.default.actualizarContador3);
// Ruta para la notificación SSE de cambios
router.get('/notificarCambioContadorSSE', Contador_1.default.notificarCambioContadorSSE);
exports.default = router;
