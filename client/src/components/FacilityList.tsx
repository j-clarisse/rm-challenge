import {useState} from 'react';
import {Group, Pagination, Stack, Text} from '@mantine/core';
import type {Facility} from '../types';
import {paginate} from '../utils';
import FacilityCard from './FacilityCard';

const PAGE_SIZE = 50;

type FacilityListProps = {
    facilities: Facility[];
};

const FacilityList = ({facilities}: FacilityListProps) => {
    const [page, setPage] = useState(1);
    const totalPages = Math.ceil(facilities.length / PAGE_SIZE);

    const handlePageChange = (nextPage: number) => {
        setPage(nextPage);
        window.scrollTo({top: 0});
    };

    return (
        <Stack gap="sm">
            <Group justify="space-between">
                <Text fw={500}>{facilities.length} facilities</Text>
                <Pagination total={totalPages} value={page} onChange={handlePageChange} size="sm" hideWithOnePage/>
            </Group>
            {paginate(facilities, page, PAGE_SIZE).map((facility) => (
                <FacilityCard key={facility.code} facility={facility}/>
            ))}
        </Stack>
    );
};

export default FacilityList;
