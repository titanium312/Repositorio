import { Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { Database } from '../../../db/Database';
import routerh from '../../../Router/Routerh';

const pool = Database.connect();

// Controlador para actualizar el estado de una habitación
export const actualizarEstadoHabitacion = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Obtén los parámetros necesarios de la solicitud
    const { idHabitacion, idEstadoHabitacion } = req.body;

    // Verifica que ambos parámetros están presentes
    if (!idHabitacion || !idEstadoHabitacion) {
      return res.status(400).json({ message: 'Faltan parámetros: ID de habitación o ID de estado de habitación.' });
    }

    // Consulta SQL para actualizar el estado de la habitación
    const query = `
      UPDATE habitacion
      SET ID_Estado_Habitacion = ?
      WHERE ID_Habitacion = ?;
    `;

    // Conexión a la base de datos y ejecución de la consulta
    const [result] = await pool.execute(query, [idEstadoHabitacion, idHabitacion]);

    // Accede a la propiedad 'affectedRows' en el resultado
    const affectedRows = (result as mysql.ResultSetHeader).affectedRows;

    // Si no se actualizó ninguna fila, la habitación no existe
    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Habitación no encontrada o estado no válido.' });
    }

    // Respuesta exitosa
    return res.status(200).json({ message: 'Estado de la habitación actualizado exitosamente.' });
  } catch (error: unknown) {
    // Manejo de errores con tipo 'unknown'
    if (error instanceof Error) {
      // Accede de forma segura a las propiedades de 'Error'
      console.error(error.message);
      return res.status(500).json({ message: 'Error al actualizar el estado de la habitación.', error: error.message });
    }

    // En caso de que el error no sea una instancia de Error
    console.error('Error desconocido', error);
    return res.status(500).json({ message: 'Error desconocido al actualizar el estado de la habitación.' });
  }
};


// Controlador para obtener todos los estados de las habitaciones
export const obtenerEstadosHabitacion = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Consulta SQL para obtener todos los estados de las habitaciones
    const query = `SELECT ID_Estado_Habitacion, Descripcion FROM estado_habitacion`;

    // Ejecutar la consulta
    const [rows] = await pool.execute(query);

    // Si no se encontraron estados, devolver un mensaje adecuado
    if ((rows as any).length === 0) {
      return res.status(404).json({ message: 'No se encontraron estados de habitaciones.' });
    }

    // Responder con los estados encontrados
    return res.status(200).json(rows);
  } catch (error: unknown) {
    // Manejo de errores con tipo 'unknown'
    if (error instanceof Error) {
      console.error(error.message);
      return res.status(500).json({ message: 'Error al obtener los estados de las habitaciones.', error: error.message });
    }

    console.error('Error desconocido', error);
    return res.status(500).json({ message: 'Error desconocido al obtener los estados de las habitaciones.' });
  }
};
