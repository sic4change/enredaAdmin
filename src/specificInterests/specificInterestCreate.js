import * as React from "react";
import {
    TextInput,
    SimpleForm,
    Create,
    ReferenceInput,
    SelectInput,
    required
} from 'react-admin';
import './specificInterestStyles.scss';

const CreateTitle = () => {
    return <span>Crear interés laboral específico</span>;
};

export const SpecificInterestCreate = props => (
    <Create {...props} title={<CreateTitle/>}>
        <SimpleForm className={'specificInterestGridLayoutCreateEdit'} redirect="list">
            <TextInput source="name" label="Nombre" validate={[required()]}/>
            <ReferenceInput source="interestId" label="Interés laboral" reference="interests" validate={[required()]}>
                <SelectInput optionText="name"/>
            </ReferenceInput>
        </SimpleForm>
    </Create>
);

export default SpecificInterestCreate;

