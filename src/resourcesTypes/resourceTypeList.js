import * as React from "react";
import {
    List,
    Datagrid,
    TextField,
    EditButton,
    DeleteButton,
    TextInput,
    Filter,
    RichTextField
}
    from 'react-admin';
import './resourceTypeStyles.scss';

const ResourceTypeFilter = ({permissions, ...props}) => (
    <Filter {...props}>
        <TextInput source="name" label="Buscar por nombre" alwaysOn/>
    </Filter>
);

const ResourceTypeTitle = () => {
    return <span>Lista de tipos de recursos</span>;
};

export const ResourceTypeList = ({permissions, ...props}) => {
        return (<List {...props} filters={<ResourceTypeFilter/>} title={<ResourceTypeTitle/>} sort={{ field: 'name', order: 'ASC' }}>
            <Datagrid className="resourcesTypes">
                <TextField source="name" label="Nombre"/>
                <RichTextField source="description" label="Descripción" />
                {permissions && permissions['super-admin'] && <EditButton/>}
                {permissions && permissions['super-admin'] && <DeleteButton/>}
            </Datagrid>
        </List>)
    }
;

export default ResourceTypeList;
