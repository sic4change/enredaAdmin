import * as React from "react";
import {
    TextInput,
    SimpleForm,
    Create,
    required,
    NumberInput
} from 'react-admin';
import './resourceCategoryStyles.scss';

const CreateTitle = () => {
    return <span>Crear categoría de recurso</span>;
};

export const ResourceCategoryCreate = props => (
    <Create {...props} title={<CreateTitle/>}>
        <SimpleForm className={'resourceCategoryGridLayoutCreateEdit'} redirect="list">
            <NumberInput source="order" label="Orden" validate={[required()]}/>
            <TextInput source="name" label="Categoría" validate={[required()]}/>
        </SimpleForm>
    </Create>
);

export default ResourceCategoryCreate;
