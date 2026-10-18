import {useEffect, useState} from 'react';
import {Alert, AppShell, Button, Group, Loader, Text, Title} from '@mantine/core';
import {useDisclosure} from '@mantine/hooks';
import FacilityList from './components/FacilityList';
import type {Facility} from './types';
import {buildFacilitiesQuery, getFiltersFromSearch} from './utils';

const App = () => {
    const [navOpened, {toggle: toggleNav}] = useDisclosure(true); // Open on initial load
    const [filters] = useState(() => getFiltersFromSearch(window.location.search));
    const [facilities, setFacilities] = useState<Facility[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let abort = false;

        fetch(`/api/facilities${buildFacilitiesQuery(filters)}`).then(async (res) => {
            const body = await res.json().catch(() => null);
            if (abort) {
                return;
            }
            if (res.ok) {
                setFacilities(body.facilities);
            } else if (res.status === 404) {
                // API returns 404 when no facilities match the filters
                setFacilities([]);
            } else {
                setError(body?.error ?? "Failed to load facilities");
            }
        });

        return () => {
            abort = true;
        };
    }, [filters]);

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
                <Text size="sm" c="dimmed">Navigation</Text>
            </AppShell.Navbar>
            <AppShell.Main>
                <Button variant="default" onClick={toggleNav} mb="md">Filters</Button>
                {error ? (
                    <Alert color="red" title="Couldn't load facilities">{error}</Alert>
                ) : facilities ? (
                    <FacilityList facilities={facilities}/>
                ) : (
                    <Loader/>
                )}
            </AppShell.Main>
        </AppShell>
    );
};

export default App;
