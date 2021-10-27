import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { MenuItemLink, Responsive } from 'react-admin';
import DashboardIcon from '@material-ui/icons/Dashboard';
import UserIcon from '@material-ui/icons/Group';
import CollectionsBookmarkIcon from '@material-ui/icons/CollectionsBookmark';
import OrganizationIcon from '@material-ui/icons/Business';
import CountryIcon from '@material-ui/icons/Public';
import ProvinceIcon from '@material-ui/icons/Map';
import CityIcon from '@material-ui/icons/Place';
import InterestIcon from '@material-ui/icons/ViewAgenda';
import SpecifictInterestIcon from '@material-ui/icons/ViewCarousel';
import ResourceIcon from '@material-ui/icons/Bookmarks';
import CertificateIcon from '@material-ui/icons/Star';
import AbilityIcon from '@material-ui/icons/GolfCourse';

import { connect } from 'react-redux';
import compose from 'recompose/compose';
import { withRouter } from 'react-router-dom';

class EnREDAMenuMentor extends Component {

    static propTypes = {
        onMenuClick: PropTypes.func,
        logout: PropTypes.object,
    };

    handleToggle = menu => {
        this.setState(state => ({ [menu]: !state[menu] }));
    };

    render() {
        const { onMenuClick, open, logout} = this.props;
        return (
            <div>
                <br></br>
                <MenuItemLink
                    to={`/`} // by default react-admin renders Dashboard on this route
                    primaryText="Dashboard"
                    leftIcon={<DashboardIcon />}
                    onClick={onMenuClick}
                    sidebarIsOpen={open}
                />

                <MenuItemLink
                    to={`/resources`} 
                    primaryText="Recursos"
                    leftIcon={<ResourceIcon />}
                    onClick={onMenuClick}
                    sidebarIsOpen={open}
                />

                <Responsive
                    small={logout}
                    medium={null} // Pass null to render nothing on larger devices
                />
            </div>
        );
    }
}

const mapStateToProps = state => ({
    open: state.admin.ui.sidebarOpen,
    theme: state.theme,
});

const enhance = compose(
    withRouter,
    connect(
        mapStateToProps,
        {}
    )
);

export default enhance(EnREDAMenuMentor);