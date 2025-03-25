import { Request, Response } from 'express';
import { Database } from '../../../db/Database';
import mysql from 'mysql2/promise';

const pool = Database.connect();

// Función para validar los datos del proveedor
const validateProviderData = (data: any): string | null => {
  if (!data.ID_Provedor || !data.Nombre || !data.Telefono || !data.Correo || !data.Direccion) {
    return 'Faltan datos requeridos (ID_Provedor, Nombre, Telefono, Correo, Direccion)';
  }
  return null;
};

export const createProvedor = async (req: Request, res: Response): Promise<void> => {
  console.log('Cuerpo de la solicitud:', req.body);

  const { ID_Provedor, Nombre, Telefono, Correo, Direccion } = req.body;

  // Validar los datos del proveedor
  const validationError = validateProviderData(req.body);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  try {
    const connection = await pool.getConnection();

    // Verificar si el proveedor ya existe (por correo)
    const [existingProvider] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT ID_Provedor FROM Provedor WHERE Correo = ?',
      [Correo]
    );

    if (existingProvider.length > 0) {
      res.status(400).json({ error: `El proveedor con correo ${Correo} ya existe` });
      connection.release();
      return;
    }

    // Insertar el nuevo proveedor
    await connection.execute(
      'INSERT INTO Provedor (ID_Provedor, Nombre, Telefono, Correo, Direccion) VALUES (?, ?, ?, ?, ?)', 
      [ID_Provedor, Nombre, Telefono, Correo, Direccion]
    );

    connection.release();
    res.status(201).json({ message: 'Proveedor creado exitosamente' });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error al crear el proveedor:', error.message);
      res.status(500).json({ error: 'Error al crear el proveedor', details: error.message });
    } else {
      console.error('Error desconocido:', error);
      res.status(500).json({ error: 'Error desconocido' });
    }
  }
};


//curl -X POST http://localhost:1234/Hotel/provedores -H "Content-Type: application/json" -d "{\"ID_Provedor\": 123, \"Nombre\": \"Proveedor Test\", \"Telefono\": \"123456789\", \"Correo\": \"proveedor@correo.com\", \"Direccion\": \"Calle Falsa 123\"}"
