import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AssignmentTurnedInIcon from '@material-ui/icons/AssignmentTurnedIn';
import { Button } from '@material-ui/core';
import { withStyles} from '@material-ui/core/styles';
import { addResourceToUser, addUserToResource, removeResourceToUser } from '../../resources/actions/resourceActions';
import { removeUserFromResource } from '../../resources/actions/resourceActions';

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

class AddUserToResource extends Component {

    constructor(props) {
        super(props);
        this.state = {
            text: 'Me interesa participar',
            color: "secondary"
        }
    }

    handleAddUserToResource = () => {
        const { basePath, record, userId } = this.props;
        if (this.state.text === 'No me interesa participar') {
            this.setState({
                text: 'Me interesa participar',
                color: "secondary"
            })
            removeUserFromResource(record.id, record, basePath, userId);
            removeResourceToUser(record.id, record, basePath, userId);
        } else {
            this.setState({
                text: 'No me interesa participar',
                color: "#ff5c5c"
            })
            addUserToResource(record.id, record, basePath, userId);
            addResourceToUser(record.id, record, basePath, userId);
        }
        
    }

    render() {
        //const { basePath, record} = this.props;
        return <Button variant="outlined" color={this.state.color} startIcon={<AssignmentTurnedInIcon />} onClick={this.handleAddUserToResource} >
            {this.state.text}
        </Button>

    }
}

AddUserToResource.propTypes = {
    record: PropTypes.object,
};

const enhance = compose(
    connect(null, {
        addUserToResource: addUserToResource,
        addResourceToUser: addResourceToUser,
        removeUserFromResource: removeUserFromResource,
        removeResourceToUser: removeResourceToUser
    }),
    withStyles(styles)
);

export default enhance(AddUserToResource);
