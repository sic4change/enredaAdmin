import {database} from "./firebaseConfig";

export default function getCurrentUser(value, cb) {
    database.collection('users').where( 'email', '==', value).get().then(
        querySnapshot => {
            const user = querySnapshot.docs.map(doc => doc.data())[0];
            //if(user.role === 'Desempleado') throw new Error('Usuario sin privilegios');
            cb(user);
        });
}

/*export default function getUserById(id) {
    return new Observable(observer => {
        database.collection('users').doc(id).get().then((document) => {
            if (!document.exists) return;
            observer.next(document.data());
            observer.complete();
        });
    });
}*/
