import {Badge, Card, Group, Stack, Table, Text} from '@mantine/core';
import type {Facility} from '../types';
import {
    formatDate,
    FUELTECH_OPTIONS,
    getLabel,
    NETWORK_REGION_OPTIONS,
    STATUS_COLOURS,
    STATUS_OPTIONS,
    summariseUnits
} from '../utils';

type FacilityCardProps = {
    facility: Facility;
};

const FacilityCard = ({facility}: FacilityCardProps) => {
    const {statusIds, fueltechIds, earliestCommencement} = summariseUnits(facility.units);

    return (
        <Card withBorder padding="sm">
            <Stack gap="xs">
                <Group justify="space-between" wrap="nowrap">
                    <Text fw={600}>{facility.name}</Text>
                    <Badge variant="light">{getLabel(NETWORK_REGION_OPTIONS, facility.network_region)}</Badge>
                </Group>
                <Group gap={4}>
                    {statusIds.map((statusId) => (
                        <Badge key={statusId} variant="light" color={STATUS_COLOURS[statusId]}>
                            {getLabel(STATUS_OPTIONS, statusId)}
                        </Badge>
                    ))}
                    {fueltechIds.map((fueltechId) => (
                        <Badge key={fueltechId} variant="outline" color="gray">
                            {getLabel(FUELTECH_OPTIONS, fueltechId)}
                        </Badge>
                    ))}
                </Group>
                {earliestCommencement && (
                    <Text size="sm" c="dimmed">Since {formatDate(earliestCommencement)}</Text>
                )}
                <Table.ScrollContainer minWidth={360}>
                    <Table fz="xs" striped verticalSpacing={4}>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Unit</Table.Th>
                                <Table.Th>Technology</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th>Commenced</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {facility.units.map((unit) => (
                                <Table.Tr key={unit.code}>
                                    <Table.Td>{unit.code}</Table.Td>
                                    <Table.Td>{getLabel(FUELTECH_OPTIONS, unit.fueltech_id)}</Table.Td>
                                    <Table.Td>{getLabel(STATUS_OPTIONS, unit.status_id)}</Table.Td>
                                    <Table.Td>{formatDate(unit.commencement_date)}</Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Table.ScrollContainer>
            </Stack>
        </Card>
    );
};

export default FacilityCard;
