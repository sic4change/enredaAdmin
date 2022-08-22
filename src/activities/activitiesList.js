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
}
    from 'react-admin';
import {connect} from 'react-redux';
import jsonExport from 'jsonexport/dist';
import { ImportButton } from "react-admin-import-csv";

const ActivityFilter = ({permissions, ...props}) => {
    return(
        <Filter {...props}>
            <TextInput source="name" label="Actividad" alwaysOn resettable/>
        </Filter>
    )
};

const ActivityTitle = () => {
    return <span>Lista de Actividades</span>;
};

const ActivityListActions = (props) => {
    const {
      className,
      total,
      resource,
      currentSort,
      filterValues,
    } = props;
    return (
      <TopToolbar className={className}>
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
        downloadCSV(csv, 'activities'); 
    }); 
});
};

export const ActivitiesListView = ({permissions, record, ...props}) => {
    
    const userIsAdmin = permissions && permissions['super-admin'];

    return (<List {...props} 
            filters={<ActivityFilter/>} 
            title={<ActivityTitle/>} 
            sort={{ field: 'name', order: 'ASC' }}
            actions={<ActivityListActions />}
            exporter={exporter}
            >
        <Datagrid className="activities">
            <TextField source="name" label="Actividad"/>      
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



