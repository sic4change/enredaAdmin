import * as React from "react";
import { TextInput, Edit, SimpleForm, ReferenceInput, SelectInput, required }
    from 'react-admin';
import './provinceStyles.scss';

const EditTitle = ({record}) => {
    return <span>Editar provincia: {record ? `${record.name}` : ''}</span>;
};

export const ProvinceEdit = props => (
    <Edit {...props} title={<EditTitle/>}>
        <SimpleForm className={'provinceGridLayoutCreateEdit'}  redirect="list">
            <TextInput source="name" label="Nombre" validate={[required()]}/>
            <ReferenceInput source="countryId" label="País" reference="countries" filter={{active: true}} validate={[required()]}>
                <SelectInput optionText="name"/>
            </ReferenceInput>
        </SimpleForm>
    </Edit>
);

export default ProvinceEdit;
