import { Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { Database } from '../../../../db/Database';  // Ajusta la ruta si es necesario

const pool = Database.connect();

export const getServicios = async (req: Request, res: Response): Promise<void> => {
  try {
    // Obtener el parámetro 'tipo_servicio' de la query
    const { tipo_servicio } = req.query;

    let tipoServicioArray: string[] = [];

    // Verificamos si tipo_servicio es un arreglo de strings
    if (Array.isArray(tipo_servicio)) {
      // Si es un arreglo, nos aseguramos de que cada valor sea una cadena (string)
      tipoServicioArray = tipo_servicio.filter(item => typeof item === 'string').map(item => item.trim());
    }
    // Si tipo_servicio es una sola cadena, la convertimos a un arreglo con un solo valor
    else if (typeof tipo_servicio === 'string') {
      tipoServicioArray = [tipo_servicio.trim()];
    }

    // Consulta base sin filtro
    let query = `
      SELECT 
          s.ID_Servicio, 
          s.Nombre, 
          s.Descripcion, 
          s.Precio, 
          st.Descripcion AS Tipo_Servicio
      FROM 
          servicio s
      JOIN 
          servicio_tipo_relacion str ON s.ID_Servicio = str.ID_Servicio
      JOIN 
          Servicio_tipo st ON str.ID_Servicio_tipo = st.ID_producto_tipo
    `;

    const queryParams: any[] = [];

    // Si hay tipos de servicio, agregar el filtro con IN
    if (tipoServicioArray.length > 0) {
      query += ' WHERE st.Descripcion IN (?)';
      queryParams.push(tipoServicioArray);
    }

    // Ejecutar la consulta con los parámetros
    const [result] = await pool.query(query, queryParams);

    const rows = result as mysql.RowDataPacket[];

    // Si no se encuentran resultados
    if (rows.length === 0) {
      res.status(404).json({ message: 'No se encontraron servicios.' });
    } else {
      res.status(200).json({ servicios: rows });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los servicios.' });
  }
};
