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
            filter = {createdby: props.user.email}
        }
    }
    return (<List {...props} 
            filters={<ResourcePictureFilter/>} 
            title={<ResourcePictureTitle/>} 
            filter={filter}
            sort={{ field: 'resourcePhoto.title', order: 'ASC' }}
            >
        <Datagrid className="resourcePictures">
            <ImageField classes={imageFieldClasses} source="resourcePhoto.src" title="Foto" label="Foto"/>
            <TextField source="resourcePhoto.title" label="Nombre"/>    
            <EditButton/>
            <DeleteButton/>
        </Datagrid>
    </List>)
};

function mapStateToProps(state) {
    return {user: state.user}
}

const ResourcePicturesList = connect(mapStateToProps)(ResourcePicturesListView);
export default ResourcePicturesList;



