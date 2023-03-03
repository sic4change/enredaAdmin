import * as React from "react";
import {
    List,
    Datagrid,
    TextField,
    EditButton,
    DeleteButton,
    TextInput,
    Filter,
    RichTextField,
    NumberField
}
    from 'react-admin';
import './resourceCategoryStyles.scss';

const ResourceCategoryFilter = ({permissions, ...props}) => (
    <Filter {...props}>
        <TextInput source="name" label="Buscar por nombre" alwaysOn/>
    </Filter>
);

const ResourceCategoryTitle = () => {
    return <span>Lista de categoría de recursos</span>;
};

export const ResourceCategoryList = ({permissions, ...props}) => {
        return (<List {...props} filters={<ResourceCategoryFilter/>} title={<ResourceCategoryTitle/>} sort={{ field: 'order', order: 'ASC' }}>
            <Datagrid className="resourcesCategories">
                <NumberField source="order" label="Orden" />
                <TextField source="name" label="Categoría"/>
                {permissions && permissions['super-admin'] && <EditButton/>}
                {permissions && permissions['super-admin'] && <DeleteButton/>}
            </Datagrid>
        </List>)
    }
;

export default ResourceCategoryList;
