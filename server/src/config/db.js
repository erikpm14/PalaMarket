import mongoose from 'mongoose';

// Los filtros con operadores ($ne, $gt…) procedentes de la entrada se tratan como texto.
mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', true);

let connection = null;

const DISCONNECTED = 0;

/** Conexión reutilizable: en serverless cada invocación comparte la misma promesa. */
export const connectDb = (uri, timeoutMs = 8000) => {
  // Una instancia reanudada tras estar inactiva puede conservar una promesa ya resuelta de una conexión cerrada.
  // Durante un cierre en curso (estado «disconnecting») no se abre otra: se espera a que termine.
  if (connection && mongoose.connection.readyState === DISCONNECTED) connection = null;
  if (!connection) {
    connection = mongoose.connect(uri, { serverSelectionTimeoutMS: timeoutMs, maxPoolSize: 5 }).catch((error) => {
      connection = null;
      throw error;
    });
  }
  return connection;
};

export const disconnectDb = async () => {
  connection = null;
  await mongoose.disconnect();
};
