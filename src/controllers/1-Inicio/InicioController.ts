// controllers/reservaController.ts
import { Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { Database } from '../../db/Database';

const pool = Database.connect();

export const getReservas = async (req: Request, res: Response) => {
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
      WHERE
        r.Fecha_Ingreso IS NOT NULL;
    `;

    const [results] = await pool.query(query);
    const reservas = results as mysql.RowDataPacket[];

    if (reservas.length === 0) {
      return res.status(404).json({ message: 'No se encontraron reservas.' });
    }

    res.status(200).json(reservas);
  } catch (error) {
    console.error('Error ejecutando la consulta:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
