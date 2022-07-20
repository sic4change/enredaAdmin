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
            <ImageInput source="resourcePhoto" label="Foto" accept="image/*" placeholder={<p>Deje su archivo aquí</p>} validate={[required()]}>
                <ImageField source="src" title="title"/>
            </ImageInput>
            <FormDataConsumer>
                {({ formData, ...rest }) => formData.resourcePhoto &&
                    <TextInput source="resourcePhoto.title" label="Nombre" validate={[required()]} {...rest} />
                }
            </FormDataConsumer>
            <TextInput source="role" label="Creado por" initialValue={props.user.role} disabled />
        </SimpleForm>
    </Create>
);

function mapStateToProps(state, props) {
    return { formInput: state.formInput, user: state.user }
}

const ResourcePicturesCreate = connect(mapStateToProps)(ResourcePicturesCreateView);
export default ResourcePicturesCreate;