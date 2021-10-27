import * as React from "react";
import {
    List,
    Datagrid,
    TextField,
    ReferenceField,
    Filter,
    CreateButton,
    ReferenceInput,
    AutocompleteInput,
    NullableBooleanInput,
    BooleanField,
    EditButton,
    DeleteButton,
    FileField,
    CardActions,
    TextInput,
    DateField,
} from 'react-admin';

import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

import { useListContext} from 'react-admin';

import { makeStyles } from '@material-ui/core/styles';


import './certificateStyles.scss';
import {connect} from 'react-redux';
import { Link } from "@material-ui/core";


const modalityChoices = [
        { _id: 'Presencial', name: 'Presencial' },
        { _id: 'Semipresencial', name: 'Semipresencial' },
        { _id: 'Online para residentes en país', name: 'Online para residentes en país' },
        { _id: 'Online para residentes en provincia', name: 'Online para residentes en provincia' },
        { _id: 'Online para residentes en ciudad', name: 'Online para residentes en ciudad' },
        { _id: 'Online', name: 'Online' },
];

const NoneActions = props => (
    <CardActions />
);

const Empty = () => {
    const { basePath, certificate } = useListContext();
    return (
        <Box textAlign="center" m={10}>
            <Typography variant="h4" paragraph>
                Sin certificaciones todavía
            </Typography>
            <Typography variant="body1">
                ¿Te apetece crear uno nuevo?
            </Typography>
            <CreateButton basePath={basePath} />
        </Box>
    );
};

const CertificateFilter = ({role, permissions, ...props}) => {

    return (<Filter {...props}>
        <TextInput source="name" label="Nombre" alwaysOn resettable/>
        <ReferenceInput source="resource" reference="resources" label="Recurso" filterToQuery={searchText => ({ title: searchText })} sort={{ field: 'title', order: 'ASC' }} alwaysOn resettable>
            <AutocompleteInput optionText="title" resettable/>
        </ReferenceInput>
        <ReferenceInput source="user" reference="users" label="Nombre" filterToQuery={searchText => ({ firstName: searchText })} sort={{ field: 'firstName', order: 'ASC' }} alwaysOn resettable>
            <AutocompleteInput optionText="firstName" resettable/>
        </ReferenceInput>
        <ReferenceInput source="user" reference="users" label="Apellidos" filterToQuery={searchText => ({ firstName: searchText })} sort={{ field: 'lastName', order: 'ASC' }} alwaysOn resettable>
            <AutocompleteInput optionText="lastName" resettable/>
        </ReferenceInput>
        <NullableBooleanInput source="finished" label="Completado" alwaysOn resettable/>
    </Filter>
    );
};



const CertificateListTitle = () => {
    return <span>Lista de certificaciones</span>;
};


export const CertificateListView = ({permissions, ...props}) => {
    const newProps = {...props};
    delete newProps.dispatch;   //Solution for Warning: Invalid value for prop `dispatch` on <div> tag. Either remove it from the element, or pass a string or number value to keep it in the DOM
    let filter;

    let role = props.user.role

    if (permissions && !permissions['super-admin']) {
        if (permissions['organization']) {
            filter = {creator: props.user.organization}
        } else if (permissions['mentor']) {
            filter = {creator: props.user.userId}
        } else if (permissions['unemployed']) {
            filter = {user: props.user.userId}
        }
    }

    const cardStyle = {
        width: 500,
        margin: '0.5em',
        display: 'inline-block',
        verticalAlign: 'top'
    };

    const iconStyle = {
        fontSize: 15, paddingTop:5, marginTop:5, alignContent:'center'
    }

    const useImageFieldStyles = makeStyles(theme => ({
        image: { 
            width: 50,
            height: 50,
            display: "block",
            borderRadius: "50%"
        }
    }));

    const imageFieldClasses = useImageFieldStyles();
    

    return (<List empty={<Empty />} {...newProps}
                  filters={<CertificateFilter role={role}/>}
                  actions={<NoneActions />}
                  title={<CertificateListTitle/>}
                  filter={filter}
                  sort={{ field: 'title', order: 'ASC' }}
    >
        <Datagrid rowClick="" className={'resources'}>
            <TextField source="name" label="Nombre"/>
            <ReferenceField source="resource" reference="resources" label="Recurso">
                <TextField source="title"/>
            </ReferenceField>
            <ReferenceField source="user" reference="users" label="Nombre">
                <TextField source="firstName"/>
            </ReferenceField>
            <ReferenceField source="user" reference="users" label="Apellidos">
                <TextField source="lastName"/>
            </ReferenceField>
            <DateField source="date" label="Fecha"/>
            <BooleanField source="finished" label="Completado"/>
            <FileField source="certificatePic.src" title="Certfificado" label="Certificado" />
            {props.user.role !== 'Desempleado' && <EditButton/>}
            {props.user.role !== 'Desempleado' && <DeleteButton/>}
        </Datagrid>
    </List>)
};

function mapStateToProps(state) {
    return {user: state.user}
}

const CertificateList = connect(mapStateToProps)(CertificateListView);
export default CertificateList;
