import * as React from "react";
import {
    List,
    Datagrid,
    TextField,
    EditButton,
    DeleteButton,
    TextInput,
    Filter,
}
    from 'react-admin';
import './interestStyles.scss';

const InterestsFilter = ({permissions, ...props}) => (
    <Filter {...props}>
        <TextInput source="name" label="Buscar por nombre" alwaysOn/>
    </Filter>
);

const InterestsTitle = () => {
    return <span>Lista de intereses</span>;
};

export const InterestList = ({permissions, ...props}) => {
        return (<List {...props} filters={<InterestsFilter/>} title={<InterestsTitle/>} sort={{ field: 'name', order: 'ASC' }}>
            <Datagrid className="interests">
                <TextField source="name" label="Nombre"/>
                {permissions && permissions['super-admin'] && <EditButton/>}
                {permissions && permissions['super-admin'] && <DeleteButton/>}
            </Datagrid>
        </List>)
    }
;

export default InterestList;
