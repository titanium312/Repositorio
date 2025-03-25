"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ContadorYDictadoController {
    // Obtener los valores de los contadores
    static obtenerContadores(req, res) {
        res.json({
            contador1: ContadorYDictadoController.contador1,
            contador2: ContadorYDictadoController.contador2,
            contador3: ContadorYDictadoController.contador3
        });
    }
    // Obtener la orden dictada (si hay una pendiente)
    static obtenerOrdenDictado(req, res) {
        if (ContadorYDictadoController.ordenDictada !== null) {
            res.json({ contador: ContadorYDictadoController.ordenDictada });
        }
        else {
            res.json({ message: 'No value set' });
        }
    }
    // Enviar una nueva orden dictada (actualizar la orden dictada)
    static enviarOrdenDictado(req, res) {
        const { contadorId } = req.body;
        console.log(`Recibiendo contadorId: ${contadorId}`);
        if (typeof contadorId === 'number') {
            const oldOrden = ContadorYDictadoController.ordenDictada;
            ContadorYDictadoController.ordenDictada = contadorId;
            if (oldOrden !== ContadorYDictadoController.ordenDictada) {
                console.log(`¡Cambio detectado! La orden dictada ha cambiado a: ${ContadorYDictadoController.ordenDictada}`);
                ContadorYDictadoController.enviarEventoSSE();
            }
            else {
                console.log('La orden dictada no ha cambiado.');
            }
            res.json({ message: 'Contador actualizado', contador: ContadorYDictadoController.ordenDictada });
        }
        else {
            console.log('Valor no válido para contadorId');
            res.status(400).json({ message: 'Valor no válido' });
        }
    }
    // Incrementar los contadores
    static actualizarContador1(req, res) {
        const { valor } = req.body;
        if (typeof valor === 'number') {
            ContadorYDictadoController.contador1 = valor;
            console.log(`¡Contador 1 actualizado! Nuevo valor: ${ContadorYDictadoController.contador1}`);
            ContadorYDictadoController.enviarEventoSSE();
            res.json({ mensaje: 'Contador 1 actualizado', valor: ContadorYDictadoController.contador1 });
        }
        else {
            res.status(400).json({ mensaje: 'Valor no válido para contador 1' });
        }
    }
    static actualizarContador2(req, res) {
        const { valor } = req.body;
        if (typeof valor === 'number') {
            ContadorYDictadoController.contador2 = valor;
            console.log(`¡Contador 2 actualizado! Nuevo valor: ${ContadorYDictadoController.contador2}`);
            ContadorYDictadoController.enviarEventoSSE();
            res.json({ mensaje: 'Contador 2 actualizado', valor: ContadorYDictadoController.contador2 });
        }
        else {
            res.status(400).json({ mensaje: 'Valor no válido para contador 2' });
        }
    }
    static actualizarContador3(req, res) {
        const { valor } = req.body;
        if (typeof valor === 'number') {
            ContadorYDictadoController.contador3 = valor;
            console.log(`¡Contador 3 actualizado! Nuevo valor: ${ContadorYDictadoController.contador3}`);
            ContadorYDictadoController.enviarEventoSSE();
            res.json({ mensaje: 'Contador 3 actualizado', valor: ContadorYDictadoController.contador3 });
        }
        else {
            res.status(400).json({ mensaje: 'Valor no válido para contador 3' });
        }
    }
    // Enviar actualizaciones a todos los clientes conectados por SSE
    static enviarEventoSSE() {
        console.log("Emitiendo evento SSE con la orden dictada y los contadores actualizados...");
        const data = JSON.stringify({
            contador1: ContadorYDictadoController.contador1,
            contador2: ContadorYDictadoController.contador2,
            contador3: ContadorYDictadoController.contador3,
            ordenDictada: ContadorYDictadoController.ordenDictada
        });
        // Emitir un evento SSE a todos los clientes conectados
        ContadorYDictadoController.clientesConectados.forEach((cliente) => {
            cliente.write(`data: ${data}\n\n`);
        });
    }
    // Notificar cambios en los contadores o la orden dictada
    static notificarCambioContadorSSE(req, res) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        // Agregar el cliente a la lista de clientes conectados para notificar
        ContadorYDictadoController.clientesConectados.push(res);
        // Enviar los datos iniciales cuando el cliente se conecta
        res.write(`data: ${JSON.stringify({
            contador1: ContadorYDictadoController.contador1,
            contador2: ContadorYDictadoController.contador2,
            contador3: ContadorYDictadoController.contador3,
            ordenDictada: ContadorYDictadoController.ordenDictada
        })}\n\n`);
        req.on('close', () => {
            // Eliminar el cliente de la lista cuando se desconecte
            ContadorYDictadoController.clientesConectados = ContadorYDictadoController.clientesConectados.filter(cliente => cliente !== res);
        });
    }
}
ContadorYDictadoController.contador1 = 0;
ContadorYDictadoController.contador2 = 0;
ContadorYDictadoController.contador3 = 0;
ContadorYDictadoController.ordenDictada = null;
ContadorYDictadoController.clientesConectados = []; // Para manejar las conexiones SSE
exports.default = ContadorYDictadoController;
