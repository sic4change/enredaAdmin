import * as React from "react";
import { 
    TextInput, 
    Edit, 
    required,
    SimpleForm 
}
    from 'react-admin';
import { connect } from 'react-redux';

const EditTitle = ({record}) => {
    return <span>Editar Competencia: {record ? `${record.name}` : ''}</span>;
};

export const CompetenciesEditView = ({ permissions, ...props }) => (
    <Edit {...props} title={<EditTitle/>}>
        <SimpleForm redirect="list">
            <TextInput source="name" label="Competencia" validate={[required()]} />
        </SimpleForm>    
    </Edit>
);

function mapStateToProps(state, props) {
    return { formInput: state.formInput, user: state.user }
}

const CompetenciesEdit = connect(mapStateToProps)(CompetenciesEditView);
export default CompetenciesEdit;