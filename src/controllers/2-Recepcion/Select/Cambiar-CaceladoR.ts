import mysql from 'mysql2/promise';  // Importa desde 'mysql2/promise' para obtener la versión que soporta promesas.
import { Request, Response } from 'express';
import { Database } from '../../../db/Database';

const pool = Database.connect();

export class CancelarReserva {

  // Cancelar una reserva y actualizar las habitaciones asociadas
  public static async cancelarReserva(req: Request, res: Response): Promise<void> {
    const { ID_Reserva } = req.params;
    const { comentario } = req.body; // Tomamos el comentario de la cancelación desde el cuerpo de la solicitud.

    try {
      // Paso 1: Asegurarnos de que el ID_Reserva es un número
      const idReserva = parseInt(ID_Reserva, 10);
      if (isNaN(idReserva)) {
        console.log('ID_Reserva recibido:', ID_Reserva);  // Agregado para depurar
        res.status(400).json({ message: 'ID de reserva inválido' });
        return;
      }

      // Paso 2: Verificar si la reserva existe
      const [reserva] = await pool.query(
        'SELECT * FROM Reserva WHERE ID_Reserva = ?',
        [idReserva] // Asegurarse de que el valor es un número
      );

      // Aquí resolvemos el error al acceder al primer resultado.
      const reservaData = (reserva as mysql.RowDataPacket[])[0];  // Asegúrate de acceder a las filas correctamente

      if (!reservaData) {
        res.status(404).json({ message: 'Reserva no encontrada' });
        return;
      }

      // Paso 3: Construir el nuevo comentario de cancelación concatenando con el comentario anterior.
      const observaciones = reservaData.Observaciones ? reservaData.Observaciones : '';
      const nuevoComentario = observaciones + '\nMotivo de cancelación: ' + comentario;

      // Paso 4: Siempre cancelamos la reserva, sin importar si está activa o no
      const [updateReservaResult] = await pool.query(
        'UPDATE Reserva SET Fecha_Salida = NOW(), Observaciones = ? WHERE ID_Reserva = ?',
        [nuevoComentario, idReserva] // Asegurarse de usar el ID de reserva numérico
      );
      const updateReserva = updateReservaResult as mysql.ResultSetHeader;

      if (updateReserva.affectedRows === 0) {
        res.status(500).json({ message: 'Error al cancelar la reserva' });
        return;
      }

      // Paso 5: Si la reserva está activa (sin Fecha_Salida), cambiamos el estado de las habitaciones a 'No disponible'
      if (!reservaData.Fecha_Salida) {
        const [updateHabitacionesResult] = await pool.query(
          `UPDATE habitacion
           JOIN ReservaHabitacion RH ON RH.ID_Habitacion = habitacion.ID_Habitacion
           JOIN RHEstado RE ON RE.ID_RHEstado = RH.ID_RHEstado
           SET habitacion.ID_Estado_Habitacion = 5,  -- Estado 'No disponible' (ID 5)
               RH.ID_RHEstado = 4  -- Estado 'Cancelado' (ID 4) en ReservaHabitacion
           WHERE RH.ID_Reserva = ? AND RE.ID_RHEstado = 1;`, 
          [idReserva] // Usar el ID de reserva numérico
        );
        const updateHabitaciones = updateHabitacionesResult as mysql.ResultSetHeader;

        if (updateHabitaciones.affectedRows === 0) {
          res.status(404).json({ message: 'No se encontraron habitaciones activas para esta reserva' });
          return;
        }
      }

      // Paso 6: Si hay una factura asociada, también la actualizamos a "Cancelada"
      const [updateFacturaResult] = await pool.query(
        `UPDATE factura f
         JOIN reserva r ON f.ID_Factura = r.ID_Factura
         SET f.ID_estadoFactura = 3  -- Estado 'Cancelada' (ID 3)
         WHERE r.ID_Reserva = ?;`,
        [idReserva] // Usar el ID de la reserva para asegurarse de encontrar la factura correcta
      );
      const updateFactura = updateFacturaResult as mysql.ResultSetHeader;

      if (updateFactura.affectedRows === 0) {
        res.status(500).json({ message: 'Error al actualizar la factura, probablemente ya esté cancelada o no asociada.' });
        return;
      }

      // Si todo salió bien, respondemos que la cancelación fue exitosa
      res.json({
        message: 'Reserva cancelada y habitaciones actualizadas correctamente si estaban activas',
      });

    } catch (err) {
      console.error('Error al cancelar la reserva:', err);
      res.status(500).json({ message: 'Error al cancelar la reserva', error: err });
    }
  }
}
