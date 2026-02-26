import AsyncStorage from '@react-native-async-storage/async-storage';
import { getNextTrains } from '../services/trainService';
import { STATION_MAP } from '../data/stations';
import MetroWidget from './MetroWidget';
import React from 'react';

const STORAGE_KEY = 'metro_panels_config';

/**
 * Carga la configuración de paneles desde AsyncStorage
 */
async function loadPanelConfig() {
    try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error('Error loading panel config for widget:', e);
    }
    return [
        { from: '', to: '' },
        { from: '', to: '' },
        { from: '', to: '' },
        { from: '', to: '' },
    ];
}

/**
 * Obtiene los datos de trenes para todos los paneles
 */
async function fetchAllPanelsData(panels) {
    const results = await Promise.all(
        panels.map(async (panel) => {
            if (panel.from && panel.to) {
                try {
                    const trains = await getNextTrains(panel.from, panel.to);
                    return {
                        ...panel,
                        fromName: STATION_MAP[panel.from] || panel.from,
                        toName: STATION_MAP[panel.to] || panel.to,
                        trains,
                    };
                } catch (e) {
                    console.error('Error fetching trains:', e);
                    return {
                        ...panel,
                        fromName: STATION_MAP[panel.from] || panel.from,
                        toName: STATION_MAP[panel.to] || panel.to,
                        trains: [],
                    };
                }
            }
            return { ...panel, trains: [] };
        })
    );
    return results;
}

/**
 * Widget task handler para react-native-android-widget
 * Se ejecuta cuando el widget necesita actualizar su UI
 */
export async function widgetTaskHandler(props) {
    const { widgetAction, clickAction, clickActionData, renderWidget } = props;

    switch (widgetAction) {
        case 'WIDGET_ADDED':
        case 'WIDGET_UPDATE':
        case 'WIDGET_RESIZED': {
            // Cargar config y datos
            const panels = await loadPanelConfig();
            const panelsData = await fetchAllPanelsData(panels);

            renderWidget(<MetroWidget panelsData={panelsData} />);
            break;
        }

        case 'WIDGET_CLICK': {
            // Cualquier clic en el widget (incluido el botón "Actualizar")
            // refresca los datos
            const panels = await loadPanelConfig();
            const panelsData = await fetchAllPanelsData(panels);

            renderWidget(<MetroWidget panelsData={panelsData} />);
            break;
        }

        case 'WIDGET_DELETED':
            // Nada que hacer
            break;

        default:
            break;
    }
}
