import * as React from "react";
import {
    List,
    Datagrid,
    TextField,
    EmailField,
    ImageField,
    BooleanField,
    EditButton,
    DeleteButton,
    ReferenceInput,
    AutocompleteInput,
    ReferenceField,
    Filter,
    TextInput,
    //BooleanInput
}
    from 'react-admin';

import { makeStyles } from '@material-ui/core/styles';

import CustomURLField from '../components/fields/customURLField';
import './organizationStyles.scss';

const UserFilter = (props) => (
    <Filter {...props}>
        <TextInput source="name" label="Nombre" alwaysOn resettable/>
        <ReferenceInput source="address.country" reference="countries" filter={{active: true}} label="País" filterToQuery={searchText => ({ name: searchText })} sort={{ field: 'name', order: 'ASC' }} alwaysOn resettable>
            <AutocompleteInput optionText="name" resettable/>
        </ReferenceInput>
        <ReferenceInput source="address.province" reference="provinces" filter={{active: true}} label="Provincia" filterToQuery={searchText => ({ name: searchText })} sort={{ field: 'name', order: 'ASC' }} alwaysOn resettable>
            <AutocompleteInput optionText="name" resettable/>
        </ReferenceInput>
        <ReferenceInput source="address.city" reference="cities" label="Municipio" filter={{active: true}} filterToQuery={searchText => ({ name: searchText })} sort={{ field: 'name', order: 'ASC' }} alwaysOn resettable>
            <AutocompleteInput optionText="name" resettable/>
        </ReferenceInput>
        {/* <BooleanInput source="trust" label="Confianza" alwaysOn resettable></BooleanInput> */}
    </Filter>
);

const UserListTitle = () => {
    return <span>Lista de organizaciones</span>;
};

export const OrganizationList = ({permissions, ...props}) => {

    const useImageFieldStyles = makeStyles(theme => ({
        image: { 
            width: 100,
            height: 100,
            display: "block",
        }
    }));

    const imageFieldClasses = useImageFieldStyles();

    return (<List {...props} filters={<UserFilter/>} title={<UserListTitle/>} sort={{ field: 'name', order: 'ASC' }}>
        <Datagrid rowClick="show">
            <ImageField classes={imageFieldClasses} source="logoPic.src" title="Foto" label="Foto"/>
            <TextField source="name" label="Nombre"/>
            <ReferenceField link={false} source="address.country" reference="countries" label="País">
                <TextField source="name"/>
            </ReferenceField>
            <ReferenceField link={false} source="address.province" reference="provinces" label="Provincia">
                <TextField source="name"/>
            </ReferenceField>
            <ReferenceField link={false} source="address.city" reference="cities" label="Municipio">
                <TextField source="name"/>
            </ReferenceField>
            <EmailField source="email" label='Email'/>
            <CustomURLField source="website" label="Sitio web"/>
            <TextField source="phone" label="Teléfono" emptyText="-"/>
            <BooleanField source="trust" label="Confianza"/>
            {permissions && permissions['super-admin'] && <EditButton/>}
            {permissions && permissions['super-admin'] && <DeleteButton/>}
        </Datagrid>
    </List>)
};

export default OrganizationList;
