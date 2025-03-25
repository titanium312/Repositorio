import { Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { Database } from '../../../db/Database';

const pool = Database.connect();

// Verificar si el producto tiene suficiente stock
const checkProductStock = async (connection: mysql.Connection, id_producto: number, cantidad: number) => {
  const [productos] = await connection.query<mysql.RowDataPacket[]>(`
    SELECT 
      p.Nombre AS Producto,
      p.Stock AS Stock,
      p.Precio_Unitario AS Precio_Unitario  -- Asegúrate de que el precio sea parte de la consulta
    FROM 
      producto p
    WHERE 
      p.ID_Producto = ?
  `, [id_producto]);

  if (productos.length === 0) {
    throw new Error('Producto no encontrado.');
  }

  const producto = productos[0];

  if (producto.Stock < cantidad) {
    throw new Error('No hay suficiente stock disponible.');
  }

  return producto;
};

// Controlador para crear una factura y procesar una venta
export const ProductoSale = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    // Iniciar una transacción
    await connection.beginTransaction();

    const { productos, tipoFactura, descuento = 0, adelanto = 0, fechaEmision = new Date() } = req.body;

    if (!productos || productos.length === 0) {
      throw new Error('Debe incluir productos en la venta.');
    }

    // 1. Crear la factura
    const [result] = await connection.query<mysql.OkPacket>(
      `INSERT INTO factura (Fecha_Emision, ID_estadoFactura, TipoFactura, Descuento, Adelanto)
       VALUES (?, 1, ?, ?, ?)`,
      [fechaEmision, tipoFactura, descuento, adelanto]
    );

    const idFactura = result.insertId;

    // 2. Insertar los detalles de la factura y verificar stock
    let totalVenta = 0;

    for (const item of productos) {
      const { id_producto, cantidad } = item;

      // Verificar si el producto tiene suficiente stock
      const producto = await checkProductStock(connection, id_producto, cantidad);

      // Calcular el precio total del producto (sin aplicar descuento aún)
      const precioTotalProducto = producto.Precio_Unitario * cantidad;
      totalVenta += precioTotalProducto;

      // Insertar en la tabla de detalles de la factura
      await connection.query(
        `INSERT INTO detallesproducto (ID_Factura, ID_Producto, Cantidad, Fecha_emicion)
         VALUES (?, ?, ?, ?)`,
        [idFactura, id_producto, cantidad, fechaEmision]
      );

      // Actualizar el stock del producto
      await connection.query(
        `UPDATE producto SET Stock = Stock - ? WHERE ID_Producto = ?`,
        [cantidad, id_producto]
      );
    }

    // 3. Aplicar el descuento (si corresponde)
    totalVenta = totalVenta * (1 - descuento / 100);

    // 4. Actualizar el total de la factura
    await connection.query(
      `UPDATE factura SET Total = ? WHERE ID_Factura = ?`,
      [totalVenta, idFactura]
    );

    // 5. Si hay adelanto, restarlo del total
    if (adelanto > 0) {
      await connection.query(
        `UPDATE factura SET Total = Total - ? WHERE ID_Factura = ?`,
        [adelanto, idFactura]
      );
    }

    // 6. Confirmar la transacción
    await connection.commit();

    // Enviar la respuesta con la información de la factura creada
    res.status(201).json({
      message: 'Venta procesada exitosamente.',
      idFactura,
      totalVenta
    });
  } catch (error: unknown) {
    // Si ocurre un error, hacer un rollback de la transacción
    await connection.rollback();

    // Verificación de tipo de error
    if (error instanceof Error) {
      console.error('Error:', error.message);  // Accede al mensaje de error
      res.status(500).json({
        message: error.message || 'Error al procesar la venta.'
      });
    } else {
      console.error('Error desconocido:', error);  // En caso de que no sea una instancia de Error
      res.status(500).json({
        message: 'Error inesperado al procesar la venta.'
      });
    }
  } finally {
    // Liberar la conexión
    connection.release();
  }
};
