import { Request, Response } from 'express';
import { Database } from '../../../db/Database';
import mysql from 'mysql2/promise';

const pool = Database.connect();

// Función para validar los datos del producto
const validateProductData = (data: any): string | null => {
  if (!data.ID_Producto || !data.nombre || !data.descripcion || !data.ID_producto_tipo) {
    return 'Faltan datos requeridos (ID_Producto, nombre, descripcion, ID_producto_tipo)';
  }

  // Validación adicional para otros campos
  if (data.Precio_Unitario && isNaN(data.Precio_Unitario)) {
    return 'El Precio_Unitario debe ser un número válido';
  }

  if (data.Stock && isNaN(data.Stock)) {
    return 'El Stock debe ser un número válido';
  }

  return null;
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  console.log('Cuerpo de la solicitud:', req.body);

  const { 
    ID_Producto, 
    nombre, 
    descripcion, 
    Precio_Unitario, 
    Stock = 0,  // Valor por defecto si no se envía
    ID_Provedor, 
    ID_producto_tipo 
  } = req.body;

  const validationError = validateProductData(req.body);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // Verificar si el producto ya existe
    const [existingProduct] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT ID_Producto FROM producto WHERE ID_Producto = ?',
      [ID_Producto]
    );

    if (existingProduct.length > 0) {
      res.status(400).json({ error: `El producto con ID_Producto ${ID_Producto} ya existe` });
      return;
    }

    // Insertar el nuevo producto con todos los campos
    await connection.execute(
      'INSERT INTO producto (ID_Producto, Nombre, Descripcion, Precio_Unitario, Stock, ID_Provedor, ID_producto_tipo) VALUES (?, ?, ?, ?, ?, ?, ?)', 
      [ID_Producto, nombre, descripcion, Precio_Unitario, Stock, ID_Provedor, ID_producto_tipo]
    );

    res.status(201).json({ message: 'Producto creado exitosamente' });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error al crear el producto:', error.message);
      res.status(500).json({ error: 'Error al crear el producto', details: error.message });
    } else {
      console.error('Error desconocido:', error);
      res.status(500).json({ error: 'Error desconocido' });
    }
  } finally {
    if (connection) {
      connection.release();
    }
  }
};



//C:\Users\Roberto\Documents\Trabajo\Hotel>curl -X POST http://localhost:1234/Hotel/productos -H "Content-Type: application/json" -d "{\"ID_Producto\": 21, \"nombre\": \"Producto Ejemplo\", \"descripcion\": \"Descripción del producto\", \"Precio_Unitario\": 150.00, \"Stock\": 10, \"ID_Provedor\": 123, \"ID_producto_tipo\": 2}"{"message":"Producto creado exitosamente"}
