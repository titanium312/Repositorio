import { Request, Response } from 'express';
import mysql from 'mysql2/promise';  // Asegúrate de importar mysql2/promise
import { Database } from '../../../db/Database';

// Crear un pool de conexiones a la base de datos
const pool = Database.connect();

export const getPisos = async (req: Request, res: Response): Promise<void> => {
  try {
    // Obtener todos los pisos
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT ID_Piso, Descripcion 
      FROM Piso`
    );

    if (rows.length > 0) {
      res.status(200).json({ pisos: rows });
    } else {
      res.status(404).json({ message: 'No se encontraron pisos.' });
    }
  } catch (error) {
    console.error('Error al obtener los pisos:', error);
    res.status(500).json({ message: 'Error al obtener los pisos.' });
  }
};

/**
 * Ruta para obtener la información de una habitación específica por ID (con y sin reserva)
 */
export const getHabitacionInfo = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    // Realizamos la consulta SQL para obtener la información de la habitación por ID, con o sin reserva
    const [result] = await pool.query<mysql.RowDataPacket[]>(
      `SELECT
          h.ID_Habitacion,
          h.Nombre,
          h.Descripcion,
          t.Descripcion AS Tipo_Habitacion,
          h.Costo,
          e.Descripcion AS Estado_Habitacion,
          p.Descripcion AS Piso
       FROM habitacion h
       JOIN tipo_habitacion t ON h.ID_Tipo_Habitacion = t.ID_Tipo_Habitacion
       JOIN estado_habitacion e ON h.ID_Estado_Habitacion = e.ID_Estado_Habitacion
       JOIN piso p ON h.ID_Piso = p.ID_Piso
       WHERE h.ID_Habitacion = ?`,
      [id] // `id` debe ser el valor que pasas como parámetro
    );
    

    // Verificar si la habitación existe
    if (result.length === 0) {
      res.status(404).json({ message: 'Habitación no encontrada' });
    } else {
      res.status(200).json(result);
    }
  } catch (error) {
    console.error('Error al obtener la habitación:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * Ruta para eliminar una reserva de una habitación
 */
export const eliminarReserva = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    // Verificamos si existe la reserva asociada a la habitación
    const [result] = await pool.query<mysql.RowDataPacket[]>(
      `SELECT ID_Reserva FROM reserva_habitacion WHERE ID_Habitacion = ?`, [id]
    );

    if (result.length === 0) {
      res.status(404).json({ message: 'No se encontró una reserva asociada a la habitación' });
      return;
    }

    // Eliminamos la reserva de la habitación
    const [deleteResult] = await pool.query<mysql.ResultSetHeader>(
      `DELETE FROM reserva_habitacion WHERE ID_Habitacion = ?`, [id]
    );

    // Accedemos al primer objeto en deleteResult para obtener 'affectedRows'
    if (deleteResult.affectedRows > 0) {
      res.status(200).json({ message: `Reserva de la habitación con ID ${id} eliminada exitosamente.` });
    } else {
      res.status(500).json({ message: 'Error al eliminar la reserva' });
    }
  } catch (error) {
    console.error('Error al eliminar la reserva:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};


//curl -X GET http://localhost:1234/Hotel/habitaciones/2
