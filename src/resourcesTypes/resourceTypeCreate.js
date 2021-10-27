import * as React from "react";
import {
    TextInput,
    SimpleForm,
    Create,
    required
} from 'react-admin';
import './resourceTypeStyles.scss';

const CreateTitle = () => {
    return <span>Crear tipo de recurso</span>;
};

export const ResourceTypeCreate = props => (
    <Create {...props} title={<CreateTitle/>}>
        <SimpleForm className={'resourceTypeGridLayoutCreateEdit'} redirect="list">
            <TextInput source="name" label="Nombre" validate={[required()]}/>
            <TextInput multiline source="description" label="Descripción"/>
        </SimpleForm>
    </Create>
);

export default ResourceTypeCreate;
