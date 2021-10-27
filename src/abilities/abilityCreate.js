import * as React from "react";
import {
    TextInput,
    SimpleForm,
    Create,
    required
} from 'react-admin';
import './abilitiesStyles.scss';

const CreateTitle = () => {
    return <span>Crear habilidad</span>;
};

export const AbilityCreate = props => (
    <Create {...props} title={<CreateTitle/>}>
        <SimpleForm className={'abilitiesGridLayoutCreateEdit'} redirect="list">
            <TextInput source="name" label="Nombre" validate={[required()]}/>
        </SimpleForm>
    </Create>
);

export default AbilityCreate;
