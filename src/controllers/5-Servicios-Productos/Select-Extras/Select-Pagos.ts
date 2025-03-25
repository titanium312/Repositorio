import { Request, Response } from 'express';
import { Database } from '../../../db/Database';

const pool = Database.connect();

// Controlador para obtener todos los métodos de pago
export const obtenerMetodosPagoController = async (req: Request, res: Response): Promise<void> => {
  try {
    // Realizamos la consulta para obtener todos los métodos de pago
    const [rows] = await pool.query(`SELECT * FROM metodoPago`);
    
    // Enviamos la respuesta con los datos en formato JSON
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener los métodos de pago:', error);
    
    // Si ocurre un error, enviamos una respuesta 500 con un mensaje de error
    res.status(500).json({ message: 'Error al obtener los métodos de pago' });
  }
};
