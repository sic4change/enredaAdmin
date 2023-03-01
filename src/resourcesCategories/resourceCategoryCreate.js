import * as React from "react";
import {
    TextInput,
    SimpleForm,
    Create,
    required
} from 'react-admin';
import './resourceCategoryStyles.scss';

const CreateTitle = () => {
    return <span>Crear categoría de recurso</span>;
};

export const ResourceCategoryCreate = props => (
    <Create {...props} title={<CreateTitle/>}>
        <SimpleForm className={'resourceCategoryGridLayoutCreateEdit'} redirect="list">
            <TextInput source="name" label="Categoría" validate={[required()]}/>
            <TextInput multiline source="description" label="Descripción"/>
        </SimpleForm>
    </Create>
);

export default ResourceCategoryCreate;
