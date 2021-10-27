import {FirebaseAuthProvider, FirebaseDataProvider} from "react-admin-firebase";
import firebase from 'firebase';

const config = {
    apiKey: "AIzaSyDtKT5Dd-NOko6DCWgDFl6NqfJPCE8_4XQ",
    authDomain: "enreda-d3b41.firebaseapp.com",
    databaseURL: "https://enreda-d3b41.firebaseio.com",
    projectId: "enreda-d3b41",
    storageBucket: "enreda-d3b41.appspot.com",
    messagingSenderId: "791604879416",
    appId: "1:791604879416:web:212be61f4e878495e086cd",
    measurementId: "G-6YVKNCHZY1"
};
firebase.initializeApp(config);

const options = {};
export const dataProvider = FirebaseDataProvider(config, options);
export const authProvider = FirebaseAuthProvider(config, options);

export const database = firebase.firestore();



