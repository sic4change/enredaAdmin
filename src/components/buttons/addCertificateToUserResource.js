import React, { Component } from 'react';
import PropTypes from 'prop-types';
import File from '@material-ui/icons/InsertDriveFile';
import { Button } from '@material-ui/core';
import { withStyles} from '@material-ui/core/styles';
import { Link } from 'react-router-dom';

import { connect } from 'react-redux';
import compose from 'recompose/compose';

const styles = theme => ({
    buttonPadding: {    
      margin: '0 auto',
      marginTop: '10px',
      marginBottom: '10px',
      display: 'block',   
    },
  });

class AddCertificateToUserResource extends Component {

    constructor(props) {
        super(props);
        this.state = {
            text: 'Crear Certificado',
            color: "ff5c5c",
        }
    }

    render() {
        const { record, userId } = this.props;
        console.log('Aqui record', record.userId);
        console.log('Aqui userid', userId);
        return <Button component={Link} to={ { pathname: `/certificates/create`, state: { record: {resource: userId.resourceId, user: record.userId, finished: false} }} } startIcon={<File/>} label={"Crear certificado"}/>
    }
}

AddCertificateToUserResource.propTypes = {
    record: PropTypes.object,
};

const enhance = compose(
    connect(null, {
    }),
    withStyles(styles)
);

export default enhance(AddCertificateToUserResource);
