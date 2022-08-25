import * as React from "react";
import {
    TextInput,
    SimpleForm,
    Create,
    ReferenceInput,
    required,
    SelectInput,
    ArrayInput,
    SimpleFormIterator,

} from 'react-admin';
import { connect } from 'react-redux';

const CreateTitle = () => {
    return <span>Crear Actividad</span>;
};
const choices = [
    {label: "1", value: 1},
    {label: "2", value: 2},
    {label: "3", value: 3},
    {label: "4", value: 4},
    {label: "5", value: 5},
];

const maxPerPage = 999999999999999999999999999999999;

export const ActivitiesCreateView = ({ permissions, ...props }) => (
    <Create {...props} title={<CreateTitle/>}>
        <SimpleForm redirect="list">
            <TextInput source="name" label="Actividad" validate={[required()]} />
            <ArrayInput source="competencies">
                <SimpleFormIterator>
                    <ReferenceInput source="competencyId" label="Competencias" reference="competencies" sort={{ field: 'name', order: 'ASC' }} validate={[required()]} perPage={maxPerPage}>
                        <SelectInput optionText="name" />
                    </ReferenceInput>
                    <SelectInput source="points" label="Puntos" choices={choices} optionText="label" optionValue="value" validate={[required()]} />  
                </SimpleFormIterator>
            </ArrayInput>
        </SimpleForm>
    </Create>
);

function mapStateToProps(state, props) {
    return { formInput: state.formInput, user: state.user }
}

const ActivitiesCreate = connect(mapStateToProps)(ActivitiesCreateView);
export default ActivitiesCreate;