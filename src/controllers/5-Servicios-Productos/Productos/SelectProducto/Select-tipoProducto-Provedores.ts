import { Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { Database } from '../../../../db/Database';

const pool = Database.connect();

export class ProductoController {

  // Obtener todos los tipos de productos
  static async obtenerTiposDeProductos(req: Request, res: Response): Promise<void> {
    const connection = await pool.getConnection();

    try {
      // Realizamos la consulta SELECT para obtener los tipos de productos
      const [tiposProductos] = await connection.query('SELECT * FROM PRODUCTO_TIPO');

      // Enviar la respuesta con los tipos de productos
      res.status(200).json({
        message: 'Tipos de productos obtenidos correctamente',
        data: tiposProductos
      });

    } catch (error: unknown) {
      console.error('Error al obtener los tipos de productos:', error);

      // Comprobamos si el error es una instancia de Error
      if (error instanceof Error) {
        res.status(500).json({ message: 'Error al obtener los tipos de productos', error: error.message });
      } else {
        // Si no es una instancia de Error, devolvemos un error genérico
        res.status(500).json({ message: 'Error desconocido al obtener los tipos de productos' });
      }
    } finally {
      // Liberamos la conexión
      connection.release();
    }
  }

  // Obtener todos los proveedores
  static async obtenerProveedores(req: Request, res: Response): Promise<void> {
    const connection = await pool.getConnection();

    try {
      // Realizamos la consulta SELECT para obtener los proveedores
      const [proveedores] = await connection.query('SELECT * FROM Provedor');

      // Enviar la respuesta con los proveedores
      res.status(200).json({
        message: 'Proveedores obtenidos correctamente',
        data: proveedores
      });

    } catch (error: unknown) {
      console.error('Error al obtener los proveedores:', error);

      // Comprobamos si el error es una instancia de Error
      if (error instanceof Error) {
        res.status(500).json({ message: 'Error al obtener los proveedores', error: error.message });
      } else {
        // Si no es una instancia de Error, devolvemos un error genérico
        res.status(500).json({ message: 'Error desconocido al obtener los proveedores' });
      }
    } finally {
      // Liberamos la conexión
      connection.release();
    }
  }
}
