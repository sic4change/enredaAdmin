import * as React from "react";
import {
    TextInput,
    SimpleForm,
    Create,
    ReferenceInput,
    SelectInput,
    required
} from 'react-admin';
import './provinceStyles.scss';

const CreateTitle = () => {
    return <span>Crear provincia</span>;
};

export const ProvinceCreate = props => (
    <Create {...props} title={<CreateTitle/>}>
        <SimpleForm className={'provinceGridLayoutCreateEdit'} redirect="list">
            <TextInput source="name" label="Nombre" validate={[required()]}/>
            <ReferenceInput source="countryId" label="País" reference="countries" filter={{active: true}} validate={[required()]}>
                <SelectInput optionText="name"/>
            </ReferenceInput>
        </SimpleForm>
    </Create>
);

export default ProvinceCreate;

