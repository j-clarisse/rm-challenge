import {useEffect} from 'react'
import {AppShell, Burger, Group, Text, Title} from '@mantine/core'
import {useDisclosure} from '@mantine/hooks'

const App = () => {
    const [navOpened, {toggle: toggleNav}] = useDisclosure(true); // Open on initial load

    useEffect(() => {
        let abort = false;

        fetch("/api/facilities").then(async (res) => {
            if (res.ok) {
                const body = await res.json();
                if (abort) {
                    return;
                }
                console.log(body.facilities);
            }
        });

        return () => {
            abort = true;
        }
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
                <Burger opened={navOpened} onClick={toggleNav} size="sm" aria-label="Toggle navigation"/>
                <Text>Hello world!</Text>
            </AppShell.Main>
        </AppShell>
    )
}

export default App
