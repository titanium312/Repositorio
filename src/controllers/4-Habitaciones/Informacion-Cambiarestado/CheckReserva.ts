import { Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { Database } from '../../../db/Database';

// Conexión a la base de datos
const pool = Database.connect();

export const CheckReserva = async (req: Request, res: Response): Promise<Response> => {
  const connection = await pool.getConnection();

  try {
    const { idReserva } = req.body;

    if (!idReserva) {
      return res.status(400).json({ message: 'El parámetro "idReserva" es requerido.' });
    }

    // Paso 1: Verificar si la factura está pagada o saldo <= 0
    const [facturaResult] = await connection.execute(
      `
      SELECT 
        f.ID_Factura, 
        f.Total, 
        f.Adelanto, 
        (f.Total - f.Adelanto) AS saldo
      FROM 
        factura f
      WHERE 
        f.ID_Factura = (
          SELECT r.ID_Factura FROM reserva r WHERE r.ID_Reserva = ?
        )
        AND (f.ID_estadoFactura = 2 OR (f.Total - f.Adelanto) <= 0);  -- Estado "Pagada" o saldo <= 0
      `,
      [idReserva]
    );

    if ((facturaResult as mysql.RowDataPacket[]).length === 0) {
      return res.status(400).json({ message: 'Factura no pagada o saldo pendiente.' });
    }

    // Paso 2: Verificar si hay habitaciones activas (Estado "activo")
    const [habitacionesActivas] = await connection.execute(
      `
      SELECT rh.ID_Habitacion
      FROM ReservaHabitacion rh
      WHERE rh.ID_Reserva = ? AND rh.ID_RHEstado = 1;  -- Estado "activo"
      `,
      [idReserva]
    );

    const habitacionesActivasResult = habitacionesActivas as mysql.RowDataPacket[];
    if (habitacionesActivasResult.length === 0) {
      return res.status(400).json({ message: 'No hay habitaciones activas en esta reserva.' });
    }

    // Obtener las habitaciones que se van a actualizar
    const habitacionesIds = habitacionesActivasResult.map((row) => row.ID_Habitacion);

    if (habitacionesIds.length === 0) {
      return res.status(400).json({ message: 'No se encontraron habitaciones para actualizar.' });
    }

    // Paso 3: Actualizar el estado de las habitaciones en ReservaHabitacion a "terminado" (Estado 2)
    await connection.execute(
      `
      UPDATE ReservaHabitacion
      SET ID_RHEstado = 2  -- Estado "terminado"
      WHERE ID_Reserva = ? AND ID_RHEstado = 1;  -- Cambiar solo las activas
      `,
      [idReserva]
    );

    // Paso 4: Actualizar el estado de las habitaciones en la tabla habitacion a "limpieza" (Estado 6)
    await connection.execute(
      `
      UPDATE habitacion
      SET ID_Estado_Habitacion = 6  -- Estado "limpieza"
      WHERE ID_Habitacion IN (${habitacionesIds.join(',')});
      `
    );

    // Confirmar la actualización exitosa
    return res.status(200).json({
      message: `Reserva verificada y habitaciones actualizadas al estado "limpieza".`,
      habitacionesActualizadas: habitacionesIds.length,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error en el proceso.', error: error instanceof Error ? error.message : error });
  } finally {
    connection.release();
  }
};
