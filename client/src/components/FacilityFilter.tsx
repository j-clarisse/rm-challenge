import {MultiSelect, type ComboboxData} from '@mantine/core';

type FacilityFilterProps = {
    label: string;
    placeholder: string;
    data: ComboboxData;
    value: string[];
    onChange: (value: string[]) => void;
};

const FacilityFilter = ({label, placeholder, data, value, onChange}: FacilityFilterProps) => (
    <MultiSelect
        label={label}
        placeholder={value.length === 0 ? placeholder : undefined} // Mantine shows the placeholder even with selections
        data={data}
        value={value}
        onChange={onChange}
        clearable
        clearSectionMode="both"
        withAlignedLabels
        hidePickedOptions
        styles={{pillsList: {maxHeight: 96, overflowY: "auto"}}} // ~3 rows of pills, then scroll
    />
);

export default FacilityFilter;
