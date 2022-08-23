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
    SingleFieldList,
    ChipField
    
} from 'react-admin';

const ProfessionShowActions = ({basePath, data, resource}) => (
    <TopToolbar>
        <EditButton basePath={basePath} record={data}/>
        <DeleteButton basePath={basePath} record={data} resource={resource}/>
        <ListButton basePath={basePath}/>
    </TopToolbar>
);

const ProfessionTitle = ({record}) => {
    return <span>Profesión: {record ? `${record.name}` : ''}</span>;
};

export const ProfessionShow = ({permissions, ...props}) => {
    return (<ShowController {...props}>
        {controllerProps =>
            <ShowView {...props} {...controllerProps} actions={<ProfessionShowActions/>} title={<ProfessionTitle/>}>
                <TabbedShowLayout syncWithLocation={false}>
                    <Tab label="información" contentClassName={'courseGridLayoutShow'}>
                    {controllerProps.record && controllerProps.record.name && 
                        <TextField source="name" label="Profesión"/>
                    }
                    {controllerProps.record && controllerProps.record.activities &&
                        <ReferenceArrayField reference="activities" source="activities" label="Actividades">
                            <SingleFieldList >
                                <ChipField source="name"/>
                            </SingleFieldList>
                        </ReferenceArrayField>
                    }
                    </Tab>
                </TabbedShowLayout>
            </ShowView>
        }
    </ShowController>)
}
export default ProfessionShow;
