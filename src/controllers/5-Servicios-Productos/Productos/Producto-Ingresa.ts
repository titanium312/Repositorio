import { Request, Response } from 'express';
import { Database } from '../../../db/Database';
import mysql from 'mysql2/promise';

// Conexión a la base de datos
const pool = Database.connect();

// Función para registrar la entrada de productos y transacciones de la factura
export const agregarEntrada = async (req: Request, res: Response): Promise<void> => {
  const connection = await pool.getConnection();
  const { productos, proveedorId, tipoFactura, metodoPago, descuento, adelanto } = req.body;

  try {
    await connection.beginTransaction();

    // Paso 1: Registrar la factura de compra
    const [resultFactura] = await connection.query<mysql.ResultSetHeader>(
      `INSERT INTO factura (Fecha_Emision, Total, ID_estadoFactura, TipoFactura, Descuento, Adelanto)
       VALUES (CURRENT_DATE, ?, 1, ?, ?, ?)`,
      [calcularTotal(productos), tipoFactura, descuento, adelanto]
    );

    const facturaId = resultFactura.insertId; // Acceder al insertId

    // Paso 2: Registrar los detalles de los productos en la factura
    for (const producto of productos) {
      const { idProducto, cantidad, precioCompra } = producto;

      // 2.1 Registrar la entrada de productos (inventario)
      await connection.query(
        `INSERT INTO entrada (ID_Producto, Cantidad, Precio_Compra)
         VALUES (?, ?, ?)`,
        [idProducto, cantidad, precioCompra]
      );

      // 2.2 Insertar detalles de productos en la factura
      await connection.query(
        `INSERT INTO detallesproducto (ID_Factura, ID_Producto, Cantidad, Fecha_emicion)
         VALUES (?, ?, ?, CURRENT_DATE)`,
        [facturaId, idProducto, cantidad]
      );

      // 2.3 Actualizar el stock de los productos
      await connection.query(
        `UPDATE producto SET Stock = Stock + ? WHERE ID_Producto = ?`,
        [cantidad, idProducto]
      );
    }

    // Paso 3: Registrar el pago
    await connection.query(
      `INSERT INTO pagos (ID_Factura, Monto, Fecha_Pago, ID_MetodoPago)
       VALUES (?, ?, CURRENT_TIMESTAMP, ?)`,
      [facturaId, adelanto, metodoPago]
    );

    // Confirmar la transacción
    await connection.commit();

    res.status(200).json({ message: 'Factura registrada exitosamente', facturaId });
  } catch (error: unknown) {
    // Verificación de tipo de error
    if (error instanceof Error) {
      // Si el error es una instancia de Error, accedemos a las propiedades como message y stack
      console.error(error.message);
      res.status(500).json({ message: 'Error al registrar la factura', error: error.message });
    } else {
      // En caso de que el error no sea un objeto tipo Error, enviamos un mensaje genérico
      console.error('Error desconocido');
      res.status(500).json({ message: 'Error desconocido' });
    }

    // Revertir la transacción si hubo un error
    await connection.rollback();
  } finally {
    // Liberar la conexión
    connection.release();
  }
};

// Función para calcular el total de la factura basado en los productos
const calcularTotal = (productos: { cantidad: number, precioCompra: number }[]) => {
  return productos.reduce((total, producto) => {
    return total + (producto.cantidad * producto.precioCompra);
  }, 0);
};
