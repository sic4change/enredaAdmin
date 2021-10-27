import * as React from "react";
import {
    TextInput,
    SimpleForm,
    Create,
    required
} from 'react-admin';
import './countryStyles.scss';

const CreateTitle = () => {
    return <span>Crear país</span>;
};

export const CountryCreate = props => (
    <Create {...props} title={<CreateTitle/>}>
        <SimpleForm className={'countryGridLayoutCreateEdit'} redirect="list">
            <TextInput source="name" label="Nombre" validate={[required()]}/>
        </SimpleForm>
    </Create>
);

export default CountryCreate;

//<Query type='getList' resource='campaigns' payload={{
//         pagination: { page: 1, perPage: 10000000 },
//         sort: { field: 'name', order: 'ASC' },
//         filter: { organization: user.organization }}}>
