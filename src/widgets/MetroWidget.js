import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

const COLORS = {
    background: '#1A1A2E',
    surface: '#16213E',
    surfaceLight: '#1F3050',
    primary: '#E31937',
    accent: '#00B4D8',
    text: '#FFFFFF',
    textSecondary: '#A0AEC0',
    textMuted: '#718096',
    border: '#1F3050',
};

function WidgetTrainItem({ train }) {
    return (
        <FlexWidget
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 3,
                paddingHorizontal: 6,
            }}
        >
            <TextWidget
                text={train.time}
                style={{
                    fontSize: 12,
                    color: COLORS.text,
                    fontWeight: 'bold',
                    width: 40,
                }}
            />
            <FlexWidget
                style={{
                    backgroundColor: '#E3193740',
                    borderRadius: 4,
                    paddingHorizontal: 4,
                    paddingVertical: 1,
                    marginRight: 4,
                }}
            >
                <TextWidget
                    text={`${train.minutesLeft}'`}
                    style={{
                        fontSize: 10,
                        color: COLORS.primary,
                        fontWeight: 'bold',
                    }}
                />
            </FlexWidget>
            <TextWidget
                text={train.line || ''}
                style={{
                    fontSize: 10,
                    color: COLORS.accent,
                    fontWeight: 'bold',
                    marginRight: 4,
                }}
            />
            <TextWidget
                text={train.destination || ''}
                style={{
                    fontSize: 10,
                    color: COLORS.textSecondary,
                }}
                maxLines={1}
            />
        </FlexWidget>
    );
}

function WidgetPanel({ panelData, index }) {
    const { from, to, fromName, toName, trains = [] } = panelData;
    const hasConfig = from && to;

    return (
        <FlexWidget
            style={{
                flex: 1,
                backgroundColor: COLORS.surface,
                borderRadius: 10,
                padding: 6,
                margin: 2,
            }}
        >
            {/* Panel header */}
            <FlexWidget
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 3,
                    paddingBottom: 3,
                }}
            >
                <FlexWidget
                    style={{
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: COLORS.primary,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 4,
                    }}
                >
                    <TextWidget
                        text={`${index + 1}`}
                        style={{ fontSize: 9, color: '#FFFFFF', fontWeight: 'bold' }}
                    />
                </FlexWidget>
                {hasConfig ? (
                    <TextWidget
                        text={`${fromName || from} → ${toName || to}`}
                        style={{
                            fontSize: 10,
                            color: COLORS.text,
                            fontWeight: 'bold',
                        }}
                        maxLines={1}
                    />
                ) : (
                    <TextWidget
                        text="Sin configurar"
                        style={{
                            fontSize: 10,
                            color: COLORS.textMuted,
                            fontStyle: 'italic',
                        }}
                    />
                )}
            </FlexWidget>

            {/* Train list */}
            {hasConfig && trains.length > 0 ? (
                <FlexWidget style={{ flex: 1 }}>
                    {trains.slice(0, 3).map((train, i) => (
                        <WidgetTrainItem key={`train-${index}-${i}`} train={train} />
                    ))}
                </FlexWidget>
            ) : hasConfig ? (
                <FlexWidget
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <TextWidget
                        text="Sin datos"
                        style={{
                            fontSize: 10,
                            color: COLORS.textMuted,
                        }}
                    />
                </FlexWidget>
            ) : (
                <FlexWidget
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <TextWidget
                        text="Configura en la app"
                        style={{
                            fontSize: 9,
                            color: COLORS.textMuted,
                            textAlign: 'center',
                        }}
                    />
                </FlexWidget>
            )}
        </FlexWidget>
    );
}

export default function MetroWidget({ panelsData = [] }) {
    // Crear array de 4 paneles con defaults
    const panels = Array.from({ length: 4 }, (_, i) => panelsData[i] || {});

    return (
        <FlexWidget
            style={{
                flex: 1,
                backgroundColor: COLORS.background,
                borderRadius: 16,
                padding: 6,
            }}
        >
            {/* Header con botón actualizar */}
            <FlexWidget
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    marginBottom: 2,
                }}
            >
                <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <FlexWidget
                        style={{
                            width: 20,
                            height: 20,
                            borderRadius: 6,
                            backgroundColor: COLORS.primary,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 6,
                        }}
                    >
                        <TextWidget
                            text="M"
                            style={{ fontSize: 11, color: '#FFFFFF', fontWeight: 'bold' }}
                        />
                    </FlexWidget>
                    <TextWidget
                        text="Metro Bilbao"
                        style={{
                            fontSize: 12,
                            color: COLORS.text,
                            fontWeight: 'bold',
                        }}
                    />
                </FlexWidget>

                {/* Botón actualizar - clickAction en FlexWidget */}
                <FlexWidget
                    clickAction="REFRESH"
                    clickActionData={{ action: 'refresh' }}
                    style={{
                        backgroundColor: COLORS.surfaceLight,
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                    }}
                >
                    <TextWidget
                        text="⟳ Actualizar"
                        style={{
                            fontSize: 10,
                            color: COLORS.accent,
                            fontWeight: 'bold',
                        }}
                    />
                </FlexWidget>
            </FlexWidget>

            {/* Grid 2x2 de paneles */}
            <FlexWidget style={{ flex: 1 }}>
                <FlexWidget style={{ flex: 1, flexDirection: 'row' }}>
                    <WidgetPanel panelData={panels[0]} index={0} />
                    <WidgetPanel panelData={panels[1]} index={1} />
                </FlexWidget>
                <FlexWidget style={{ flex: 1, flexDirection: 'row' }}>
                    <WidgetPanel panelData={panels[2]} index={2} />
                    <WidgetPanel panelData={panels[3]} index={3} />
                </FlexWidget>
            </FlexWidget>
        </FlexWidget>
    );
}
