import { Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { Database } from '../../../db/Database';

const pool = Database.connect();

// Definir la interfaz para los detalles de un pedido
interface Order {
  ID_Servicio: number;
  Cantidad: number;
  mesa: string; // Corregir tipo de 'mesa'
}

// Función para validar los datos de los pedidos
const validateOrderData = (orders: Order[]): string | null => {
  for (const order of orders) {
    if (!order.ID_Servicio || !order.Cantidad || !order.mesa) {
      return 'Faltan datos requeridos en uno de los pedidos';
    }
    if (isNaN(order.Cantidad) || order.Cantidad <= 0) {
      return 'La Cantidad debe ser un número mayor que 0';
    }
  }
  return null;
};

// Función para recibir múltiples pedidos
export const recibirPedido = async (req: Request, res: Response): Promise<void> => {
  const orders: Order[] = req.body.orders; // Esperamos un arreglo de pedidos

  // Validamos los datos del pedido
  const validationError = validateOrderData(orders);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  const connection = await pool.getConnection();
  try {
    // Iniciar la transacción
    await connection.beginTransaction();

    // 1. Obtener el precio de cada servicio y validar existencia
    const servicioIds: number[] = orders.map(order => order.ID_Servicio);
    const [servicioRows] = await connection.query(
      'SELECT ID_Servicio, Precio FROM servicio WHERE ID_Servicio IN (?)',
      [servicioIds]
    );

    if ((servicioRows as any).length !== orders.length) {
      throw new Error('Uno o más servicios no existen');
    }

    const servicioPrecios = (servicioRows as any).map((row: any) => row.Precio);

    // 2. Calcular el total de la factura
    const totalFactura = orders.reduce((total, order, index) => {
      return total + (order.Cantidad * servicioPrecios[index]);
    }, 0);

    // 3. Insertar la factura
    const [insertFacturaResult] = await connection.query(
      'INSERT INTO factura (Fecha_Emision, ID_estadoFactura, TipoFactura, Total, Descuento, Adelanto) VALUES (CURDATE(), 1, 2, ?, 0.00, 0.00)', 
      [totalFactura]
    );

    const facturaId = (insertFacturaResult as mysql.ResultSetHeader).insertId;

    // 4. Insertar los detalles de cada servicio en la factura
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const servicioId = servicioIds[i];
      const precioUnitario = servicioPrecios[i];
      
      await connection.query(
        'INSERT INTO servicio_detalle (ID_Factura, ID_Servicio, Cantidad, Total, mesa) VALUES (?, ?, ?, ?, ?)', 
        [
          facturaId, 
          servicioId, 
          order.Cantidad, 
          order.Cantidad * precioUnitario,
          order.mesa  // Agregar 'mesa' aquí
        ]
      );
    }

    // 5. Confirmar la transacción
    await connection.commit();

    // Responder con éxito
    res.status(201).json({ message: 'Pedido recibido y procesado correctamente', facturaId });

  }catch (error: unknown) {
    // Verificar si el error es una instancia de Error
    if (error instanceof Error) {
      // Ahora puedes acceder a 'message' y otras propiedades de 'Error'
      console.error('Error al procesar el pedido:', error.message);
      res.status(500).json({ error: error.message || 'Ocurrió un error al procesar el pedido' });
    } else {
      // Si el error no es una instancia de Error, maneja el caso
      console.error('Error desconocido:', error);
      res.status(500).json({ error: 'Ocurrió un error inesperado' });
    }
  }
  
};
