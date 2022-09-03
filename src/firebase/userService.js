
import {database} from "./firebaseConfig";

export default function getCurrentUser(value, cb) {
    return database.collection('users')
        .where( 'email', '==', value)
        .get()
        .then(
            querySnapshot => {
                const user = querySnapshot.docs.map(doc => doc.data())[0];
                cb(user);
                return user;
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


