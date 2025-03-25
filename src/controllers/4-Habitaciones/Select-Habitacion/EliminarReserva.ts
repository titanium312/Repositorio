import { Request, Response } from 'express';
import { Database } from '../../../db/Database';

const pool = Database.connect();

export const eliminarReserva = async (req: Request, res: Response): Promise<Response> => {
  const { ID_Reserva } = req.params;

  if (!ID_Reserva) {
    return res.status(400).json({ message: 'ID de reserva es requerido' });
  }

  // Usar transacción
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();  // Iniciar la transacción

    // Eliminar de la tabla reserva_habitacion
    await connection.query('DELETE FROM reserva_habitacion WHERE ID_Reserva = ?', [ID_Reserva]);

    // Eliminar de la tabla reserva
    const [deleteResult]: [any, any] = await connection.query('DELETE FROM reserva WHERE ID_Reserva = ?', [ID_Reserva]);

    if (deleteResult.affectedRows === 0) {
      throw new Error('No se pudo eliminar la reserva, puede que no exista.');
    }

    // Confirmar transacción
    await connection.commit();
    return res.status(200).json({ message: `Reserva con ID ${ID_Reserva} eliminada exitosamente.` });
  } catch (error: unknown) {
    // Si ocurre un error, revertir la transacción
    await connection.rollback();

    // Comprobamos que el error sea de tipo Error
    if (error instanceof Error) {
      console.error('Error al eliminar la reserva:', error);
      return res.status(500).json({ message: 'Error interno del servidor al eliminar la reserva', error: error.message });
    } else {
      // En caso de que el error no sea un Error, manejamos un error genérico
      console.error('Error inesperado:', error);
      return res.status(500).json({ message: 'Error desconocido al eliminar la reserva' });
    }
  } finally {
    // Liberar la conexión
    connection.release();
  }
};
