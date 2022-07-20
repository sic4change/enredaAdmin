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
    FormDataConsumer
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
            <ImageInput source="resourcePhoto" label="Foto" accept="image/*" placeholder={<p>Deje su archivo aquí</p>} validate={[required()]}>
                <ImageField source="src" title="title"/>
            </ImageInput>
            <FormDataConsumer>
                {({ formData, ...rest }) => formData.resourcePhoto &&
                    <TextInput source="resourcePhoto.title" label="Nombre" validate={[required()]} {...rest} />
                }
            </FormDataConsumer>
        </SimpleForm>
    </Edit>
);

function mapStateToProps(state, props) {
    return { formInput: state.formInput, user: state.user }
}

const ResourcePicturesEdit = connect(mapStateToProps)(ResourcePicturesEditView);
export default ResourcePicturesEdit;