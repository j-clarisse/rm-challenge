import {createRoot} from 'react-dom/client';
import '@mantine/core/styles.css';
import {MantineProvider} from '@mantine/core';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
    <MantineProvider defaultColorScheme="light">
        <App />
    </MantineProvider>
);
