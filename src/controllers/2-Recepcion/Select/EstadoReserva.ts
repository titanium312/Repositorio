import { Request, Response } from 'express';  // Importamos los tipos de Express
import { Database } from '../../../db/Database';  // Asegúrate de que esta importación sea correcta

const pool = Database.connect();  // Conexión a la base de datos

export class MetodoPago {
  // Obtener todos los métodos de pago
  public static async getMetodoPago(req: Request, res: Response): Promise<void> {
    try {
      // Realizamos la consulta SQL para obtener los métodos de pago
      const [rows] = await pool.query('SELECT * FROM MetodoPago');
      
      // Enviamos la respuesta con los datos obtenidos
      res.status(200).json(rows);
    } catch (error) {
      console.error('Error al obtener los métodos de pago:', error);
      res.status(500).json({ message: 'Error al obtener los métodos de pago' });
    }
  }
}
