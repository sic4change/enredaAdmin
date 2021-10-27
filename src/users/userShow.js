import * as React from "react";
import {
    ImageField,
    SimpleShowLayout,
    TextField,
    ReferenceField,
    ReferenceManyField,
    DateField,
    Tab,
    ReferenceInput,
    AutocompleteInput,
    TextInput,
    SelectInput,
    List,
    Filter,
    FileField,
    TabbedShowLayout,
    TopToolbar,
    EditButton,
    DeleteButton,
    ListButton,
    ShowController,
    ReferenceArrayField,
    ShowView,
    FunctionField,
    SingleFieldList,
    ChipField,
    Datagrid,
    BooleanField,
    NullableBooleanInput
} from 'react-admin';
import './userStyles.scss';
import Aside from '../components/aside';

import moment from "moment";

import ChipFieldAvailability from "../components/ChipFieldAvailability";

const modalityChoices = [
    { _id: 'Presencial', name: 'Presencial' },
    { _id: 'Semipresencial', name: 'Semipresencial' },
    { _id: 'Online para residentes en país', name: 'Online para residentes en país' },
    { _id: 'Online para residentes en provincia', name: 'Online para residentes en provincia' },
    { _id: 'Online para residentes en ciudad', name: 'Online para residentes en ciudad' },
    { _id: 'Online', name: 'Online' },
];


const UserShowActions = ({permissions, basePath, data, resource}) => (
    <TopToolbar>
        <EditButton basePath={basePath} record={data}/>
        {permissions && permissions['super-admin'] &&
        <DeleteButton basePath={basePath} record={data} resource={resource}/>
        }
        {permissions && permissions['super-admin'] &&
        <ListButton basePath={basePath}/>
        }
    </TopToolbar>
);

const NoResources = () => {
    return <React.Fragment>
        <p style={{
            color: 'rgba(0, 0, 0, 0.54)',
            fontSize: 'smaller',
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            fontWeight: '400',
            lineHeight: '1',
            letterSpacing: '0.00938em'}}>Recursos</p>
        <span style={{
            fontSize: 'small',
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'}}
        >Aún no se ha inscrito a ningún recursos</span>
    </React.Fragment>;
};

const NoCertificates = () => {
    return <React.Fragment>
        <p style={{
            color: 'rgba(0, 0, 0, 0.54)',
            fontSize: 'smaller',
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            fontWeight: '400',
            lineHeight: '1',
            letterSpacing: '0.00938em'}}>Certificaciones</p>
        <span style={{
            fontSize: 'small',
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'}}
        >Aún no dispone de nigún certificado</span>
    </React.Fragment>;
};

const ResourceFilter = (props) => {
    return (<Filter {...props}>
        <TextInput source="title" label="Buscar por título" alwaysOn resettable />
        <TextInput source="status" label="Disponibilidad" alwaysOn/>
        <ReferenceInput source="interests" reference="interests" label="Interés" filterToQuery={searchText => ({ name: searchText })} sort={{ field: 'name', order: 'ASC' }} alwaysOn resettable>
            <AutocompleteInput optionText="name" resettable/>
        </ReferenceInput>
        <ReferenceInput source="organizer" reference="organizations" label="Promotor"  filterToQuery={searchText => ({ name: searchText })} sort={{ field: 'name', order: 'ASC' }} alwaysOn resettable>
            <AutocompleteInput optionText="name" resettable/>
         </ReferenceInput>
        <ReferenceInput source="organizer" reference="users" label="Mentor" filter={ {role: 'Mentor'}} filterToQuery={searchText => ({ firstName: searchText })} sort={{ field: 'firstName', order: 'ASC' }} alwaysOn resettable>
             <AutocompleteInput optionText="firstName" resettable/>
        </ReferenceInput>
        
        <TextInput source="promotor" label="Buscar por organizador" alwaysOn resettable/>
        
        <ReferenceInput source="address.country" reference="countries" label="País" filter={{active: true}} filterToQuery={searchText => ({ name: searchText })} sort={{ field: 'name', order: 'ASC' }} alwaysOn resettable>
            <AutocompleteInput optionText="name" resettable/>
        </ReferenceInput>
        <ReferenceInput source="address.province" reference="provinces" label="Provincia" filter={{active: true}} filterToQuery={searchText => ({ name: searchText })} sort={{ field: 'name', order: 'ASC' }} alwaysOn resettable>
            <AutocompleteInput optionText="name" resettable/>
        </ReferenceInput>
        <ReferenceInput source="address.city" reference="cities" label="Municipio" filter={{active: true}} filterToQuery={searchText => ({ name: searchText })} sort={{ field: 'name', order: 'ASC' }} alwaysOn resettable>
            <AutocompleteInput optionText="name" resettable/>
        </ReferenceInput>
        <SelectInput label="Modalidad" source="modality" choices={modalityChoices} optionText="name" optionValue="_id" allowEmpty alwaysOn/>
        
    </Filter>
    );
  }

  const CertificateFilter = (props) => {
    return (<Filter {...props}>
            <TextInput source="name" label="Nombre" alwaysOn resettable/>
            <ReferenceInput source="resource" reference="resources" label="Recurso" filterToQuery={searchText => ({ title: searchText })} sort={{ field: 'title', order: 'ASC' }} alwaysOn resettable>
                <AutocompleteInput optionText="title" resettable/>
            </ReferenceInput>
            <NullableBooleanInput source="finished" label="Completado" alwaysOn resettable/>
        </Filter>
    );
  }

const ShowTitle = ({record}) => {
    return <span>Usuario: {record ? `${record.firstName} ` : ''}</span>;
};

const UserShow = ({permissions, ...props}) => {

    return (<ShowController {...props}>
        {controllerProps =>
            <ShowView {...props} {...controllerProps} aside={<Aside/>} actions={<UserShowActions/>}
                      title={<ShowTitle/>}>
                <TabbedShowLayout>
                     <Tab label="Resumen">
                                 
                <SimpleShowLayout className={'userGridLayoutShow'}>
                    {controllerProps.record && controllerProps.record.profilePic &&
                    <ImageField source="profilePic.src"
                                title="profilePic.title"
                                label="Foto de perfil"
                                className={'userImageShow'}/>
                    }
                    <TextField source="firstName" label="Nombre"/>
                    {controllerProps.record && controllerProps.record.lastName &&
                    <TextField source="lastName" label="Apellidos"/>
                    }
                    {controllerProps.record && controllerProps.record.gender &&
                    <TextField source="gender" label="Género"/>
                    }
                    <TextField source="email"/>
                    {controllerProps.record && controllerProps.record.address && controllerProps.record.address.country &&
                    <ReferenceField link="show" source="address.country" reference="countries" label="País">
                        <TextField source="name"/>
                    </ReferenceField>
                    }
                    {controllerProps.record && controllerProps.record.address && controllerProps.record.address.province &&
                    <ReferenceField link="show" source="address.province" reference="provinces" label="Provincia">
                        <TextField source="name"/>
                    </ReferenceField>
                    }
                    {controllerProps.record && controllerProps.record.address && controllerProps.record.address.city &&
                    <ReferenceField link="show" source="address.city" reference="cities" label="Municipio">
                        <TextField source="name"/>
                    </ReferenceField>
                    }
                    {controllerProps.record && controllerProps.record.address && controllerProps.record.address.postCode &&
                    <TextField source="address.postCode" label="Código Postal"/>
                    }
                    <TextField source="phone" label="Teléfono" emptyText="-"/>
                    {controllerProps.record && controllerProps.record.organization &&
                    <ReferenceField link="show" source="organization" reference="organizations" label="Organización">
                        <TextField source="name"/>
                    </ReferenceField>
                    }
                    {controllerProps.record && controllerProps.record.birthday &&
                    <DateField source="birthday" label="Fecha de nacimiento"/>
                    }
                    {/* {controllerProps.record && controllerProps.record.website &&
                    <UrlField source="website" label="Sitio web" emptyText="-"/>
                    } */}
                    {controllerProps.record && controllerProps.record.role &&
                    <TextField source="role" label="Rol"/>
                    }
                    {/* {controllerProps.record && controllerProps.record.unemployedType &&
                    <TextField source="unemployedType" label="Tipo de desempleado"/>
                    } */}
                    {controllerProps.record && controllerProps.record.education && controllerProps.record.education.value &&
                    <TextField source="education.value" label="Nivel de educación"/>
                    }
                    {controllerProps.record && controllerProps.record.motivation && controllerProps.record.motivation.abilities &&
                    <ReferenceArrayField reference="abilities" source="motivation.abilities" label="Habilidades a reforzar">
                        <SingleFieldList >
                            <ChipField source="name"/>
                        </SingleFieldList>
                    </ReferenceArrayField>
                    }
                    {controllerProps.record && controllerProps.record.interests && controllerProps.record.interests.interests &&
                    <ReferenceArrayField reference="interests" source="interests.interests" label="Intereses">
                        <SingleFieldList >
                            <ChipField source="name"/>
                        </SingleFieldList>
                    </ReferenceArrayField>
                    }
                    {controllerProps.record && controllerProps.record.interests && controllerProps.record.interests.specificInterests &&
                    <ReferenceArrayField reference="specificInterests" source="interests.specificInterests" label="Intereses laborales específicos">
                        <SingleFieldList >
                            <ChipField source="name"/>
                        </SingleFieldList>
                    </ReferenceArrayField>
                    }
                    {controllerProps.record && controllerProps.record.unemployedType && permissions && permissions['super-admin'] && 
                        <TextField source="unemployedType" label="Tipo"/>
                    }
                    <BooleanField source="active" label="Activo"/>
                    {controllerProps.record && controllerProps.record.role === "Mentor" &&
                    <BooleanField source="trust" label="Confianza"/>
                    }
                </SimpleShowLayout>
                </Tab>
            
                {controllerProps.record && controllerProps.record.role === "Desempleado" ? <Tab label="Recursos">
                <SimpleShowLayout >
                <ReferenceManyField
                            addLabel={false}
                            reference="resources"
                            target="participants"
                            filter={ {participantsString: controllerProps.record.userId}} 
                            sort={{ field: 'lastupdate', order: 'DESC' }}>
                            <List {...props} filters={<ResourceFilter/>} bulkActionButtons={false}>
                            <Datagrid >
                                <TextField source="title" label="Titulo"/>
                                <ReferenceField source="resourceType" reference="resourcesTypes" label="Tipo de recurso">
                                    <TextField source="name"/>
                                </ReferenceField>
                                <ChipFieldAvailability source="status" label="Disponibilidad"/>
                                <ReferenceArrayField reference="interests" source="interests" label="Intereses">
                                    <SingleFieldList >
                                        <ChipField source="name"/>
                                    </SingleFieldList>
                                </ReferenceArrayField>
                                <FunctionField label="Comienzo" render={record => record.notExpire ? 'No expira' : `${new Date(record.start.seconds * 1000).toLocaleString("es-ES")}` } />
                                <FunctionField label="Fecha máxima de inscripción" render={record => record.notExpire ? 'No expira' : `${new Date(record.maximumDate.seconds * 1000).toLocaleString("es-ES")}` } />
                                <TextField source="capacity" label="Aforo" emptyText='-'/>
                                <TextField source="assistants" label="Asistentes" emptyText='-'/>
                                {permissions && permissions['super-admin'] &&
                                    <ReferenceField link="show" source="organizer" reference="organizations" label="Promotor">
                                        <TextField source="name"/>
                                    </ReferenceField>
                                }
                                {permissions && permissions['super-admin'] &&
                                    <ReferenceField link="show" source="organizer" reference="users" label="Mentor">
                                        <FunctionField label="Name"
                                                    render={record => record.firstName && record.lastName ? `${record.firstName} ${record.lastName}` : null}/>
                                    </ReferenceField>
                                }
                                 <TextField source="promotor" label="Organizador"/>
                                <TextField source="modality" label="Modalidad"/>
                                <TextField source="link" label="Link" emptyText='-'/>
                                <BooleanField source="notExpire" label="No Expira"/>
                                <BooleanField source="trust" label="Confianza"/>
                            </Datagrid>
                            </List>
                        </ReferenceManyField>
                    </SimpleShowLayout>
                </Tab> : null}
                {controllerProps.record && controllerProps.record.role === "Desempleado" ? <Tab label="Certificaciones">
                <SimpleShowLayout >
                        <ReferenceManyField
                            addLabel={false}
                            reference="certificates"
                            target="user"
                            filter={ {user: controllerProps.record.userId}}
                            sort={{ field: 'lastupdate', order: 'DESC' }}>
                        <List {...props} filter={{user: controllerProps.record.userId}} filters={<CertificateFilter/>} bulkActionButtons={false}>
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
                            </Datagrid>
                            </List>
                        </ReferenceManyField>
                    </SimpleShowLayout>
                </Tab> : null}
                </TabbedShowLayout>
            </ShowView>
        }
    </ShowController>)
};

export default UserShow;
