import { Request, Response } from 'express';
import { Database } from '../../db/Database';
import path from 'path';
import fs from 'fs';

// Crear un pool de conexiones a la base de datos
const pool = Database.connect();

// Ruta de las imágenes
const imageFolderPath = path.join(__dirname, '../../public/images');

// Función para obtener todas las imágenes junto con información adicional
export const getAllImages = async (req: Request, res: Response): Promise<void> => {
  try {
    // Consulta SQL para obtener habitaciones, estado, imagen y piso
    const query = `
      SELECT
          h.ID_Habitacion,
          h.Nombre AS Nombre_Habitacion,
          e.Descripcion AS Estado_Habitacion,
          i.Imagen,  -- Asumiendo que la columna Imagen está en la tabla imagenes_habitacion
          IFNULL(rh.ID_Reserva, 'N/A') AS ID_Reserva,
          p.Descripcion AS Piso_Descripcion  -- Descripción del piso
      FROM
          habitacion h
      LEFT JOIN
          estado_habitacion e ON e.ID_Estado_Habitacion = h.ID_Estado_Habitacion
      LEFT JOIN
          imagenes_habitacion i ON i.ID_Habitacion = h.ID_Habitacion
      LEFT JOIN
          ReservaHabitacion rh ON rh.ID_Habitacion = h.ID_Habitacion AND rh.ID_RHEstado = 1  -- Solo las reservas activas
      LEFT JOIN
          Piso p ON p.ID_Piso = h.ID_Piso  -- Relacionar con la tabla Piso
    `;

    // Ejecutar la consulta
    const [rows] = await pool.execute(query) as [any[], any];

    // Mapear las filas obtenidas para agregar imágenes y otras propiedades
    const result = rows.map((row) => {
      let imagenBase64 = null;

      // Opción 1: Convertir la imagen a Base64 (si la imagen está presente)
      if (row.Imagen) {
        imagenBase64 = Buffer.isBuffer(row.Imagen)
          ? row.Imagen.toString('base64')
          : row.Imagen;
      }

      // Opción 2: Servir la imagen como archivo estático (si la imagen está presente en el servidor)
      const imagePath = path.join(imageFolderPath, `${row.ID_Habitacion}.jpg`);
      let imageUrl: string | null = null;

      if (fs.existsSync(imagePath)) {
        imageUrl = `/images/${row.ID_Habitacion}.jpg`;  // URL del archivo estático
      }

      // Construir el objeto de respuesta
      const responseObj: any = {
        ID_Habitacion: row.ID_Habitacion,
        Imagen: imagenBase64 ? `data:image/jpeg;base64,${imagenBase64}` : imageUrl, // Usar Base64 o la URL de la imagen
        Descripcion: row.Descripcion,
        Fecha_Creacion: row.Fecha_Creacion,
        Nombre_Habitacion: row.Nombre_Habitacion,
        Estado_Habitacion: row.Estado_Habitacion,
        Piso_Descripcion: row.Piso_Descripcion, // Aquí agregamos la descripción del piso
      };

      // Solo añadir ID_Reserva si el estado es "activo" (ID_RHEstado = 1)
      if (row.ID_Reserva !== 'N/A') {
        responseObj.ID_Reserva = row.ID_Reserva;
      }

      return responseObj;
    });

    // Enviar la respuesta con las habitaciones y sus detalles
    res.json(result);

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error al obtener las imágenes:', error.message);
      res.status(500).json({ message: 'Error al obtener las imágenes.', error: error.message });
    } else {
      console.error('Error inesperado:', error);
      res.status(500).json({ message: 'Error inesperado al procesar la solicitud.' });
    }
  }
};
