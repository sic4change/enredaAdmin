import * as React from "react";
import {
    TextInput,
    SimpleForm,
    Create,
    required
} from 'react-admin';
import './interestStyles.scss';

const CreateTitle = () => {
    return <span>Crear interés laboral</span>;
};

export const InterestCreate = props => (
    <Create {...props} title={<CreateTitle/>}>
        <SimpleForm className={'interestGridLayoutCreateEdit'} redirect="list">
            <TextInput source="name" label="Nombre" validate={[required()]}/>
        </SimpleForm>
    </Create>
);

export default InterestCreate;
