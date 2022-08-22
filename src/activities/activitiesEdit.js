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
    return <span>Editar Actividad: {record ? `${record.name}` : ''}</span>;
};

export const ActivitiesEditView = ({ permissions, ...props }) => (
    <Edit {...props} title={<EditTitle/>}>
        <SimpleForm redirect="list">
            <TextInput source="name" label="Actividad" validate={[required()]} />
        </SimpleForm>    
    </Edit>
);

function mapStateToProps(state, props) {
    return { formInput: state.formInput, user: state.user }
}

const ActivitiesEdit = connect(mapStateToProps)(ActivitiesEditView);
export default ActivitiesEdit;