import React, { Fragment } from 'react';
import {
    List,
    Datagrid,
    TextField,
    EditButton,
    DeleteButton,
    TextInput,
    ReferenceField,
    Filter,
    ReferenceInput,
    DateField,
    ImageField,
    FunctionField,
    AutocompleteInput,
    ReferenceArrayField,
    ChipField,
    SelectInput,
    SingleFieldList,
    TopToolbar,
    CreateButton,
    BooleanField
}
    from 'react-admin';

import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

import { useListContext} from 'react-admin';
import { Card, CardContent, CardActions, CardHeader, Icon } from '@material-ui/core';

import { makeStyles } from '@material-ui/core/styles';

import moment from "moment";

import './resourceStyles.scss';
import {connect} from 'react-redux';
import ChipFieldAvailability from "../components/ChipFieldAvailability";

import CalendarViewDay from '@material-ui/icons/DateRange';
import EventBusy from '@material-ui/icons/EventBusy';
import People from '@material-ui/icons/People';
import Modality from '@material-ui/icons/Assistant';
import Place from '@material-ui/icons/Place';
import Folder from '@material-ui/icons/Folder';
import File from '@material-ui/icons/InsertDriveFile';
import Euro from '@material-ui/icons/Euro';
import AddUserToExternalResource from "../components/buttons/addUserToExternalResource";
import AddUserToResource from "../components/buttons/addUserToResource";
import RemoveUserFromResource from "../components/buttons/removeUserFromResource";

const maxPerPage = 999999999999999999999999999999999;

const modalityChoices = [
        { _id: 'Presencial', name: 'Presencial' },
        { _id: 'Semipresencial', name: 'Semipresencial' },
        { _id: 'Online para residentes en país', name: 'Online para residentes en país' },
        { _id: 'Online para residentes en provincia', name: 'Online para residentes en provincia' },
        { _id: 'Online para residentes en ciudad', name: 'Online para residentes en ciudad' },
        { _id: 'Online', name: 'Online' },
];

const Empty = () => {
    const { basePath, resource } = useListContext();
    return (
        <Box textAlign="center" m={10}>
            <Typography variant="h4" paragraph>
                Sin recursos todavía
            </Typography>
            <Typography variant="body1">
                ¿Te apetece crear uno nuevo?
            </Typography>
            <CreateButton basePath={basePath} />
        </Box>
    );
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
            {role === 'Super Admin' &&
                <ReferenceInput source="organizer" reference="organizations" label="Promotor"  filterToQuery={searchText => ({ name: searchText })} sort={{ field: 'name', order: 'ASC' }} alwaysOn resettable>
                    <AutocompleteInput optionText="name" resettable/>
                </ReferenceInput>
            }
            {role === 'Super Admin' &&
                <ReferenceInput source="organizer" reference="users" label="Mentor" filter={ {role: 'Mentor'}} filterToQuery={searchText => ({ firstName: searchText })} sort={{ field: 'firstName', order: 'ASC' }} alwaysOn resettable>
                    <AutocompleteInput optionText="firstName" resettable/>
                </ReferenceInput>
            } 
            {(role === 'Organización' || role === 'Super Admin') &&
                <TextInput source="promotor" label="Buscar por organizador" alwaysOn resettable/>
            } 
            <ReferenceInput source="address.country" reference="countries" label="País" filter={{active: true}} filterToQuery={searchText => ({ name: searchText })} sort={{ field: 'name', order: 'ASC' }} alwaysOn resettable>
                <AutocompleteInput optionText="name" resettable/>
            </ReferenceInput>
            <ReferenceInput source="address.province" reference="provinces" label="Provincia" filter={{active: true}} filterToQuery={searchText => ({ name: searchText })} sort={{ field: 'name', order: 'ASC' }} perPage={maxPerPage} alwaysOn resettable>
                <AutocompleteInput optionText="name" resettable/>
            </ReferenceInput>
            <ReferenceInput source="address.city" reference="cities" label="Municipio" filter={{active: true}} filterToQuery={searchText => ({ name: searchText })} sort={{ field: 'name', order: 'ASC' }} perPage={maxPerPage} alwaysOn resettable>
                <AutocompleteInput optionText="name" resettable/>
            </ReferenceInput>
            {/* <ReferenceInput source="address.country" reference="countries" label="Online" filter={{active: false}} filterToQuery={searchText => ({ name: searchText })} sort={{ field: 'name', order: 'ASC' }} alwaysOn resettable>
                <AutocompleteInput optionText="name" resettable/>
            </ReferenceInput> */}
            <SelectInput label="Modalidad" source="modality" choices={modalityChoices} optionText="name" optionValue="_id" allowEmpty alwaysOn/>
            
        </Filter>
    )
};

const ResourceFilterUnemployed = ({ ...props}) => {

    return (<Filter {...props}>
            <TextInput source="title" label="Buscar por título" alwaysOn resettable/>
            <ReferenceInput source="resourceType" reference="resourcesTypes" label="Tipo de recurso" filterToQuery={searchText => ({ name: searchText })} sort={{ field: 'name', order: 'ASC' }} alwaysOn resettable>
                <AutocompleteInput optionText="name" resettable/>
            </ReferenceInput>
            <ReferenceInput source="interests" reference="interests" label="Interés" filterToQuery={searchText => ({ name: searchText })} sort={{ field: 'name', order: 'ASC' }} alwaysOn resettable>
                <AutocompleteInput optionText="name" resettable/>
            </ReferenceInput>
            <ReferenceInput source="organizer" reference="organizations" label="Promotor"  filterToQuery={searchText => ({ name: searchText })} sort={{ field: 'name', order: 'ASC' }} alwaysOn resettable>
                <AutocompleteInput optionText="name" resettable/>
            </ReferenceInput>
            <TextInput source="promotor" label="Buscar por organizador" alwaysOn resettable/>
            <ReferenceInput source="organizer" reference="users" label="Mentor" filter={ {role: 'Mentor'}}  filterToQuery={searchText => ({ firstName: searchText })} sort={{ field: 'firstName', order: 'ASC' }} alwaysOn resettable>
                <AutocompleteInput optionText="firstName" resettable/>
            </ReferenceInput>
            <ReferenceInput source="address.country" reference="countries" label="País" filter={{active: true}} filterToQuery={searchText => ({ name: searchText })} sort={{ field: 'name', order: 'ASC' }} alwaysOn resettable>
                <AutocompleteInput optionText="name" resettable/>
            </ReferenceInput>
            <ReferenceInput source="address.province" reference="provinces" label="Provincia" filter={{active: true}} filterToQuery={searchText => ({ name: searchText })} sort={{ field: 'name', order: 'ASC' }}  perPage={maxPerPage} alwaysOn resettable>
                <AutocompleteInput optionText="name" resettable/>
            </ReferenceInput>
            <ReferenceInput source="address.city" reference="cities" label="Municipio" filter={{active: true}} filterToQuery={searchText => ({ name: searchText })} sort={{ field: 'name', order: 'ASC' }} perPage={maxPerPage} alwaysOn resettable>
                <AutocompleteInput optionText="name" resettable/>
            </ReferenceInput>
            {/* <ReferenceInput source="address.country" reference="countries" label="Online" filter={{active: false}} filterToQuery={searchText => ({ name: searchText })} sort={{ field: 'name', order: 'ASC' }} alwaysOn resettable>
                <AutocompleteInput optionText="name" resettable/>
            </ReferenceInput> */}
            <SelectInput label="Modalidad" source="modality" choices={modalityChoices} optionText="name" optionValue="_id" allowEmpty alwaysOn/>
        </Filter>
    )
};


const ResourceListTitle = () => {
    return <span>Lista de recursos</span>;
};

const ListActionsUnemployed = props => {
    const { 
      className, 
    } = props;
    return (
      <TopToolbar className={className}>
        
      </TopToolbar>
    );
  };

export const ResourceListView = ({permissions, ...props}) => {
    const newProps = {...props};
    delete newProps.dispatch;   //Solution for Warning: Invalid value for prop `dispatch` on <div> tag. Either remove it from the element, or pass a string or number value to keep it in the DOM
    let filter;
    const referenceLink = permissions && !permissions['super-admin'] ? false : 'show';

    let role = props.user.role

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
            borderRadius: "50%",
            objectFit: "cover",
        }
    }));

    const imageFieldClasses = useImageFieldStyles();
    
    const ResourcesGrid = () => {
        const { ids, data, basePath } = useListContext();
        return (
            <div style={{ margin: '1em' }}>
            {ids.map(id => {
            return (
                <Card key={id} style={cardStyle}>
                    {(data[id].organizerType === 'Mentor') ? <CardHeader
                        avatar={<ReferenceField label="Mentor" resource="users" record={data[id]} source="organizer" reference="users" basePath={basePath} link={referenceLink}>
                            <ImageField classes={imageFieldClasses} source="profilePic.src" title="Foto" label="Foto"/>
                        </ReferenceField>}
                        title={<TextField record={data[id]} source="title" />}
                        subheader={<ReferenceField label="Organización" resource="organizations" record={data[id]} source="organizer" reference="organizations" basePath={basePath} link={referenceLink}>
                        <TextField source="name" />
                    </ReferenceField>}
                    /> : <CardHeader
                        avatar={<ReferenceField label="Organization" resource="organizations" record={data[id]} source="organizer" reference="organizations" basePath={basePath} link={referenceLink}>
                            <ImageField classes={imageFieldClasses} source="logoPic.src" title="Foto" label="Foto"/>
                        </ReferenceField>}
                        title={<TextField record={data[id]} source="title" />}
                        subheader={<ReferenceField label="Organización" resource="organizations" record={data[id]} source="organizer" reference="organizations" basePath={basePath} link={referenceLink}>
                        <TextField source="name" />
                    </ReferenceField> }
                />}
                    <CardContent> 
                         
                        
                        
                        {data[id].titulation &&  
                        <div>
                            <TextField record={data[id]} source="description" /> <br></br>
                            <Icon style={iconStyle} component={Folder}></Icon>&nbsp;
                            <TextField record={data[id]} emptyText="Tipo de recurso:" />&nbsp;
                            <ReferenceField label="Tipo" resource="resourcesTypes" record={data[id]} source="resourceType" reference="resourcesTypes" basePath={basePath} link={referenceLink}>
                                <TextField source="name" />
                            </ReferenceField>. &nbsp;<TextField record={data[id]} source="titulation" /> <br></br>
                        </div>
                        }
                        
                        {(data[id].titulation === undefined || data[id].titulation === null) && 
                        <div>
                            <TextField record={data[id]} source="description" /> <br></br>
                            <Icon style={iconStyle} component={Folder}></Icon>&nbsp;
                            <TextField record={data[id]} emptyText="Tipo de recurso:" />&nbsp;
                            <ReferenceField label="Tipo" resource="resourcesTypes" record={data[id]} source="resourceType" reference="resourcesTypes" basePath={basePath} link={referenceLink}>
                                <TextField source="name" />
                            </ReferenceField> <br></br>
                        </div>
                        
                        }
                        
                        {(data[id].contractType !== undefined && data[id].contractType !== '') ?
                        <div>
                            <Icon style={iconStyle} component={File}></Icon>&nbsp;
                            <TextField record={data[id]} emptyText="Tipo contrato:" />&nbsp; 
                            <TextField record={data[id]} source="contractType"/>&nbsp;
                        
                        </div> : null}

                        {(data[id].salary !== undefined && data[id].salary !== '') ?
                        <div>
                            <Icon style={iconStyle} component={Euro}></Icon>&nbsp;
                            <TextField record={data[id]} emptyText="Salario:" />&nbsp; 
                            <TextField record={data[id]} source="salary"/>&nbsp;
                        
                        </div> : null}

                        {(data[id].notExpire !== undefined && data[id].notExpire) ?  
                        <div><Icon style={iconStyle} component={CalendarViewDay}></Icon>&nbsp;<TextField record={data[id]} emptyText="El evento no caduca" /></div> : 
                        <div>
                            <Icon style={iconStyle} component={CalendarViewDay}></Icon>&nbsp;
                            <TextField record={data[id]} emptyText="Fecha:" />&nbsp; 
                            <DateField record={data[id]} source="start"/>-&nbsp;
                            <DateField record={data[id]} source="end"/><br></br>
                            <Icon style={iconStyle} component={EventBusy}></Icon>&nbsp;
                            <TextField record={data[id]} emptyText="Límite de inscripción:" />&nbsp; 
                            <DateField record={data[id]} source="maximumDate"/>
                            
                        </div>} 
                        {data[id].temporality &&  <div><TextField record={data[id]} source="temporality" /><br></br></div> }
                        
                        <Icon style={iconStyle} component={People}></Icon>&nbsp;
                        <TextField record={data[id]} emptyText="Aforo:" />&nbsp; 
                        <TextField record={data[id]} source="capacity" /> <br></br>

                        <Icon style={iconStyle} component={Modality}></Icon>&nbsp;
                        <TextField record={data[id]} emptyText="Modalidad:" />&nbsp; 
                        <TextField record={data[id]} source="modality" /> <br></br>

                        {(data[id].modality === 'Online') && 
                            <div>
                                <Icon style={iconStyle} component={Place}></Icon>&nbsp;
                                <TextField record={data[id]} source="address.place" />
                            </div>
                        }

                        {(data[id].modality === 'Presencial' || data[id].modality === 'Semipresencial' || data[id].modality === 'Online para residentes en ciudad') && 
                            <div>
                                <Icon style={iconStyle} component={Place}></Icon>&nbsp;
                                <ReferenceField resource="country" record={data[id]} source="address.country" reference="countries" basePath={basePath} link={referenceLink}>
                                    <TextField source="name" />
                                </ReferenceField>,&nbsp;
                                <ReferenceField resource="province" record={data[id]} source="address.province" reference="provinces" basePath={basePath} link={referenceLink}>
                                    <TextField source="name" />
                                </ReferenceField>,&nbsp;
                                <ReferenceField resource="city" record={data[id]} source="address.city" reference="cities" basePath={basePath} link={referenceLink}>
                                    <TextField source="name" />
                                </ReferenceField>,&nbsp;
                                {(data[id].address.street !== undefined && data[id].address.street !== '') ? <TextField record={data[id]} source="address.street"/>: null}
                                {(data[id].address.street !== undefined && data[id].address.street !== '') ? <Fragment>,&nbsp;</Fragment> : null}
                                <TextField record={data[id]} source="address.place" />
                            </div>
                        }

                        {(data[id].modality === 'Online para residentes en provincia') && 
                            <div>
                                <Icon style={iconStyle} component={Place}></Icon>&nbsp;
                                <ReferenceField resource="country" record={data[id]} source="address.country" reference="countries" basePath={basePath} link={referenceLink}>
                                    <TextField source="name" />
                                </ReferenceField>,&nbsp;
                                <ReferenceField resource="province" record={data[id]} source="address.province" reference="provinces" basePath={basePath} link={referenceLink}>
                                    <TextField source="name" />
                                </ReferenceField>,&nbsp;
                                <TextField record={data[id]} source="address.place" />
                            </div>
                        }

                        {(data[id].modality === 'Online para residentes en país') && 
                            <div>
                                <Icon style={iconStyle} component={Place}></Icon>&nbsp;
                                <ReferenceField resource="country" record={data[id]} source="address.country" reference="countries" basePath={basePath} link={referenceLink}>
                                    <TextField source="name" />
                                </ReferenceField>,&nbsp;
                                <TextField record={data[id]} source="address.place" />
                            </div>
                        }

                    </CardContent>

                    <CardActions style={{ textAlign: 'right' }}>
                        {(data[id].link !== undefined && data[id].link !== null && data[id].link !== '') ? <AddUserToExternalResource record={data[id]} /> : (data[id].participants !== undefined && data[id].participants !== null) && (data[id].participants.indexOf(props.user.userId) >= 0) ? 
                            <RemoveUserFromResource basePath={basePath} record={data[id]} userId={props.user.userId} /> : <AddUserToResource basePath={basePath} record={data[id]} userId={props.user.userId}/> 
                        } 
                    </CardActions>

                </Card>
            )
            }
            )}
            </div>
        );
    };

    if (permissions && !permissions['super-admin']) {
        if (permissions['organization']) {
            filter = {organizer: props.user.organization}
        } else if (permissions['mentor']) {
            filter = {organizer: props.user.userId}
        } else if (permissions['unemployed']) {
            return (
                <List title="Todos los recursos" {...props} filter={ {enable: true, trust: true}} filters={<ResourceFilterUnemployed />} sort={{ field: 'maximumDate', order: 'ASC' }} bulkActionButtons={false} actions={<ListActionsUnemployed/>}>
                    <ResourcesGrid />
                </List>
            )
            
        }
    }

    return (<List empty={<Empty />} {...newProps}
                  filters={<ResourceFilter role={role}/>}
                  title={<ResourceListTitle/>}
                  filter={filter}
                  sort={{ field: 'title', order: 'ASC' }}
    >
        <Datagrid rowClick="show" className={'resources'}>
            <ReferenceField source="resourcePictureId" reference="resourcesPictures" label="Foto">
                <ImageField classes={imageFieldClasses} source="resourcePhoto.src" title="Foto" label="Foto"/>
            </ReferenceField>
            <TextField source="title" label="Título"/>
            <DateField source="createdate" label="Creación"/>
            <DateField source="lastupdate" label="Actualización"/>
            <ReferenceField link={referenceLink} source="resourceType" reference="resourcesTypes" label="Tipo de recurso">
                <TextField source="name"/>
            </ReferenceField>
            <ChipFieldAvailability source="status" label="Disponibilidad"/>
            <ReferenceArrayField reference="interests" source="interests" label="Intereses">
                <SingleFieldList >
                    <ChipField source="name"/>
                </SingleFieldList>
            </ReferenceArrayField>
            <FunctionField label="Comienzo" render={record => new Date(record.start).getTime() >2556057600000 ? 'No expira' : `${moment(record.start).format("DD/MM/YYYY")}` } />
            <FunctionField label="Fecha máxima de inscripción" render={record => new Date(record.maximumDate).getTime() > 2555971200000 ? 'No expira' : `${moment(record.maximumDate).format("DD/MM/YYYY")}` } />
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
            {((permissions && permissions['super-admin']) || (props.user.role === 'Organización')) && <TextField source="promotor" label="Organizador"/>}
            <TextField source="modality" label="Modalidad"/>
            <TextField source="link" label="Link" emptyText='-'/>
            <BooleanField source="notExpire" label="No Expira"/>
            <BooleanField source="trust" label="Confianza"/>
            {props.user.role !== 'Desempleado' && <EditButton/>}
            {props.user.role !== 'Desempleado' && <DeleteButton/>}

        </Datagrid>
    </List>)
};

function mapStateToProps(state) {
    return {user: state.user}
}

const ResourceList = connect(mapStateToProps)(ResourceListView);
export default ResourceList;
