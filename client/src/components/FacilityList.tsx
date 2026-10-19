import {useMemo, useState} from 'react';
import {Divider, Group, Pagination, Select, Stack, Text} from '@mantine/core';
import type {Facility, SortBy} from '../types';
import {formatCapacity, SORT_OPTIONS, sumCapacity} from '../utils';
import FacilityCard from './FacilityCard';

const PAGE_SIZE = 50;

function paginate<T>(items: T[], page: number, size: number): T[] {
    return items.slice((page - 1) * size, page * size);
}

type FacilityListProps = {
    facilities: Facility[];
    expandAll: boolean;
    showTotalCapacity: boolean;
    sortBy: SortBy | null;
    onSortChange: (sortBy: SortBy | null) => void;
};

const FacilityList = ({facilities, expandAll, showTotalCapacity, sortBy, onSortChange}: FacilityListProps) => {
    const [page, setPage] = useState(1);
    const totalPages = Math.ceil(facilities.length / PAGE_SIZE);
    const totalCapacity = useMemo(
        () => (showTotalCapacity ? sumCapacity(facilities) : null),
        [facilities, showTotalCapacity]
    );

    const handlePageChange = (nextPage: number) => {
        setPage(nextPage);
        window.scrollTo({top: 0});
    };

    return (
        <Stack gap="sm">
            <Group justify="space-between">
                <Group gap="xs">
                    <Text fw={500}>{facilities.length} facilities</Text>
                    {showTotalCapacity && (
                        <>
                            <Divider orientation="vertical"/>
                            <Text fw={500}>Total capacity: {formatCapacity(totalCapacity)}</Text>
                        </>
                    )}
                </Group>
                <Group gap="sm">
                    <Select
                        data={SORT_OPTIONS}
                        value={sortBy}
                        onChange={(value) => onSortChange(value as SortBy | null)}
                        placeholder="Default"
                        leftSection={<Text size="sm" c="dimmed">Sort by:</Text>}
                        leftSectionWidth={64}
                        leftSectionPointerEvents="none"
                        clearable
                        withAlignedLabels
                        w={250}
                    />
                    <Pagination total={totalPages} value={page} onChange={handlePageChange} size="sm" hideWithOnePage/>
                </Group>
            </Group>
            {paginate(facilities, page, PAGE_SIZE).map((facility) => (
                // Key includes expandAll so toggling it remounts cards with the new default
                <FacilityCard key={`${facility.code}-${expandAll}`} facility={facility} showUnits={expandAll}/>
            ))}
        </Stack>
    );
};

export default FacilityList;
