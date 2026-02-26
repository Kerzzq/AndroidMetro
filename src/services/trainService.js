import { STATION_MAP } from '../data/stations';

/**
 * Obtiene los próximos trenes entre dos estaciones usando la API de tiempo real
 * @param {string} from Código de estación de origen
 * @param {string} to Código de estación de destino
 */
export async function getNextTrains(from, to) {
    if (!from || !to) return [];

    try {
        const url = `https://api.metrobilbao.eus/metro/real-time/${from}/${to}`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.trains || !Array.isArray(data.trains)) {
            return [];
        }

        // Mapear el formato de la API al formato esperado por el widget
        return data.trains.map(train => ({
            time: train.timeRounded || '',
            minutesLeft: train.estimated !== undefined ? train.estimated : null,
            destination: train.direction || '',
            wagons: train.wagons ? `${train.wagons} vagones` : ''
        }));
    } catch (error) {
        console.error('Error fetching trains from API:', error);
        return [];
    }
}
