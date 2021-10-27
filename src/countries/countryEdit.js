import * as React from "react";
import { TextInput, Edit, SimpleForm, required }
    from 'react-admin';
import './countryStyles.scss';

const EditTitle = ({record}) => {
    return <span>Editar país: {record ? `${record.name}` : ''}</span>;
};

export const CountryEdit = props => (
    <Edit {...props} title={<EditTitle/>}>
        <SimpleForm className={'countryGridLayoutCreateEdit'} redirect="list">
            <TextInput source="name" label="Nombre" validate={[required()]}/>
        </SimpleForm>
    </Edit>
);

export default CountryEdit;
