import * as React from "react";
import {
    SimpleForm,
    BooleanInput,
    Edit,
    FileInput,
    TextInput,
    required,
    ReferenceInput,
    AutocompleteInput,
    ImageField
} from 'react-admin';
import {connect} from 'react-redux';
import './certificateStyles.scss';

import { DateInput } from 'react-admin-date-inputs';

const EditTitle = ({record}) => {
    return <span>Editar certificación: {record ? `${record.name}` : ''}</span>;
};

export const CertificateEditView = ({permissions, ...props}) => {
    const newProps = {...props};
    delete newProps.onChangeCountry;
    delete newProps.onChangeProvince;
    delete newProps.onChangeOnline;
    delete newProps.onChangeNotExpire;
    
    delete newProps.formInput;

    return (<Edit {...newProps} title={<EditTitle/>}>
            <SimpleForm className={'certificateGridLayoutCreateEdit'} >
                <TextInput source="name" label="Nombre certificación" validate={[required()]} alwaysOn resettable/>
                <ReferenceInput source="resource" reference="resources" label="Recurso" filterToQuery={searchText => ({ title: searchText })} sort={{ field: 'title', order: 'ASC' }} alwaysOn resettable validate={[required()]} disabled>
                    <AutocompleteInput optionText="title" resettable/>
                </ReferenceInput>
                <ReferenceInput source="user" reference="users" label="Nombre" filterToQuery={searchText => ({ firstName: searchText })} sort={{ field: 'firstName', order: 'ASC' }} alwaysOn resettable validate={[required()]} disabled>
                    <AutocompleteInput optionText="firstName" resettable/>
                </ReferenceInput>
                <ReferenceInput source="user" reference="users" label="Apellidos" filterToQuery={searchText => ({ firstName: searchText })} sort={{ field: 'lastName', order: 'ASC' }} alwaysOn resettable validate={[required()]} disabled>
                    <AutocompleteInput optionText="lastName" resettable/>
                </ReferenceInput>
                <DateInput source="date" options={{ format: 'dd/MM/yyyy' }} label="Fecha" validate={[required()]} />
                <BooleanInput source="finished" label="Finalizado" defaultValue="true"/>
                <FileInput source="certificatePic" label="Certificación" accept="application/pdf" placeholder={<p>Introduce el archivo aquí</p>}>
                    <ImageField source="src" title="title"/>
                </FileInput>
            </SimpleForm>
        </Edit>
    )
};

function mapStateToProps(state, props) {
    return {formInput: state.formInput, user: state.user}
}

function mapDispatchToProps(dispatch) {
    return {
    };
}

const CertificateEdit = connect(mapStateToProps, mapDispatchToProps)(CertificateEditView);
export default CertificateEdit;


