import * as React from "react";
import {TextInput, Edit, SimpleForm, ReferenceInput, SelectInput, required, FormDataConsumer}
    from 'react-admin';
import './cityStyles.scss';

const EditTitle = ({record}) => {
    return <span>Editar municipio: {record ? `${record.name}` : ''}</span>;
};

export const CityEdit = props => (
    <Edit {...props} title={<EditTitle/>}>
        <SimpleForm className={'cityGridLayoutCreateEdit'} redirect="list">
            <TextInput source="name" label="Nombre" validate={[required()]}/>
            <ReferenceInput source="countryId" label="País" reference="countries" filter={{active: true}} validate={[required()]}>
                <SelectInput optionText="name"/>
            </ReferenceInput>
            <ReferenceInput source="provinceId"
                            label="Provincia"
                            reference="provinces"
                            validate={[required()]}
            >
                <FormDataConsumer>
                    {({formData, ...rest}) => {
                        const filteredChoices = rest.choices.filter((data) => data.countryId === formData.countryId);
                        return (<SelectInput {...rest}
                                             choices={filteredChoices}
                        />)}
                    }
                </FormDataConsumer>
            </ReferenceInput>
        </SimpleForm>
    </Edit>
);

export default CityEdit;
