import * as React from 'react';
import { Layout } from 'react-admin';
import enREDaAppBar from '../appbar/enREDaAppbar';
import EnredaMenuOrganization from '../menu/enredaMenuOrganization';

const enREDaLayoutOrganization = (props) =>  {
    return <Layout {...props} 
    menu={EnredaMenuOrganization}
    appBar={enREDaAppBar} />;
} 

export default enREDaLayoutOrganization;
