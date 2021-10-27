import * as React from "react";
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
    AutocompleteInput,
}
    from 'react-admin';
import './specificInterestStyles.scss';

const SpecificInterestFilter = ({permissions, ...props}) => (
    <Filter {...props}>
        <TextInput source="name" label="Buscar por nombre" alwaysOn/>
        <ReferenceInput source="interestId" reference="interests" label="Interés laboral"  filterToQuery={searchText => ({ name: searchText })} sort={{ field: 'name', order: 'ASC' }} alwaysOn resettable>
            <AutocompleteInput optionText="name"/>
        </ReferenceInput>
    </Filter>
);

const SpecificInterestTitle = () => {
    return <span>Lista de intereses laborales específicos</span>;
};

export const SpecificInterestList = ({permissions, ...props}) => {
        return (<List {...props} filters={<SpecificInterestFilter/>} title={<SpecificInterestTitle/>} sort={{ field: 'name', order: 'ASC' }}>
            <Datagrid className="specificInterests">
                <TextField source="name" label="Nombre"/>
                <ReferenceField link="show" source="interestId" reference="interests" label="Interés laboral">
                    <TextField source="name"/>
                </ReferenceField>
                {permissions && permissions['super-admin'] && <EditButton/>}
                {permissions && permissions['super-admin'] && <DeleteButton/>}
            </Datagrid>
        </List>)
    }
;

export default SpecificInterestList;
