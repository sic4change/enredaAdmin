import * as React from "react";
import {
    TextField,
    TopToolbar,
    EditButton,
    DeleteButton,
    ListButton,
    ShowController,
    Tab,
    TabbedShowLayout,
    ShowView,
    ReferenceArrayField,
    Datagrid,
    ReferenceField,
    ArrayField
    
} from 'react-admin';

const ActivityShowActions = ({basePath, data, resource}) => (
    <TopToolbar>
        <EditButton basePath={basePath} record={data}/>
        <DeleteButton basePath={basePath} record={data} resource={resource}/>
        <ListButton basePath={basePath}/>
    </TopToolbar>
);

const ActivityTitle = ({record}) => {
    return <span>Actividad: {record ? `${record.name}` : ''}</span>;
};

export const ActivitiesShow = ({permissions, ...props}) => {
    return (<ShowController {...props}>
        {controllerProps =>
            <ShowView {...props} {...controllerProps} actions={<ActivityShowActions/>} title={<ActivityTitle/>}>
                <TabbedShowLayout syncWithLocation={false}>
                    <Tab label="información" contentClassName={'courseGridLayoutShow'}>
                    {controllerProps.record && controllerProps.record.name && 
                        <TextField source="name" label="Actividad"/>
                    }
                    {controllerProps.record && controllerProps.record.competencies &&
                        <ArrayField source="competencies" label="Competencias" addLabel={false}>
                        <Datagrid>
                            <ReferenceField source="competencyId" label="Competencias" reference="competencies" sortByOrder="DESC">
                                <TextField source="name"/>
                            </ReferenceField>
                            <TextField source="points" label="Puntos" />
                        </Datagrid>
                        </ArrayField>
                    }
                    </Tab>
                </TabbedShowLayout>
            </ShowView>
        }
    </ShowController>)
}
export default ActivitiesShow;
