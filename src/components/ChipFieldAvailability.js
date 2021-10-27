import React from 'react';
import Chip from '@material-ui/core/Chip';

const ChipFieldAvailability = ({ record = {}, source }) =>{
    if(record[source] === 'Disponible') {
        return (
            <Chip label={record[source]} style={{background: '#A4DE00'}}/>
        )
    } else if(record[source] === 'Completo') {
        return (
            <Chip label={record[source]} style={{background: 'orange'}}/>
        )
    } else if(record[source] === 'A actualizar') {
        return (
            <Chip label={record[source]} style={{background: 'yellow'}}/>
        )
    } else {
        return (
            <Chip label={record[source]} style={{background: '#dd0000', color: 'white'}}/>
        )
    }
};

export default ChipFieldAvailability;
