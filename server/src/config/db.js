import mongoose from 'mongoose';

// Los filtros con operadores ($ne, $gt…) procedentes de la entrada se tratan como texto.
mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', true);

let connection = null;

const DISCONNECTED = 0;
const DISCONNECTING = 3;

/** Conexión reutilizable: en serverless cada invocación comparte la misma promesa. */
export const connectDb = (uri, timeoutMs = 8000) => {
  // Una instancia reanudada tras estar inactiva puede conservar una promesa ya resuelta de una conexión cerrada.
  if (connection && [DISCONNECTED, DISCONNECTING].includes(mongoose.connection.readyState)) connection = null;
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
