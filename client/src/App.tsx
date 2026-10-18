import {useEffect, useMemo, useState} from 'react';
import {Alert, AppShell, Button, Checkbox, Group, Loader, ScrollArea, Select, Stack, Title} from '@mantine/core';
import FacilityFilter from './components/FacilityFilter';
import FacilityList from './components/FacilityList';
import type {CommencedRange, ExpectedClosureRange, ExpectedOperationRange, Facility} from './types';
import {
    buildSearchFromFilters,
    COMMENCED_OPTIONS,
    EXPECTED_CLOSURE_OPTIONS,
    EXPECTED_OPERATION_OPTIONS,
    filterFacilities,
    FUELTECH_GROUPED_OPTIONS,
    getFiltersFromSearch,
    NETWORK_REGION_OPTIONS,
    NON_RENEWABLE_FUELTECH_IDS,
    RENEWABLE_FUELTECH_IDS,
    sortFacilities,
    STATUS_OPTIONS
} from './utils';

const App = () => {
    const [filters, setFilters] = useState(() => getFiltersFromSearch(window.location.search));
    const [facilities, setFacilities] = useState<Facility[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [expandAll, setExpandAll] = useState(false);
    const [showTotalCapacity, setShowTotalCapacity] = useState(false);

    // Fetch every facility once; all filtering happens client-side
    useEffect(() => {
        let abort = false;

        fetch("/api/facilities").then(async (res) => {
            const body = await res.json().catch(() => null);
            if (abort) {
                return;
            }
            if (res.ok) {
                setFacilities(body.facilities);
            } else {
                setError(body?.error ?? "Failed to load facilities");
            }
        });

        return () => {
            abort = true;
        };
    }, []);

    // Keep the URL in sync so a reload restores the same filters
    useEffect(() => {
        window.history.replaceState(null, "", buildSearchFromFilters(filters) || window.location.pathname);
    }, [filters]);

    const visibleFacilities = useMemo(
        () => facilities && sortFacilities(filterFacilities(facilities, filters), filters.sortBy),
        [facilities, filters]
    );

    return (
        <AppShell
            header={{height: 56}}
            navbar={{width: 260, breakpoint: 0}} // Always shown; breakpoint 0 avoids the mobile overlay
            padding="md"
        >
            <AppShell.Header>
                <Group h="100%" px="md">
                    <Title order={4}>Power Station Facilities in Australia</Title>
                </Group>
            </AppShell.Header>
            <AppShell.Navbar p="md">
                <AppShell.Section grow component={ScrollArea}>
                    <Stack gap="md">
                        <FacilityFilter
                            label="Region"
                            placeholder="All regions"
                            data={NETWORK_REGION_OPTIONS}
                            value={filters.networkRegions}
                            onChange={(networkRegions) => setFilters((prev) => ({...prev, networkRegions}))}
                        />
                        <FacilityFilter
                            label="Status"
                            placeholder="All statuses"
                            data={STATUS_OPTIONS}
                            value={filters.statusIds}
                            onChange={(statusIds) => setFilters((prev) => ({...prev, statusIds}))}
                        />
                        <Stack gap={6}>
                            <FacilityFilter
                                label="Fuel technology"
                                placeholder="All fuel technologies"
                                data={FUELTECH_GROUPED_OPTIONS}
                                value={filters.fueltechIds}
                                onChange={(fueltechIds) => setFilters((prev) => ({...prev, fueltechIds}))}
                            />
                            <Group gap="xs">
                                <Button
                                    size="compact-xs"
                                    variant="light"
                                    onClick={() => setFilters((prev) => ({...prev, fueltechIds: RENEWABLE_FUELTECH_IDS}))}
                                >
                                    Renewables
                                </Button>
                                <Button
                                    size="compact-xs"
                                    variant="light"
                                    onClick={() => setFilters((prev) => ({...prev, fueltechIds: NON_RENEWABLE_FUELTECH_IDS}))}
                                >
                                    Non-renewables
                                </Button>
                            </Group>
                        </Stack>
                        <Select
                            label="Commenced"
                            placeholder="Any time"
                            data={COMMENCED_OPTIONS}
                            value={filters.commenced}
                            onChange={(value) => setFilters((prev) => ({...prev, commenced: value as CommencedRange | null}))}
                            clearable
                            withAlignedLabels
                        />
                        <Select
                            label="Expected operation"
                            placeholder="Any time"
                            data={EXPECTED_OPERATION_OPTIONS}
                            value={filters.expectedOperation}
                            onChange={(value) => setFilters((prev) => ({...prev, expectedOperation: value as ExpectedOperationRange | null}))}
                            clearable
                            withAlignedLabels
                        />
                        <Select
                            label="Expected closure"
                            placeholder="Any time"
                            data={EXPECTED_CLOSURE_OPTIONS}
                            value={filters.expectedClosure}
                            onChange={(value) => setFilters((prev) => ({...prev, expectedClosure: value as ExpectedClosureRange | null}))}
                            clearable
                            withAlignedLabels
                        />
                        <Checkbox
                            label="Show all units"
                            checked={expandAll}
                            onChange={(event) => setExpandAll(event.currentTarget.checked)}
                        />
                        <Checkbox
                            label="Show total capacity"
                            checked={showTotalCapacity}
                            onChange={(event) => setShowTotalCapacity(event.currentTarget.checked)}
                        />
                    </Stack>
                </AppShell.Section>
            </AppShell.Navbar>
            <AppShell.Main>
                {error ? (
                    <Alert color="red" title="Couldn't load facilities">{error}</Alert>
                ) : visibleFacilities ? (
                    // Remount on filter/sort change so pagination resets to page 1
                    <FacilityList
                        key={buildSearchFromFilters(filters)}
                        facilities={visibleFacilities}
                        expandAll={expandAll}
                        showTotalCapacity={showTotalCapacity}
                        sortBy={filters.sortBy}
                        onSortChange={(sortBy) => setFilters((prev) => ({...prev, sortBy}))}
                    />
                ) : (
                    <Loader/>
                )}
            </AppShell.Main>
        </AppShell>
    );
};

export default App;
