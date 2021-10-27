import * as React from "react";
import { TextInput, Edit, SimpleForm, ReferenceInput, SelectInput, required }
    from 'react-admin';
import './specificInterestStyles.scss';

const EditTitle = ({record}) => {
    return <span>Editar interés laboral específico: {record ? `${record.name}` : ''}</span>;
};

export const SpecificInterestEdit = props => (
    <Edit {...props} title={<EditTitle/>}>
        <SimpleForm className={'specificInterestGridLayoutCreateEdit'} redirect="list">
            <TextInput source="name" label="Nombre" validate={[required()]}/>
            <ReferenceInput source="interestId" label="Interés laboral" reference="interests" validate={[required()]}>
                <SelectInput optionText="name"/>
            </ReferenceInput>
        </SimpleForm>
    </Edit>
);

export default SpecificInterestEdit;
