// Importa las dependencias
require("dotenv").config();
const axios = require("axios");

////////////////////////////////
const http = require("http");
const sql = require("mssql");

// Configuración de la conexión a la base de datos
const config = {
  user: "kuky",
  password: "Kf123456",
  server: "3.144.237.208",
  database: "kflor",
  options: {
    encrypt: false, // Si estás utilizando Azure, establece esto en true
  },
};

// Función para obtener los datos de la tabla y convertirlos en JSON
async function obtenerPedidos() {
  try {
    // Conectar a la base de datos
    await sql.connect(config);

    // Consulta para seleccionar los datos de la tabla
    const result = await sql.query(`
    SELECT 
    -- task descripcion: (rango o express) - direccion - referencia 
    'Dir: ' + VC.DireccionEntrega as TaskDescripcion,
    VC.Observaciones as referencia, 
    VC.DeliveryTurnoID rango,
    VC.PedidoID order_id, 
    Prod.Descripcion nombre_producto, 
    VC.Referencia descripcion, 
    VPD.preciounitario precio_unitario, 
    VPD.cantidad cantidad,
    VC.DireccionEntrega direccion_final,
    VC.Observaciones direccion_referencia, 
    VC.ContactoTelefono telefono_comprador, 
    P.email email_comprador, 
    P.Personeria nombre_destinatario,
    CONCAT(
        YEAR(VC.FechaEntrega),
        '-', 
        RIGHT('00' + CAST(MONTH(VC.FechaEntrega) AS VARCHAR(2)), 2), 
        '-', 
        RIGHT('00' + CAST(DAY(VC.FechaEntrega) AS VARCHAR(2)), 2)
    ) AS job_pickup_datetime,
    VC.TookanID
FROM 
    VentaPedidoCabecera VC 
    LEFT JOIN Personeria P ON VC.PersoneriaID = P.PersoneriaID
    LEFT JOIN ventaguiacabecera VGC ON VC.PedidoID = VGC.ReferenciaID
    LEFT JOIN VentaPedidoDetalle VPD ON VPD.PedidoID = VC.PedidoID
    LEFT JOIN Producto Prod ON Prod.ProductoID = VPD.ProductoID
WHERE 
    VC.TipoEntrega = 2
    AND VC.PedidoID = VGC.ReferenciaID
    --AND VC.FechaEntrega >= DATEADD(DAY, DATEDIFF(DAY, 0, GETDATE()), 0)
    AND YEAR(VC.FechaEntrega) = YEAR(GETDATE())
    AND MONTH(VC.FechaEntrega) = MONTH(GETDATE())
    AND DAY(VC.FechaEntrega) = DAY(GETDATE())
    AND VC.TookanID IS NULL
ORDER BY VC.PedidoID;
    `);

    // Convertir el resultado en formato JSON
    const jsonData = result.recordset;

    // Cerrar la conexión
    await sql.close();

    return jsonData;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function actualizarTookanID(tookan_id, order_id) {
  try {
    await sql.connect(config);
    await sql.query`UPDATE VentaPedidoCabecera SET TookanID = ${tookan_id} WHERE PedidoID = ${order_id}`;
    await sql.close();
    console.log(`TookanID actualizado para PedidoID ${order_id}`);
  } catch (error) {
    console.error("Error al actualizar TookanID:", error);
  }
}

// Función para filtrar y formatear los números de teléfono
function processPhoneNumbers(phoneNumbers) {
  // Verificar si phoneNumbers es un array
  if (!Array.isArray(phoneNumbers)) {
    // Si no es un array, devolver un array vacío
    return [];
  }

  // Filtrar los números de teléfono vacíos
  const nonEmptyPhoneNumbers = phoneNumbers.filter(
    (phoneNumber) => phoneNumber.trim() !== ""
  );

  // Formatear los números de teléfono restantes según sea necesario
  const formattedPhoneNumbers = nonEmptyPhoneNumbers.map((phoneNumber) => {
    // Aquí puedes realizar cualquier formateo adicional si es necesario
    return phoneNumber.trim(); // Por ejemplo, eliminar espacios en blanco adicionales
  });

  return formattedPhoneNumbers;
}

////////////////////////////////

// Define la URL base de la API de Tookan
const baseURL = `https://api.tookanapp.com/v2/`;

let create_delivery = async (payload) => {
  let data = {
    api_key: "53646285f2165e0b14497c6e521022471eedc7fa28db7c3b5d18",
    order_id: payload.order_id,
    job_description: payload.job_description,
    customer_phone: payload.job_pickup_phone,
    customer_username: payload.job_pickup_name,
    customer_email: payload.job_pickup_email,
    customer_address: payload.job_pickup_address,
    latitude: payload.job_pickup_latitude,
    longitude: payload.job_pickup_longitude,
    job_delivery_datetime: payload.job_delivery_datetime,
    custom_field_template: payload.pickup_custom_field_template,
    // meta_data: payload.pickup_meta_data,
    team_id: payload.team_id,
    auto_assignment: payload.auto_assignment,
    has_pickup: payload.has_pickup,
    has_delivery: payload.has_delivery,
    layout_type: payload.layout_type,
    tracking_link: payload.tracking_link,
    timezone: payload.timezone,
    fleet_id: payload.fleet_id,
    ref_images: payload.ref_images,
    notify: payload.notify,
    tags: payload.tags,
    barcode: payload.barcode,
    geofence: payload.geofence,
  };

  console.log(data);
  let let_url = `${baseURL}create_task`;
  try {
    let options = {
      method: "post",
      url: let_url,
      data: {
        api_key: "53646285f2165e0b14497c6e521022471eedc7fa28db7c3b5d18",
        order_id: payload.order_id,
        job_description: payload.job_description,
        customer_phone: payload.job_pickup_phone,
        customer_username: payload.job_pickup_name,
        customer_email: payload.job_pickup_email,
        customer_address: payload.job_pickup_address,
        latitude: payload.job_pickup_latitude,
        longitude: payload.job_pickup_longitude,
        job_delivery_datetime: payload.job_delivery_datetime,
        custom_field_template: payload.pickup_custom_field_template,
        // meta_data: payload.pickup_meta_data,
        team_id: payload.team_id,
        auto_assignment: payload.auto_assignment,
        has_pickup: payload.has_pickup,
        has_delivery: payload.has_delivery,
        layout_type: payload.layout_type,
        tracking_link: payload.tracking_link,
        timezone: payload.timezone,
        fleet_id: payload.fleet_id,
        ref_images: payload.p_ref_images,
        notify: payload.notify,
        tags: payload.tags,
        barcode: payload.barcode,
        geofence: payload.geofence,
      },
      headers: {
        "Content-Type": "application/json",
      },
    };

    let res = await axios(options);
    if (res.status == 200) {
      return res.data;
    } else {
      err.code = 5007;
      err.message =
        "Response from Tooken is not succeess plz check the credentials)";
      throw err;
    }
  } catch (error) {
    throw error;
  }
};

let payloadCheckById = {
  order_ids: ["2139"],
};

// Ejecutar la función y manejar la respuesta
obtenerPedidos()
  .then(async (data) => {
    // Objeto para almacenar los pedidos agrupados por order_id
    const pedidosAgrupados = {};
    var rangoEnviar = "";
    var distrito = "";

    // Agrupar los pedidos por order_id
    let tipo_entrega = "";
    data.forEach((pedido) => {
      const order_id = pedido.order_id;
      if (!pedidosAgrupados[order_id]) {
        pedidosAgrupados[order_id] = {
          order_id: order_id,
          rango: pedido.rango,
          TaskDescripcion: pedido.TaskDescripcion,
          referencia: pedido.referencia,
          descripcion: pedido.descripcion,
          direccion_final: pedido.direccion_final,
          direccion_referencia: pedido.direccion_referencia,
          telefono_comprador: pedido.telefono_comprador,
          email_comprador: pedido.email_comprador,
          nombre_destinatario: pedido.nombre_destinatario,
          job_pickup_datetime: pedido.job_pickup_datetime,
          TookanID: pedido.TookanID,
          total: 0, // Inicializar el total en 0
          productos: [],
        };
      }

      // Determinar el tipo de entrega y sumar el precio al total

      if (pedido.nombre_producto.includes("EXPRESS")) {
        tipo_entrega = "EXPRESS";
        pedidosAgrupados[order_id].total +=
          pedido.precio_unitario * pedido.cantidad;

        distrito = pedido.nombre_producto
          .substring(
            pedido.nombre_producto.indexOf("EXPRESS") + "EXPRESS".length
          )
          .trim();
        rangoEnviar = "EXPRESS";
      } else if (pedido.nombre_producto.includes("REGULAR")) {
        tipo_entrega = "REGULAR";
        pedidosAgrupados[order_id].total +=
          pedido.precio_unitario * pedido.cantidad;

        distrito = pedido.nombre_producto
          .substring(
            pedido.nombre_producto.indexOf("REGULAR") + "REGULAR".length
          )
          .trim();

        console.log("ES RANGO: ", pedido.rango);

        const parteDecimal = pedido.rango.toString().split(".")[1]; // Obtenemos la parte decimal como cadena
        const ultimoDigito = parteDecimal.charAt(parteDecimal.length - 1);

        if (ultimoDigito == 2) {
          rangoEnviar = "Rango 1";
        } else if (ultimoDigito == 3) {
          rangoEnviar = "Rango 2";
        } else if (ultimoDigito == 5) {
          rangoEnviar = "Rango 3";
        }
        console.log("EL UTIMO DIGITO ES: ", ultimoDigito);
      }

      pedidosAgrupados[order_id].productos.push({
        nombre_producto: pedido.nombre_producto,
        precio_unitario: pedido.precio_unitario,
        cantidad: pedido.cantidad,
        tipo_delivery: tipo_entrega, // Agregar el tipo de entrega
      });
    });

    // Mostrar los pedidos agrupados
    for (const order_id in pedidosAgrupados) {
      if (Object.hasOwnProperty.call(pedidosAgrupados, order_id)) {
        const pedido = pedidosAgrupados[order_id];
        // console.log(`Pedido con order_id ${order_id}:`);
        // console.log("Task Descripción:", pedido.TaskDescripcion);
        // console.log("Order ID:", pedido.order_id);
        // console.log("Descripción:", pedido.descripcion);
        // console.log("Dirección final:", pedido.direccion_final);
        // console.log("Dirección de referencia:", pedido.direccion_referencia);
        // console.log("Teléfono del comprador:", pedido.telefono_comprador);
        // console.log("Email del comprador:", pedido.email_comprador);
        // console.log("Nombre del destinatario:", pedido.nombre_destinatario);
        // console.log("Fecha de recogida:", pedido.job_pickup_datetime);
        // console.log("TookanID:", pedido.TookanID);
        // console.log("Productos:");

        // pedido.productos.forEach((producto, index) => {
        //   console.log(`Producto ${index + 1}:`);
        //   console.log("Nombre del producto:", producto.nombre_producto);
        //   console.log("Precio unitario:", producto.precio_unitario);
        //   console.log("Cantidad:", producto.cantidad);
        //   console.log("Tipo de entrega:", producto.tipo_delivery); // Mostrar el tipo de entrega
        // });

        // console.log("Total:", pedido.total); // Mostrar el total
        // console.log("---------------------------------------------");

        var fecha = "";

        console.log("RANGO: ", rangoEnviar);
        console.log("FECHA DE LA BASE DE DATOS: ", pedido.job_pickup_datetime);

        if (rangoEnviar == "Rango 1") {
          fecha = pedido.job_pickup_datetime + " 14:00:00";
        } else if (rangoEnviar == "Rango 2") {
          fecha = pedido.job_pickup_datetime + " 18:00:00";
        } else if (rangoEnviar == "Rango 3") {
          fecha = pedido.job_pickup_datetime + " 20:00:00";
        } else if (rangoEnviar == "EXPRESS") {
          fecha = pedido.job_pickup_datetime + " 00:00:00";
        }

        console.log("DISTRITO: ", distrito);

        console.log("FECHA: ", fecha);

        // Crear el payload para la entrega con los datos del pedido actual
        let payloadCreate = {
          documento_origen: "SO" + order_id,
          express: "",
          rango: rangoEnviar, //Puede tener los valores "Rango 1",  "Rango 2",  "Rango 3".
          direccion_final: pedido.direccion_final,
          direccion_referencia: pedido.direccion_referencia,
          email_comprador: pedido.email_comprador,
          nombre_destinatario: pedido.nombre_destinatario,
          telefono_comprador: pedido.telefono_comprador,
          hora_deliv: fecha,
          // //////////////////////////////////

          order_id: "SO" + pedido.order_id, // Usar el order_id del pedido actual
          job_description:
            tipo_entrega === "EXPRESS"
              ? "Express - " +
                pedido.TaskDescripcion +
                ", " +
                distrito +
                " - Ref: " +
                pedido.referencia
              : rangoEnviar +
                " - " +
                pedido.TaskDescripcion +
                ", " +
                distrito +
                " - Ref: " +
                pedido.referencia, // Modificar el job_description según el tipo de entrega
          job_pickup_phone: pedido.telefono_comprador,
          job_pickup_name: pedido.nombre_destinatario,
          job_pickup_email: pedido.email_comprador
            ? pedido.email_comprador
            : "No se proporcionó email",
          job_pickup_address: pedido.direccion_final,
          job_pickup_latitude: "",
          job_pickup_longitude: "",
          // job_pickup_datetime: fecha,
          job_delivery_datetime: fecha, // Convertir la fecha y hora
          pickup_custom_field_template: "Prueba",
          team_id: "",
          auto_assignment: "0",
          has_pickup: "0",
          has_delivery: "1",
          layout_type: "0",
          tracking_link: 1,
          timezone: "+300",
          fleet_id: "636",
          ref_images: [
            "http://tookanapp.com/wp-content/uploads/2015/11/logo_dark.png",
          ],
          notify: 1,
          tags: "",
          barcode: "",
          geofence: 0,
        };

        // console.log(payloadCreate);

        try {
          // Llamar a la función para crear la entrega con el payload actual

          //
          // await create_delivery(payloadCreate);
          // await actualizarTookanID("SO" + pedido.order_id, pedido.order_id);
          //

          let response = await create_delivery(payloadCreate);

          if (response.status === 200) {
            // Actualizar el campo TookanID en la base de datos
            await actualizarTookanID("SO" + pedido.order_id, pedido.order_id);
            console.log(
              "Pedido creado y TookanID actualizado:",
              pedido.order_id
            );
          } else {
            console.log(response);
            console.error("1- Error al crear la entrega: ", response);
          }
        } catch (error) {
          console.error("2- Error al crear la entrega:", error);
        }
      }
    }
  })
  .catch((error) => console.error("Error al obtener pedidos:", error));
