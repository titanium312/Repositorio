import mysql from 'mysql2/promise';
import { Request, Response } from 'express';
import { Database } from '../../../db/Database';

const pool = Database.connect();

export class ReactivarReserva {

  // Reactivar una reserva previamente cancelada y actualizar las habitaciones asociadas
  public static async reactivarReserva(req: Request, res: Response): Promise<void> {
    const { ID_Reserva } = req.params;

    try {
      // Paso 1: Asegurarnos de que el ID_Reserva es un número
      const idReserva = parseInt(ID_Reserva, 10);
      if (isNaN(idReserva)) {
        res.status(400).json({ message: 'ID de reserva inválido' });
        return;
      }

      // Paso 2: Verificar si la reserva existe y obtener el estado desde RHEstado
    
    
      const [reserva] = await pool.query(
        `SELECT r.ID_Reserva, r.Fecha_Ingreso, r.Fecha_Salida, re.Descripcion AS EstadoDescripcion
         FROM Reserva r
         JOIN RHEstado re ON r.ID_Estado = re.ID_RHEstado
         WHERE r.ID_Reserva = ?`,
        [idReserva]
      );
      

      const reservaData = (reserva as mysql.RowDataPacket[])[0];

      if (!reservaData) {
        res.status(404).json({ message: 'Reserva no encontrada' });
        return;
      }

      // Paso 3: Verificar si la reserva está cancelada
      if (reservaData.EstadoDescripcion !== 'cancelado') {
        res.status(400).json({ message: 'La reserva no está cancelada, no se puede reactivar' });
        return;
      }

      const fechaActual = new Date();
      const fechaEntrada = new Date(reservaData.Fecha_Entrada);
      const horasDiferencia = (fechaEntrada.getTime() - fechaActual.getTime()) / (1000 * 3600); // Diferencia en horas

      // Paso 4: Verificar conflictos de fecha y hora (si ya hay otra reserva en la misma fecha y hora)
      const [conflictoReserva] = await pool.query(
        `SELECT * FROM Reserva
         WHERE Fecha_Entrada = ? AND Estado != 4 AND ID_Reserva != ?`,
        [reservaData.Fecha_Entrada, idReserva] // Evitar la misma reserva
      );

      if ((conflictoReserva as mysql.RowDataPacket[]).length > 0) {
        res.status(400).json({ message: 'Ya existe otra reserva en la misma fecha y hora' });
        return;
      }

      // Paso 5: Verificar disponibilidad de la habitación si la reactivación es en menos de 5 horas
      if (horasDiferencia <= 5) {
        const [habitaciones] = await pool.query(
          `SELECT h.ID_Habitacion, h.Nombre, h.ID_Estado_Habitacion
           FROM habitacion h
           JOIN ReservaHabitacion rh ON rh.ID_Habitacion = h.ID_Habitacion
           WHERE rh.ID_Reserva = ? AND h.ID_Estado_Habitacion != 5`,  // Estado 5: No disponible
          [idReserva]
        );

        if ((habitaciones as mysql.RowDataPacket[]).length === 0) {
          res.status(400).json({ message: 'No hay habitaciones disponibles para reactivar la reserva' });
          return;
        }
      }

      // Paso 6: Verificación de la hora de entrada y actualización del estado de la reserva
      const minutosFaltantes = (fechaEntrada.getTime() - fechaActual.getTime()) / (1000 * 60); // Diferencia en minutos

      let nuevoEstadoReserva = 1;  // Estado 'Activo' (ID 1)
      if (minutosFaltantes > 15 && minutosFaltantes <= 60) {
        nuevoEstadoReserva = 3;  // Estado 'En Espera' (ID 3)
      } else if (minutosFaltantes < 0) {
        res.status(400).json({ message: 'La hora de entrada ya pasó, se debe actualizar la hora de entrada' });
        return;
      }

      // Paso 7: Reactivar la reserva
      const [updateReservaResult] = await pool.query(
        `UPDATE Reserva 
         SET Estado = ?, Fecha_Entrada = NOW() 
         WHERE ID_Reserva = ? AND Estado = 4`,  // Cambiar estado a 'Activo'
        [nuevoEstadoReserva, idReserva]
      );
      const updateReserva = updateReservaResult as mysql.ResultSetHeader;

      if (updateReserva.affectedRows === 0) {
        res.status(500).json({ message: 'Error al reactivar la reserva' });
        return;
      }

      // Paso 8: Si la reactivación es en menos de 5 horas, cambiar el estado de la habitación a "Ocupado" (ID 2)
      if (horasDiferencia < 5) {
        const [updateHabitacionesResult] = await pool.query(
          `UPDATE habitacion h
           JOIN ReservaHabitacion rh ON rh.ID_Habitacion = h.ID_Habitacion
           SET h.ID_Estado_Habitacion = 2,  -- Estado 'Ocupado' (ID 2)
               rh.ID_RHEstado = 1  -- Estado 'Activo' (ID 1) en ReservaHabitacion
           WHERE rh.ID_Reserva = ?;`,
          [idReserva]
        );
        const updateHabitaciones = updateHabitacionesResult as mysql.ResultSetHeader;

        if (updateHabitaciones.affectedRows === 0) {
          res.status(404).json({ message: 'No se encontraron habitaciones activas para esta reserva' });
          return;
        }
      }

      // Paso 9: Reactivar la factura si es necesario
      const [updateFacturaResult] = await pool.query(
        `UPDATE factura f
         JOIN reserva r ON f.ID_Factura = r.ID_Factura
         SET f.ID_estadoFactura = 1  -- Estado 'Pendiente' (ID 1)
         WHERE r.ID_Reserva = ?;`,
        [idReserva]
      );
      const updateFactura = updateFacturaResult as mysql.ResultSetHeader;

      if (updateFactura.affectedRows === 0) {
        res.status(500).json({ message: 'Error al actualizar la factura, probablemente ya esté activa o no asociada.' });
        return;
      }

      // Si todo salió bien, respondemos que la reactivación fue exitosa
      res.json({
        message: 'Reserva reactivada y habitaciones actualizadas correctamente.',
      });

    } catch (err) {
      console.error('Error al reactivar la reserva:', err);
      res.status(500).json({ message: 'Error al reactivar la reserva', error: err });
    }
  }
}
