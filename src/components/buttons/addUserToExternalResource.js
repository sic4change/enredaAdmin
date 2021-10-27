import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AssignmentTurnedInIcon from '@material-ui/icons/AssignmentTurnedIn';
import { Button } from '@material-ui/core';
import { withStyles} from '@material-ui/core/styles';

const styles = theme => ({
    buttonPadding: {    
      margin: '0 auto',
      marginTop: '10px',
      marginBottom: '10px',
      display: 'block',   
    },
  });

class AddUserToExternalResource extends Component {
    
    render() {
        const { record} = this.props;
        return <Button variant="outlined" color="secondary" startIcon={<AssignmentTurnedInIcon />} href={record.link} target="_blank" >
            Me interesa participar
        </Button>

    }
}

AddUserToExternalResource.propTypes = {
    record: PropTypes.object,
};


export default withStyles(styles)(AddUserToExternalResource);