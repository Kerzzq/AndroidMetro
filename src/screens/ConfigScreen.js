import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
    StatusBar,
    Modal,
    FlatList,
    TextInput,
    Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STATIONS, STATION_MAP } from '../data/stations';
import { getNextTrains } from '../services/trainService';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../styles/theme';

const STORAGE_KEY = 'metro_panels_config';
const NUM_PANELS = 4;

const DEFAULT_PANELS = Array.from({ length: NUM_PANELS }, () => ({
    from: '',
    to: '',
}));

// Componente selector de estación personalizado
function StationSelector({ visible, onClose, onSelect, title }) {
    const [search, setSearch] = useState('');
    const filtered = STATIONS.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={selectorStyles.overlay}>
                <View style={selectorStyles.container}>
                    <View style={selectorStyles.header}>
                        <Text style={selectorStyles.title}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={selectorStyles.closeBtn}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={selectorStyles.search}
                        placeholder="Buscar estación..."
                        placeholderTextColor={COLORS.textMuted}
                        value={search}
                        onChangeText={setSearch}
                        autoFocus
                    />
                    <FlatList
                        data={filtered}
                        keyExtractor={(item) => item.code}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={selectorStyles.item}
                                onPress={() => {
                                    onSelect(item.code);
                                    setSearch('');
                                    onClose();
                                }}
                            >
                                <View style={selectorStyles.itemIcon}>
                                    <Text style={selectorStyles.itemIconText}>M</Text>
                                </View>
                                <View>
                                    <Text style={selectorStyles.itemName}>{item.name}</Text>
                                    <Text style={selectorStyles.itemCode}>{item.code}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            </View>
        </Modal>
    );
}

const selectorStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        maxHeight: '80%',
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.widgetBorder,
    },
    title: {
        color: COLORS.textPrimary,
        fontSize: 18,
        fontWeight: '700',
    },
    closeBtn: {
        color: COLORS.textMuted,
        fontSize: 22,
        padding: SPACING.xs,
    },
    search: {
        backgroundColor: COLORS.surfaceLight,
        color: COLORS.textPrimary,
        marginHorizontal: SPACING.lg,
        marginVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm + 2,
        borderRadius: RADIUS.md,
        fontSize: 16,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.sm + 4,
        paddingHorizontal: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.widgetBorder,
    },
    itemIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    itemIconText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 16,
    },
    itemName: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: '500',
    },
    itemCode: {
        color: COLORS.textMuted,
        fontSize: 12,
        marginTop: 2,
    },
});

// Componente de un tren individual
function TrainRow({ train }) {
    return (
        <View style={styles.trainRow}>
            <View style={styles.trainTimeContainer}>
                <Text style={styles.trainTime}>{train.time}</Text>
                <View style={styles.trainMinutesBadge}>
                    <Text style={styles.trainMinutes}>{train.minutesLeft} min</Text>
                </View>
            </View>
            <View style={styles.trainInfo}>
                <Text style={styles.trainLine}>{train.line}</Text>
                <Text style={styles.trainDest} numberOfLines={1}>
                    {train.destination}
                </Text>
            </View>
        </View>
    );
}

// Componente de un panel configurable
function PanelCard({ index, config, trains, loading, onChangeFrom, onChangeTo, onRefresh }) {
    const [showFromSelector, setShowFromSelector] = useState(false);
    const [showToSelector, setShowToSelector] = useState(false);
    const fromName = config.from ? STATION_MAP[config.from] : null;
    const toName = config.to ? STATION_MAP[config.to] : null;

    return (
        <View style={styles.panelCard}>
            <View style={styles.panelHeader}>
                <View style={styles.panelNumber}>
                    <Text style={styles.panelNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.panelTitle}>Panel {index + 1}</Text>
                {config.from && config.to && (
                    <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
                        <Text style={styles.refreshBtnText}>↻</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Selectores de estación */}
            <View style={styles.stationSelectors}>
                <View style={styles.stationRow}>
                    <View style={styles.stationIconContainer}>
                        <View style={[styles.stationDot, { backgroundColor: COLORS.success }]} />
                        <View style={styles.stationLine} />
                    </View>
                    <TouchableOpacity
                        style={styles.stationButton}
                        onPress={() => setShowFromSelector(true)}
                    >
                        <Text style={styles.stationLabel}>Origen</Text>
                        <Text
                            style={[
                                styles.stationValue,
                                !fromName && styles.stationPlaceholder,
                            ]}
                        >
                            {fromName || 'Seleccionar estación'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.stationRow}>
                    <View style={styles.stationIconContainer}>
                        <View style={[styles.stationDot, { backgroundColor: COLORS.primary }]} />
                    </View>
                    <TouchableOpacity
                        style={styles.stationButton}
                        onPress={() => setShowToSelector(true)}
                    >
                        <Text style={styles.stationLabel}>Destino</Text>
                        <Text
                            style={[
                                styles.stationValue,
                                !toName && styles.stationPlaceholder,
                            ]}
                        >
                            {toName || 'Seleccionar estación'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Lista de trenes */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Cargando trenes...</Text>
                </View>
            ) : trains.length > 0 ? (
                <View style={styles.trainsContainer}>
                    <Text style={styles.trainsTitle}>Siguientes trenes</Text>
                    {trains.slice(0, 5).map((train, i) => (
                        <TrainRow key={`${train.time}-${i}`} train={train} />
                    ))}
                </View>
            ) : config.from && config.to ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🚇</Text>
                    <Text style={styles.emptyText}>No hay trenes disponibles</Text>
                    <Text style={styles.emptySubtext}>Pulsa ↻ para actualizar</Text>
                </View>
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>📍</Text>
                    <Text style={styles.emptyText}>Configura las estaciones</Text>
                    <Text style={styles.emptySubtext}>
                        Selecciona origen y destino para ver los próximos trenes
                    </Text>
                </View>
            )}

            {/* Modales de selección */}
            <StationSelector
                visible={showFromSelector}
                onClose={() => setShowFromSelector(false)}
                onSelect={onChangeFrom}
                title="Estación de origen"
            />
            <StationSelector
                visible={showToSelector}
                onClose={() => setShowToSelector(false)}
                onSelect={onChangeTo}
                title="Estación de destino"
            />
        </View>
    );
}

export default function ConfigScreen() {
    const [panels, setPanels] = useState(DEFAULT_PANELS);
    const [trainData, setTrainData] = useState(Array(NUM_PANELS).fill([]));
    const [loading, setLoading] = useState(Array(NUM_PANELS).fill(false));
    const [refreshing, setRefreshing] = useState(false);

    // Cargar configuración guardada
    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const saved = await AsyncStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                setPanels(parsed);
                // Fetch datos para los paneles configurados
                fetchAllTrains(parsed);
            }
        } catch (e) {
            console.error('Error loading config:', e);
        }
    };

    const saveConfig = async (newPanels) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPanels));
            // También guardar en SharedPreferences para el widget
            await AsyncStorage.setItem('widget_panels_config', JSON.stringify(newPanels));
        } catch (e) {
            console.error('Error saving config:', e);
        }
    };

    const fetchTrainsForPanel = async (panelConfig, index) => {
        if (!panelConfig.from || !panelConfig.to) return;

        setLoading((prev) => {
            const next = [...prev];
            next[index] = true;
            return next;
        });

        try {
            const trains = await getNextTrains(panelConfig.from, panelConfig.to);
            setTrainData((prev) => {
                const next = [...prev];
                next[index] = trains;
                return next;
            });
        } catch (e) {
            console.error(`Error fetching trains for panel ${index}:`, e);
        } finally {
            setLoading((prev) => {
                const next = [...prev];
                next[index] = false;
                return next;
            });
        }
    };

    const fetchAllTrains = async (panelConfigs) => {
        const configs = panelConfigs || panels;
        await Promise.all(
            configs.map((config, i) => fetchTrainsForPanel(config, i))
        );
    };

    const handleChangeStation = (panelIndex, field, stationCode) => {
        const newPanels = [...panels];
        newPanels[panelIndex] = { ...newPanels[panelIndex], [field]: stationCode };
        setPanels(newPanels);
        saveConfig(newPanels);

        // Si ambas estaciones están seleccionadas, fetch trenes
        if (newPanels[panelIndex].from && newPanels[panelIndex].to) {
            fetchTrainsForPanel(newPanels[panelIndex], panelIndex);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchAllTrains();
        setRefreshing(false);
    }, [panels]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View style={styles.logoContainer}>
                        <View style={styles.logoIcon}>
                            <Text style={styles.logoText}>M</Text>
                        </View>
                        <View>
                            <Text style={styles.headerTitle}>Metro Bilbao</Text>
                            <Text style={styles.headerSubtitle}>Widget · Próximos trenes</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.refreshAllBtn} onPress={onRefresh}>
                        <Text style={styles.refreshAllText}>⟳ Actualizar</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Paneles */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.primary}
                        colors={[COLORS.primary]}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.sectionTitle}>Configura tus paneles</Text>
                <Text style={styles.sectionSubtitle}>
                    Selecciona las estaciones para cada panel del widget
                </Text>

                {panels.map((panel, index) => (
                    <PanelCard
                        key={index}
                        index={index}
                        config={panel}
                        trains={trainData[index]}
                        loading={loading[index]}
                        onChangeFrom={(code) =>
                            handleChangeStation(index, 'from', code)
                        }
                        onChangeTo={(code) =>
                            handleChangeStation(index, 'to', code)
                        }
                        onRefresh={() => fetchTrainsForPanel(panel, index)}
                    />
                ))}

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Los datos se actualizan desde metrobilbao.eus
                    </Text>
                    <Text style={styles.footerNote}>
                        Añade el widget "Metro Bilbao" a tu pantalla de inicio
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.widgetBorder,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 0,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoIcon: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    logoText: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '900',
    },
    headerTitle: {
        color: COLORS.textPrimary,
        fontSize: 20,
        fontWeight: '800',
    },
    headerSubtitle: {
        color: COLORS.textMuted,
        fontSize: 12,
        marginTop: 2,
    },
    refreshAllBtn: {
        backgroundColor: COLORS.surfaceLight,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.widgetBorder,
    },
    refreshAllText: {
        color: COLORS.accent,
        fontSize: 13,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: SPACING.lg,
        paddingBottom: SPACING.xxl,
    },
    sectionTitle: {
        color: COLORS.textPrimary,
        fontSize: 24,
        fontWeight: '800',
        marginBottom: SPACING.xs,
    },
    sectionSubtitle: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginBottom: SPACING.lg,
    },
    panelCard: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.widgetBorder,
        ...SHADOWS.medium,
    },
    panelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    panelNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.sm,
    },
    panelNumberText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
    },
    panelTitle: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
    },
    refreshBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.widgetBorder,
    },
    refreshBtnText: {
        color: COLORS.accent,
        fontSize: 20,
    },
    stationSelectors: {
        marginBottom: SPACING.md,
    },
    stationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    stationIconContainer: {
        alignItems: 'center',
        marginRight: SPACING.md,
        width: 20,
    },
    stationDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    stationLine: {
        width: 2,
        height: 30,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginTop: 4,
        position: 'absolute',
        top: 14,
    },
    stationButton: {
        flex: 1,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm + 2,
        borderWidth: 1,
        borderColor: COLORS.widgetBorder,
    },
    stationLabel: {
        color: COLORS.textMuted,
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    stationValue: {
        color: COLORS.textPrimary,
        fontSize: 15,
        fontWeight: '600',
        marginTop: 2,
    },
    stationPlaceholder: {
        color: COLORS.textMuted,
        fontWeight: '400',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.lg,
    },
    loadingText: {
        color: COLORS.textMuted,
        marginLeft: SPACING.sm,
        fontSize: 14,
    },
    trainsContainer: {
        borderTopWidth: 1,
        borderTopColor: COLORS.widgetBorder,
        paddingTop: SPACING.md,
    },
    trainsTitle: {
        color: COLORS.textSecondary,
        fontSize: 13,
        fontWeight: '600',
        marginBottom: SPACING.sm,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    trainRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.widgetBorder,
    },
    trainTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 120,
    },
    trainTime: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: '700',
        marginRight: SPACING.sm,
    },
    trainMinutesBadge: {
        backgroundColor: COLORS.primary + '30',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: RADIUS.sm,
    },
    trainMinutes: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '700',
    },
    trainInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    trainLine: {
        color: COLORS.accent,
        fontSize: 13,
        fontWeight: '700',
        marginRight: SPACING.sm,
        backgroundColor: COLORS.accent + '20',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
        overflow: 'hidden',
    },
    trainDest: {
        color: COLORS.textSecondary,
        fontSize: 13,
        flex: 1,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: SPACING.lg,
    },
    emptyIcon: {
        fontSize: 32,
        marginBottom: SPACING.sm,
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    emptySubtext: {
        color: COLORS.textMuted,
        fontSize: 12,
        marginTop: 4,
        textAlign: 'center',
    },
    footer: {
        alignItems: 'center',
        paddingVertical: SPACING.xl,
    },
    footerText: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
    footerNote: {
        color: COLORS.textMuted,
        fontSize: 12,
        marginTop: 4,
        fontStyle: 'italic',
    },
});
