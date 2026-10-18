import {useEffect, useMemo, useState} from 'react';
import {Alert, AppShell, Button, Group, Loader, Stack, Title} from '@mantine/core';
import {useDisclosure} from '@mantine/hooks';
import {FunnelIcon} from '@phosphor-icons/react';
import FacilityFilter from './components/FacilityFilter';
import FacilityList from './components/FacilityList';
import type {Facility} from './types';
import {
    buildSearchFromFilters,
    filterFacilities,
    FUELTECH_GROUPED_OPTIONS,
    getFiltersFromSearch,
    NETWORK_REGION_OPTIONS,
    NON_RENEWABLE_FUELTECH_IDS,
    RENEWABLE_FUELTECH_IDS,
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
                            label="Fuel tech"
                            placeholder="All fuel techs"
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
                </Stack>
            </AppShell.Navbar>
            <AppShell.Main>
                <Button
                    variant={navOpened ? "default" : "light"}
                    onClick={toggleNav}
                    mb="md"
                    leftSection={<FunnelIcon size={16}/>}
                    aria-pressed={navOpened}
                >
                    Filters
                </Button>
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
