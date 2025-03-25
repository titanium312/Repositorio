import mysql from 'mysql2/promise';  // Importa desde 'mysql2/promise' para obtener la versión que soporta promesas.
import { Request, Response } from 'express';
import { Database } from '../../db/Database';

const pool = Database.connect();

export class ClienteController {

// Obtener todos los clientes
public static async getClientes(req: Request, res: Response): Promise<void> {
  try {
    // Asegúrate de que el nombre de la tabla sea correcto (cliente en singular)
    const [clientes] = await pool.query('SELECT * FROM cliente');
    res.json(clientes);  // 'clientes' es un arreglo de filas
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'message' in err) {
      const error = err as { message: string };
      console.error('Error al obtener los clientes:', error.message);  // Log detallado del error
      res.status(500).json({ message: 'Error al obtener los clientes', error: error.message });
    } else {
      console.error('Error desconocido:', err);
      res.status(500).json({ message: 'Error desconocido al obtener los clientes' });
    }
  }
}


  // Obtener cliente por ID
  public static async getClienteById(req: Request, res: Response): Promise<void> {
    const { ID_Cliente } = req.params;
    try {
      const [result] = await pool.query('SELECT * FROM cliente WHERE id = ?', [ID_Cliente]);
      const cliente = result as mysql.RowDataPacket[];  // Aseguramos que el resultado es un arreglo

      if (cliente.length === 0) {
        res.status(404).json({ message: 'Cliente no encontrado' });
      } else {
        res.json(cliente[0]);  // 'cliente' es un arreglo de filas, seleccionamos el primer elemento
      }
    } catch (err) {
      res.status(500).json({ message: 'Error al obtener el cliente', error: err });
    }
  }

 // Crear o actualizar un cliente
public static async upsertCliente(req: Request, res: Response): Promise<void> {
  const { ID_Cliente, Telefono, Correo, Nombre1, Nombre2, Apellido1, Apellido2 } = req.body;
  
  try {
    // Verificar si el cliente ya existe en la base de datos
    const [existingClient] = await pool.query(
      'SELECT * FROM cliente WHERE ID_Cliente = ?',
      [ID_Cliente]
    );

    const clientExists = (existingClient as mysql.RowDataPacket[]).length > 0;

    if (clientExists) {
      // Si el cliente existe, actualizamos los datos
      const [result] = await pool.query(
        'UPDATE cliente SET Telefono = ?, Correo = ?, Nombre1 = ?, Nombre2 = ?, Apellido1 = ?, Apellido2 = ? WHERE ID_Cliente = ?',
        [Telefono, Correo, Nombre1, Nombre2, Apellido1, Apellido2, ID_Cliente]
      );

      const updateResult = result as mysql.ResultSetHeader;

      if (updateResult.affectedRows === 0) {
        res.status(404).json({ message: 'Cliente no encontrado' });
      } else {
        res.json({ message: 'Cliente actualizado exitosamente' });
      }
    } else {
      // Si el cliente no existe, lo creamos
      const [result] = await pool.query(
        'INSERT INTO cliente (ID_Cliente, Telefono, Correo, Nombre1, Nombre2, Apellido1, Apellido2) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [ID_Cliente, Telefono, Correo, Nombre1, Nombre2, Apellido1, Apellido2]
      );

      const insertResult = result as mysql.OkPacket;

      if (insertResult.affectedRows > 0) {
        res.status(201).json({ message: 'Cliente creado exitosamente', id: ID_Cliente });
      } else {
        res.status(500).json({ message: 'Error al crear el cliente' });
      }
    }
  } catch (err) {
    res.status(500).json({ message: 'Error al procesar la solicitud', error: err });
  }
}



// Eliminar un cliente
public static async deleteCliente(req: Request, res: Response): Promise<void> {
  const { ID_Cliente } = req.params;
  try {
    // Corregimos la columna de la tabla para usar 'ID_Cliente' en lugar de 'id'
    const [result] = await pool.query('DELETE FROM cliente WHERE ID_Cliente = ?', [ID_Cliente]);
    
    const deleteResult = result as mysql.ResultSetHeader;  // Aseguramos que el resultado es un ResultSetHeader
    if (deleteResult.affectedRows === 0) {
      res.status(404).json({ message: 'Cliente no encontrado' });
    } else {
      res.json({ message: 'Cliente eliminado exitosamente' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar el cliente', error: err });
  }
}

}
