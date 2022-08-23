import * as React from "react";
import {
    TextInput,
    SimpleForm,
    Create,
    required
} from 'react-admin';
import { connect } from 'react-redux';

const CreateTitle = () => {
    return <span>Crear Competencia</span>;
};

export const CompetenciesCreateView = ({ permissions, ...props }) => (
    <Create {...props} title={<CreateTitle/>}>
        <SimpleForm redirect="list">
            <TextInput source="name" label="Competencia" validate={[required()]}/>
        </SimpleForm>
    </Create>
);

function mapStateToProps(state, props) {
    return { formInput: state.formInput, user: state.user }
}

const CompetenciesCreate = connect(mapStateToProps)(CompetenciesCreateView);
export default CompetenciesCreate;