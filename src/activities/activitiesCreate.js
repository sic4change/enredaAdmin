import * as React from "react";
import {
    TextInput,
    SimpleForm,
    Create,
} from 'react-admin';
import { connect } from 'react-redux';

const CreateTitle = () => {
    return <span>Crear Actividad</span>;
};

export const ActivitiesCreateView = ({ permissions, ...props }) => (
    <Create {...props} title={<CreateTitle/>}>
        <SimpleForm redirect="list">
            <TextInput source="name" label="Actividad" />
        </SimpleForm>
    </Create>
);

function mapStateToProps(state, props) {
    return { formInput: state.formInput, user: state.user }
}

const ActivitiesCreate = connect(mapStateToProps)(ActivitiesCreateView);
export default ActivitiesCreate;