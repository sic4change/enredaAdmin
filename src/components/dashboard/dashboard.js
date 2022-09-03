import * as React from "react";

import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import {connect} from 'react-redux';
import Typography from '@material-ui/core/Typography';
import {EditButton, ShowButton} from "react-admin";
import PersonIcon from '@material-ui/icons/Person';
import AlternateEmailIcon from '@material-ui/icons/AlternateEmail';
import PersonPinIcon from '@material-ui/icons/PersonPin';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import {useQuery, useGetIdentity, Loading} from 'react-admin';
import Box from '@material-ui/core/Box';
import InfoIcon from '@material-ui/icons/Info';


const UserProfile = ({userId}) => {
    const { identity, loading: identityLoading } = useGetIdentity();
    const {data, loading, error} = useQuery({
        type: 'getOne',
        resource: 'users',
        payload: {id: userId}
    });

    if (loading || identityLoading) return <Loading/>;
    if (error) return <Loading/>;
    if (!data || !identity) return null;

    let role = data.role;
    let toCloseIfDesempleado = false;
    if (role === "Desempleado") {
        role = "Usuario"
        toCloseIfDesempleado = true
    };
    
    return (
        <React.Fragment>
            {role !== "Usuario" ?
                <React.Fragment>
                    <Typography variant="body1" color="textSecondary" component="p">
                        Esta es tu ventana de administración.
                    </Typography>
                    <br/>
                    <Typography variant="body1" color="textSecondary" component="p" m={1}>
                        Según tu rol, puedes
                        <Box fontWeight={'fontWeightBold'} component={'span'} style={{color: 'orange'}}> visualizar,
                            editar y eliminar </Box>
                        todos los recursos disponibles en esta web.
                    </Typography>
                    <Typography variant="body1" component="span">
                        <Box fontWeight={'fontWeightBold'} style={{color: 'orange'}}>Por favor, procede con
                            precaución.</Box>
                    </Typography>
                </React.Fragment>
                :
                <React.Fragment>
                    <Typography variant="body1" color="textSecondary" component="p">
                        Esta es tu ventana de administración.
                    </Typography>
                    
                </React.Fragment>
            }

            <br/><br/>
            <Card style={{backgroundColor: 'white', borderRadius: '20px'}}>
                <Typography variant="h6" color='primary' style={{margin: '1em'}}>
                    Perfil del usuario
                </Typography>
                <Typography variant="body1" color="textSecondary" style={{margin: '1em'}}>
                    Estos son algunos de los datos básicos de tu perfil. Si lo crees necesario, puedes editarlos.
                </Typography>
                <CardContent>
                    <List>
                        <ListItem>
                            <ListItemIcon>
                                <PersonIcon/>
                            </ListItemIcon>
                            <ListItemText>
                                <Typography variant="body2" color='textSecondary'>
                                    <strong>Nombre: </strong>{data.firstName}
                                </Typography>
                            </ListItemText>
                        </ListItem>
                        <ListItem>
                            <ListItemIcon>
                                <AlternateEmailIcon/>
                            </ListItemIcon>
                            <ListItemText>
                                <Typography variant="body2" color='textSecondary'>
                                    <strong>Email: </strong>{data.email}
                                </Typography>
                            </ListItemText>
                        </ListItem>
                        <ListItem>
                            <ListItemIcon>
                                <PersonPinIcon/>
                            </ListItemIcon>
                            <ListItemText>
                                <Typography variant="body2" color='textSecondary'>
                                    <strong>Rol: </strong>{role}
                                </Typography>
                            </ListItemText>
                        </ListItem>
                    </List>
                    <br/><br/>
                    <div style={{textAlign: 'right'}}>
                        <ShowButton basePath={"/users"} record={data} label="Ver perfil completo"/>
                        <br/>
                        <EditButton basePath={"/users"} record={data} label="Editar mi perfil "/>
                    </div>
                </CardContent>
            </Card>
            {role === "Organización" ?
                <React.Fragment>
                    <br/><br/>
                    <Typography variant="body2" component="span" color={'textSecondary'}>
                        <InfoIcon fontSize="small" style={{verticalAlign:"bottom"}}/>
                        &nbsp;Si necesitas editar la información de tu organización, por favor, ponte en contacto con
                        nosotros.
                    </Typography></React.Fragment> : null}
        </React.Fragment>
    )
};

const DashboardView = (props) => (
    <React.Fragment>
        <Card>
            <CardHeader title={`Bienvenid@ a la aplicación, ${props.user.firstName}`}/>
            <CardContent>
                <UserProfile userId={props.user.userId}/>
            </CardContent>
        </Card>
        <br/><br/>
    </React.Fragment>

);

function mapStateToProps(state) {
    return {user: state.user}
}

const Dashboard = connect(mapStateToProps)(DashboardView);
export default Dashboard;
