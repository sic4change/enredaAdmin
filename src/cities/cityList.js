import * as React from "react";
import {
    List,
    Datagrid,
    TextField,
    EditButton,
    DeleteButton,
    TextInput,
    ReferenceField,
    Filter,
    ReferenceInput,
    SelectInput,
}
    from 'react-admin';
import './cityStyles.scss';

const CitiesFilter = ({permissions, ...props}) => (
    <Filter {...props}>
        <TextInput source="name" label="Buscar por nombre" alwaysOn/>
        <ReferenceInput source="provinceId" reference="provinces" label="Provincia" alwaysOn>
            <SelectInput optionText="name"/>
        </ReferenceInput>
        <ReferenceInput source="countryId" reference="countries" label="País" alwaysOn>
            <SelectInput optionText="name"/>
        </ReferenceInput>
    </Filter>
);

const CitiesTitle = () => {
    return <span>Lista de municipios</span>;
};

export const CityList = ({permissions, ...props}) => {
        return (<List {...props} filters={<CitiesFilter/>} title={<CitiesTitle/>} filter={{active: true}} sort={{ field: 'name', order: 'ASC' }}>
            <Datagrid className="cities">
                <TextField source="name" label="Nombre"/>
                <ReferenceField link="show" source="countryId" reference="countries" filter={{active: true}} label="País">
                    <TextField source="name"/>
                </ReferenceField>
                <ReferenceField link="show" source="provinceId" reference="provinces" filter={{active: true}} label="Provincia">
                    <TextField source="name"/>
                </ReferenceField>
                {permissions && permissions['super-admin'] && <EditButton/>}
                {permissions && permissions['super-admin'] && <DeleteButton/>}
            </Datagrid>
        </List>)
    }
;

export default CityList;
