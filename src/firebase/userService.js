
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

// const getCurrentUser = async (value, cb) => {
//     const result = database
//         .collection('users')
//         .where( 'email', '==', value)
//         .get();

//     result.forEach(async doc => {
//         const user = doc.data()[0];
//         cb(user);
//         if(user.role === 'Desempleado') console.log('Usuario sin privilegios');
//       })
//       return;
// }

// export default getCurrentUser;

/*export default function getUserById(id) {
    return new Observable(observer => {
        database.collection('users').doc(id).get().then((document) => {
            if (!document.exists) return;
            observer.next(document.data());
            observer.complete();
        });
    });
}*/


