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
    SelectInput, ReferenceManyField,
}
    from 'react-admin';
import './provinceStyles.scss';
import TotalForReferenceFields from "../components/totalForReferenceFields";

const ProvincesFilter = ({permissions, ...props}) => (
    <Filter {...props}>
        <TextInput source="name" label="Buscar por nombre" alwaysOn/>
        <ReferenceInput source="countryId" reference="countries" filter={{active: true}} label="País" alwaysOn>
            <SelectInput optionText="name"/>
        </ReferenceInput>
    </Filter>
);

const ProvincesTitle = () => {
    return <span>Lista de provincias</span>;
};

export const ProvinceList = ({permissions, ...props}) => {
        return (<List {...props} filters={<ProvincesFilter/>} title={<ProvincesTitle/>} filter={{active: true}} sort={{ field: 'name', order: 'ASC' }}>
            <Datagrid className="provinces">
                <TextField source="name" label="Nombre"/>
                <ReferenceField link="show" source="countryId" reference="countries" label="País">
                    <TextField source="name"/>
                </ReferenceField>
                <ReferenceManyField label="Nº municipios" reference="cities" target="provinceId">
                    <TotalForReferenceFields/>
                </ReferenceManyField>
                {permissions && permissions['super-admin'] && <EditButton/>}
                {permissions && permissions['super-admin'] && <DeleteButton/>}
            </Datagrid>
        </List>)
    }
;

export default ProvinceList;
