import * as React from "react";
import { TextInput, Edit, SimpleForm, required }
    from 'react-admin';
import './resourceCategoryStyles.scss';

const EditTitle = ({record}) => {
    return <span>Editar categoría de recurso: {record ? `${record.name}` : ''}</span>;
};

export const ResourceCategoryEdit = props => (
    <Edit {...props} title={<EditTitle/>}>
        <SimpleForm className={'resourceCategoryGridLayoutCreateEdit'} redirect="list">
            <NumberInput source="order" label="Orden" validate={[required()]}/>
            <TextInput source="name" label="Categoría" validate={[required()]}/>
        </SimpleForm>
    </Edit>
);

export default ResourceCategoryEdit;
