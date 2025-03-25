import express from 'express';
import cors from 'cors';
import dictadoRoutes from './Router/Routes'; // Asegúrate de que esta ruta esté bien

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Rutas del dictado
app.use('/api', dictadoRoutes);

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
