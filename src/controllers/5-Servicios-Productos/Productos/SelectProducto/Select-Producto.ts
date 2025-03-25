import { Request, Response } from 'express';
import { Database } from '../../../../db/Database';

const pool = Database.connect();

// Controlador para obtener todos los productos con su categoría y precios
const obtenerProductos = async (req: Request, res: Response): Promise<void> => {
    try {
        // Realizamos el JOIN con la tabla producto_tipo para obtener la categoría
        const [rows] = await pool.query(`
            SELECT 
                p.ID_Producto,
                p.Nombre,
                p.Descripcion,
                p.Stock,
                pt.Descripcion AS Categoria,
                e.Precio_Compra,
                p.Precio_Unitario AS Precio_Venta
            FROM 
                producto p
            JOIN 
                producto_tipo pt ON p.ID_producto_tipo = pt.ID_producto_tipo
            LEFT JOIN 
                Entrada e ON p.ID_Producto = e.ID_Producto
            ORDER BY 
                p.ID_Producto;
        `);

        // Enviamos la respuesta con los productos, sus categorías y precios
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener los productos:', error);
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
};

// Exportación por defecto
export default obtenerProductos;
