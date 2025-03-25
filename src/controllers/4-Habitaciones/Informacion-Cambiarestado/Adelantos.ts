import { Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { Database } from '../../../db/Database';
import { PoolConnection } from 'mysql2/promise';

const pool = Database.connect();


export const ConsultarDeuda = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { idReserva } = req.body;  // Accepting idReserva from the body instead of query

    if (!idReserva) {
      return res.status(400).json({ message: 'Falta el parámetro: ID de reserva.' });
    }

    const queryFactura = `
      SELECT
        f.ID_Factura,
        f.Total AS TotalFactura,
        (f.Total - f.Adelanto) AS Deuda,  -- Cálculo de la deuda como TotalFactura - Adelanto
        f.Adelanto AS TotalAdelanto,
        ef.Descripcion AS EstadoFactura
      FROM
        factura f
      LEFT JOIN
        EstadoFactura ef ON f.ID_estadoFactura = ef.ID_EstadoFactura
      WHERE
        f.ID_Factura = (SELECT ID_Factura FROM reserva WHERE ID_Reserva = ?);  -- Usar el parámetro idReserva
    `;

    const [facturaResult] = await pool.execute(queryFactura, [idReserva]);

    const factura = (facturaResult as any)[0];

    if (!factura) {
      return res.status(404).json({ message: 'No se encontró ninguna factura para esta reserva.' });
    }

    return res.status(200).json({
      idFactura: factura.ID_Factura,  // Incluyendo ID de la factura
      totalFactura: factura.TotalFactura,
      totalAdeudado: factura.Deuda,   // Asegúrate de usar "Deuda"
      totalAdelanto: factura.TotalAdelanto,
      estadoFactura: factura.EstadoFactura,  // Agregado estado de la factura
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(error.message);
      return res.status(500).json({ message: 'Error al consultar la deuda.', error: error.message });
    }
    console.error('Error desconocido', error);
    return res.status(500).json({ message: 'Error desconocido al consultar la deuda.' });
  }
};



//-------------------------------------------------------
export const Adelanto = async (req: Request, res: Response): Promise<Response> => {
  const connection: PoolConnection = await pool.getConnection();

  try {
    const { idReserva, montoPago, metodoPago, comentario } = req.body;

    // Validar parámetros requeridos
    if (!idReserva || !montoPago || !metodoPago || montoPago <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros inválidos: Asegúrate de proporcionar ID de reserva, monto de pago positivo y método de pago.',
      });
    }

    await connection.beginTransaction();

    // Consultar la factura asociada
    const queryFactura = `
      SELECT 
        f.ID_Factura,
        f.Total AS TotalFactura,
        f.Adelanto AS TotalAdelanto,
        (f.Total - f.Adelanto) AS DeudaRestante
      FROM 
        factura f
      WHERE 
        f.ID_Factura = (SELECT ID_Factura FROM reserva WHERE ID_Reserva = ?);
    `;

    const [facturaResult] = await connection.execute(queryFactura, [idReserva]);
    const factura = (facturaResult as any)[0];

    if (!factura) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'No se encontró la factura asociada a la reserva proporcionada.',
      });
    }

    const { ID_Factura: idFactura, TotalFactura: totalFactura, TotalAdelanto: totalAdelanto, DeudaRestante: deudaRestante } = factura;

    // Verificar si el monto de pago excede la deuda
    if (montoPago > deudaRestante) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'El pago excede el monto de la deuda. No es posible registrar el pago.',
        deudaRestante: deudaRestante, // Muestra el valor correcto de la deuda
        montoSobrante: montoPago - deudaRestante, // Monto sobrante si el pago excede la deuda
      });
    }
    
    // Si no excede la deuda, calculamos la deuda restante después del pago
    const deudaRestanteCorrecta = deudaRestante - montoPago;

    // Registrar el pago
    const queryInsertPago = `
      INSERT INTO Pagos (ID_Factura, Monto, Fecha_Pago, ID_MetodoPago)
      VALUES (?, ?, NOW(), ?);
    `;
    await connection.execute(queryInsertPago, [idFactura, montoPago, metodoPago]);

    // Actualizar el adelanto de la factura
    const queryActualizarAdelanto = `
      UPDATE factura
      SET Adelanto = Adelanto + ?
      WHERE ID_Factura = ?;
    `;
    await connection.execute(queryActualizarAdelanto, [montoPago, idFactura]);

    // Determinar el estado actualizado de la factura
    const nuevoEstadoFactura = deudaRestanteCorrecta <= 0 ? 2 : 1; // 2 = Pagada, 1 = Pendiente

    const queryActualizarEstado = `
      UPDATE factura
      SET ID_estadoFactura = ?
      WHERE ID_Factura = ?;
    `;
    await connection.execute(queryActualizarEstado, [nuevoEstadoFactura, idFactura]);

    // Actualizar las observaciones de la reserva si hay un comentario
    if (comentario) {
      const queryActualizarObservaciones = `
        UPDATE reserva
        SET Observaciones = CONCAT(IFNULL(Observaciones, ''), '\n\n--- Observación ---\n', ?)
        WHERE ID_Reserva = ?;
      `;
      await connection.execute(queryActualizarObservaciones, [comentario, idReserva]);
    }

    await connection.commit();

    // Respuesta exitosa
    return res.status(200).json({
      success: true,
      message:
        deudaRestanteCorrecta <= 0
          ? 'El pago fue registrado correctamente y la factura ha sido marcada como pagada.'
          : 'El pago fue registrado correctamente, pero la factura aún tiene deuda pendiente.',
      deudaRestante: deudaRestanteCorrecta,
      estadoFactura: nuevoEstadoFactura,
    });
  } catch (error: unknown) {
    await connection.rollback();
    console.error('Error al procesar la solicitud:', error);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al procesar la factura y el pago.',
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  } finally {
    connection.release();
  }
};






/* 
C:\Users\Roberto>curl -X POST "http://localhost:1234/Hotel/factura/Adelanto" ^
¿Más?   -H "Content-Type: application/json" ^
¿Más?   -d "{\"idReserva\": 20, \"montoPago\": 11.00, \"metodoPago\": 1, \"comentario\": \"Pago realizado correctamente.\"}"
{"message":"El pago fue registrado y la factura ha sido marcada como pagada.","deudaRestante":-33,"estadoFactura":2}
C:\Users\Roberto>


C:\Users\Roberto>curl -X POST "http://localhost:1234/Hotel/factura/Deuda" -H "Content-Type: application/json" -d "{\"idReserva\": 25}"


*/