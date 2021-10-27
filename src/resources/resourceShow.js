import * as React from "react";
import {
    SimpleShowLayout,
    TextField,
    Datagrid,
    ImageField,
    EmailField,
    ReferenceManyField,
    ReferenceField,
    BooleanField,
    TopToolbar,
    EditButton,
    DeleteButton,
    ListButton,
    ShowController,
    FileField,
    Tab,
    TabbedShowLayout,
    ShowView,
    DateField,
    Filter,
    ReferenceInput,
    AutocompleteInput,
    TextInput,
    NullableBooleanInput,
    List,
    Button,
    ReferenceArrayField,
    ChipField,
    SingleFieldList, SelectInput, CreateButton,
} from 'react-admin';
import './resourceStyles.scss';

import RemoveUserInResource from "../components/buttons/removeUserInResource";
import AddCertificateToUserResource from "../components/buttons/addCertificateToUserResource";

import { makeStyles } from '@material-ui/core/styles';

import { Link } from 'react-router-dom';


const ResourceShowActions = ({basePath, data, resource}) => (
    <TopToolbar>
        <EditButton basePath={basePath} record={data}/>
        <DeleteButton basePath={basePath} record={data} resource={resource}/>
        <ListButton basePath={basePath}/>
    </TopToolbar>
);

const ResourceTitle = ({record}) => {
    return <span>Recurso: {record ? `${record.title}` : ''}</span>;
};

const NoParticipants = () => {
    return <React.Fragment>
        <p style={{
            color: 'rgba(0, 0, 0, 0.54)',
            fontSize: 'smaller',
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            fontWeight: '400',
            lineHeight: '1',
            letterSpacing: '0.00938em'}}></p>
        <span style={{
            fontSize: 'small',
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'}}
        >Aún no hay participantes inscritos</span>
    </React.Fragment>;
};

const NoCertificados = () => {
    return <React.Fragment>
        <p style={{
            color: 'rgba(0, 0, 0, 0.54)',
            fontSize: 'smaller',
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            fontWeight: '400',
            lineHeight: '1',
            letterSpacing: '0.00938em'}}></p>
        <span style={{
            fontSize: 'small',
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'}}
        >Aún no hay certificaciones</span>
    </React.Fragment>;
};

const CertificateFilter = (props) => {
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
  }

  const UserFilter = ({role, permissions, ...props}) => {

    const rolesChoices = [
        { _id: 'Super Admin', name: 'Super Admin' },
        { _id: 'Mentor', name: 'Mentor' },
        { _id: 'Organización', name: 'Organización' },
        { _id: 'Desempleado', name: 'Desempleado' },
    ];

    const typeChoices = [
        { _id: 'T1', name: 'T1' },
        { _id: 'T2', name: 'T2' },
        { _id: 'T3', name: 'T3' },
        { _id: 'T4', name: 'T4' },
    ];


    return (<Filter {...props}>
                <TextInput source="firstName" label="Nombre" alwaysOn resettable/>
                <TextInput source="lastName" label="Apellidos" alwaysOn resettable/>
                <TextInput source="email" label="Buscar por email" alwaysOn resettable/>
                <ReferenceInput source="address.country" reference="countries" label="País" filter={{active: true}} filterToQuery={searchText => ({ name: searchText })} sort={{ field: 'name', order: 'ASC' }} alwaysOn resettable>
                    <AutocompleteInput optionText="name" resettable/>
                </ReferenceInput>
                <ReferenceInput source="address.province" reference="provinces" label="Provincia" filter={{active: true}} filterToQuery={searchText => ({ name: searchText })} sort={{ field: 'name', order: 'ASC' }} alwaysOn resettable>
                    <AutocompleteInput optionText="name" resettable/>
                </ReferenceInput>
                <ReferenceInput source="address.city" reference="cities" label="Municipio" filter={{active: true}} filterToQuery={searchText => ({ name: searchText })} sort={{ field: 'name', order: 'ASC' }} alwaysOn resettable>
                    <AutocompleteInput optionText="name" resettable/>
                </ReferenceInput>

            
            </Filter>
        )
};

const ResourceShow = ({permissions, ...props}) => {

    const referenceLink = permissions && !permissions['super-admin'] ? false : 'show';

    const useImageFieldStyles = makeStyles(theme => ({
        image: { 
            width: 50,
            height: 50,
            display: "block",
            borderRadius: "50%",
        }
    }));
    
    const imageFieldClasses = useImageFieldStyles();

    const CreateRelatedCertificationButton = ({ record }) => (
        <Button
            component={Link}
            to={{
                pathname: '/certifications/create',
                state: { record: { resource: record.resourceId, user: record.userId } },
            }}
        >
            Añadir certificación
        </Button>
    );


    return (
        <ShowController {...props}>
            {controllerProps => {  
                return (
                <ShowView {...props} {...controllerProps} actions={<ResourceShowActions/>}
                          title={<ResourceTitle/>}>
                              <TabbedShowLayout>
                                  <Tab label="Resumen">
                                  <SimpleShowLayout className={'resourceGridLayoutShow'}>
                        <TextField source="title" label="Título"/>
                        <TextField source="description" label="Descripción"/>
                        {controllerProps.record && controllerProps.record.notExpire &&
                            <BooleanField label="No expira" source="notExpire"/>
                        }
                        {controllerProps.record && !controllerProps.record.notExpire &&
                            <DateField source="start" label="Comienzo" showTime={true}/>
                        }
                        {controllerProps.record && !controllerProps.record.notExpire && 
                            <DateField source="end" label="Finalización" showTime={true}/>
                        }
                        {controllerProps.record && !controllerProps.record.notExpire && 
                            <DateField source="maximumDate" label="Fecha máxima de inscripción"/>
                        }

                        <TextField source="duration" label="Duración"/>

                        {controllerProps.record && controllerProps.record.temporality && 
                            <TextField source="temporality" label="Horario"/>
                        }

                        <TextField source="modality" label="Modalidad"/>
                        {controllerProps.record && !controllerProps.record.online &&

                            <ReferenceField link={referenceLink} source="address.country" reference="countries"
                                            label="País">
                                <TextField source="name"/>
                            </ReferenceField> 
                        }
                        {controllerProps.record && !controllerProps.record.online &&
                            <ReferenceField link={referenceLink} source="address.province" reference="provinces"
                                            label="Provincia">
                                <TextField source="name"/>
                            </ReferenceField>
                        }
                        {controllerProps.record && !controllerProps.record.online &&
                            <ReferenceField link={referenceLink} source="address.city" reference="cities" label="Municipio">
                                <TextField source="name"/>
                            </ReferenceField>
                        }
                        {controllerProps.record && !controllerProps.record.online &&
                            <TextField source="address.street" label="Calle y número" emptyText={'-'}/>
                        }
                        <TextField source="address.place" label="Lugar de realización" emptyText={'-'}/>
                        
                        <ReferenceField link={referenceLink} source="resourceType" reference="resourcesTypes"
                                        label="Tipo de recurso">
                            <TextField source="name"/>
                        </ReferenceField>
                        {controllerProps.record && controllerProps.record.contractType &&
                            <TextField label="Tipo contrato" source="contractType"/>
                        }
                        {controllerProps.record && controllerProps.record.salary &&
                            <TextField label="Salario" source="salary"/>
                        }
                        {controllerProps.record && controllerProps.record.titulation &&
                            <TextField label="Titulación" source="titulation"/>
                        }
                        <ReferenceArrayField reference="interests" source="interests" label="Intereses">
                            <SingleFieldList >
                                <ChipField source="name"/>
                            </SingleFieldList>
                        </ReferenceArrayField>
    
                        {permissions && permissions['super-admin'] && controllerProps.record  &&
                        <ReferenceField link="show" source="organizer" reference="organizations" label="Promotor">
                            <TextField source="name"/>
                        </ReferenceField>
                        }
                        {permissions && permissions['super-admin'] && controllerProps.record && controllerProps.record.organizerType === 'Mentor' &&
                        <ReferenceField link="show" source="organizer" reference="users" label="Mentor">
                            <TextField source="firstName"/>
                        </ReferenceField>
                        }
                        {controllerProps.record && controllerProps.record.promotor &&
                            <TextField label="Organizador" source="promotor"/>
                        }
                        {controllerProps.record && controllerProps.record.link &&
                            <TextField label="Link" source="link"/>
                        }
                        <BooleanField label="Confianza" source="trust"/>
                        
                    </SimpleShowLayout>
                </Tab>
                <Tab label="Participantes">
                <SimpleShowLayout >
                <ReferenceManyField
                            addLabel={false}
                            reference="users"
                            target="resources"
                            filter={ {resourcesString: controllerProps.record.resourceId}} 
                            sort={{ field: 'firstName', order: 'DESC' }}>
                            <List {...props} filters={<UserFilter/>} bulkActionButtons={false}>
                            <Datagrid record={props.record}>
                                <ImageField classes={imageFieldClasses} source="profilePic.src" title="Foto" label="Foto"/>
                                <TextField source="firstName" label="Nombre"/>
                                <TextField source="lastName" label="Apellidos"/>
                                <ReferenceField link={false} source="address.country" reference="countries" label="País">
                                    <TextField source="name"/>
                                </ReferenceField>
                                <ReferenceField link={false} source="address.province" reference="provinces" label="Provincia">
                                    <TextField source="name"/>
                                </ReferenceField>
                                <ReferenceField link={false} source="address.city" reference="cities" label="Municipio">
                                    <TextField source="name"/>
                                </ReferenceField>
                                {permissions && permissions['super-admin'] &&
                                    <TextField source="role" label="Rol"/>
                                }
                                <EmailField source="email"/>
                                <TextField source="phone" label="Teléfono"/>
                                
                                {permissions && permissions['super-admin'] &&
                                    <TextField source="unemployedType" label="Tipo"/>
                                }

                                {permissions && permissions['super-admin'] &&
                                    <BooleanField source="active" label="Activo"/>
                                }

                                {permissions && !permissions['unemployed'] && <RemoveUserInResource userId={controllerProps.record} record ={controllerProps.record} label="Desasignar"/> } 
                                <AddCertificateToUserResource userId={controllerProps.record} record ={controllerProps.record} label="Crear certificado"/>
                                
                            </Datagrid>
                            </List>
                        </ReferenceManyField>
                    </SimpleShowLayout>
                </Tab> 

                <Tab label="Certificaciones">
                <SimpleShowLayout >
                <ReferenceManyField
                            addLabel={false}
                            reference="certificates"
                            target="resource"
                            filter={ {resource: controllerProps.record.resourceId}}
                            sort={{ field: 'title', order: 'DESC' }}>
                            <List {...props} filters={<CertificateFilter/>} bulkActionButtons={false}>
                            <Datagrid >
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
                                <BooleanField source="finished" label="Completado"/>
                                <FileField source="certificatePic.src" title="Certfificado" label="Certificado" />
                                <EditButton/>
                                <DeleteButton/>
                            </Datagrid>
                            </List>
                        </ReferenceManyField>
                    </SimpleShowLayout>
                </Tab> 
                </TabbedShowLayout>
                    
                </ShowView>)}
            }
        </ShowController>
    )
};

export default ResourceShow;
