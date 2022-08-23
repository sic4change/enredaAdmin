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

const CompetenciesFilter = ({permissions, ...props}) => {
    return(
        <Filter {...props}>
            <TextInput source="name" label="Competencia" alwaysOn resettable/>
        </Filter>
    )
};

const CompetenciesTitle = () => {
    return <span>Lista de Competencias</span>;
};

const CompetenciesListActions = (props) => {
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
        downloadCSV(csv, 'competencies'); 
    }); 
});
};

export const CompetenciesListView = ({permissions, record, ...props}) => {
    
    const userIsAdmin = permissions && permissions['super-admin'];

    return (<List {...props} 
            filters={<CompetenciesFilter/>} 
            title={<CompetenciesTitle/>} 
            sort={{ field: 'name', order: 'ASC' }}
            actions={<CompetenciesListActions />}
            exporter={exporter}
            >
        <Datagrid className="competencies">
            <TextField source="name" label="Competencia"/>      
            { userIsAdmin && <EditButton/> }
            { userIsAdmin && <DeleteButton/> }
        </Datagrid>
    </List>)
};

function mapStateToProps(state) {
    return {user: state.user}
}

const CompetenciesList = connect(mapStateToProps)(CompetenciesListView);
export default CompetenciesList;



