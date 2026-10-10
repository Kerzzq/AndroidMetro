import { changeInstance, deleteInstance } from '../services/favoritesRepository';
import { refreshWidget } from './widgetRuntime';
export async function widgetTaskHandler({ widgetInfo, widgetAction, clickAction, clickActionData = {}, renderWidget }) {
  try {
    if (widgetAction === 'WIDGET_DELETED') { await deleteInstance(widgetInfo.widgetId); return; }
    if (widgetAction === 'WIDGET_CLICK') {
      if (clickAction === 'OPEN_SELECTOR') { await changeInstance(widgetInfo.widgetId, { view: 'favorites' }); await refreshWidget(widgetInfo, renderWidget, false); return; }
      if (clickAction === 'CLOSE_SELECTOR') { await changeInstance(widgetInfo.widgetId, { view: 'trains' }); await refreshWidget(widgetInfo, renderWidget, false); return; }
      if (clickAction === 'SELECT_FAVORITE') await changeInstance(widgetInfo.widgetId, { favoriteId: clickActionData.favoriteId, view: 'trains' });
    }
    await refreshWidget(widgetInfo, renderWidget, widgetAction !== 'WIDGET_RESIZED');
  } catch (error) {
    console.warn('No se pudo actualizar el widget:', error.message);
  }
}
