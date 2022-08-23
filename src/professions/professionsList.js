import * as React from "react";
import {
    List,
    Datagrid,
    TextField,
    EditButton,
    DeleteButton,
    TextInput,
    Filter,
    downloadCSV,
    TopToolbar,
    ExportButton,
    CreateButton,
}
    from 'react-admin';
import {connect} from 'react-redux';
import jsonExport from 'jsonexport/dist';
import { ImportButton } from "react-admin-import-csv";

const ProfessionFilter = ({permissions, ...props}) => {
    return(
        <Filter {...props}>
            <TextInput source="name" label="Profesión" alwaysOn resettable/>
        </Filter>
    )
};

const ProfessionTitle = () => {
    return <span>Lista de Profesiones</span>;
};

const ProfessionListActions = (props) => {
    const {
      className,
      total,
      resource,
      currentSort,
      filterValues,
    } = props;
    return (
      <TopToolbar className={className}>
        <CreateButton/>
        <ExportButton
          maxResults='99999999999999999999999999999999999999999'
          disabled={total === 0}
          resource={resource}
          sort={currentSort}
          filter={filterValues}
        />
        <ImportButton {...props} />
      </TopToolbar>
    );
  };

const exporter =(records, fetchRelatedRecords) => {
    fetchRelatedRecords(records).then(users => {
        const data = records.map(record => ({
                ...record,
        }));
    jsonExport(data, {
        headers: ['id','name','lastupdate','updatedby','createdate','createdby'] // order fields in the export
    }, (err, csv) => {
        downloadCSV(csv, 'professions'); 
    }); 
});
};

export const ActivitiesListView = ({permissions, record, ...props}) => {
    
    const userIsAdmin = permissions && permissions['super-admin'];

    return (<List {...props} 
            filters={<ProfessionFilter/>} 
            title={<ProfessionTitle/>} 
            sort={{ field: 'name', order: 'ASC' }}
            actions={<ProfessionListActions />}
            exporter={exporter}
            >
        <Datagrid className="professions" rowClick="show">
            <TextField source="name" label="Profesión"/>      
            { userIsAdmin && <EditButton/> }
            { userIsAdmin && <DeleteButton/> }
        </Datagrid>
    </List>)
};

function mapStateToProps(state) {
    return {user: state.user}
}

const ActivitiesList = connect(mapStateToProps)(ActivitiesListView);
export default ActivitiesList;



