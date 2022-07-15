import * as React from "react";
import { 
    TextInput, 
    Edit, 
    SimpleForm, 
    required, 
    ReferenceInput,
    SelectInput,
    ImageInput,
    ImageField,
}
    from 'react-admin';
import './resourcePictureStyles.scss';
import { connect } from 'react-redux';

const EditTitle = ({record}) => {
    return <span>Editar foto de recurso: {record ? `${record.name}` : ''}</span>;
};

export const ResourcePicturesEditView = ({ permissions, ...props }) => (
    <Edit {...props} title={<EditTitle/>}>
        <SimpleForm className={'resourceTypeGridLayoutCreateEdit'} redirect="list">
            {permissions && (permissions['super-admin']) &&
                <ReferenceInput source="organizer" label="Organizador" reference="organizations" sort={{ field: 'name', order: 'ASC' }}
                    validate={[required()]}>
                    <SelectInput optionText="name" />
                </ReferenceInput>
            }
            {permissions && (!permissions['super-admin'] && props.user.role === 'Organización') &&
                <ReferenceInput source="organizer" label="Organizador" reference="organizations" filter={{ organizationId: props.user.organization }} sort={{ field: 'name', order: 'ASC' }}
                    validate={[required()]}>
                    <SelectInput optionText="name" />
                </ReferenceInput>
            }
            <TextInput source="name" label="Nombre" validate={[required()]}/>
            <ReferenceInput source="resourceTypeId" reference="resourcesTypes" label="Tipo de recurso" validate={[required()]}>
                <SelectInput source="name" label="Tipo de recurso"/>
            </ReferenceInput>
            <ImageInput source="resourcePhoto" label="Foto" accept="image/*" placeholder={<p>Deje su archivo aquí</p>} validate={[required()]}>
                <ImageField source="src" title="title"/>
            </ImageInput>
        </SimpleForm>
    </Edit>
);

function mapStateToProps(state, props) {
    return { formInput: state.formInput, user: state.user }
}

const ResourcePicturesEdit = connect(mapStateToProps)(ResourcePicturesEditView);
export default ResourcePicturesEdit;