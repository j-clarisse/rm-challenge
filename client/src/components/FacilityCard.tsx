import {useState} from 'react';
import {AccordionChevron, Badge, Card, Divider, Group, Stack, Table, Text} from '@mantine/core';
import type {Facility} from '../types';
import {
    formatCapacity,
    formatDate,
    getLabel,
    summariseUnits
} from '../utils';

type FacilityCardProps = {
    facility: Facility;
    showUnits: boolean;
};

const STATUS_COLOUR_MAP: Record<string, string> = {
    operating: "green",
    commissioning: "yellow",
    committed: "blue",
    retired: "gray"
};

const FacilityCard = ({facility, showUnits}: FacilityCardProps) => {
    const [expanded, setExpanded] = useState(showUnits);
    const {statusIds, fueltechIds, earliestCommencement, totalCapacity} = summariseUnits(facility.units);
    const unitCount = facility.units.length;

    const toggleExpanded = () => setExpanded((prev) => !prev);

    return (
        // Whole card toggles the units section
        <Card
            withBorder
            padding="sm"
            role="button"
            tabIndex={0}
            aria-expanded={expanded}
            onClick={toggleExpanded}
            style={{cursor: "pointer"}}
        >
            <Card.Section inheritPadding py="sm">
                <Stack gap="xs">
                    <Group justify="space-between" wrap="nowrap" align="flex-start">
                        <Group gap="xs" wrap="nowrap">
                            <Text fw={600}>{facility.name}</Text>
                            <Badge variant="light">{getLabel(facility.network_region)}</Badge>
                            {earliestCommencement && (
                                <Text size="sm" c="dimmed">Since {formatDate(earliestCommencement)}</Text>
                            )}
                        </Group>
                        <Group gap={4} justify="flex-end">
                            {statusIds.map((statusId) => (
                                <Badge key={statusId} variant="light" color={STATUS_COLOUR_MAP[statusId]}>
                                    {getLabel(statusId)}
                                </Badge>
                            ))}
                        </Group>
                    </Group>
                    <Group gap={4}>
                        {fueltechIds.map((fueltechId) => (
                            <Badge key={fueltechId} variant="outline" color="gray">
                                {getLabel(fueltechId)}
                            </Badge>
                        ))}
                    </Group>
                </Stack>
            </Card.Section>
            <Card.Section withBorder inheritPadding py="xs">
                <Group justify="space-between">
                    <Group gap="xs">
                        <Text size="sm" c="dimmed">{unitCount} unit{unitCount === 1 ? "" : "s"}</Text>
                        <Divider orientation="vertical"/>
                        <Text size="sm" c="dimmed">Capacity (registered): {formatCapacity(totalCapacity)}</Text>
                    </Group>
                    <AccordionChevron style={{transform: expanded ? "rotate(180deg)" : undefined}}/>
                </Group>
            </Card.Section>
            {expanded && (
                <Card.Section
                    withBorder
                    inheritPadding
                    py="xs"
                    onClick={(e) => e.stopPropagation()}
                    style={{cursor: "auto"}}
                >
                    <Table.ScrollContainer minWidth={740}>
                        <Table fz="xs" verticalSpacing={4}>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Unit</Table.Th>
                                    <Table.Th>Technology</Table.Th>
                                    <Table.Th>Status</Table.Th>
                                    <Table.Th>Commenced</Table.Th>
                                    <Table.Th>Expected operation</Table.Th>
                                    <Table.Th>Capacity (Registered)</Table.Th>
                                    <Table.Th>Closure</Table.Th>
                                    <Table.Th>Expected closure</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {facility.units.map((unit) => (
                                    <Table.Tr key={unit.code}>
                                        <Table.Td>{unit.code}</Table.Td>
                                        <Table.Td>{getLabel(unit.fueltech_id)}</Table.Td>
                                        <Table.Td>{getLabel(unit.status_id)}</Table.Td>
                                        <Table.Td>{formatDate(unit.commencement_date)}</Table.Td>
                                        <Table.Td>{formatDate(unit.expected_operation_date)}</Table.Td>
                                        <Table.Td>{formatCapacity(unit.capacity_registered)}</Table.Td>
                                        <Table.Td>{formatDate(unit.closure_date)}</Table.Td>
                                        <Table.Td>{formatDate(unit.expected_closure_date)}</Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </Table.ScrollContainer>
                </Card.Section>
            )}
        </Card>
    );
};

export default FacilityCard;
