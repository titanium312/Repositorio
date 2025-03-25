import mysql from 'mysql2/promise';

export class Database {
  private static pool: mysql.Pool;

  // Método para conectar a la base de datos y obtener el pool de conexiones
  public static connect(): mysql.Pool {
    if (!this.pool) {
      // Crear un pool con soporte para promesas
      this.pool = mysql.createPool({
        host: 'localhost',      // Cambia esto si tu base de datos está en otro servidor
        user: 'root',           // Tu usuario de la base de datos
        password: '123456789',  // Cambia esto con tu contraseña
        database: 'hotel',      // Nombre de la base de datos
        waitForConnections: true,
        connectionLimit: 10,    // Límite de conexiones simultáneas
        queueLimit: 0           // Sin límite de espera
      });
    }
    return this.pool;
  }

  // Método para ejecutar una consulta utilizando el pool de conexiones
  public static async query(query: string, params: any[] = []): Promise<any> {
    const pool = this.connect(); // Aseguramos que el pool de conexiones esté creado
    const [results] = await pool.query(query, params); // Ejecuta la consulta
    return results;  // Retorna los resultados de la consulta
  }

  // Opcional: Método para obtener una conexión específica (aunque no es necesario en muchos casos)
  public static async getConnection(): Promise<mysql.Connection> {
    const pool = this.connect(); // Aseguramos que el pool de conexiones esté creado
    return await pool.getConnection(); // Obtener una conexión desde el pool
  }
}
