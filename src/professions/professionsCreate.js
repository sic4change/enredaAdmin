import * as React from "react";
import {
    TextInput,
    SimpleForm,
    Create,
    required,
    SelectArrayInput,
    ReferenceInput
} from 'react-admin';
import { connect } from 'react-redux';

const CreateTitle = () => {
    return <span>Crear Profesión</span>;
};

const maxPerPage = 999999999999999999999999999999999;

export const ProfessionsCreateView = ({ permissions, ...props }) => (
    <Create {...props} title={<CreateTitle/>}>
        <SimpleForm redirect="list">
            <TextInput source="name" label="Profesión" validate={[required()]} />
            <ReferenceInput source="activities" label="Actividades" reference="activities" sort={{ field: 'name', order: 'ASC' }} perPage={maxPerPage}>
                <SelectArrayInput optionText="name" validate={[required()]} />
            </ReferenceInput>
        </SimpleForm>
    </Create>
);

function mapStateToProps(state, props) {
    return { formInput: state.formInput, user: state.user }
}

const ProfessionsCreate = connect(mapStateToProps)(ProfessionsCreateView);
export default ProfessionsCreate;