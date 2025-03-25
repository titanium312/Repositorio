import { Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { Database } from '../../db/Database';  // Asegúrate de importar tu pool de conexiones

const pool = Database.connect();

export class InformacionReserva {
  // Método que obtiene toda la información de una reserva con solo la ID de la reserva
  static async obtenerDetallesReserva(req: Request, res: Response): Promise<Response> {
    const { idReserva } = req.params;  // Obtenemos la ID de la reserva desde los parámetros

    const connection = await pool.getConnection();
    try {
      // 1. Información de la habitación
      const [habitacion]: [mysql.RowDataPacket[], mysql.FieldPacket[]] = await connection.query(
        `SELECT
            r.ID_Reserva AS ID_Reserva,
            h.ID_Habitacion AS ID_Habitacion,
            h.Nombre AS Nombre_Habitacion,
            eh.Descripcion AS Estado,
            p.Descripcion AS Piso,
            h.Costo AS Costo,
            h.Descripcion AS Descripcion_Habitacion
        FROM
            habitacion h
        JOIN
            estado_habitacion eh ON h.ID_Estado_Habitacion = eh.ID_Estado_Habitacion
        JOIN
            piso p ON h.ID_Piso = p.ID_Piso
        JOIN
            ReservaHabitacion rh ON h.ID_Habitacion = rh.ID_Habitacion
        JOIN
            reserva r ON rh.ID_Reserva = r.ID_Reserva
        WHERE
            r.ID_Reserva = ?`,  // Usamos un parámetro dinámico
        [idReserva]
      );

      if (habitacion.length === 0) {
        return res.status(404).json({ message: 'Reserva no encontrada o habitación no asignada a la reserva' });
      }

      // 2. Información del cliente
      const [cliente]: [mysql.RowDataPacket[], mysql.FieldPacket[]] = await connection.query(
        `SELECT
            c.ID_Cliente,
            c.Nombre1,
            c.Nombre2,
            c.Apellido1,
            c.Apellido2,
            c.Telefono,
            c.Correo,
            r.Observaciones
        FROM
            cliente c
        JOIN
            reserva r ON c.ID_Cliente = r.ID_Cliente
        WHERE
            r.ID_Reserva = ?`,  // Usamos un parámetro dinámico
        [idReserva]
      );

      if (cliente.length === 0) {
        return res.status(404).json({ message: 'Cliente no encontrado para esta reserva' });
      }

      // 3. Fechas y tiempo estimado
      const [reserva]: [mysql.RowDataPacket[], mysql.FieldPacket[]] = await connection.query(
        `SELECT
            r.Fecha_Ingreso,
            r.Fecha_Salida,
            TIMESTAMPDIFF(DAY, r.Fecha_Ingreso, r.Fecha_Salida) AS Tiempo_Estimado_Dias,
            TIMESTAMPDIFF(HOUR, r.Fecha_Ingreso, r.Fecha_Salida) % 24 AS Tiempo_Estimado_Horas,
            TIMESTAMPDIFF(MINUTE, r.Fecha_Ingreso, r.Fecha_Salida) % 60 AS Tiempo_Estimado_Minutos,
            CASE
                WHEN NOW() > r.Fecha_Salida THEN 'Rebasado'
                ELSE 'No Rebasado'
            END AS Tiempo_Rebasado
        FROM
            reserva r
        WHERE
            r.ID_Reserva = ?`,  // Usamos un parámetro dinámico
        [idReserva]
      );

      if (reserva.length === 0) {
        return res.status(404).json({ message: 'No se encontró la reserva' });
      }

      // 4. Información de la Factura (Costo, Adelanto y Por Pagar)
      const [factura]: [mysql.RowDataPacket[], mysql.FieldPacket[]] = await connection.query(
        `SELECT
            f.Total AS Costo_Calculado,
            SUM(rs.Cantidad * s.Precio) AS Dinero_Extra,  -- Dinero extra por los servicios adicionales
            f.Adelanto AS Dinero_Adelantado,
            (f.Total - f.Adelanto) AS Por_Pagar
        FROM
            factura f
        JOIN
            reserva r ON r.ID_Factura = f.ID_Factura
        LEFT JOIN
            reserva_servicio rs ON rs.ID_Reserva = r.ID_Reserva
        LEFT JOIN
            servicio s ON s.ID_Servicio = rs.ID_Servicio
        WHERE
            r.ID_Reserva = ? 
        GROUP BY
            f.ID_Factura`,  // Usamos un parámetro dinámico
        [idReserva]
      );

      if (factura.length === 0) {
        return res.status(404).json({ message: 'Factura no encontrada para esta reserva' });
      }

      // 5. Servicios Adicionales en la Reserva (Producto y Costo)
      const [servicios]: [mysql.RowDataPacket[], mysql.FieldPacket[]] = await connection.query(
        `SELECT
            s.Nombre AS Producto,
            rs.Cantidad,
            rs.Precio_Unitario,
            (rs.Cantidad * rs.Precio_Unitario) AS Subtotal
        FROM
            reserva_servicio rs
        JOIN
            servicio s ON rs.ID_Servicio = s.ID_Servicio
        WHERE
            rs.ID_Reserva = ?`,  // Usamos un parámetro dinámico
        [idReserva]
      );

      // Si no hay servicios adicionales, respondemos con un arreglo vacío
      const serviciosResponse = servicios.length > 0 ? servicios : [];

      // Construir la respuesta con toda la información
      return res.status(200).json({
        habitacion: habitacion[0],
        cliente: cliente[0],
        reserva: reserva[0],
        factura: factura[0],
        servicios: serviciosResponse,
      });

    } catch (error) {
      console.error('Error al obtener los detalles de la reserva', error);
      if (error instanceof Error) {
        return res.status(500).json({ message: 'Error al obtener los detalles de la reserva', error: error.message });
      } else {
        return res.status(500).json({ message: 'Error desconocido al obtener los detalles de la reserva' });
      }
    } finally {
      connection.release();
    }
  }
}
