import * as React from "react";
import { TextInput, Edit, SimpleForm, required }
    from 'react-admin';
import './resourceTypeStyles.scss';

const EditTitle = ({record}) => {
    return <span>Editar tipo de recurso: {record ? `${record.name}` : ''}</span>;
};

export const ResourceTypeEdit = props => (
    <Edit {...props} title={<EditTitle/>}>
        <SimpleForm className={'resourceTypeGridLayoutCreateEdit'} redirect="list">
            <TextInput source="name" label="Nombre" validate={[required()]}/>
            <TextInput multiline source="description" label="Descripción"/>
        </SimpleForm>
    </Edit>
);

export default ResourceTypeEdit;
