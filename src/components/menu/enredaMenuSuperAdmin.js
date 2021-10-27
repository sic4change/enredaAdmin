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

class EnREDAMenuSuperAdmin extends Component {

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
                    to={`/users`} 
                    primaryText="Usuarios"
                    leftIcon={<UserIcon />}
                    onClick={onMenuClick}
                    sidebarIsOpen={open}
                />

                <MenuItemLink
                    to={`/organizations`} 
                    primaryText="Organizaciones"
                    leftIcon={<OrganizationIcon />}
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

                <MenuItemLink
                    to={`/certificates`} 
                    primaryText="Certfificaciones"
                    leftIcon={<CertificateIcon />}
                    onClick={onMenuClick}
                    sidebarIsOpen={open}
                />

                <MenuItemLink
                    to={`/resourcesTypes`} 
                    primaryText="Tipos de recursos"
                    leftIcon={<CollectionsBookmarkIcon />}
                    onClick={onMenuClick}
                    sidebarIsOpen={open}
                />
            
                <MenuItemLink
                    to={`/countries`} 
                    primaryText="Países"
                    leftIcon={<CountryIcon />}
                    onClick={onMenuClick}
                    sidebarIsOpen={open}
                />

                <MenuItemLink
                    to={`/provinces`} 
                    primaryText="Provincias"
                    leftIcon={<ProvinceIcon />}
                    onClick={onMenuClick}
                    sidebarIsOpen={open}
                />

                <MenuItemLink
                    to={`/cities`} 
                    primaryText="Municipios"
                    leftIcon={<CityIcon />}
                    onClick={onMenuClick}
                    sidebarIsOpen={open}
                />

                <MenuItemLink
                    to={`/interests`} 
                    primaryText="Intereses laborales"
                    leftIcon={<InterestIcon />}
                    onClick={onMenuClick}
                    sidebarIsOpen={open}
                />

                <MenuItemLink
                    to={`/specificInterests`} 
                    primaryText="Intereses l. específicos"
                    leftIcon={<SpecifictInterestIcon />}
                    onClick={onMenuClick}
                    sidebarIsOpen={open}
                />

                <MenuItemLink
                    to={`/abilities`} 
                    primaryText="Habilidades"
                    leftIcon={<AbilityIcon />}
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

export default enhance(EnREDAMenuSuperAdmin);