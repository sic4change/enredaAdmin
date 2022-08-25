import * as React from "react";
import { 
    TextInput, 
    Edit, 
    required,
    SimpleForm,
    SimpleFormIterator,
    ArrayInput,
    ReferenceInput,
    SelectInput,
}
    from 'react-admin';
import { connect } from 'react-redux';

const EditTitle = ({record}) => {
    return <span>Editar Actividad: {record ? `${record.name}` : ''}</span>;
};

const choices = [
    {label: "1", value: 1},
    {label: "2", value: 2},
    {label: "3", value: 3},
    {label: "4", value: 4},
    {label: "5", value: 5},
];

const maxPerPage = 999999999999999999999999999999999;

export const ActivitiesEditView = ({ permissions, ...props }) => (
    <Edit {...props} title={<EditTitle/>}>
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
    </Edit>
);

function mapStateToProps(state, props) {
    return { formInput: state.formInput, user: state.user }
}

const ActivitiesEdit = connect(mapStateToProps)(ActivitiesEditView);
export default ActivitiesEdit;