import * as React from "react";
import { TextInput, Edit, SimpleForm, required }
    from 'react-admin';
import './interestStyles.scss';

const EditTitle = ({record}) => {
    return <span>Editar interés laboral: {record ? `${record.name}` : ''}</span>;
};

export const InterestEdit = props => (
    <Edit {...props} title={<EditTitle/>}>
        <SimpleForm className={'interestGridLayoutCreateEdit'} redirect="list">
            <TextInput source="name" label="Nombre" validate={[required()]}/>
        </SimpleForm>
    </Edit>
);

export default InterestEdit;
