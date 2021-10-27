import * as React from "react";
import {
    TextInput,
    SimpleForm,
    Create,
    ReferenceInput,
    SelectInput,
    FormDataConsumer,
    required
} from 'react-admin';
import './cityStyles.scss';

const CreateTitle = () => {
    return <span>Crear municipio</span>;
};

export const CityCreate = props => (
    <Create {...props} title={<CreateTitle/>}>
        <SimpleForm className={'cityGridLayoutCreateEdit'} redirect="list">
            <TextInput source="name" label="Nombre" validate={[required()]}/>
            <ReferenceInput source="countryId" label="País" reference="countries" filter={{active: true}} validate={[required()]}>
                <SelectInput optionText="name"/>
            </ReferenceInput>
            {/* <ReferenceInput source="provinceId" label="Provincia" reference="provinces" filter={{active: true}} validate={[required()]}>
                <SelectInput optionText="name"/>
            </ReferenceInput> */}
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
    </Create>
);

export default CityCreate;

