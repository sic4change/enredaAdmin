import React, {useState, useRef, useEffect, useContext} from 'react';
import { AppContext } from '../components/appContext';
import {Field, withTypes} from 'react-final-form';
import {useLocation} from 'react-router-dom';
import loginBackground from '../assets/enreda_fondo.jpg';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CircularProgress from '@material-ui/core/CircularProgress';
import TextField from '@material-ui/core/TextField';
import {createMuiTheme, makeStyles} from '@material-ui/core/styles';
import {ThemeProvider} from '@material-ui/styles';
import {Notification, useLogout} from 'react-admin';
import {useTranslate, useLogin, useNotify} from 'ra-core';
import ForgotPasswordButton from "./CustomForgotPassword";
import {authProvider} from "../firebase/firebaseConfig";
import getCurrentUser from "../firebase/userService";
import {connect} from 'react-redux';
import {Dialog, DialogActions, DialogTitle } from "@material-ui/core";

import { useRedirect } from 'react-admin';

export const lightTheme = {
    palette: {
        primary: {
            main: '#232e7f',
        },
        secondary: {
            light: '#5f5fc4',
            main: '#232e7f',
            dark: '#001064',
            contrastText: '#fff',
        },
        background: {
            default: '#fcfcfe',
        },
    },
    shape: {
        borderRadius: 10,
    },
    overrides: {
        RaMenuItemLink: {
            root: {
                borderLeft: '3px solid #fff',
            },
            active: {
                borderLeft: '3px solid #4f3cc9',
            },
        },
        MuiPaper: {
            elevation1: {
                boxShadow: 'none',
            },
            root: {
                border: '1px solid #e0e0e3',
                backgroundClip: 'padding-box',
            },
        },
        MuiButton: {
            contained: {
                backgroundColor: '#fff',
                color: '#4f3cc9',
                boxShadow: 'none',
            },
        },
        MuiAppBar: {
            colorSecondary: {
                color: '#808080',
                backgroundColor: '#fff',
            },
        },
        MuiLinearProgress: {
            colorPrimary: {
                backgroundColor: '#f5f5f5',
            },
            barColorPrimary: {
                backgroundColor: '#d7d7d7',
            },
        },
        MuiFilledInput: {
            root: {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                '&$disabled': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
            },
        },
    },
};

const useStyles = makeStyles(theme => ({
    main: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundImage: `url(${loginBackground})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundColor: 'rgba(255,255,255,0.6)',
        backgroundBlendMode: 'lighten'
    },
    card: {
        minWidth: 300,
        marginTop: '15em',
        width: '20%',
    },
    avatar: {
        margin: '1em',
        display: 'flex',
        justifyContent: 'center',
    },
    icon: {
        backgroundColor: theme.palette.secondary.main,
    },
    form: {
        padding: '1em',
    },
    input: {
        marginTop: '1em',
    },
    actions: {
        padding: '0 1em 1em 1em',
        flexDirection: 'column'
    },
}));

const renderInput = ({
                         meta: {touched, error} = {touched: false, error: undefined},
                         input: {...inputProps},
                         ...props
                     }) => (
    <TextField
        error={!!(touched && error)}
        helperText={touched && error}
        {...inputProps}
        {...props}
        fullWidth
    />
);

const {Form} = withTypes();

const LoginComponent = (props) => {
    const [loading, setLoading] = useState(false);
    const [openAlert, setOpenAlert] = useState(false);
    const reference = useRef();
    reference.current = openAlert;
    const translate = useTranslate();
    const classes = useStyles();
    const notify = useNotify();
    const redirect = useRedirect();
    const login = useLogin();
    const location = useLocation();
    const logout = useLogout();
    const context = useContext(AppContext);
    
    const handleSubmit = async (auth) => {
        setLoading(true);
        try {
            await login(auth, location.state ? location.state.nextPathname : '/' );
            let data = await authProvider.checkAuth();
            const currentUser = await getCurrentUser(data.email, props.onLogin);
            if (currentUser.role == 'Desempleado') {
                context.setGobalMessage('Hemos detectado que esta cuenta busca trabajo, por favor pulse ACEPTAR para ir a la pagina principal y pulse "Acceder"');
                logout();
            }
        } catch (error) {
            setLoading(false);
            notify(
                typeof error === 'string'
                    ? error
                    : typeof error === 'undefined' || !error.message
                    ? 'ra.auth.sign_in_error'
                    : error.message,
                'warning'
            );
        }
    };

    const validate = (values) => {
        const errors = {};
        if (!values.username) {
            errors.username = translate('ra.validation.required');
        }
        if (!values.password) {
            errors.password = translate('ra.validation.required');
        }
        return errors;
    };

    const handleClose = () => {
        redirect('https://www.enredas.org');
    };

    useEffect(() => {
        console.log(openAlert);
     }, [openAlert]);

    return ( 
        <React.Fragment>
            <Dialog
                open={!!context.globalMessage}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title">
                <DialogTitle id="alert-dialog-title">{context.globalMessage}</DialogTitle>
                <DialogActions>
                    <Button 
                        variant="contained"
                        type="submit"
                        color="primary"
                        onClick={handleClose}>
                            Aceptar
                    </Button>
                </DialogActions>
            </Dialog>
            <Form
                onSubmit={handleSubmit}
                validate={validate}
                render={({handleSubmit}) => (
                    <form onSubmit={handleSubmit} noValidate>
                        <div className={classes.main}>
                            <Card className={classes.card}>
                                <div >
                                    {/* <Avatar className={classes.icon}>
                                        <LockIcon/>
                                    </Avatar> */}
                                    <img src="/logo_enreda.png" style={{
                                        textAlign: 'center',
                                        display: 'block',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        margin: 'auto',
                                        width: '50%',
                                        marginTop: '3em'
                                    }} alt="Logo enREDa" />
                                </div>
                                <div className={classes.form}>
                                    <div className={classes.input}>
                                        <Field
                                            autoFocus
                                            name="username"
                                            // @ts-ignore
                                            component={renderInput}
                                            label="Correo electrónico"
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className={classes.input}>
                                        <Field
                                            name="password"
                                            // @ts-ignore
                                            component={renderInput}
                                            label={translate('ra.auth.password')}
                                            type="password"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                                <CardActions className={classes.actions}>
                                    <Button
                                        variant="contained"
                                        type="submit"
                                        color="primary"
                                        disabled={loading}
                                        fullWidth
                                    >
                                        {loading && (
                                            <CircularProgress
                                                size={25}
                                                thickness={2}
                                            />
                                        )}
                                        {translate('ra.auth.sign_in')}
                                    </Button>
                                    <ForgotPasswordButton {...props} />
                                </CardActions>
                            </Card>
                            <Notification/>
                        </div>
                    </form>
                    
                )}
            />
        </React.Fragment>
    );
};

// We need to put the ThemeProvider decoration in another component
// Because otherwise the useStyles() hook used in Login won't get
// the right theme
const LoginWithTheme = (props) => (
    <ThemeProvider theme={createMuiTheme(lightTheme)}>
        <LoginComponent {...props} />
    </ThemeProvider>
);

function mapStateToProps(state) {
    return {};
}

function mapDispatchToProps(dispatch) {
    return {
        onLogin: (user) => dispatch({type: 'LOGGED_IN_USER', value:user})
    };
}

const Login = connect(mapStateToProps, mapDispatchToProps)(LoginWithTheme);
export default Login;