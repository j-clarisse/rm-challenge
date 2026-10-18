import {Card, Text} from '@mantine/core';
import type {Facility} from '../types';
import {getRegionLabel} from '../utils';

type FacilityCardProps = {
    facility: Facility;
};

const FacilityCard = ({facility}: FacilityCardProps) => (
    <Card withBorder padding="sm">
        <Text fw={500}>{facility.name}</Text>
        <Text size="sm" c="dimmed">{getRegionLabel(facility.network_region)}</Text>
    </Card>
);

export default FacilityCard;
