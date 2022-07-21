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
    Button
}
    from 'react-admin';
import {connect} from 'react-redux';
import './resourcePictureStyles.scss';
import { makeStyles } from '@material-ui/core/styles';

const ResourcePictureFilter = ({permissions, ...props}) => {
    return(
        <Filter {...props}>
            <TextInput source="name" label="Nombre" alwaysOn resettable/>
        </Filter>
    )
};

const ResourcePictureTitle = () => {
    return <span>Lista de fotos de recursos</span>;
};

const useStyles = makeStyles(theme => ({
    button: {
      marginTop: theme.spacing(1),
      marginBottom: theme.spacing(1),
      color: 'white !important'
    },
  }));

export const ResourcePicturesListView = ({permissions, record, ...props}) => {

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
    
    const currentUserMail = props ? props.user.email : null;
    const userIsAdmin = permissions && permissions['super-admin'];
    const userIsOrganization = permissions && permissions['organization'];

    const EditResourcePicture = ({ record }) => {
        const currentPicture = record ? record.createdby : null;
        if (permissions && permissions['organization'] && currentUserMail == currentPicture || permissions && permissions['super-admin'] ) {
            return <EditButton record={record}/>;
        }
        if (permissions && permissions['organization'] && currentUserMail != currentPicture ) {
            return null;
        }
    };
    
    const DeleteResourcePicture = ({ record }) => {
        const currentPicture = record ? record.createdby : null;
        if (permissions && permissions['organization'] && currentUserMail == currentPicture || permissions && permissions['super-admin'] ) {
            return <DeleteButton record={record}/>;
        }
        if (permissions && permissions['organization'] && currentUserMail != currentPicture ) {
            return null;
        }
    };

    return (<List {...props} 
            filters={<ResourcePictureFilter/>} 
            title={<ResourcePictureTitle/>} 
            sort={{ field: 'resourcePhoto.title', order: 'ASC' }}
            >
        <Datagrid className="resourcePictures">
            <ImageField classes={imageFieldClasses} source="resourcePhoto.src" title="Foto" label="Foto"/>
            <TextField source="resourcePhoto.title" label="Nombre"/>    
            
            { userIsAdmin && <EditButton record={record}/> }
            { userIsAdmin && <DeleteButton record={record}/> }

            { userIsOrganization && <EditResourcePicture/>}
            { userIsOrganization && <DeleteResourcePicture/>}

        </Datagrid>
    </List>)
};

function mapStateToProps(state) {
    return {user: state.user}
}

const ResourcePicturesList = connect(mapStateToProps)(ResourcePicturesListView);
export default ResourcePicturesList;



