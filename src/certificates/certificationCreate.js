import * as React from "react";
import {
    SimpleForm,
    ReferenceInput,
    Toolbar,
    SaveButton,
    AutocompleteInput,
    required,
    BooleanInput,
    Create,
    TextInput,
    ImageField,
    FileInput
} from 'react-admin';
import {connect} from 'react-redux';
import './certificateStyles.scss';

import { DateInput } from 'react-admin-date-inputs';

const maxPerPage = 999999999999999999999999999999999;

Date.prototype.addHours= function(h){
    this.setHours(this.getHours()+h);
    return this;
}

const CreateTitle = () => {
    return <span>Crear certificación</span>;
};


export const CertificateCreateView = ({permissions, ...props}) => {

    const organizerType = (permissions && !permissions['super-admin'] && props.user.role === 'Mentor') ? 'Mentor' : 'Organización';
    let creator;
    if (props.user.role == 'Organización') {
        creator = props.user.organization;
    } else if (props.user.role == 'Mentor') {
        creator =  props.user.userId;
    } else {
        creator = '';
    }

    const CreateToolbar = props => (
        <Toolbar {...props}>
            <SaveButton
            transform={data => ({ ...data, creator: creator})}
                submitOnEnter={false}
            />
        </Toolbar>
    );

    const newProps = {...props};

    return (<Create {...newProps} title={<CreateTitle/>}>
            <SimpleForm className={'certificateGridLayoutCreateEdit'} toolbar={<CreateToolbar />}>
                <TextInput source="name" label="Nombre certificación" validate={[required()]} alwaysOn resettable/>
                <ReferenceInput source="resource" reference="resources" label="Recurso" filterToQuery={searchText => ({ title: searchText })} sort={{ field: 'title', order: 'ASC' }} alwaysOn resettable validate={[required()]}>
                    <AutocompleteInput optionText="title" resettable/>
                </ReferenceInput>
                <ReferenceInput source="user" reference="users" label="Nombre" filterToQuery={searchText => ({ firstName: searchText })} sort={{ field: 'firstName', order: 'ASC' }} alwaysOn resettable validate={[required()]} >
                    <AutocompleteInput optionText="firstName" resettable/>
                </ReferenceInput>
                <ReferenceInput source="user" reference="users" label="Apellidos" filterToQuery={searchText => ({ firstName: searchText })} sort={{ field: 'lastName', order: 'ASC' }} alwaysOn resettable validate={[required()]} >
                    <AutocompleteInput optionText="lastName" resettable/>
                </ReferenceInput>
                <DateInput source="date" options={{ format: 'dd/MM/yyyy' }} label="Fecha" validate={[required()]} />
                <BooleanInput source="finished" label="Completado" alwaysOn resettable validate={[required()]} defaultValue={false}/>
                <FileInput source="certificatePic" label="Certificación" accept="application/pdf" placeholder={<p>Introduce el archivo aquí</p>}>
                    <ImageField source="src" title="title"/>
                </FileInput>
            </SimpleForm>
        </Create>
    )
};

function mapStateToProps(state, props) {
    return {formInput: state.formInput, user: state.user}
}

function mapDispatchToProps(dispatch) {
    return {
       
    };
}

const CertificateCreate = connect(mapStateToProps, mapDispatchToProps)(CertificateCreateView);
export default CertificateCreate;

