import { Router, Request, Response, NextFunction } from 'express';

// Importación de los controladores
// ------------------------------ Rutas de ESTADÍSTICAS ------------------------------
import { EstadisticasController } from '../controllers/1-Inicio/EstadisticaHabitacion';
// ------------------------------ Rutas de CLIENTES ------------------------------
import { ClienteController } from '../controllers/2-Recepcion/ClienteController';
// ------------------------------ Rutas de BS HABITACIONES (Búsqueda) ------------------------------
import { BsHabitacionController } from '../controllers/2-Recepcion/BsHabitacion';
// ------------------------------ Rutas de RESERVAS ------------------------------
import { RecepcionController } from '../controllers/2-Recepcion/Recepsion';
import { ReservaController } from '../controllers/3-Reservacion/Reservacion';
import { Adelanto,ConsultarDeuda } from '../controllers/4-Habitaciones/Informacion-Cambiarestado/Adelantos';
import { CheckReserva } from '../controllers/4-Habitaciones/Informacion-Cambiarestado/CheckReserva';
import { MetodoPago } from '../controllers/2-Recepcion/Select/EstadoReserva';
import { CancelarReserva } from '../controllers/2-Recepcion/Select/Cambiar-CaceladoR'; // Asegúrate de que la ruta sea correcta
import { ReactivarReserva } from '../controllers/2-Recepcion/Select/Reactivar-Reserva';  // Ajusta la ruta según donde esté tu clase ReactivarReserva


// ------------------------------ Rutas de IMÁGENES // ------------------------------ Rutas de HABITACIONES ------------------------------

import { insertHabitacionWithImage, updateImage, deleteHabitacion, getTiposHabitacion, getEstadosHabitacion, upload } from '../controllers/4-Habitaciones/AgregarHabitacion';
import { getAllImages } from '../controllers/4-Habitaciones/Catalgo';
import { getHabitacionInfo, eliminarReserva, getPisos } from '../controllers/4-Habitaciones/Select-Habitacion/Habtacion-Select';
import { InformacionReserva } from '../controllers/4-Habitaciones/Informacion';  
import { actualizarEstadoHabitacion,obtenerEstadosHabitacion} from '../controllers/4-Habitaciones/Informacion-Cambiarestado/CambiarEstado';
import { actualizar, ver } from '../controllers/4-Habitaciones/Informacion-Cambiarestado/ActulizarApi';



// ------------------------------ Rutas de PRODUCTOS ------------------------------

import { createProduct } from '../controllers/5-Servicios-Productos/Productos/RegistraProducto'; 
import { agregarEntrada } from '../controllers/5-Servicios-Productos/Productos/Producto-Ingresa'; 
import { ProductoSale } from '../controllers/5-Servicios-Productos/Productos/Producto-Sale'; 
import obtenerProductos from '../controllers/5-Servicios-Productos/Productos/SelectProducto/Select-Producto';
import { ProductoController} from '../controllers/5-Servicios-Productos/Productos/SelectProducto/Select-tipoProducto-Provedores';
import { createProvedor } from '../controllers/5-Servicios-Productos/Productos/RegistraProvedor'; 
// ------------------------------ Rutas de SERVICIOS ------------------------------

import { registerService } from '../controllers/5-Servicios-Productos/Servicios/ServivoResgistra';
import { getServicios } from '../controllers/5-Servicios-Productos/Servicios/select/Select-Servicios'; 
import { recibirPedido }  from '../controllers/5-Servicios-Productos/Servicios/ServiciosInsertar'; 
import { ServicioListaRecep} from '../controllers/5-Servicios-Productos/Servicios/ServicioListaRecep'; 
import { actualizarEstadoFactura, eliminarFacturaYDetalles,eliminarServicioDeFactura} from '../controllers/5-Servicios-Productos/Servicios/select/Servicio-Actuliza-Elimina'; 
import { getServiciosTipo } from '../controllers/5-Servicios-Productos/Servicios/select/Select-tipoServicios';

import { obtenerServiciosDeReserva, insertarServicioAReserva, eliminarServicioDeReserva } from '../controllers/5-Servicios-Productos/Reserva-Servicios/InsertarServicios';


// ------------------------------ Rutas de PAGOS ------------------------------
import { obtenerMetodosPagoController} from '../controllers/5-Servicios-Productos/Select-Extras/Select-Pagos';
//--------------------------------Contabilidad------------------------------------

import { getDetallesFacturasConPagos} from '../controllers/6-Contabilidad/Constabilidad';



// Definición del middleware asíncrono para manejar errores de manera centralizada
const asyncMiddleware = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const routerh = Router();

// ------------------------------ Rutas de INICIO ------------------------------

// Obtener todas las reservas

routerh.get('/reservasTabla', EstadisticasController.obtenerReservasActivas);

// ------------------------------ Rutas de ESTADÍSTICAS ------------------------------

// Obtener estadísticas de habitaciones
routerh.get('/estadisticas', EstadisticasController.obtenerEstadisticas);

// ------------------------------ Rutas de CLIENTES ------------------------------

routerh.get('/clientes', ClienteController.getClientes);// Obtener todos los clientes
routerh.get('/clientes/:ID_Cliente', ClienteController.getClienteById);// Obtener un cliente por ID
routerh.post('/clientes', ClienteController.upsertCliente);// Crear o actualizar un cliente
routerh.delete('/clientes/:ID_Cliente', ClienteController.deleteCliente);// Eliminar un cliente por ID

// ------------------------------ Rutas de BS HABITACIONES (Búsqueda) ------------------------------

routerh.get('/Bshabitacion/:id', BsHabitacionController.getHabitacionById);// Obtener una habitación por ID

routerh.get('/Bshabitacion/', BsHabitacionController.getAllHabitaciones);// Obtener una habitación por ID
// ------------------------------ Rutas de RESERVAS ------------------------------
routerh.post('/reserva', asyncMiddleware(RecepcionController.crearReservaYFactura));// Crear una reserva y factura
routerh.get('/metodos-pago', MetodoPago.getMetodoPago);
// Obtener las reservas de habitaciones por cliente
routerh.get('/reservas-habitaciones-clientes', ReservaController.getReservaHabitacionCliente);
// Obtener todas las habitaciones (con y sin reserva)
// Eliminar la reserva de una habitación por ID
routerh.delete('/habitaciones/eliminar-reserva/:id', eliminarReserva);
routerh.post('/factura/Adelanto', asyncMiddleware(Adelanto));
routerh.post('/factura/Deuda', asyncMiddleware(ConsultarDeuda));
routerh.post('/factura/CkeckReserva', asyncMiddleware(CheckReserva));
// Ruta para cancelar la reserva, pasando el ID de la reserva como parámetro
routerh.put('/cancelarReserva/:ID_Reserva', CancelarReserva.cancelarReserva);
// Ruta para reactivar una reserva, utilizando el ID de la reserva como parámetro
routerh.put('/reactivar/:ID_Reserva', ReactivarReserva.reactivarReserva);



// ------------------------------ Rutas de IMÁGENES ------------------------------
// Obtener todas las imágenes de una habitación específica
routerh.get('/get-images/:idHabitacion?', getAllImages);

// ------------------------------ Rutas de HABITACIONES ------------------------------

// Obtener información de una habitación específica por ID
routerh.get('/habitaciones/:id', getHabitacionInfo);
// Insertar una habitación con imagen
routerh.post('/habitacion', upload.single('imagen'), insertHabitacionWithImage);
// Actualizar imagen de una habitación
routerh.put('/habitacion/imagen', upload.single('imagen'), updateImage);
// Eliminar una habitación (con validación de reservas)
routerh.delete('/habitacion/:ID_Habitacion', deleteHabitacion);
// Obtener los estados de las habitaciones
routerh.get('/estados-habitacion', getEstadosHabitacion);
// Obtener los tipos de habitaciones
routerh.get('/tipos-habitacion', getTiposHabitacion);
// Obtener pisos disponibles
routerh.get('/pisos', getPisos);
// Ruta para actualizar los datos
// Rutas con controladores asíncronos



routerh.put('/actualizar', asyncMiddleware(actualizar));



routerh.get('/ver', asyncMiddleware(ver));
// ------------------------------ Rutas de INFORMACIÓN DE HABITACIÓN ------------------------------
// Obtener los detalles de la reserva de una habitación
routerh.get('/InformacionReserva/:idReserva', asyncMiddleware(InformacionReserva.obtenerDetallesReserva));
routerh.get('/estados-habitacion', asyncMiddleware(obtenerEstadosHabitacion));
routerh.put('/habitacion/estado', asyncMiddleware(actualizarEstadoHabitacion));
// ------------------------------ Rutas de PRODUCTOS ------------------------------
// Crear un nuevo producto
routerh.post('/productos', createProduct);
// Registrar la entrada de un producto
routerh.post('/productos/entrada', agregarEntrada);
// Registrar la venta de un producto
routerh.post('/producto/sale', ProductoSale);
// Obtener todos los productos registrados
routerh.get('/productos-Optener', obtenerProductos);
routerh.get('/tipos-productos', asyncMiddleware(ProductoController.obtenerTiposDeProductos));
routerh.get('/productos/proveedores', ProductoController.obtenerProveedores);
routerh.post('/provedores', createProvedor);

// ------------------------------ Rutas de SERVICIOS ------------------------------
// Registrar un nuevo servicio
routerh.post('/RegistraServicio', registerService);
// Ruta para obtener servicios con la opción de filtrar por tipo de servicio
routerh.get('/ListaServicios', getServicios);
// Registrar un pedido para un servicio
routerh.post('/recibir-pedido', recibirPedido);
// Obtener detalles de servicios
routerh.get('/servicio/Recepcion-ServiciosList', asyncMiddleware(ServicioListaRecep));
// Cambiar el estado de un servicio
routerh.put('/cambiar-estado', asyncMiddleware(actualizarEstadoFactura)); 
// Cambiar el estado de un servicio
routerh.put('/Eliminar-Factura', asyncMiddleware(eliminarFacturaYDetalles));
routerh.put('/Eliminar-Factura-Servicio', asyncMiddleware(eliminarServicioDeFactura));
// Obtener los tipos de servicios disponibles
routerh.get('/servicios/tipo', getServiciosTipo);

// Obtener los servicios de una reserva específica
routerh.get('/reservas/:idReserva/servicios',  asyncMiddleware(obtenerServiciosDeReserva));

// Insertar un servicio/producto a una reserva
routerh.post('/reservasInser/:idReserva/servicios', asyncMiddleware(insertarServicioAReserva));


// Eliminar un servicio/producto de una reserva

  routerh.delete('/reservasEli/:idReserva/servicios/:idProducto', asyncMiddleware(eliminarServicioDeReserva));






// ------------------------------ Rutas de PAGOS ------------------------------
// Obtener todos los métodos de pago disponibles
routerh.get('/metodos-pago', obtenerMetodosPagoController);

//--------------------------------Contabilidad------------------------------------
// Rutas para las funciones del controlador
routerh.get('/Factura', getDetallesFacturasConPagos);


export default routerh;
