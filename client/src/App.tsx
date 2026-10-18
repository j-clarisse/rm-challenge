import {useEffect, useState} from 'react';
import {AppShell, Button, Group, Loader, Text, Title} from '@mantine/core';
import {useDisclosure} from '@mantine/hooks';
import FacilityList from './components/FacilityList';
import type {Facility} from './types';

const App = () => {
    const [navOpened, {toggle: toggleNav}] = useDisclosure(true); // Open on initial load
    const [facilities, setFacilities] = useState<Facility[] | null>(null);

    useEffect(() => {
        let abort = false;

        fetch("/api/facilities").then(async (res) => {
            if (res.ok) {
                const body = await res.json();
                if (abort) {
                    return;
                }
                setFacilities(body.facilities);
            }
        });

        return () => {
            abort = true;
        };
    }, []);

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
                {facilities ? <FacilityList facilities={facilities}/> : <Loader/>}
            </AppShell.Main>
        </AppShell>
    );
};

export default App;
