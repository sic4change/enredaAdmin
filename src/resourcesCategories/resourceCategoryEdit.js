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
            <TextInput source="name" label="Categoría" validate={[required()]}/>
            <TextInput multiline source="description" label="Descripción"/>
        </SimpleForm>
    </Edit>
);

export default ResourceCategoryEdit;
