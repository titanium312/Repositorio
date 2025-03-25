import { Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { Database } from '../../../../db/Database';

// Conexión a la base de datos
const pool = Database.connect();

// Función para actualizar el estado de la factura
export const actualizarEstadoFactura = async (req: Request, res: Response): Promise<Response> => {
  const { idFactura, estado } = req.body;  // El ID de la factura y el estado deseado (2 = Pagada, 3 = Cancelada)

  // Verifica que el estado sea válido
  if (![2, 3].includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido. Usa 2 para Pagada o 3 para Cancelada.' });
  }

  let connection;
  try {
    // Obtiene una conexión desde el pool
    connection = await pool.getConnection();

    // Comienza la transacción
    await connection.beginTransaction();

    // Actualiza el estado de la factura
    const [result] = await connection.execute(
      'UPDATE factura SET ID_estadoFactura = ? WHERE ID_Factura = ?',
      [estado, idFactura]
    );

    // 'result' es un array con un objeto ResultSetHeader, donde podemos encontrar affectedRows
    const affectedRows = (result as mysql.OkPacket).affectedRows;

    // Si no se actualizó ninguna factura, devuelve un error
    if (affectedRows === 0) {
      return res.status(404).json({ error: 'Factura no encontrada.' });
    }

    // Confirma la transacción
    await connection.commit();

    return res.status(200).json({ message: 'Estado de la factura actualizado con éxito.' });
  } catch (error) {
    // Si ocurre un error, revierte la transacción
    if (connection) await connection.rollback();
    console.error('Error al actualizar estado:', error);
    return res.status(500).json({ error: 'Hubo un error al actualizar el estado de la factura.' });
  } finally {
    if (connection) connection.release();
  }
};

// Función para eliminar detalles de la factura y la factura en sí
export const eliminarFacturaYDetalles = async (req: Request, res: Response): Promise<Response> => {
  const { idFactura } = req.body;  // El ID de la factura que deseas eliminar

  let connection;
  try {
    // Obtiene una conexión desde el pool
    connection = await pool.getConnection();

    // Comienza la transacción
    await connection.beginTransaction();

    // Elimina los detalles de la factura
    await connection.execute(
      'DELETE FROM servicio_detalle WHERE ID_Factura = ?',
      [idFactura]
    );

    // Elimina la factura
    const [result] = await connection.execute(
      'DELETE FROM factura WHERE ID_Factura = ?',
      [idFactura]
    );

    // 'result' es un array con un objeto ResultSetHeader, donde podemos encontrar affectedRows
    const affectedRows = (result as mysql.OkPacket).affectedRows;

    // Si no se eliminó ninguna factura, devuelve un error
    if (affectedRows === 0) {
      return res.status(404).json({ error: 'Factura no encontrada.' });
    }

    // Confirma la transacción
    await connection.commit();

    return res.status(200).json({ message: 'Factura y detalles eliminados con éxito.' });
  } catch (error) {
    // Si ocurre un error, revierte la transacción
    if (connection) await connection.rollback();
    console.error('Error al eliminar factura:', error);
    return res.status(500).json({ error: 'Hubo un error al eliminar la factura y sus detalles.' });
  } finally {
    if (connection) connection.release();
  }
};

// Función para eliminar un servicio específico de la factura
export const eliminarServicioDeFactura = async (req: Request, res: Response): Promise<Response> => {
  const { idFactura, idServicio } = req.body;  // El ID de la factura y el ID del servicio a eliminar

  let connection;
  try {
    // Obtiene una conexión desde el pool
    connection = await pool.getConnection();

    // Comienza la transacción
    await connection.beginTransaction();

    // Elimina el servicio de la factura (de la tabla servicio_detalle)
    const [result] = await connection.execute(
      'DELETE FROM servicio_detalle WHERE ID_Factura = ? AND ID_Servicio = ?',
      [idFactura, idServicio]
    );

    // 'result' es un array con un objeto ResultSetHeader, donde podemos encontrar affectedRows
    const affectedRows = (result as mysql.OkPacket).affectedRows;

    // Si no se eliminó ningún servicio, devuelve un error
    if (affectedRows === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado en la factura.' });
    }

    // Confirma la transacción
    await connection.commit();

    return res.status(200).json({ message: 'Servicio eliminado de la factura con éxito.' });
  } catch (error) {
    // Si ocurre un error, revierte la transacción
    if (connection) await connection.rollback();
    console.error('Error al eliminar servicio de factura:', error);
    return res.status(500).json({ error: 'Hubo un error al eliminar el servicio de la factura.' });
  } finally {
    if (connection) connection.release();
  }
};
