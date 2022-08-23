import * as React from "react";
import { 
    TextInput, 
    Edit, 
    required,
    SimpleForm,
    ReferenceArrayInput, 
    SelectArrayInput,
    ChipField
}
    from 'react-admin';
import { connect } from 'react-redux';

const EditTitle = ({record}) => {
    return <span>Editar Profesión: {record ? `${record.name}` : ''}</span>;
};

export const ProfessionsEditView = ({ permissions, ...props }) => (
    <Edit {...props} title={<EditTitle/>}>
        <SimpleForm redirect="list">
            <TextInput source="name" label="Profesión" validate={[required()]} />
            <ReferenceArrayInput reference="activities" source="activities" label="Actividades" sort={{ field: 'name', order: 'ASC' }}>
                <SelectArrayInput>
                    <ChipField source="name" validate={[required()]} />
                </SelectArrayInput>
            </ReferenceArrayInput>
        </SimpleForm>    
    </Edit>
);

function mapStateToProps(state, props) {
    return { formInput: state.formInput, user: state.user }
}

const ProfessionsEdit = connect(mapStateToProps)(ProfessionsEditView);
export default ProfessionsEdit;