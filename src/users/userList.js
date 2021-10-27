import * as React from "react";
import {
    List,
    Datagrid,
    TextField,
    EmailField,
    EditButton,
    DeleteButton,
    TextInput,
    ReferenceField,
    Filter,
    ReferenceInput,
    AutocompleteInput,
    SelectInput,
    BooleanField,
    ImageField,
}
    from 'react-admin';

import { makeStyles } from '@material-ui/core/styles';

import {connect} from 'react-redux';
import './userStyles.scss';

import { Fragment } from 'react';
import { BulkDeleteButton } from 'react-admin';

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
                {role === 'Super Admin' && 
                    <ReferenceInput source="organization" reference="organizations" label="Organización" alwaysOn>
                        <SelectInput optionText="name"/>
                    </ReferenceInput>
                }
                {role === 'Super Admin' && 
                    <SelectInput label="Rol" source="role" choices={rolesChoices} optionText="name" optionValue="_id" allowEmpty alwaysOn/>
                }
                {role === 'Super Admin' && 
                    <SelectInput label="Tipo" source="unemployedType" choices={typeChoices} optionText="name" optionValue="_id" allowEmpty alwaysOn/>
                }
            </Filter>
        )
};

const UserListTitle = () => {
    return <span>Lista de usuarios</span>;
};

const PostBulkActionButtons = props => (
    <Fragment>
        <BulkDeleteButton {...props} />
    </Fragment>
);

export const UserListView = ({permissions, ...props}) => {

    const useImageFieldStyles = makeStyles(theme => ({
        image: { 
            width: 50,
            height: 50,
            display: "block",
            borderRadius: "50%",
        }
    }));

    const imageFieldClasses = useImageFieldStyles();

        let role = props.user.role
        const newProps = {...props};
        delete newProps.dispatch;   //Solution for Warning: Invalid value for prop `dispatch` on <div> tag. Either remove it from the element, or pass a string or number value to keep it in the DOM
        const filter = permissions && !permissions['super-admin'] ? {organization: props.user.organization} : {};
        const bulkActionButtonsBoolean = permissions && !permissions['super-admin'] ? false : <PostBulkActionButtons/>;

        return (<List {...newProps}
                      bulkActionButtons={bulkActionButtonsBoolean}
                      filters={<UserFilter  role={role}/>}
                      filter={filter}
                      title={<UserListTitle/>}
                      sort={{ field: 'firstName', order: 'ASC' }}>
            <Datagrid rowClick="show">
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
                {permissions && permissions['super-admin'] && <TextField source="unemployedType" label="Tipo"/>}
                {permissions && permissions['super-admin'] &&
                    <ReferenceField link="show" source="organization" reference="organizations" label="Organización">
                        <TextField source="name"/>
                    </ReferenceField>
                }
                {permissions && permissions['super-admin'] &&
                    <BooleanField source="active" label="Activo"/>
                }
                {permissions && permissions['super-admin'] && <EditButton/>}
                {permissions && permissions['super-admin'] && <DeleteButton/>}
            </Datagrid>
        </List>)
    }
;

function mapStateToProps(state) {
    return {user: state.user}
}

const UserList = connect(mapStateToProps)(UserListView);
export default UserList;
