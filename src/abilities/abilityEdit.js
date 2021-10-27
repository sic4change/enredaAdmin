import * as React from "react";
import { TextInput, Edit, SimpleForm, required }
    from 'react-admin';
import './abilitiesStyles.scss';

const EditTitle = ({record}) => {
    return <span>Editar habilidad: {record ? `${record.name}` : ''}</span>;
};

export const AbilityEdit = props => (
    <Edit {...props} title={<EditTitle/>}>
        <SimpleForm className={'abilitiesGridLayoutCreateEdit'} redirect="list">
            <TextInput source="name" label="Nombre" validate={[required()]}/>
        </SimpleForm>
    </Edit>
);

export default AbilityEdit;
