// src/controllers/financialController.ts
import { Request, Response } from 'express';
import { Database } from '../../db/Database'; // Importa la clase de la base de datos

// Crea el pool de conexiones de la base de datos
const pool = Database.connect();
// Función para obtener los detalles de las facturas con pagos
export const getDetallesFacturasConPagos = async (req: Request, res: Response) => {
  try {
    const connection = await pool;
    const [rows] = await connection.execute(`
      SELECT 
        f.ID_Factura,
        f.Fecha_Emision,
        f.Total,
        f.ID_estadoFactura,
        f.TipoFactura,
        f.Descuento,
        f.Adelanto,
        p.ID_Factura AS Pago_ID_Factura,
        p.Monto AS Pago_Monto,
        p.Fecha_Pago,
        p.ID_MetodoPago
      FROM 
        factura f
      LEFT JOIN 
        Pagos p ON f.ID_Factura = p.ID_Factura;
    `);

    res.json({ detallesFacturasConPagos: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los detalles de las facturas con pagos.' });
  }
};
