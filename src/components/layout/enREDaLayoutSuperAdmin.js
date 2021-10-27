import * as React from 'react';
import { Layout } from 'react-admin';
import enREDaAppBar from '../appbar/enREDaAppbar';
import enredaMenu from '../menu/enredaMenuSuperAdmin';

const enREDaLayoutSuperAdmin = (props) =>  {
    return <Layout {...props} 
   //menu={enredaMenu}
    appBar={enREDaAppBar} />;
} 

export default enREDaLayoutSuperAdmin;
