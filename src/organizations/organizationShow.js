import * as React from "react";
import {
    ImageField,
    SimpleShowLayout,
    TextField,
    UrlField,
    TopToolbar,
    Filter,
    TextInput,
    ReferenceInput,
    AutocompleteInput,
    SelectInput,
    Tab,
    TabbedShowLayout,
    EditButton,
    DateField,
    DeleteButton,
    FunctionField,
    SingleFieldList,
    ChipField,
    Datagrid,
    ReferenceManyField,
    List,
    ReferenceArrayField,
    ListButton, EmailField, ReferenceField, ShowView, ShowController, BooleanField,
} from 'react-admin';
import './organizationStyles.scss';
import Aside from '../components/aside'

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

const NoResources = () => {
    return <React.Fragment>
        <p style={{
            color: 'rgba(0, 0, 0, 0.54)',
            fontSize: 'smaller',
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            fontWeight: '400',
            lineHeight: '1',
            letterSpacing: '0.00938em'}}>Participantes</p>
        <span style={{
            fontSize: 'small',
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'}}
        >Aún no ha creado ningún recurso</span>
    </React.Fragment>;
};

const UserShowActions = ({basePath, data, resource}) => (
    <TopToolbar>
        <EditButton basePath={basePath} record={data}/>
        <DeleteButton basePath={basePath} record={data} resource={resource}/>
        <ListButton basePath={basePath}/>
    </TopToolbar>
);

const ShowTitle = ({record}) => {
    return <span>Organización: {record ? ` ${record.name} ` : ' '}</span>;
};

const ResourceFilter = ({role, permissions, ...props}) => {

    return (<Filter {...props}>
            <TextInput source="title" label="Buscar por título" alwaysOn resettable/>
            <ReferenceInput source="resourceType" reference="resourcesTypes" label="Tipo de recurso" filterToQuery={searchText => ({ name: searchText })} sort={{ field: 'name', order: 'ASC' }} alwaysOn resettable>
                <AutocompleteInput optionText="name" resettable/>
            </ReferenceInput>
            <TextInput source="status" label="Disponibilidad" alwaysOn/>
            <ReferenceInput source="interests" reference="interests" label="Interés" filterToQuery={searchText => ({ name: searchText })} sort={{ field: 'name', order: 'ASC' }} alwaysOn resettable>
                <AutocompleteInput optionText="name" resettable/>
            </ReferenceInput>
            <TextInput source="promotor" label="Buscar por organizador" alwaysOn resettable/>
            <ReferenceInput source="address.country" reference="countries" label="País" filter={{active: true}} filterToQuery={searchText => ({ name: searchText })} sort={{ field: 'name', order: 'ASC' }} alwaysOn resettable>
                <AutocompleteInput optionText="name" resettable/>
            </ReferenceInput>
            <ReferenceInput source="address.province" reference="provinces" label="Provincia" filter={{active: true}} filterToQuery={searchText => ({ name: searchText })} sort={{ field: 'name', order: 'ASC' }} alwaysOn resettable>
                <AutocompleteInput optionText="name" resettable/>
            </ReferenceInput>
            <ReferenceInput source="address.city" reference="cities" label="Ciudad" filter={{active: true}} filterToQuery={searchText => ({ name: searchText })} sort={{ field: 'name', order: 'ASC' }} alwaysOn resettable>
                <AutocompleteInput optionText="name" resettable/>
            </ReferenceInput>
            <SelectInput label="Modalidad" source="modality" choices={modalityChoices} optionText="name" optionValue="_id" allowEmpty alwaysOn/>
            
        </Filter>
    )
};

export const OrganizationShow = ({permissions, ...props}) => (
    <ShowController {...props}>
        {controllerProps =>
            <ShowView {...props} {...controllerProps} aside={<Aside/>} actions={<UserShowActions/>}
                      title={<ShowTitle/>}>
                           <TabbedShowLayout>
                                <Tab label="Resumen">
                                    <SimpleShowLayout className={'organizationGridLayoutShow'}>
                                        {controllerProps.record && controllerProps.record.logoPic &&
                                        <ImageField source="logoPic.src" title="logoPic.title" label="Logo" className={'organizationImageShow'}/>
                                        }
                                        <TextField source="name" label="Nombre"/>
                                        {controllerProps.record && controllerProps.record.description &&
                                        <TextField source="description" label="Descripción"/>
                                        }
                                        {controllerProps.record && controllerProps.record.website &&
                                        <UrlField source="website" label="Sitio web" emptyText="-"/>
                                        }
                                        <EmailField source="email" label='Email'/>
                                        {controllerProps.record && controllerProps.record.phone &&
                                        <TextField source="phone" label="Teléfono"/>
                                        }
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
                                        <BooleanField source="trust" label="Confianza"/>
                                        
                                    </SimpleShowLayout>
                                    </Tab>
                                    <Tab label="Recursos">
                                    <SimpleShowLayout >
                                              <ReferenceManyField
                                                addLabel={false}
                                                reference="resources"
                                                target="organizer"
                                                filter={ {organizer: props.id}}
                                                sort={{ field: 'date', order: 'DESC' }}>
                                                <List {...props}  filters={<ResourceFilter />} bulkActionButtons={false}>
                                                    <Datagrid>
                                                    <TextField source="title" label="Título"/>
                                                    <DateField source="createdate" label="Creación"/>
                                                    <DateField source="lastupdate" label="Actualización"/>
                                                    <ReferenceField source="resourceType" reference="resourcesTypes" label="Tipo de recurso">
                                                        <TextField source="name"/>
                                                    </ReferenceField>
                                                    <ChipFieldAvailability source="status" label="Disponibilidad"/>
                                                    <ReferenceArrayField reference="interests" source="interests" label="Intereses">
                                                        <SingleFieldList >
                                                            <ChipField source="name"/>
                                                        </SingleFieldList>
                                                    </ReferenceArrayField>
                                                    <FunctionField label="Comienzo" render={record => record.start.getTime() > 2556057600000 ? 'No expira' : `${moment(record.start).format("DD/MM/YYYY")}` } />
                                                    <FunctionField label="Fecha máxima de inscripción" render={record => record.maximumDate.getTime() > 2555971200000 ? 'No expira' : `${moment(record.maximumDate).format("DD/MM/YYYY")}` } />
                                                    <TextField source="capacity" label="Aforo" emptyText='-'/>
                                                    <TextField source="assistants" label="Asistentes" emptyText='-'/>
                                                    <TextField source="promotor" label="Organizador"/>
                                                    <TextField source="modality" label="Modalidad"/>
                                                    <TextField source="link" label="Link" emptyText='-'/>
                                                    <BooleanField source="notExpire" label="No Expira"/>
                                                    <BooleanField source="trust" label="Confianza"/>
                                                    <EditButton/>
                                                    <DeleteButton/>
                                                    
                                                    </Datagrid>
                                                </List>
                                                </ReferenceManyField>
                                            
                                        </SimpleShowLayout>
                                    </Tab>
                                </TabbedShowLayout>
                                
            </ShowView>
        }
    </ShowController>
);
export default OrganizationShow;
