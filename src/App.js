import React, {Component} from 'react';
import './App.css';
import {Admin, Resource, Loading} from 'react-admin';
import UserList from './users/userList';
import UserCreate from './users/userCreate'
import UserShow from './users/userShow'
import UserEdit from './users/userEdit'
import Dashboard from './components/dashboard/dashboard';
import UserIcon from '@material-ui/icons/Group';
import CollectionsBookmarkIcon from '@material-ui/icons/CollectionsBookmark';
import OrganizationIcon from '@material-ui/icons/Business';
import polyglotI18nProvider from 'ra-i18n-polyglot';
import spanishMessages from '@blackbox-vision/ra-language-spanish';
import Login from "./login/CustomLoginPage";
import OrganizationCreate from "./organizations/organizationCreate";
import OrganizationList from "./organizations/organizationList";
import OrganizationEdit from "./organizations/organizationEdit";
import OrganizationShow from "./organizations/organizationShow";
import CountryIcon from '@material-ui/icons/Public';
import CountryCreate from "./countries/countryCreate";
import CountryList from "./countries/countryList";
import CountryEdit from "./countries/countryEdit";
import {authProvider, dataProvider} from "./firebase/firebaseConfig"
import getCurrentUser from "./firebase/userService"
import ProvinceIcon from '@material-ui/icons/Map';
import ProvinceList from "./provinces/provinceList";
import ProvinceEdit from "./provinces/provinceEdit";
import ProvinceCreate from "./provinces/provinceCreate";
import CityIcon from '@material-ui/icons/Place';
import CityList from "./cities/cityList";
import CityEdit from "./cities/cityEdit";
import CityCreate from "./cities/cityCreate";
import InterestIcon from '@material-ui/icons/ViewAgenda';
import InterestEdit from "./interests/interestEdit";
import InterestCreate from "./interests/interestCreate";
import InterestList from "./interests/interestList";
import SpecifictInterestIcon from '@material-ui/icons/ViewCarousel';
import SpecificInterestEdit from "./specificInterests/specificInterestEdit";
import SpecificInterestCreate from "./specificInterests/specificInterestCreate";
import SpecificInterestList from "./specificInterests/specificInterestList";
import ResourceIcon from '@material-ui/icons/Bookmarks';
import ResourceList from "./resources/resourceList";
import ResourceShow from "./resources/resourceShow";
import ResourceCreate from "./resources/resourceCreate"
import ResourceTypeList from "./resourcesTypes/resourceTypeList";
import ResourceTypeEdit from "./resourcesTypes/resourceTypeEdit";
import ResourceTypeCreate from "./resourcesTypes/resourceTypeCreate";
import ResourceEdit from "./resources/resourceEdit";
import CertificateIcon from '@material-ui/icons/Star';
import CertificateEdit from "./certificates/certificateEdit";
import AbilityIcon from '@material-ui/icons/GolfCourse';
import AbilityList from "./abilities/abilityList";
import AbilityEdit from "./abilities/abilityEdit";
import AbilityCreate from "./abilities/abilityCreate";

import enREDaLayoutSuperAdmin from './components/layout/enREDaLayoutSuperAdmin';
import CertificateList from './certificates/certificateList';
import CertificateCreate from './certificates/certificationCreate';
import enREDaLayoutOrganization from './components/layout/enREDaLayoutOrganization';
import enredaMenuMentor from './components/menu/enredaMenuMentor';

const i18nProvider = polyglotI18nProvider(() => spanishMessages, 'es');


export default class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            user: undefined,
            isLoaded: false
        };
        this.init();
    }

    init() {
        authProvider.checkAuth().then(data => {
            const onUserResponse = (user) => this.setState({user, isLoaded: true});
            getCurrentUser(data.email, onUserResponse);
        }).catch(error => {
            this.setState({isLoaded: true})
        });
    }

    render() {
        const initialState = {
            user: this.state.user,
            
        };

        // let layout;
        // if (this.state.user !== undefined) {
        //     if (this.state.user.role == 'Super Admin') {
        //         layout = enREDaLayoutSuperAdmin;
        //     } else if (this.state.user.role == 'Organización') {
        //         layout = enREDaLayoutOrganization;
        //     } else {
        //         layout = enredaMenuMentor;
        //     }
        // } 

        
        return this.state.isLoaded ? (

            <Admin
                layout={enREDaLayoutSuperAdmin}
                loginPage={Login}
                dashboard={Dashboard}
                dataProvider={dataProvider}
                authProvider={authProvider}
                i18nProvider={i18nProvider}
                initialState={initialState}
                customReducers={
                    {
                        'user': (current = {}, action) => {
                            return action.type === 'LOGGED_IN_USER' ? action.value : current;
                        },
                        'formInput': (current = {}, action) => {
                            switch (action.type) {
                                case 'COUNTRY_SELECTED':
                                    return {...current, country: action.value};
                                case 'PROVINCE_SELECTED':
                                    return {...current, province: action.value};
                                case 'ROLE_SELECTED':
                                    return {...current, role: action.value};
                                case 'ONLINE_SELECTED':
                                    return {...current, online: action.value};
                                case 'NOTEXPIRE_SELECTED':
                                    return {...current, notExpire: action.value};
                                default:
                                    return current;
                            }
                        },
                    }
                }
            >

                {permissions => {

                    return [
                        permissions['super-admin']  || permissions['organization'] ?
                            <Resource name="users"
                                      options={{label: "Usuarios"}}
                                      icon={UserIcon}
                                      list={UserList}
                                      edit={permissions['super-admin']  ||permissions['organization'] ? UserEdit : null}
                                      create={permissions['super-admin']  ? UserCreate : null}
                                      show={UserShow}
                            /> : <Resource name="users"
                                           edit={UserEdit}
                                           show={UserShow}
                            />,
                        permissions['super-admin']  ?
                            <Resource name="organizations"
                                      options={{label: "Organizaciones"}}
                                      icon={OrganizationIcon}
                                      list={OrganizationList}
                                      edit={OrganizationEdit}
                                      create={OrganizationCreate}
                                      show={OrganizationShow}
                            /> : <Resource name="organizations"/>,
                        <Resource name="resources"
                                  options={{label: "Recursos"}}
                                  icon={ResourceIcon}
                                  list={ResourceList}
                                  show={ResourceShow}
                                  edit={ResourceEdit}
                                  create={ResourceCreate}
                        />,
                        <Resource name="certificates"
                                  options={{label: "Certificaciones"}}
                                  icon={CertificateIcon}
                                  edit={CertificateEdit}
                                  list={CertificateList}
                                  create={CertificateCreate}
                        />,
                        permissions['super-admin'] ?
                            <Resource name="resourcesTypes"
                                      options={{label: "Tipos de recursos"}}
                                      icon={CollectionsBookmarkIcon}
                                      list={ResourceTypeList}
                                      edit={ResourceTypeEdit}
                                      create={ResourceTypeCreate}
                            /> : <Resource name="resourcesTypes"/>,
                        permissions['super-admin'] ?
                            <Resource name="countries"
                                      options={{label: "Países"}}
                                      icon={CountryIcon}
                                      list={CountryList}
                                      edit={CountryEdit}
                                      create={CountryCreate}
                            /> : <Resource name="countries"/>,
                        permissions['super-admin'] ?
                            <Resource name="provinces"
                                      options={{label: "Provincias"}}
                                      icon={ProvinceIcon}
                                      list={ProvinceList}
                                      edit={ProvinceEdit}
                                      create={ProvinceCreate}
                            /> : <Resource name="provinces"/>,
                        permissions['super-admin'] ?
                            <Resource name="cities"
                                      options={{label: "Municipios"}}
                                      icon={CityIcon}
                                      list={CityList}
                                      edit={CityEdit}
                                      create={CityCreate}
                            /> : <Resource name="cities"/>,
                        permissions['super-admin'] ?
                            <Resource name="interests"
                                      options={{label: "Intereses laborales"}}
                                      icon={InterestIcon}
                                      list={InterestList}
                                      edit={InterestEdit}
                                      create={InterestCreate}
                            /> : <Resource name="interests"/>,
                        permissions['super-admin'] ?
                            <Resource name="specificInterests"
                                      options={{label: "Intereses l. específicos"}}
                                      icon={SpecifictInterestIcon}
                                      list={SpecificInterestList}
                                      edit={SpecificInterestEdit}
                                      create={SpecificInterestCreate}
                            /> : <Resource name="specificInterests"/>,
                        permissions['super-admin'] ?
                            <Resource name="abilities"
                                      options={{label: "Habilidades"}}
                                      icon={AbilityIcon}
                                      list={AbilityList}
                                      edit={AbilityEdit}
                                      create={AbilityCreate}
                            /> : <Resource name="abilities"/>,
                    ]
                }}
            </Admin>
        ) : (<Loading loadingPrimary="Espere por favor" loadingSecondary="Estamos cargando su contenido"/>)
    }
}

