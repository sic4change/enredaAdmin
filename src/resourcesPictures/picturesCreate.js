import * as React from "react";
import {
    TextInput,
    SimpleForm,
    Create,
    required,
    ReferenceInput,
    ImageInput,
    ImageField,
    SelectInput,
    FormDataConsumer

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
            <ReferenceInput source="role" label="Rol" reference="users" filter={{ userId: props.user.userId }} sort={{ field: 'role', order: 'ASC' }} validate={[required()]}>
                <SelectInput optionValue="role" optionText="role" />
            </ReferenceInput>
            }
           {permissions && (!permissions['super-admin'] && props.user.role === 'Organización') &&
            <ReferenceInput source="role" label="Rol" reference="users" filter={{ organization: props.user.organization }}  validate={[required()]}>
                <SelectInput optionValue="role" optionText="role" />
            </ReferenceInput>
            }
            <ReferenceInput source="resourceTypeId" reference="resourcesTypes" label="Tipo de recurso" validate={[required()]}>
                <SelectInput source="name" label="Tipo de recurso"/>
            </ReferenceInput>
            <ImageInput source="resourcePhoto" label="Foto" accept="image/*" placeholder={<p>Deje su archivo aquí</p>} validate={[required()]}>
                <ImageField source="src" title="title"/>
            </ImageInput>
            <FormDataConsumer>
                {({ formData, ...rest }) => formData.resourcePhoto &&
                    <TextInput source="resourcePhoto.title" label="Nombre" validate={[required()]} {...rest} />
                }
            </FormDataConsumer>
        </SimpleForm>
    </Create>
);

function mapStateToProps(state, props) {
    return { formInput: state.formInput, user: state.user }
}

const ResourcePicturesCreate = connect(mapStateToProps)(ResourcePicturesCreateView);
export default ResourcePicturesCreate;