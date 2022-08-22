import * as React from "react";
import {
    TextInput,
    SimpleForm,
    Create,
} from 'react-admin';
import { connect } from 'react-redux';

const CreateTitle = () => {
    return <span>Crear Profesión</span>;
};

export const ProfessionsCreateView = ({ permissions, ...props }) => (
    <Create {...props} title={<CreateTitle/>}>
        <SimpleForm redirect="list">
            <TextInput source="name" label="Profesión" />
        </SimpleForm>
    </Create>
);

function mapStateToProps(state, props) {
    return { formInput: state.formInput, user: state.user }
}

const ProfessionsCreate = connect(mapStateToProps)(ProfessionsCreateView);
export default ProfessionsCreate;