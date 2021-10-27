import * as React from "react";
import {
    List,
    Datagrid,
    TextField,
    EditButton,
    DeleteButton,
    TextInput,
    Filter,
    ReferenceManyField,
}
    from 'react-admin';
import TotalForReferenceFields from '../components/totalForReferenceFields';
import './countryStyles.scss';

const CountriesFilter = ({permissions, ...props}) => (
    <Filter {...props}>
        <TextInput source="name" label="Buscar por nombre" alwaysOn/>
    </Filter>
);

const CountriesTitle = () => {
    return <span>Lista de países</span>;
};

export const CountryList = ({permissions, ...props}) => {
        return (<List {...props} filters={<CountriesFilter/>} title={<CountriesTitle/>} filter={{active: true}} sort={{ field: 'name', order: 'ASC' }}>
            <Datagrid className="countries">
                <TextField source="name" label="Nombre"/>
                <ReferenceManyField label="Nº provincias" reference="provinces" target="countryId">
                    <TotalForReferenceFields/>
                </ReferenceManyField>
                <ReferenceManyField label="Nº municipios" reference="cities" target="countryId">
                    <TotalForReferenceFields/>
                </ReferenceManyField>
                {permissions && permissions['super-admin'] && <EditButton/>}
                {permissions && permissions['super-admin'] && <DeleteButton/>}
            </Datagrid>
        </List>)
    }
;

export default CountryList;
