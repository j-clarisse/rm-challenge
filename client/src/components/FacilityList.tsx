import {Stack, Text} from '@mantine/core';
import type {Facility} from '../types';
import FacilityCard from './FacilityCard';

type FacilityListProps = {
    facilities: Facility[];
};

const FacilityList = ({facilities}: FacilityListProps) => (
    <Stack gap="sm">
        <Text fw={500}>{facilities.length} facilities</Text>
        {facilities.map((facility) => (
            <FacilityCard key={facility.code} facility={facility}/>
        ))}
    </Stack>
);

export default FacilityList;
