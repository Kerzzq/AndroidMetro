// Servicio para obtener los próximos trenes del Metro de Bilbao
// Obtiene y parsea HTML de metrobilbao.eus usando regex (compatible con React Native)

/**
 * Obtiene la fecha actual en formato DD-MM-YYYY
 */
function getTodayFormatted() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}-${month}-${year}`;
}

/**
 * Fetch de los próximos trenes entre dos estaciones
 * @param {string} fromStation - Código de estación origen (ej: 'ABA')
 * @param {string} toStation - Código de estación destino (ej: 'SIN')
 * @returns {Promise<Array<{time: string, minutesLeft: string, line: string, destination: string}>>}
 */
export async function getNextTrains(fromStation, toStation) {
    if (!fromStation || !toStation) {
        return [];
    }

    const date = getTodayFormatted();
    const url = `https://www.metrobilbao.eus/es/proximos-trenes?frmStn=${fromStation}&toStn=${toStation}&d=${date}`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
                Accept:
                    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'es-ES,es;q=0.9',
            },
        });

        if (!response.ok) {
            console.error(`Error fetching trains: ${response.status}`);
            return [];
        }

        const html = await response.text();
        return parseTrainData(html);
    } catch (error) {
        console.error('Error fetching next trains:', error);
        return [];
    }
}

/**
 * Parsea el HTML de la página de próximos trenes usando regex
 * Busca patrones como: "10:42 (4) | L1/L2 | Destino Kabiezes"
 */
function parseTrainData(html) {
    const trains = [];

    // Patrón principal: "HH:MM (X) | LX/LX | Destino XXXXX"
    const trainRegex =
        /(\d{1,2}:\d{2})\s*\((\d+)\)\s*\|\s*([^|]+?)\s*\|\s*(?:Destino\s+)?([^\n<]+)/gi;

    // Eliminar tags HTML para trabajar con texto plano
    const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
        .replace(/<[^>]+>/g, ' ') // Remove all HTML tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code))
        .replace(/\s+/g, ' '); // Normalize whitespace

    let match;
    while ((match = trainRegex.exec(textContent)) !== null) {
        const train = {
            time: match[1].trim(),
            minutesLeft: match[2].trim(),
            line: match[3].trim(),
            destination: match[4].trim().replace(/\s+/g, ' '),
        };

        // Evitar duplicados
        const isDuplicate = trains.some(
            (t) => t.time === train.time && t.destination === train.destination
        );
        if (!isDuplicate) {
            trains.push(train);
        }
    }

    // Si no encontramos con ese patrón, intentar un formato más relajado
    if (trains.length === 0) {
        // Buscar tiempos de tren en formato alternativo
        const altRegex = /(\d{1,2}:\d{2})\s*\((\d+)\)/g;
        let altMatch;
        while ((altMatch = altRegex.exec(textContent)) !== null) {
            // Extraer contexto alrededor del match
            const start = Math.max(0, altMatch.index - 10);
            const end = Math.min(textContent.length, altMatch.index + altMatch[0].length + 50);
            const context = textContent.substring(start, end);

            // Intentar extraer línea y destino del contexto
            const lineMatch = context.match(/[L]\d(?:\/L\d)?/i);
            const destMatch = context.match(/(?:Destino|Dest\.?)\s+(\S+(?:\s+\S+)?)/i);

            trains.push({
                time: altMatch[1],
                minutesLeft: altMatch[2],
                line: lineMatch ? lineMatch[0] : '',
                destination: destMatch ? destMatch[1] : '',
            });
        }
    }

    return trains;
}

/**
 * Obtiene los datos de todos los paneles configurados
 * @param {Array<{from: string, to: string}>} panels - Array de 4 paneles con estaciones
 * @returns {Promise<Array<Array<{time, minutesLeft, line, destination}>>>}
 */
export async function getAllPanelsData(panels) {
    const results = await Promise.all(
        panels.map((panel) => {
            if (panel.from && panel.to) {
                return getNextTrains(panel.from, panel.to);
            }
            return Promise.resolve([]);
        })
    );
    return results;
}
