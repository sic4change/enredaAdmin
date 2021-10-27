import React from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Snackbar,
    TextField,
} from "@material-ui/core";

import firebase from "firebase";

export default function AlertDialog() {
    const [open, setOpen] = React.useState(false);
    const [email, setEmail] = React.useState("");

    const [toastOpen, setToastOpen] = React.useState(false);
    const [toastMessage, setToastMessage] = React.useState("");

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };
    const handleSubmit = async () => {
        console.log("Enviando email de reinicio de contraseña a: ", email);
        try {
            await firebase.auth().sendPasswordResetEmail(email);
            setOpen(false);
            setToastOpen(true);
            setToastMessage("¡Email de reinicio de contraseña enviado!");
        } catch (error) {
            setToastOpen(true);
            setToastMessage(error.message);
        }
    };

    const handleOnChange = (event) => {
        const email = event.target.value;
        setEmail(email);
    };

    const handleToastClose = () => {
        setToastOpen(false);
        setToastOpen(false);
    };

    return (
        <div style={{ justifyContent: 'center', display: 'flex', marginTop: '15px'}}>
            <Button variant="contained" onClick={handleClickOpen}>
                ¿Ha olvidado su contraseña?
            </Button>
            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">¿No recuerda su contraseña?</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Introduzca su email para cambiarla ahora mismo
                    </DialogContentText>
                    <TextField
                        id="outlined-basic"
                        label="Email"
                        type="email"
                        variant="outlined"
                        style={{width: '100%'}}
                        onChange={handleOnChange}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} color="primary" autoFocus>
                        Enviar email
                    </Button>
                </DialogActions>
            </Dialog>
            <Snackbar
                open={toastOpen}
                onClose={handleToastClose}
                autoHideDuration={6000}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "center",
                }}
                message={toastMessage}
            />
        </div>
    );
}
