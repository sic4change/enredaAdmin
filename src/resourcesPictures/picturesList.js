import * as React from "react";
import {
    List,
    Datagrid,
    TextField,
    EditButton,
    DeleteButton,
    TextInput,
    Filter,
    ImageField,
    ReferenceField,
    ReferenceInput,
    AutocompleteInput

}
    from 'react-admin';
import {connect} from 'react-redux';
import './resourcePictureStyles.scss';
import { makeStyles } from '@material-ui/core/styles';

const ResourcePictureFilter = ({permissions, ...props}) => {
    return(
        <Filter {...props}>
            <TextInput source="name" label="Nombre" alwaysOn resettable/>
            <ReferenceInput source="resourceTypeId" reference="resourcesTypes" label="Tipo" filterToQuery={searchText => ({ title: searchText })} sort={{ field: 'name', order: 'ASC' }} alwaysOn resettable>
                <AutocompleteInput optionText="name"  resettable/>
            </ReferenceInput>
        </Filter>
    )
};

const ResourcePictureTitle = () => {
    return <span>Lista de fotos de recursos</span>;
};

export const ResourcePicturesListView = ({permissions, ...props}) => {

    const useImageFieldStyles = makeStyles(theme => ({
        image: { 
            width: 150,
            height: 100,
            display: "block",
            borderRadius: "0%",
            objectFit: "cover",
        }
    }));
    const imageFieldClasses = useImageFieldStyles();
    let filter;
    if (permissions && !permissions['super-admin']) {
        if (permissions['organization']) {
            filter = {organizer: props.user.organization}
        }
    }
    return (<List {...props} 
            filters={<ResourcePictureFilter/>} 
            title={<ResourcePictureTitle/>} 
            sort={{ field: 'resourcePictureId', order: 'ASC' }}
            filter={filter}
            >
        <Datagrid className="resourcePictures">
            <ImageField classes={imageFieldClasses} source="resourcePhoto.src" title="Foto" label="Foto"/>
            <TextField source="name" label="Nombre"/>
            <ReferenceField source="resourceTypeId" reference="resourcesTypes" label="Tipo de recurso">
                <TextField source="name" label="Tipo de recurso"/>
            </ReferenceField>
            <ReferenceField source="organizer" reference="organizations" label="Organizador">
                <TextField source="name" label="Organizador"/>
            </ReferenceField>
            {props.user.role !== 'Desempleado' && <EditButton/>}
            {props.user.role !== 'Desempleado' && <DeleteButton/>}
        </Datagrid>
    </List>)
};

function mapStateToProps(state) {
    return {user: state.user}
}

const ResourcePicturesList = connect(mapStateToProps)(ResourcePicturesListView);
export default ResourcePicturesList;



