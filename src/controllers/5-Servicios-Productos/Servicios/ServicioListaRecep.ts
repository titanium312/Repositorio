import { Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { Database } from '../../../db/Database';

const pool = Database.connect();

export const ServicioListaRecep = async (req: Request, res: Response): Promise<Response> => {
    const { tipo } = req.query;  // Obtener el tipo desde el query string

    // Validar que el tipo sea 'Restaurante' o 'Bar'
    if (tipo !== 'Restaurante' && tipo !== 'Bar') {
        return res.status(400).json({ error: 'El tipo de servicio debe ser "Restaurante" o "Bar".' });
    }

    try {
        // Establecer conexión con la base de datos
        const connection = await pool.getConnection();

        // Consulta a la base de datos
        const [rows] = await connection.execute(
            `
            SELECT
                f.ID_Factura,
                s.Nombre AS Nombre_Servicio,
                sd.Cantidad,
                sd.Total / sd.Cantidad AS Precio_Unitario,
                sd.Total,
                ef.Descripcion AS Estado_Servicio,
                f.Fecha_Emision,
                st.Descripcion AS Tipo_Servicio,
                sd.mesa
            FROM
                factura f
            JOIN
                servicio_detalle sd ON f.ID_Factura = sd.ID_Factura
            JOIN
                servicio s ON sd.ID_Servicio = s.ID_Servicio
            JOIN
                EstadoFactura ef ON f.ID_estadoFactura = ef.ID_EstadoFactura
            JOIN
                servicio_tipo_relacion str ON s.ID_Servicio = str.ID_Servicio
            JOIN
                Servicio_tipo st ON str.ID_Servicio_tipo = st.ID_producto_tipo
            WHERE
                st.Descripcion = ?;
            `,
            [tipo]  // Usamos 'Restaurante' o 'Bar' como parámetro
        );

        connection.release();  // Liberar la conexión

        // Devolver los resultados
        return res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener los servicios:', error);
        return res.status(500).json({ error: 'Hubo un problema al obtener los servicios.' });
    }
};
