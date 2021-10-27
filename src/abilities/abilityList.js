import * as React from "react";
import {
    List,
    Datagrid,
    TextField,
    EditButton,
    DeleteButton,
    TextInput,
    Filter,
}
    from 'react-admin';
import './abilitiesStyles.scss';

const AbilitiesFilter = ({permissions, ...props}) => (
    <Filter {...props}>
        <TextInput source="name" label="Buscar por nombre" alwaysOn/>
    </Filter>
);

const AbilitiesTitle = () => {
    return <span>Lista de habilidades</span>;
};

export const AbilityList = ({permissions, ...props}) => {
        return (<List {...props} filters={<AbilitiesFilter/>} title={<AbilitiesTitle/>} sort={{ field: 'name', order: 'ASC' }}>
            <Datagrid className="abilities">
                <TextField source="name" label="Nombre"/>
                {permissions && permissions['super-admin'] && <EditButton/>}
                {permissions && permissions['super-admin'] && <DeleteButton/>}
            </Datagrid>
        </List>)
    }
;

export default AbilityList;
