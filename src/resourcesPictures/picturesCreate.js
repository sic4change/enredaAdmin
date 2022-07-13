import * as React from "react";
import {
    TextInput,
    SimpleForm,
    Create,
    required,
    ReferenceInput,
    ImageInput,
    ImageField,
    SelectInput

} from 'react-admin';
import './resourcePictureStyles.scss';
import { connect } from 'react-redux';

const CreateTitle = () => {
    return <span>Crear foto de recurso</span>;
};

export const ResourcePicturesCreateView = ({ permissions, ...props }) => (
    <Create {...props} title={<CreateTitle/>}>
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
    </Create>
);

function mapStateToProps(state, props) {
    return { formInput: state.formInput, user: state.user }
}

const ResourcePicturesCreate = connect(mapStateToProps)(ResourcePicturesCreateView);
export default ResourcePicturesCreate;