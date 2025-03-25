import { Request, Response } from 'express';
import { Database } from '../../../db/Database';

const pool = Database.connect();

// Interfaz para el tipo de datos de los servicios
interface Servicio {
  Servicio_ID: number;
  Servicio_Nombre: string;
  Servicio_Descripcion: string;
  Cantidad: number;
  Precio_Unitario: number;
};

// Obtener los servicios asociados a una reserva
const obtenerServiciosDeReserva = async (req: Request, res: Response) => {
  const { idReserva } = req.params; // Obtener la ID de la reserva desde los parámetros de la URL

  try {
    // Consultar los servicios asociados a la reserva
    const [resultados]: any = await pool.query(`
      SELECT r.ID_Reserva, r.Fecha_Ingreso, r.Fecha_Salida, r.Observaciones,
             s.ID_Servicio AS Servicio_ID, s.Nombre AS Servicio_Nombre, s.Descripcion AS Servicio_Descripcion,
             rs.Cantidad, rs.Precio_Unitario
      FROM reserva r
      JOIN reserva_servicio rs ON r.ID_Reserva = rs.ID_Reserva
      JOIN servicio s ON rs.ID_Servicio = s.ID_Servicio
      WHERE r.ID_Reserva = ?
    `, [idReserva]);

    // Si no se encuentran servicios, devolver un mensaje 404
    if (resultados.length === 0) {
      return res.status(404).json({ message: 'No se encontraron servicios para esta reserva' });
    }

    // Devolver tanto la información de la reserva como la ID del servicio
    const serviciosConIdReserva = resultados.map((servicio: Servicio) => ({
      ...servicio,
      ID_Reserva: idReserva, // Asegurarse de incluir la ID de la reserva
    }));

    return res.json(serviciosConIdReserva);  // Retornar los servicios con la ID de la reserva
  } catch (error) {
    // Manejo de error en caso de fallo en la consulta
    return res.status(500).json({ error: 'Error al obtener los servicios de la reserva' });
  }
};

// Insertar un servicio/producto en una reserva
const insertarServicioAReserva = async (req: Request, res: Response) => {
  const { idReserva } = req.params; // Obtener la ID de la reserva desde los parámetros de la URL
  const { idServicio, idProducto, cantidad } = req.body; // Detalles del servicio/producto

  try {
    // Obtener el precio del servicio desde la base de datos
    const [servicio]: any = await pool.query(`
      SELECT Precio
      FROM servicio
      WHERE ID_Servicio = ?
    `, [idServicio]);

    if (!servicio || servicio.length === 0) {
      return res.status(400).json({ error: 'Servicio no encontrado' });
    }

    const precioUnitario = servicio[0].Precio;

    // Insertar el servicio en la tabla reserva_servicio
    await pool.query(`
      INSERT INTO reserva_servicio (ID_Reserva, ID_Servicio, ID_Producto, Cantidad, Precio_Unitario)
      VALUES (?, ?, ?, ?, ?)
    `, [idReserva, idServicio, idProducto, cantidad, precioUnitario]);

    // Actualizar el total de la factura
    await pool.query(`
      UPDATE factura 
      SET Total = Total + (? * ?)
      WHERE ID_Factura = (SELECT ID_Factura FROM reserva WHERE ID_Reserva = ?)
    `, [precioUnitario, cantidad, idReserva]);

    return res.status(200).json({ message: 'Servicio/producto agregado correctamente' });
  } catch (error) {
    console.error(error); // Loguear el error completo para ver más detalles
    return res.status(500).json({ error: 'Error al insertar el servicio/producto' });
  }
};

// Eliminar un servicio de la reserva
const eliminarServicioDeReserva = async (req: Request, res: Response) => {
  const { idReserva, idProducto } = req.params;

  try {
    // Ejecutamos la consulta para eliminar el servicio de la reserva
    const [result]: [any, any] = await pool.query(`
      DELETE FROM reserva_servicio
      WHERE ID_Reserva = ? AND ID_Servicio = ?
    `, [idReserva, idProducto]);

    // Verificamos si se afectó alguna fila
    if (result && result.affectedRows > 0) {
      res.json({ message: 'Servicio eliminado correctamente' });
    } else {
      res.status(404).json({ message: 'Servicio no encontrado para esta reserva' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar el servicio' });
  }
};

export { obtenerServiciosDeReserva, insertarServicioAReserva, eliminarServicioDeReserva };
