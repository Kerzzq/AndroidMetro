function normalizeResponse(data, fetchedAt) {
  if (!data || !Array.isArray(data.trains)) throw new Error('invalid_data');
  const trains = data.trains.map(train => {
    if (!train || typeof train.timeRounded !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(train.timeRounded) || typeof train.direction !== 'string') throw new Error('invalid_data');
    return {
      time: train.timeRounded,
      serviceTime: typeof train.time === 'string' ? train.time : null,
      minutesAtQuery: Number.isFinite(train.estimated) && train.estimated >= 0 ? train.estimated : null,
      destination: train.direction,
      wagons: Number.isFinite(train.wagons) && train.wagons > 0 ? train.wagons : null,
    };
  });
  return { status: trains.length ? 'success' : 'empty', fetchedAt, trains };
}
const errorMessage = kind => ({ network: 'No se pudo conectar. Comprueba tu conexión.', timeout: 'El servicio tarda en responder. Vuelve a intentar.', service: 'El servicio no está disponible ahora.', invalid_data: 'El servicio devolvió datos no válidos.', invalid_route: 'Revisa las estaciones de este favorito.' }[kind] || 'No se pudo actualizar.');
module.exports = { normalizeResponse, errorMessage };
