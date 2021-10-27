import * as React from 'react';
import { Layout } from 'react-admin';
import enREDaAppBar from '../appbar/enREDaAppbar';
import EnredaMenuMentor from '../menu/enredaMenuMentor';

const enREDaLayoutMentor = (props) =>  {
    return <Layout {...props} 
    menu={EnredaMenuMentor}
    appBar={enREDaAppBar} />;
} 

export default enREDaLayoutMentor;
