import React, { Component } from 'react';
import PropTypes from 'prop-types';
import User from '@material-ui/icons/AccountCircle';
import { Button } from '@material-ui/core';
import { withStyles} from '@material-ui/core/styles';
import { addUserInResource, removeUserInResource } from '../../resources/actions/resourceActions';

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

class RemoveUserInResource extends Component {

    constructor(props) {
        super(props);
        this.state = {
            text: 'Quitar',
            color: "ff5c5c",
        }
    }
    
    handleremoveUserInResource = () => {
        const { basePath, record, userId } = this.props;
        console.log('Aqui record', record.userId);
        console.log('Aqui userid', userId);
        if (this.state.text === 'Quitar') {
            this.setState({
                text: 'Añadir',
                color: "secondary",
            })
            removeUserInResource(userId.id, record.id);
        } else {
            this.setState({
                text: 'Quitar',
                color: "#ff5c5c",
            })
            addUserInResource(userId.id, record.id);
        }
    }

    render() {
        return <Button  color={this.state.color} startIcon={<User/>} onClick={this.handleremoveUserInResource} >
            {this.state.text}
        </Button>

    }
}

RemoveUserInResource.propTypes = {
    record: PropTypes.object,
};

const enhance = compose(
    connect(null, {
        removeUserInResource: removeUserInResource,
        addUserInResource: addUserInResource,
    }),
    withStyles(styles)
);

export default enhance(RemoveUserInResource);
