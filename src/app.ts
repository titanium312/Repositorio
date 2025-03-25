// server.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import routerh from './Router/Routerh';

const app = express();
const port = 1234;

// Habilitar CORS
app.use(cors());

// Middleware para parsear JSON
app.use(express.json());

// Usar las rutas definidas
app.use('/Hotel', routerh);

// Crear el servidor de Express
const server = app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});

// Crear el servidor WebSocket utilizando el servidor de Express
const wss = new WebSocketServer({ server });

// Conexión de WebSocket
wss.on('connection', (ws) => {
  console.log('Nuevo cliente conectado');
  
  ws.on('message', (message) => {
    console.log(`Mensaje recibido: ${message}`);
  });

  ws.send('Bienvenido al servidor WebSocket');
});

// Emitir un mensaje cuando se detecta una actualización en la API
const notifyClients = () => {
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify({ actualizar: true }));  // Enviar la señal de actualización
    }
  });
};

// Middleware para manejar errores globalmente
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Algo salió mal en el servidor',
    error: err.message,
  });
});

export { notifyClients };
