import { Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { Database } from '../../db/Database';

const pool = Database.connect();

export class EstadisticasController {
  // Función para obtener las estadísticas
  public static async obtenerEstadisticas(req: Request, res: Response): Promise<void> {
    try {
      const query = `
        SELECT
          (SELECT COUNT(*) FROM habitacion) AS 'Total de Habitaciones',
          (SELECT COUNT(*)
           FROM habitacion h
           JOIN estado_habitacion eh ON h.ID_Estado_Habitacion = eh.ID_Estado_Habitacion
           WHERE eh.Descripcion = 'Disponible') AS 'Habitaciones Libres',
          (SELECT COUNT(*)
           FROM habitacion h
           JOIN estado_habitacion eh ON h.ID_Estado_Habitacion = eh.ID_Estado_Habitacion
           WHERE eh.Descripcion = 'Ocupada') AS 'Habitaciones Ocupadas',
          (SELECT COUNT(*)
           FROM reserva r
           JOIN reservahabitacion rh ON r.ID_Reserva = rh.ID_Reserva
           WHERE r.Fecha_Ingreso = CURRENT_DATE) AS 'Habitaciones Reservadas Hoy';
      `;

      // Ejecutamos la consulta
      const [result] = await pool.query(query);
      const estadisticas = result as mysql.RowDataPacket[];

      if (estadisticas.length > 0) {
        res.json(estadisticas[0]); // Devolvemos los resultados de la primera fila
      } else {
        res.status(404).json({ message: 'No se encontraron estadísticas' });
      }
    } catch (err) {
      res.status(500).json({ message: 'Error al obtener las estadísticas', error: err });
    }
  }

  // Función para obtener las reservas activas
  public static async obtenerReservasActivas(req: Request, res: Response): Promise<void> {
    try {
      const query = `
        SELECT
          c.ID_Cliente,
          CONCAT_WS(' ', c.Nombre1, c.Nombre2) AS Nombres,
          CONCAT_WS(' ', c.Apellido1, c.Apellido2) AS Apellidos,
          h.Nombre AS Nombre_Habitacion,
          h.Costo AS Tarifa,
          t.Descripcion AS Tipo,
          r.Fecha_Ingreso
        FROM
          reserva r
        JOIN
          cliente c ON r.ID_Cliente = c.ID_Cliente
        JOIN
          reservahabitacion rh ON r.ID_Reserva = rh.ID_Reserva
        JOIN
          habitacion h ON rh.ID_Habitacion = h.ID_Habitacion
        JOIN
          tipo_habitacion t ON h.ID_Tipo_Habitacion = t.ID_Tipo_Habitacion
        JOIN
          rhestado re ON rh.ID_RHEstado = re.ID_RHEstado
        WHERE
          r.Fecha_Ingreso IS NOT NULL
          AND re.Descripcion = 'Activo';  -- Asegúrate de que 'Activo' es el estado que buscas
      `;

      // Ejecutamos la consulta
      const [result] = await pool.query(query);
      const reservas = result as mysql.RowDataPacket[];

      if (reservas.length === 0) {
        res.status(404).json({ message: 'No se encontraron reservas activas' });
      } else {
        res.status(200).json(reservas); // Devolvemos las reservas activas
      }
    } catch (err) {
      res.status(500).json({ message: 'Error al obtener las reservas activas', error: err });
    }
  }
}
