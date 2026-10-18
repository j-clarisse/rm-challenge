import {useEffect, useMemo, useState} from 'react';
import {Alert, AppShell, Button, Group, Loader, MultiSelect, Stack, Title} from '@mantine/core';
import {useDisclosure} from '@mantine/hooks';
import FacilityList from './components/FacilityList';
import type {Facility} from './types';
import {
    buildSearchFromFilters,
    filterFacilities,
    FUELTECH_OPTIONS,
    getFiltersFromSearch,
    NETWORK_REGION_OPTIONS,
    STATUS_OPTIONS
} from './utils';

const App = () => {
    const [navOpened, {toggle: toggleNav}] = useDisclosure(true); // Open on initial load
    const [filters, setFilters] = useState(() => getFiltersFromSearch(window.location.search));
    const [facilities, setFacilities] = useState<Facility[] | null>(null);
    const [error, setError] = useState<string | null>(null);

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
        () => facilities && filterFacilities(facilities, filters),
        [facilities, filters]
    );

    return (
        <AppShell
            header={{height: 56}}
            navbar={{width: 260, breakpoint: 'sm', collapsed: {mobile: !navOpened, desktop: !navOpened}}}
            padding="md"
        >
            <AppShell.Header>
                <Group h="100%" px="md">
                    <Title order={4}>Power Station Facilities in Australia</Title>
                </Group>
            </AppShell.Header>
            <AppShell.Navbar p="md">
                <Stack gap="md">
                    <MultiSelect
                        label="Status"
                        placeholder="Any status"
                        data={STATUS_OPTIONS}
                        value={filters.statusIds}
                        onChange={(statusIds) => setFilters((prev) => ({...prev, statusIds}))}
                        clearable
                        clearSectionMode="both"
                        withAlignedLabels
                        hidePickedOptions
                    />
                    <MultiSelect
                        label="Fuel tech"
                        placeholder="Any fuel tech"
                        data={FUELTECH_OPTIONS}
                        value={filters.fueltechIds}
                        onChange={(fueltechIds) => setFilters((prev) => ({...prev, fueltechIds}))}
                        searchable
                        clearable
                        clearSectionMode="both"
                        withAlignedLabels
                        hidePickedOptions
                    />
                    <MultiSelect
                        label="Region"
                        placeholder="Any region"
                        data={NETWORK_REGION_OPTIONS}
                        value={filters.networkRegions}
                        onChange={(networkRegions) => setFilters((prev) => ({...prev, networkRegions}))}
                        clearable
                        clearSectionMode="both"
                        withAlignedLabels
                        hidePickedOptions
                    />
                </Stack>
            </AppShell.Navbar>
            <AppShell.Main>
                <Button variant="default" onClick={toggleNav} mb="md">Filters</Button>
                {error ? (
                    <Alert color="red" title="Couldn't load facilities">{error}</Alert>
                ) : visibleFacilities ? (
                    <FacilityList facilities={visibleFacilities}/>
                ) : (
                    <Loader/>
                )}
            </AppShell.Main>
        </AppShell>
    );
};

export default App;
