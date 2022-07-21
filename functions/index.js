const puppeteer = require('puppeteer');
const functions = require('firebase-functions');
const adminFirebase = require('firebase-admin');
adminFirebase.initializeApp(functions.config().firebase);

const db = adminFirebase.firestore();
const resourceToCreate = db.collection('resources')
const scrapToCreate = db.collection('scrapps')

var options={ memory: '2GB', timeoutSeconds: 540, }


exports.createUser = functions.firestore
    .document('users/{userId}')
    .onCreate((snapshot, context) => {
        return adminFirebase.firestore().collection('users').where("email", "==", snapshot.get('email')).get().then(
            (snapshot2) => {
                if (snapshot2.size > 1) {
                    console.log('user exists')
                    snapshot2.forEach((user) => {
                        if (user.userId === undefined) {
                            return adminFirebase.firestore().collection("users").doc(context.params.userId).delete().then(function () {
                                console.log('new user removed')
                            })
                        }
                    })
                } else {
                    console.log('user does not exists')
                    const photoUserDefault = 'https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/user_default.jpg?alt=media&token=d85b7cc4-7c25-414a-bdc3-63e2ba4a2e95'
                    const userId = context.params.userId;
                    let role = snapshot.get('role');
                    let phone = snapshot.get('phone');
                    let email = snapshot.get('email').trim().toLowerCase();
                    let active = snapshot.get('active')
                    const address = snapshot.get('address');
                    const country = address.country;
                    let birthday = snapshot.get('birthday');
                    //Controlamos que no tenga fecha de cumpleaños por ser organizacion o mentor
                    if (birthday === null || birthday === undefined) {
                        birthday = adminFirebase.firestore.Timestamp.now();
                    }
                    //Controlamos inactivos en Peru
                    if (active === undefined) { 
                        if (country === 'WMHqCzqISX6KNVs9b3iN' && role !== 'Desempleado') {
                            active = false
                        } else {
                            active = true
                        }
                    }  else {
                        active = (snapshot.get('active') === 'true') ? true : false
                    }
                    let photoURL = (snapshot.get('profilePic') !== undefined) ? snapshot.get('profilePic').src : photoUserDefault
                    if (role === 'Mentor') {
                        let trust = snapshot.data().trust !== undefined ? snapshot.data().trust : false;
                        return adminFirebase.firestore().doc(`users/${userId}`).set({userId, role, email, active, trust, birthday}, {merge: true})
                        .then(() => {
                            return adminFirebase.auth().createUser({
                                uid: userId,
                                email: email,
                                displayName: `${snapshot.get('firstName')} ${snapshot.get('lastName')}`,
                                password: 'enreda_' + userId.slice(-3),
                                //password:'enreda_1234',
                                photoURL: photoURL ,
                                disabled: !active
                            }).then(() => {
                                const claims = {};
                                switch (snapshot.get('role')) {
                                    case 'Mentor':
                                        claims['mentor'] = true;
                                        break;
                                    case 'Desempleado':
                                        claims['unemployed'] = true;
                                        break;
                                    case 'Organización':
                                        claims['organization'] = true;
                                        break;
                                    case 'Admin Zona':
                                        claims['admin'] = true;
                                        break;
                                    case 'Super Admin':
                                        claims['super-admin'] = true;
                                        break;
                                    default:
                                        break;
                                }
                                return adminFirebase.auth().setCustomUserClaims(userId, claims);
                            })
                        });
                    } else {
                        return adminFirebase.firestore().doc(`users/${userId}`).set({userId, role, email, active, birthday}, {merge: true})
                        .then(() => {
                            return adminFirebase.auth().createUser({
                                uid: userId,
                                email: email,
                                displayName: `${snapshot.get('firstName')} ${snapshot.get('lastName')}`,
                                password: 'enreda_' + userId.slice(-3),
                                //password:'enreda_1234',
                                photoURL: photoURL ,
                                disabled: !active
                            }).then(() => {
                                const claims = {};
                                switch (snapshot.get('role')) {
                                    case 'Mentor':
                                        claims['mentor'] = true;
                                        break;
                                    case 'Desempleado':
                                        claims['unemployed'] = true;
                                        break;
                                    case 'Organización':
                                        claims['organization'] = true;
                                        break;
                                    case 'Super Admin':
                                        claims['super-admin'] = true;
                                        break;
                                    case 'Admin Zona':
                                        claims['admin'] = true;
                                        break;
                                    default:
                                        break;
                                }
                                return adminFirebase.auth().setCustomUserClaims(userId, claims);
                            })
                        });
                    }
                }
        })
    });

exports.updateUser = functions.firestore.document('users/{userId}')
    .onUpdate((change, context) => {
        const userId = context.params.userId;
        const newValue = change.after.data();
        const previousValue = change.before.data();
        if (newValue.email !== previousValue.email) {
            return adminFirebase.auth().updateUser(userId, {
                email: newValue.email
            }).then(() =>
                console.log("Changed email from " + previousValue.email + ' to ' + newValue.email)
            )
        } 
        if ((newValue.firstName !== previousValue.firstName) || (newValue.lastName !== previousValue.lastName)) {
            return adminFirebase.auth().updateUser(userId, {
                displayName: `${newValue.firstName} ${newValue.lastName}`,
            }).then(() =>
                console.log("Changed username")
            )
        }
        if (newValue.active !== previousValue.active) {
            return adminFirebase.auth().updateUser(userId, {
                disabled: !newValue.active,
            }).then(() =>
                console.log("Changed active")
            )
        }
        // Si se cambia el campo trust hay que actualizarlo en todos los recursos
        if (newValue.trust !== previousValue.trust) {
            const trust = newValue.trust;
            return adminFirebase.firestore().collection('resources').where("organizer", "==", newValue.userId).get().then(
                (snapshot) => {
                    snapshot.forEach((resource) => {
                        return adminFirebase.firestore().doc(`resources/${resource.data().resourceId}`).set({trust}, {merge: true})
                        .then(() => {
                            console.log("Successfully change trust values in resources after change trust value in user mentor");
                        })
                    })
                });
        }
        if ((newValue.profilePic !== null) || (newValue.profilePic !== undefined)) {
            return adminFirebase.auth().updateUser(userId, {
                photoURL: newValue.profilePic.src,
            }).then(() =>
                console.log("Changed avatar")
            )
        }
    });

exports.deleteUser = functions.firestore
    .document('users/{userId}')
    .onDelete((snapshot, context) => {
        const userId = context.params.userId;
        return adminFirebase.auth().deleteUser(userId).then(() => {
            console.log("Successfully deleted user from auth");
        }).then(() => {
            const bucket = adminFirebase.storage().bucket();
            return bucket.deleteFiles({
                prefix: `users/${userId}`
            });
        });
    });

exports.createOrganization = functions.firestore
    .document('organizations/{organizationId}')
    .onCreate((snapshot, context) => {
        const organizationId = context.params.organizationId;
        const email = snapshot.data().email;
        let trust = snapshot.data().trust !== undefined ? snapshot.data().trust : false;
        
        return adminFirebase.firestore().doc(`organizations/${organizationId}`).set({organizationId, trust }, {merge: true})
            .then(() => {
                console.log("Successfully added organizationId to new organization");
                return adminFirebase.firestore().collection('users').where("email", "==", email).get().then(
                    (snapshot) => {
                        snapshot.forEach((user) => {
                            return adminFirebase.firestore().collection("users").doc(user.id).set({organization: organizationId}, {merge: true})
                            .then(() => {
                                console.log("Successfully add organizationId in organization user");
                            })
                        })
                    });
            });
    });

    exports.updateOrganization = functions.firestore.document('organizations/{organizationId}')
    .onUpdate((change, context) => {
        const organizationId = context.params.organizationId;
        const newValue = change.after.data();
        const previousValue = change.before.data();
        // Si se cambia el campo trust hay que actualizarlo en todos los recursos
        if (newValue.trust !== previousValue.trust) {
            const trust = newValue.trust;
            return adminFirebase.firestore().collection('resources').where("organizer", "==", previousValue.organizationId).get().then(
                (snapshot) => {
                    snapshot.forEach((resource) => {
                        return adminFirebase.firestore().doc(`resources/${resource.data().resourceId}`).set({trust}, {merge: true})
                        .then(() => {
                            console.log("Successfully change trust values in resources after change trust value in organization");
                        })
                    })
                });
        }

    });

exports.deleteOrganization = functions.firestore
    .document('organizations/{organizationId}')
    .onDelete((snapshot, context) => {
        const organizationId = context.params.organizationId;
        return adminFirebase.firestore().collection('resources').where("organizer", "==", organizationId).get().then(
            (snapshot) => {
                snapshot.forEach((resource) => {
                    return adminFirebase.firestore().collection("resources").doc(resource.id).delete().then(function () {
                        console.log("Resource successfully deleted!");
                        return adminFirebase.firestore().collection("users").where("organization", "==", organizationId).get().then(
                            (snapshot) => {
                                snapshot.forEach((user) => {
                                    return adminFirebase.firestore().collection("users").doc(user.id).delete().then(function () {
                                        return adminFirebase.auth().deleteUser(user.id).then(() => {
                                            console.log("Successfully deleted user from auth");
                                        }).then(() => {
                                            const bucket = adminFirebase.storage().bucket();
                                            return bucket.deleteFiles({
                                                prefix: `users/${user.id}`
                                            });
                                        });
                                    })
                                })
                            }
                        )
                    }).catch(function (error) {
                        console.error("Error removing resource: ", error);
                    });
                })
            }
        );
    });

exports.createCountry = functions.firestore
    .document('countries/{countryId}')
    .onCreate((snapshot, context) => {
        const countryId = context.params.countryId;
        //return adminFirebase.firestore().collection('resources').where("organizer", "==", countryId).get().then()
        return adminFirebase.firestore().doc(`countries/${countryId}`).set({countryId, active:true}, {merge: true})
            .then(() => {
                console.log("Successfully added countryId to new country");
            });
    });

exports.deleteCountry = functions.firestore
    .document('countries/{countryId}')
    .onDelete((snapshot, context) => {
        const countryId = context.params.countryId;
        return adminFirebase.firestore().collection('provinces').where("countryId", "==", countryId).get()
            .then((snapshot) => {
                snapshot.forEach((province) => {
                    return adminFirebase.firestore().collection("provinces").doc(province.id).delete().then(function () {
                        console.log("Associated province successfully deleted!");
                    })
                })
            });
    });

exports.createProvince = functions.firestore
    .document('provinces/{provinceId}')
    .onCreate((snapshot, context) => {
        const provinceId = context.params.provinceId;
        return adminFirebase.firestore().doc(`provinces/${provinceId}`).set({provinceId, active:true}, {merge: true})
            .then(() => {
                console.log("Successfully added provinceId to new province");
            });
    });

exports.deleteProvince = functions.firestore
    .document('provinces/{provinceId}')
    .onDelete((snapshot, context) => {
        const provinceId = context.params.provinceId;
        return adminFirebase.firestore().collection('cities').where("provinceId", "==", provinceId).get()
            .then((snapshot) => {
                snapshot.forEach((city) => {
                    return adminFirebase.firestore().collection("cities").doc(city.id).delete().then(function () {
                        console.log("Associated city successfully deleted!");
                    })
                })
            });
    });

exports.createCity = functions.firestore
    .document('cities/{cityId}')
    .onCreate((snapshot, context) => {
        const cityId = context.params.cityId;
        return adminFirebase.firestore().doc(`cities/${cityId}`).set({cityId, active:true}, {merge: true})
            .then(() => {
                console.log("Successfully added cityId to new city");
            });
    });

exports.createResource = functions.runWith(options).firestore
    .document('resources/{resourceId}')
    .onCreate((snapshot, context) => {
        const resourceId = context.params.resourceId;
        const doc = adminFirebase.firestore().doc(`resources/${resourceId}`);
        const onlineUpdate =  snapshot.data().modality !== 'Presencial' ? true : false;
        const countryUpdate = (snapshot.data().address.country === undefined || snapshot.data().address.country === null) ? "undefined" : snapshot.data().address.country;
        const provinceUpdate = (snapshot.data().address.province === undefined || snapshot.data().address.province === null) ? "undefined" : snapshot.data().address.province;
        const cityUpdate = (snapshot.data().address.city === undefined || snapshot.data().address.city === null) ? "undefined" : snapshot.data().address.city;
        const placeUpdate = snapshot.data().address.place;

        adminFirebase.firestore().doc(`resources/${resourceId}`).set({ resourceLink: `https://enredawebapp.web.app/resources/${resourceId}` }, { merge: true });
        
        //Si el creador del recurso es un mentor hay que mirar si el campo trust para ver si el recurso se puede mostrar o no
        if (snapshot.data().organizerType === 'Mentor') {
            return adminFirebase.firestore().collection('users').where("userId", "==", snapshot.data().organizer).get()
            .then((snapshot) => {
                snapshot.forEach((user) => {
                    if (!user.data().trust) {
                        return adminFirebase.firestore().doc(`resources/${resourceId}`).set({resourceId}, {merge: true})
                            .then(() => {
                                console.log("Successfully added resourceId to new resource");
                                doc.update({
                                    enable: true,
                                    trust: false,
                                    online: onlineUpdate,
                                    status: 'Disponible',
                                    address: {
                                        place: placeUpdate,
                                        country: countryUpdate,
                                        province: provinceUpdate,
                                        city: cityUpdate
                                    },
                                });
                
                            })
                    } else {
                        return adminFirebase.firestore().doc(`resources/${resourceId}`).set({resourceId}, {merge: true})
                        .then(() => {
                            console.log("Successfully added resourceId to new resource");
                            doc.update({
                                enable: true,
                                trust: true,
                                online: onlineUpdate,
                                status: 'Disponible',
                                address: {
                                    place: placeUpdate,
                                    country: countryUpdate,
                                    province: provinceUpdate,
                                    city: cityUpdate
                                },
                            });
            
                        })
                    }
                })
            });
            //Si el creador del recurso es una organization hay que mirar si el campo trust para ver si el recurso se puede mostrar o no
        } else if (snapshot.data().organizerType === 'Organización') {
            return adminFirebase.firestore().doc(`resources/${resourceId}`).set({resourceId}, {merge: true})
            .then(() => {
                console.log("Successfully added resourceId to new resource");
                // Comprobamos si es un recurso creado de la SPEGC por web scrapping
                if (snapshot.data().organizer === 'btTAIYUkGSgqlEAnaZJB') {
                    doc.update({
                        end: adminFirebase.firestore.Timestamp.now(),
                        start: adminFirebase.firestore.Timestamp.now(),
                        lastupdate: adminFirebase.firestore.Timestamp.now(),
                        createdate: adminFirebase.firestore.Timestamp.now(),
                        maximumDate: adminFirebase.firestore.Timestamp.now(),
                        trust: true
                    });
                } else {
                    return adminFirebase.firestore().collection('organizations').where("organizationId", "==", snapshot.data().organizer).get()
                    .then((snapshot) => {
                        snapshot.forEach((organization) => {
                            if (!organization.data().trust) {
                                doc.update({
                                    enable: true,
                                    trust: false,
                                    online: onlineUpdate,
                                    status: 'Disponible',
                                    address: {
                                        place: placeUpdate,
                                        country: countryUpdate,
                                        province: provinceUpdate,
                                        city: cityUpdate
                                    },
                                });
                            } else {
                                doc.update({
                                    enable: true,
                                    trust: true,
                                    online: onlineUpdate,
                                    status: 'Disponible',
                                    address: {
                                        place: placeUpdate,
                                        country: countryUpdate,
                                        province: provinceUpdate,
                                        city: cityUpdate
                                    },
                                });
                            }
                        })
                    });
                }
            }
        )
        } else {
            return adminFirebase.firestore().doc(`resources/${resourceId}`).set({resourceId}, {merge: true})
            .then(() => {
                console.log("Successfully added resourceId to new resource");
                const doc = adminFirebase.firestore().doc(`resources/${resourceId}`);
                doc.update({
                    enable: true,
                    trust: true,
                    online: onlineUpdate,
                    status: 'Disponible',
                    country: countryUpdate,
                    province: provinceUpdate,
                    city: cityUpdate
                });
            })
        }
        
    });

exports.storage = functions.storage.object().onFinalize(async (object) => {
    const bucket = object.bucket;
    const pathToFile = object.name;
    const downloadToken = object.metadata.firebaseStorageDownloadTokens;
    const url =`https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(
        pathToFile
        )}?alt=media&token=${downloadToken}`;
    const path = pathToFile.substring(0, pathToFile.lastIndexOf('/'));
    //const title = pathToFile.substring(pathToFile.lastIndexOf('/') + 1);
    let resourcePhoto = {
        src: url,
    }

    return adminFirebase.firestore().doc(path).set({resourcePhoto}, {merge: true})
        .then(() => {
            console.log("Successfully updated");
        });
    });

    exports.deleteResourcePicture = functions.firestore
    .document('resourcesPictures/{resourcePictureId}')
    .onDelete((snapshot, context) => {
        const resourcePictureId = snapshot.data().id;
        return adminFirebase.firestore().collection('resourcesPictures').where("id", "==", resourcePictureId).get()
            .then(() => {
                const bucket = adminFirebase.storage().bucket();
                return bucket.deleteFiles({
                    prefix: `resourcesPictures/${resourcePictureId}`
                });
            })
            .then(() => {
                console.log("Successfully updated category items and delete lessons and resources from course");
            })
            .catch((error) => {
                console.log(error);
            });
    });

exports.createResourceType = functions.firestore
    .document('resourcesTypes/{resourceTypeId}')
    .onCreate((snapshot, context) => {
        const resourceTypeId = context.params.resourceTypeId;
        return adminFirebase.firestore().doc(`resourcesTypes/${resourceTypeId}`).set({resourceTypeId}, {merge: true})
            .then(() => {
                console.log("Successfully added resourceTypeId to new resourceType");
            });
    });

exports.checkResourceDate = functions.pubsub.topic('checkResourceDate').onPublish((message, context) => {
    return adminFirebase.firestore().collection('resources').get().then((snapshot) => {
        snapshot.forEach((resource) => {
            if (resource.data().end.toMillis() <= adminFirebase.firestore.Timestamp.now().toMillis() ||
                resource.data().maximumDate.toMillis() <= adminFirebase.firestore.Timestamp.now().toMillis()
            ) {
                if (resource.data().status !== 'A actualizar') {
                    const doc = adminFirebase.firestore().doc(`resources/${resource.data().resourceId}`);
                    doc.update({
                        enable: false,
                        status: 'No disponible'
                    });
                }
            }
        });
    });
});

exports.updateResource = functions.firestore.document('resources/{resourceId}')
    .onUpdate((change, context) => {
        const resourceId = context.params.resourceId;
        const newValue = change.after.data();
        const previousValue = change.before.data();
       
        // Tras web scrapping cuando pasa de 'A actualizar a 'Disponible' hay que enviar el mail
        if ((newValue.status === 'Disponible') && (previousValue.status === 'A actualizar')) {
            const interests = [];
            Object.values(newValue.interests).forEach((key) => {
                interests.push(key);
            });
            const title = newValue.title;
            const resourceType = newValue.resourceType;
            const resourceStatus = newValue.status;

            const payload = {
                notification: {
                    title: 'enREDa',
                    body: `Nuevo recurso: ${title}`,
                    sound: "default"
                },
                data: {
                    resourceId: resourceId,
                    click_action: "FLUTTER_NOTIFICATION_CLICK",
                    title: 'enREDa',
                    body: `Nuevos recursos basados en tus intereses`,
                }
            };
            const options = {
                priority: "high",
                timeToLive: 60 * 60 * 24
            };

            if (resourceStatus !== 'A actualizar') {
                functions.logger.log('INTERESTS', interests);
                const promises = interests.map((interest) => {
                    return adminFirebase.firestore().collection('users').get().then((snapshot) => {
                        snapshot.forEach((user) => {
                            if (user.get('role') === 'Desempleado') {
                                // Si el recurso es de ocio, se envia a todo los desempleados
                                if (resourceType === 'iGkqdz7uiWuXAFz1O8PY') {
                                    return adminFirebase.messaging().sendToTopic(user.get('userId'),payload, options);
                                }
                                else {
                                    if (user.get('unemployedType') === 'T1' || user.get('unemployedType') === 'T2') {
                                        return adminFirebase.messaging().sendToTopic(user.get('userId'),payload, options);
                                    } 
                                    // Si el recurso es de habilidades sociales 
                                    else if (resourceType === 'GOw01m2HPro4I8xd6rSj'){
                                        // Si el desempleado tiene la habilidad "Habilidades sociales"
                                        if (user.get('motivation').abilities.includes('kv0ZGalD2ViPdTx0BMm6')) {
                                            return adminFirebase.messaging().sendToTopic(user.get('userId'),payload, options);
                                        }  
                                    } 
                                    // Si el recurso es de Financación
                                    else if (resourceType === 'PPX3Ufeg9YfzH4YA0SkU'){
                                        // Si el desempleado tiene la habilidad "Financiacion"
                                        if (user.get('motivation').abilities.includes('5X4lcOCqMTAZ4UwQLl03')) {
                                            return adminFirebase.messaging().sendToTopic(user.get('userId'),payload, options);
                                        }  
                                    } 
                                    // Si el recurso es de mentoria
                                    else if (resourceType === 'lUubulxiAGo4llxFJrkl'){
                                        // Si el desempleado tiene la habilidad "Apoyo profesional al sector laboral"
                                        if (user.get('motivation').abilities.includes('3ywxTQBRJ6wzgMiVx9GE')) {
                                            return adminFirebase.messaging().sendToTopic(user.get('userId'),payload, options);
                                        }  
                                    }
                                    // Si el recurso es de Apoyo y orientacion para el empleo
                                    else if (resourceType === 'MvCHSFzASskxlkBzPElb'){
                                        // Si el desempleado tiene la habilidad "Apoyo profesional al sector laboral"
                                        if (user.get('motivation').abilities.includes('RrBucTiz917syI4jyJKz')) {
                                            return adminFirebase.messaging().sendToTopic(user.get('userId'),payload, options);
                                        }  
                                    } 
                                    // Si el recurso es de programa para la emprendeduria 
                                    else if (resourceType === '4l9BLhP7cwXohUvQzMOT'){
                                        // Si el desempleado tiene la habilidad "Emprenduderia"
                                        if (user.get('motivation').abilities.includes('0m7igV4HhWcXwWabBKK5')) {
                                            return adminFirebase.messaging().sendToTopic(user.get('userId'),payload, options);
                                        }  
                                    } 
                                    // Si el recurso es de formacion
                                    else if (resourceType === 'N9KdlBYmxUp82gOv8oJC'){
                                        // Si el desempleado tiene la habilidad "Formacion"
                                        if (user.get('motivation').abilities.includes('nMWfKP0yOqQf8Zv4A3n6')) {
                                            return adminFirebase.messaging().sendToTopic(user.get('userId'),payload, options);
                                        }  
                                    }  
                                    else {
                                        const interestsUser = [];
                                        user.get('interests').interests.forEach((i) => {
                                            interestsUser.push(i);
                                        });
                                        interestsUser.forEach((interestUser) => {
                                            if (interestUser === interest) {
                                                return adminFirebase.messaging().sendToTopic(user.get('userId'),payload, options);
                                            }
                                        })
                                    }
                                }
                                
                            }
                        });
                    })
                });
                return Promise.all(promises);
            } 
        }

        //Cuando se modifica la modalidad
        if (newValue.modality !== previousValue.modality) {
            const onlineUpdate =  newValue.data().modality !== 'Presencial' ? true : false;
            const doc = adminFirebase.firestore().doc(`resources/${resourceId}`);
            const countryUpdate = (newValue.data().address.country === undefined || newValue.data().address.country === null) ? "undefined" : newValue.data().address.country;
            const provinceUpdate = (newValue.data().address.province === undefined || newValue.data().address.province === null) ? "undefined" : newValue.data().address.province;
            const cityUpdate = (newValue.data().address.city === undefined || newValue.data().address.city === null) ? "undefined" : newValue.data().address.city;
            const placeUpdate = newValue.data().address.place;
            doc.update({
                online: onlineUpdate,
                address: {
                    place: placeUpdate,
                    country: countryUpdate,
                    province: provinceUpdate,
                    city: cityUpdate
                },
            });
        }

        //Cuando se modifica la fecha limite de inscripcion
        if (newValue.maximumDate !== previousValue.maximumDate) {
            if (newValue.maximumDate.toMillis() <= adminFirebase.firestore.Timestamp.now().toMillis()) {
                if ((newValue.status !== 'A actualizar') && (newValue.status !== 'Completo')) {
                    const doc = adminFirebase.firestore().doc(`resources/${resourceId}`);
                    doc.update({
                        enable: false,
                        status: 'No disponible'
                    });
                }
            } else {
                if ((newValue.status !== 'A actualizar') && (newValue.status !== 'Completo')) {
                    const doc = adminFirebase.firestore().doc(`resources/${resourceId}`);
                    doc.update({
                        enable: true,
                        status: 'Disponible'
                    });
                }
            }
        }

        //Cuando se modifica el aforo y ya hay asistentes inscritos
        if (newValue.capacity !== previousValue.capacity) {
            if (previousValue.assistants <= newValue.capacity) {
                return adminFirebase.firestore().doc(`resources/${resourceId}`).set({
                    capacity: newValue.capacity
                }, {merge: true})
                    .then(() => {
                        console.log("Changes were applied to capacity");
                        if (previousValue.assistants === newValue.capacity) {
                            const status = 'Completo';
                            return adminFirebase.firestore().doc(`resources/${resourceId}`).set({status}, {merge: true}).then(() => {
                                console.log('Se ha modificado correctamente el evento');
                            });
                        }
                    });
            } else {
                return adminFirebase.firestore().doc(`resources/${resourceId}`).set({
                    capacity: previousValue.capacity
                }, {merge: true})
                    .then(() => {
                        console.log("Changes were not applied because the number of assistants were higher than the new capacity");
                    });
            }
        }

        // // Cuando se añaden asistentes
        if (newValue.assistants !== previousValue.assistants ) {
            let status = previousValue.status
            if (newValue.assistants === newValue.capacity) {
                status = 'Completo';
            }
            const doc = adminFirebase.firestore().doc(`resources/${resourceId}`);
            doc.update({
                assistants: newValue.participants.length.toString(),
                status: status
            });
        }
        // Cuando se modifican los participantes (solo desde las apps)
        console.log("Aqui desde el movil", newValue.participantsString);
        if ((newValue.participants !== previousValue.participants) && (newValue.participantsString === previousValue.participantsString))  {
            console.log("Aqui desde el movil");
            if (previousValue.participants.length > newValue.participants.length) {
                let participants = previousValue.participants.filter(x => !newValue.participants.includes(x));
                let participant = participants[0];
                return adminFirebase.firestore().doc(`resources/${resourceId}`).set({participantsString: newValue.participants.join()}, {merge: true})
                    .then(() => {
                        return adminFirebase.firestore().collection('users').where("userId", "==", participant).get()
                            .then((snapshot) => {
                                snapshot.forEach((user) => {
                                    let resources =  user.get('resources');
                                    if (resources === undefined) {
                                        resources = [];
                                    } 
                                    resources = resources.filter(resource => resource !== newValue.resourceId);
                                    return adminFirebase.firestore().doc(`users/${participant}`).set({resources, resourcesString: resources.join()}, {merge: true})
                                        .then(() => {
                                            return console.log("Successfully updated removed resource in user");
                                         });
                                    })
                                });
                });

            } else {
                let participants = newValue.participants.filter(x => !previousValue.participants.includes(x));
                let participant = participants[0];
                return adminFirebase.firestore().doc(`resources/${resourceId}`).set({participantsString: newValue.participants.join()}, {merge: true})
                    .then(() => {
                        return adminFirebase.firestore().collection('users').where("userId", "==", participant).get()
                        .then((snapshot) => {
                            snapshot.forEach((user) => {
                                let resources =  user.get('resources');
                                if (resources === undefined) {
                                    resources = [];
                                }
                                resources.push(newValue.resourceId);
                                    return adminFirebase.firestore().doc(`users/${participant}`).set({resources, resourcesString: resources.join()}, {merge: true})
                                        .then(() => {
                                            return console.log("Successfully updated added resources in user");
                                        });
                            });
                        });
                    });
            }
        }
});

exports.createAbility = functions.firestore
    .document('abilities/{abilityId}')
    .onCreate((snapshot, context) => {
        const abilityId = context.params.abilityId;
        return adminFirebase.firestore().doc(`abilities/${abilityId}`).set({abilityId}, {merge: true})
            .then(() => {
                console.log("Successfully added abilityId to new ability");
            });
    });

exports.createInterest = functions.firestore
    .document('interests/{interestId}')
    .onCreate((snapshot, context) => {
        const interestId = context.params.interestId;
        return adminFirebase.firestore().doc(`interests/${interestId}`).set({interestId}, {merge: true})
            .then(() => {
                console.log("Successfully added interestId to new interest");
            });
    });

exports.createSpecificInterest = functions.firestore
    .document('specificInterests/{specificInterestId}')
    .onCreate((snapshot, context) => {
        const specificInterestId = context.params.specificInterestId;
        return adminFirebase.firestore().doc(`specificInterests/${specificInterestId}`).set({specificInterestId}, {merge: true})
            .then(() => {
                console.log("Successfully added specificInterestId to new specificInterest");
            });
    });

exports.sendEmailActiveUsers = functions.firestore.document('users/{userId}')
.onUpdate((change, context) => {
    const userId = context.params.userId;
    const newValue = change.after.data();
    const beforeValue = change.before.data();
        if (!beforeValue.active && newValue.active) {
            let htmlToSendToNewUser = createWelcomeToUserTemplate(newValue.firstName, newValue.email.trim().toLowerCase(), 'enreda_' + userId.slice(-3) );
            return adminFirebase.firestore().collection('mail').add({
                to: newValue.email,
                message: {
                    subject: 'Equipo enREDa',
                    html: htmlToSendToNewUser,
                }
            })
            }
        
    });

exports.sendEmailNewUsers = functions.firestore
    .document('users/{userId}')
    .onCreate((snapshot, context) => {
        const userId = context.params.userId;
        const role = snapshot.get('role');
        const phone = snapshot.get('phone');
        const address = snapshot.get('address');
        const country = address.country;
        let active = snapshot.get('active')
        //Controlamos inactivos en Peru
        if (active === undefined) {
            if (country === 'WMHqCzqISX6KNVs9b3iN' && role !== 'Desempleado') {
                active = false
            } else {
                active = true
            }
        }
        let htmlToSendToNewUser = (active) ?  createWelcomeToUserTemplate(snapshot.get('firstName'), snapshot.get('email').trim().toLowerCase(), 'enreda_' + userId.slice(-3)) : createWelcomeToInactiveUserTemplate(snapshot.get('firstName'));
        return adminFirebase.firestore().collection('mail').add({
            to: snapshot.get('email'),
            message: {
                subject: 'Equipo enREDa',
                html: htmlToSendToNewUser,
            }
        }).then(() => {
            return adminFirebase.firestore().collection('mail').add({
                to: 'escuchamos@enredaempleo.org',
                message: {
                    subject: 'Tenemos un nuevo integrante',
                    html:
                        createWelcomeToEnredaTemplate(snapshot.get('firstName'),
                            snapshot.get('email'), snapshot.get('role')),
                }
            }).then(() => console.log('Queued email for delivery!'));
        });
    });

function createWelcomeToUserTemplate(name, email, password) {
    const contactToUserTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD
XHTML 1.0 Strict//EN"
"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"> <html
data-editor-version="2" class="sg-campaigns"
xmlns="http://www.w3.org/1999/xhtml">     <head>       <meta
http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1,
minimum-scale=1, maximum-scale=1">       <!--[if !mso]><!-->       <meta
http-equiv="X-UA-Compatible" content="IE=Edge">       <!--<![endif]-->
     <!--[if (gte mso 9)|(IE)]>       <xml>
<o:OfficeDocumentSettings>           <o:AllowPNG/>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>       </xml>       <![endif]-->
<!--[if (gte mso 9)|(IE)]>   <style type="text/css">     body {width:
600px;margin: 0 auto;}     table {border-collapse: collapse;}     table,
td {mso-table-lspace: 0pt;mso-table-rspace: 0pt;}     img
{-ms-interpolation-mode: bicubic;}   </style> <![endif]-->       <style
type="text/css">     body, p, div {       font-family:
verdana,geneva,sans-serif;       font-size: 16px;     }     body {
color: #516775;     }     body a {       color: #993300;
text-decoration: none;     }     p { margin: 0; padding: 0; }
table.wrapper {       width:100% !important;       table-layout: fixed;
      -webkit-font-smoothing: antialiased;
-webkit-text-size-adjust: 100%;       -moz-text-size-adjust: 100%;
-ms-text-size-adjust: 100%;     }     img.max-width {       max-width:
100% !important;     }     .column.of-2 {       width: 50%;     }
.column.of-3 {       width: 33.333%;     }     .column.of-4 {
width: 25%;     }     @media screen and (max-width:480px) {
.preheader .rightColumnContent,       .footer .rightColumnContent {
    text-align: left !important;       }       .preheader
.rightColumnContent div,       .preheader .rightColumnContent span,
  .footer .rightColumnContent div,       .footer .rightColumnContent span
{         text-align: left !important;       }       .preheader
.rightColumnContent,       .preheader .leftColumnContent {
font-size: 80% !important;         padding: 5px 0;       }
table.wrapper-mobile {         width: 100% !important;
table-layout: fixed;       }       img.max-width {         height: auto
!important;         max-width: 100% !important;       }
a.bulletproof-button {         display: block !important;         width:
auto !important;         font-size: 80%;         padding-left: 0
!important;         padding-right: 0 !important;       }       .columns
{         width: 100% !important;       }       .column {
display: block !important;         width: 100% !important;
padding-left: 0 !important;         padding-right: 0 !important;
margin-left: 0 !important;         margin-right: 0 !important;       }
     .social-icon-column {         display: inline-block !important;
  }     }   </style>       <!--user entered Head Start-->       <!--End
Head user entered-->     </head>     <body>       <center
class="wrapper" data-link-color="#993300"
data-body-style="font-size:16px; font-family:verdana,geneva,sans-serif;
color:#516775; background-color:#F9F5F2;">         <div class="webkit">
          <table cellpadding="0" cellspacing="0" border="0" width="100%"
class="wrapper" bgcolor="#F9F5F2">             <tr>               <td
valign="top" bgcolor="#F9F5F2" width="100%">                 <table
width="100%" role="content-container" class="outer" align="center"
cellpadding="0" cellspacing="0" border="0">                   <tr>
               <td width="100%">                       <table
width="100%" cellpadding="0" cellspacing="0" border="0">
         <tr>                           <td>
<!--[if mso]>     <center>     <table><tr><td width="600">
<![endif]-->                                     <table width="100%"
cellpadding="0" cellspacing="0" border="0" style="width:100%;
max-width:600px;" align="center">
<tr>                                         <td
role="modules-container" style="padding:0px 0px 0px 0px; color:#516775;
text-align:left;" bgcolor="#F9F5F2" width="100%" align="left"><table
class="module preheader preheader-hide" role="module"
data-type="preheader" border="0" cellpadding="0" cellspacing="0"
width="100%" style="display: none !important; mso-hide: all; visibility:
hidden; opacity: 0; color: transparent; height: 0; width: 0;">     <tr>
      <td role="module-content">         <p></p>       </td>     </tr>
</table><table class="module" role="module" data-type="spacer"
border="0" cellpadding="0" cellspacing="0" width="100%"
style="table-layout: fixed;" data-muid="bdzDb4B4pnnez4W7L1KpxJ">
<tbody><tr>         <td style="padding:0px 0px 30px 0px;"
role="module-content" bgcolor="">         </td>       </tr>
</tbody></table><table class="wrapper" role="module" data-type="image"
border="0" cellpadding="0" cellspacing="0" width="100%"
style="table-layout: fixed;" data-muid="bKZJcGfRPJb7R2nzyp6ZB6">
<tbody><tr>         <td style="font-size:6px; line-height:10px;
padding:0px 0px 0px 0px;" valign="top" align="center">           <img
class="max-width" border="0" style="display:block; color:#000000;
text-decoration:none; font-family:Helvetica, arial, sans-serif;
font-size:16px; max-width:100% !important; width:100%; height:auto
!important;"
src="http://cdn.mcauto-images-production.sendgrid.net/c2af2ef38a422013/f122e378-4bec-41c0-9b33-a9525ee1efea/2048x1366.jpg"
alt="" width="600" data-responsive="true"
data-proportionally-constrained="false">         </td>       </tr>
</tbody></table><table class="module" role="module" data-type="text"
border="0" cellpadding="0" cellspacing="0" width="100%"
style="table-layout: fixed;" data-muid="gNWHzBzkFeWH4JDKd2Aikk"
data-mc-module-version="2019-10-22">       <tbody><tr>         <td
style="background-color:#ffffff; padding:50px 0px 10px 0px;
line-height:30px; text-align:inherit;" height="100%" valign="top"
bgcolor="#ffffff"><div><div style="font-family: inherit; text-align:
center"><span style="color: #516775; font-size: 28px; font-family:
georgia, serif"><strong>Hola
${name}!</strong></span></div><div></div></div></td>       </tr>
</tbody></table><table class="module" role="module" data-type="text"
border="0" cellpadding="0" cellspacing="0" width="100%"
style="table-layout: fixed;" data-muid="bA2FfEE6abadx6yKoMr3F9"
data-mc-module-version="2019-10-22">       <tbody><tr>         <td
style="background-color:#ffffff; padding:10px 40px 50px 40px;
line-height:22px; text-align:inherit;" height="100%" valign="top"
bgcolor="#ffffff"><div><div style="font-family: inherit; text-align:
center"><span style="font-family: verdana, geneva, sans-serif">Te
informamos de que te has registrado exitosamente en el programa
enREDa.&nbsp;</span></div> <div style="font-family: inherit; text-align:
center">Debes acceder con tu email <strong>${email}</strong> . Además hemos establecido para tí la contraseña por defecto: <strong>${password}</strong> .
Una vez que inicies sesión, te recomendamos que la cambies.</div> <div style="font-family:
inherit; text-align: center">Gracias.</div><div></div></div></td>
</tr>     </tbody></table><table border="0" cellpadding="0"
cellspacing="0" class="module" data-role="module-button"
data-type="button" role="module" style="table-layout:fixed" width="100%"
data-muid="bKHWQMgPkL5opYCkxiM6aS"><tbody><tr><td align="center"
class="outer-td" style="padding:20px 0px 0px 0px;" bgcolor=""><table
border="0" cellpadding="0" cellspacing="0"
class="button-css__deep-table___2OZyb wrapper-mobile"
style="text-align:center"><tbody><tr><td align="center"
bgcolor="#993300" class="inner-td" style="border-radius:6px;
font-size:16px; text-align:center; background-color:inherit;"><a
style="background-color:#993300; border:1px solid #993300;
border-color:#993300; border-radius:0px; border-width:1px;
color:#ffffff; display:inline-block;
font-family:verdana,geneva,sans-serif; font-size:16px;
font-weight:normal; letter-spacing:1px; line-height:30px; padding:12px
20px 12px 20px; text-align:center; text-decoration:none;
border-style:solid;" href='https://enreda-d3b41.firebaseapp.com'
target="_blank">Ir a enREDa</a></td></tr></tbody></table></td></tr></tbody></table><table
class="module" role="module" data-type="text" border="0" cellpadding="0"
cellspacing="0" width="100%" style="table-layout: fixed;"
data-muid="d21b8641-6eaf-4354-9938-61022423da11">     <tbody>       <tr>
         <td style="padding:18px 0px 18px 0px; line-height:22px;
text-align:inherit;" height="100%" valign="top" bgcolor=""
role="module-content"><div><div style="font-family: inherit; text-align:
center"><a 'href=https://www.enredaempleo.org'><span style="font-size:
12px">El equipo de Enreda</span></a></div><div></div></div></td>
</tr>     </tbody>   </table><table class="module" role="module"
data-type="spacer" border="0" cellpadding="0" cellspacing="0"
width="100%" style="table-layout: fixed;"
data-muid="qkfYAswHNSwNpwb1p7m4gC">       <tbody><tr>         <td
style="padding:0px 0px 30px 0px;" role="module-content" bgcolor="">
    </td>       </tr>     </tbody></table><table class="module"
role="module" data-type="spacer" border="0" cellpadding="0"
cellspacing="0" width="100%" style="table-layout: fixed;"
data-muid="f5F8P1n4pQyU8o7DNMMEyW">       <tbody><tr>         <td
style="padding:0px 0px 30px 0px;" role="module-content" bgcolor="">
    </td>       </tr>     </tbody></table></td>
             </tr>                                     </table>
                           <!--[if mso]>
  </td>                                 </tr>
   </table>                             </center>
     <![endif]-->                           </td>
</tr>                       </table>                     </td>
         </tr>                 </table>               </td>
</tr>           </table>         </div>       </center>     </body>
</html>`;
    return contactToUserTemplate;
}


function createWelcomeToInactiveUserTemplate(name) {
    const contactToUserTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD
    XHTML 1.0 Strict//EN"
    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"> <html
    data-editor-version="2" class="sg-campaigns"
    xmlns="http://www.w3.org/1999/xhtml">     <head>       <meta
    http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1,
    minimum-scale=1, maximum-scale=1">       <!--[if !mso]><!-->       <meta
    http-equiv="X-UA-Compatible" content="IE=Edge">       <!--<![endif]-->
         <!--[if (gte mso 9)|(IE)]>       <xml>
    <o:OfficeDocumentSettings>           <o:AllowPNG/>
    <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>       </xml>       <![endif]-->
    <!--[if (gte mso 9)|(IE)]>   <style type="text/css">     body {width:
    600px;margin: 0 auto;}     table {border-collapse: collapse;}     table,
    td {mso-table-lspace: 0pt;mso-table-rspace: 0pt;}     img
    {-ms-interpolation-mode: bicubic;}   </style> <![endif]-->       <style
    type="text/css">     body, p, div {       font-family:
    verdana,geneva,sans-serif;       font-size: 16px;     }     body {
    color: #516775;     }     body a {       color: #993300;
    text-decoration: none;     }     p { margin: 0; padding: 0; }
    table.wrapper {       width:100% !important;       table-layout: fixed;
          -webkit-font-smoothing: antialiased;
    -webkit-text-size-adjust: 100%;       -moz-text-size-adjust: 100%;
    -ms-text-size-adjust: 100%;     }     img.max-width {       max-width:
    100% !important;     }     .column.of-2 {       width: 50%;     }
    .column.of-3 {       width: 33.333%;     }     .column.of-4 {
    width: 25%;     }     @media screen and (max-width:480px) {
    .preheader .rightColumnContent,       .footer .rightColumnContent {
        text-align: left !important;       }       .preheader
    .rightColumnContent div,       .preheader .rightColumnContent span,
      .footer .rightColumnContent div,       .footer .rightColumnContent span
    {         text-align: left !important;       }       .preheader
    .rightColumnContent,       .preheader .leftColumnContent {
    font-size: 80% !important;         padding: 5px 0;       }
    table.wrapper-mobile {         width: 100% !important;
    table-layout: fixed;       }       img.max-width {         height: auto
    !important;         max-width: 100% !important;       }
    a.bulletproof-button {         display: block !important;         width:
    auto !important;         font-size: 80%;         padding-left: 0
    !important;         padding-right: 0 !important;       }       .columns
    {         width: 100% !important;       }       .column {
    display: block !important;         width: 100% !important;
    padding-left: 0 !important;         padding-right: 0 !important;
    margin-left: 0 !important;         margin-right: 0 !important;       }
         .social-icon-column {         display: inline-block !important;
      }     }   </style>       <!--user entered Head Start-->       <!--End
    Head user entered-->     </head>     <body>       <center
    class="wrapper" data-link-color="#993300"
    data-body-style="font-size:16px; font-family:verdana,geneva,sans-serif;
    color:#516775; background-color:#F9F5F2;">         <div class="webkit">
              <table cellpadding="0" cellspacing="0" border="0" width="100%"
    class="wrapper" bgcolor="#F9F5F2">             <tr>               <td
    valign="top" bgcolor="#F9F5F2" width="100%">                 <table
    width="100%" role="content-container" class="outer" align="center"
    cellpadding="0" cellspacing="0" border="0">                   <tr>
                   <td width="100%">                       <table
    width="100%" cellpadding="0" cellspacing="0" border="0">
             <tr>                           <td>
    <!--[if mso]>     <center>     <table><tr><td width="600">
    <![endif]-->                                     <table width="100%"
    cellpadding="0" cellspacing="0" border="0" style="width:100%;
    max-width:600px;" align="center">
    <tr>                                         <td
    role="modules-container" style="padding:0px 0px 0px 0px; color:#516775;
    text-align:left;" bgcolor="#F9F5F2" width="100%" align="left"><table
    class="module preheader preheader-hide" role="module"
    data-type="preheader" border="0" cellpadding="0" cellspacing="0"
    width="100%" style="display: none !important; mso-hide: all; visibility:
    hidden; opacity: 0; color: transparent; height: 0; width: 0;">     <tr>
          <td role="module-content">         <p></p>       </td>     </tr>
    </table><table class="module" role="module" data-type="spacer"
    border="0" cellpadding="0" cellspacing="0" width="100%"
    style="table-layout: fixed;" data-muid="bdzDb4B4pnnez4W7L1KpxJ">
    <tbody><tr>         <td style="padding:0px 0px 30px 0px;"
    role="module-content" bgcolor="">         </td>       </tr>
    </tbody></table><table class="wrapper" role="module" data-type="image"
    border="0" cellpadding="0" cellspacing="0" width="100%"
    style="table-layout: fixed;" data-muid="bKZJcGfRPJb7R2nzyp6ZB6">
    <tbody><tr>         <td style="font-size:6px; line-height:10px;
    padding:0px 0px 0px 0px;" valign="top" align="center">           <img
    class="max-width" border="0" style="display:block; color:#000000;
    text-decoration:none; font-family:Helvetica, arial, sans-serif;
    font-size:16px; max-width:100% !important; width:100%; height:auto
    !important;"
    src="http://cdn.mcauto-images-production.sendgrid.net/c2af2ef38a422013/f122e378-4bec-41c0-9b33-a9525ee1efea/2048x1366.jpg"
    alt="" width="600" data-responsive="true"
    data-proportionally-constrained="false">         </td>       </tr>
    </tbody></table><table class="module" role="module" data-type="text"
    border="0" cellpadding="0" cellspacing="0" width="100%"
    style="table-layout: fixed;" data-muid="gNWHzBzkFeWH4JDKd2Aikk"
    data-mc-module-version="2019-10-22">       <tbody><tr>         <td
    style="background-color:#ffffff; padding:50px 0px 10px 0px;
    line-height:30px; text-align:inherit;" height="100%" valign="top"
    bgcolor="#ffffff"><div><div style="font-family: inherit; text-align:
    center"><span style="color: #516775; font-size: 28px; font-family:
    georgia, serif"><strong>Hola
    ${name}!</strong></span></div><div></div></div></td>       </tr>
    </tbody></table><table class="module" role="module" data-type="text"
    border="0" cellpadding="0" cellspacing="0" width="100%"
    style="table-layout: fixed;" data-muid="bA2FfEE6abadx6yKoMr3F9"
    data-mc-module-version="2019-10-22">       <tbody><tr>         <td
    style="background-color:#ffffff; padding:10px 40px 50px 40px;
    line-height:22px; text-align:inherit;" height="100%" valign="top"
    bgcolor="#ffffff"><div><div style="font-family: inherit; text-align:
    center"><span style="font-family: verdana, geneva, sans-serif">Te
    informamos de que te has registrado exitosamente en el programa
    enREDa.&nbsp;</span></div> <div style="font-family: inherit; text-align:
    center">Vamos a proceder a validar tus datos. En breve nos pondremos en
    contacto contigo y podrás acceder a la plataforma enREDA.</div> <div style="font-family:
    inherit; text-align: center">Gracias.</div><div></div></div></td>
    </tr>     </tbody></table><table border="0" cellpadding="0"
    cellspacing="0" class="module" data-role="module-button"
    data-type="button" role="module" style="table-layout:fixed" width="100%"
    data-muid="bKHWQMgPkL5opYCkxiM6aS"><tbody><tr><td align="center"
    class="outer-td" style="padding:20px 0px 0px 0px;" bgcolor=""><table
    border="0" cellpadding="0" cellspacing="0"
    class="button-css__deep-table___2OZyb wrapper-mobile"
    style="text-align:center"><tbody><tr><td align="center"
    bgcolor="#993300" class="inner-td" style="border-radius:6px;
    font-size:16px; text-align:center; background-color:inherit;"></td></tr></tbody></table></td></tr></tbody></table><table
    class="module" role="module" data-type="text" border="0" cellpadding="0"
    cellspacing="0" width="100%" style="table-layout: fixed;"
    data-muid="d21b8641-6eaf-4354-9938-61022423da11">     <tbody>       <tr>
             <td style="padding:18px 0px 18px 0px; line-height:22px;
    text-align:inherit;" height="100%" valign="top" bgcolor=""
    role="module-content"><div><div style="font-family: inherit; text-align:
    center"><a 'href=https://www.enredaempleo.org'><span style="font-size:
    12px">El equipo de Enreda</span></a></div><div></div></div></td>
    </tr>     </tbody>   </table><table class="module" role="module"
    data-type="spacer" border="0" cellpadding="0" cellspacing="0"
    width="100%" style="table-layout: fixed;"
    data-muid="qkfYAswHNSwNpwb1p7m4gC">       <tbody><tr>         <td
    style="padding:0px 0px 30px 0px;" role="module-content" bgcolor="">
        </td>       </tr>     </tbody></table><table class="module"
    role="module" data-type="spacer" border="0" cellpadding="0"
    cellspacing="0" width="100%" style="table-layout: fixed;"
    data-muid="f5F8P1n4pQyU8o7DNMMEyW">       <tbody><tr>         <td
    style="padding:0px 0px 30px 0px;" role="module-content" bgcolor="">
        </td>       </tr>     </tbody></table></td>
                 </tr>                                     </table>
                               <!--[if mso]>
      </td>                                 </tr>
       </table>                             </center>
         <![endif]-->                           </td>
    </tr>                       </table>                     </td>
             </tr>                 </table>               </td>
    </tr>           </table>         </div>       </center>     </body>
    </html>`;
    return contactToUserTemplate;
}

function createWelcomeToEnredaTemplate(name, email, role) {
    const contactToEnredaTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD
XHTML 1.0 Strict//EN"
"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"> <html
data-editor-version="2" class="sg-campaigns"
xmlns="http://www.w3.org/1999/xhtml">     <head>       <meta
http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1,
minimum-scale=1, maximum-scale=1">       <!--[if !mso]><!-->       <meta
http-equiv="X-UA-Compatible" content="IE=Edge">       <!--<![endif]-->
     <!--[if (gte mso 9)|(IE)]>       <xml>
<o:OfficeDocumentSettings>           <o:AllowPNG/>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>       </xml>       <![endif]-->
<!--[if (gte mso 9)|(IE)]>   <style type="text/css">     body {width:
600px;margin: 0 auto;}     table {border-collapse: collapse;}     table,
td {mso-table-lspace: 0pt;mso-table-rspace: 0pt;}     img
{-ms-interpolation-mode: bicubic;}   </style> <![endif]-->       <style
type="text/css">     body, p, div {       font-family:
verdana,geneva,sans-serif;       font-size: 16px;     }     body {
color: #516775;     }     body a {       color: #993300;
text-decoration: none;     }     p { margin: 0; padding: 0; }
table.wrapper {       width:100% !important;       table-layout: fixed;
      -webkit-font-smoothing: antialiased;
-webkit-text-size-adjust: 100%;       -moz-text-size-adjust: 100%;
-ms-text-size-adjust: 100%;     }     img.max-width {       max-width:
100% !important;     }     .column.of-2 {       width: 50%;     }
.column.of-3 {       width: 33.333%;     }     .column.of-4 {
width: 25%;     }     @media screen and (max-width:480px) {
.preheader .rightColumnContent,       .footer .rightColumnContent {
    text-align: left !important;       }       .preheader
.rightColumnContent div,       .preheader .rightColumnContent span,
  .footer .rightColumnContent div,       .footer .rightColumnContent span
{         text-align: left !important;       }       .preheader
.rightColumnContent,       .preheader .leftColumnContent {
font-size: 80% !important;         padding: 5px 0;       }
table.wrapper-mobile {         width: 100% !important;
table-layout: fixed;       }       img.max-width {         height: auto
!important;         max-width: 100% !important;       }
a.bulletproof-button {         display: block !important;         width:
auto !important;         font-size: 80%;         padding-left: 0
!important;         padding-right: 0 !important;       }       .columns
{         width: 100% !important;       }       .column {
display: block !important;         width: 100% !important;
padding-left: 0 !important;         padding-right: 0 !important;
margin-left: 0 !important;         margin-right: 0 !important;       }
     .social-icon-column {         display: inline-block !important;
  }     }   </style>       <!--user entered Head Start-->       <!--End
Head user entered-->     </head>     <body>       <center
class="wrapper" data-link-color="#993300"
data-body-style="font-size:16px; font-family:verdana,geneva,sans-serif;
color:#516775; background-color:#F9F5F2;">         <div class="webkit">
          <table cellpadding="0" cellspacing="0" border="0" width="100%"
class="wrapper" bgcolor="#F9F5F2">             <tr>               <td
valign="top" bgcolor="#F9F5F2" width="100%">                 <table
width="100%" role="content-container" class="outer" align="center"
cellpadding="0" cellspacing="0" border="0">                   <tr>
               <td width="100%">                       <table
width="100%" cellpadding="0" cellspacing="0" border="0">
         <tr>                           <td>
<!--[if mso]>     <center>     <table><tr><td width="600">
<![endif]-->                                     <table width="100%"
cellpadding="0" cellspacing="0" border="0" style="width:100%;
max-width:600px;" align="center">
<tr>                                         <td
role="modules-container" style="padding:0px 0px 0px 0px; color:#516775;
text-align:left;" bgcolor="#F9F5F2" width="100%" align="left"><table
class="module preheader preheader-hide" role="module"
data-type="preheader" border="0" cellpadding="0" cellspacing="0"
width="100%" style="display: none !important; mso-hide: all; visibility:
hidden; opacity: 0; color: transparent; height: 0; width: 0;">     <tr>
      <td role="module-content">         <p>Enreda: te ayudamos a
construir tu futuro</p>       </td>     </tr>   </table><table
class="module" role="module" data-type="spacer" border="0"
cellpadding="0" cellspacing="0" width="100%" style="table-layout:
fixed;" data-muid="iqe7juSSgLbdm3gXWExpsY">       <tbody><tr>
<td style="padding:0px 0px 30px 0px;" role="module-content" bgcolor="">
        </td>       </tr>     </tbody></table><table class="wrapper"
role="module" data-type="image" border="0" cellpadding="0"
cellspacing="0" width="100%" style="table-layout: fixed;"
data-muid="eUYR8ZuwyTirQCAuyEc98X">       <tbody><tr>         <td
style="font-size:6px; line-height:10px; padding:0px 0px 0px 0px;"
valign="top" align="center">           <img class="max-width" border="0"
style="display:block; color:#000000; text-decoration:none;
font-family:Helvetica, arial, sans-serif; font-size:16px; max-width:100%
!important; width:100%; height:auto !important;"
src="http://cdn.mcauto-images-production.sendgrid.net/c2af2ef38a422013/f122e378-4bec-41c0-9b33-a9525ee1efea/2048x1366.jpg"
alt="" width="600" data-responsive="true"
data-proportionally-constrained="false">         </td>       </tr>
</tbody></table><table class="module" role="module" data-type="text"
border="0" cellpadding="0" cellspacing="0" width="100%"
style="table-layout: fixed;" data-muid="8VquPM2ZMj7RJRhAUE6wmF"
data-mc-module-version="2019-10-22">       <tbody><tr>         <td
style="background-color:#ffffff; padding:50px 0px 10px 0px;
line-height:30px; text-align:inherit;" height="100%" valign="top"
bgcolor="#ffffff"><div><div style="font-family: inherit; text-align:
center"><span style="font-size: 18px">Tenemos un nuevo
integrante</span></div><div></div></div></td>       </tr>
</tbody></table><table class="module" role="module" data-type="text"
border="0" cellpadding="0" cellspacing="0" width="100%"
style="table-layout: fixed;" data-muid="keQHYG1b1ztewxwhDtuCpS"
data-mc-module-version="2019-10-22">       <tbody><tr>         <td
style="background-color:#ffffff; padding:10px 40px 20px 40px;
line-height:22px; text-align:inherit;" height="100%" valign="top"
bgcolor="#ffffff"><div><div style="font-family: inherit; text-align:
center"><span style="font-family: verdana, geneva, sans-serif;
font-size: 14px">Datos de contacto:</span></div> <ul>   <li
style="text-align: inherit; font-size: 14px; font-size: 14px"><span
style="font-size: 14px">Nombre: ${name}</span></li>   <li
style="text-align: inherit; font-family: verdana, geneva, sans-serif;
font-size: 14px; font-size: 14px"><span style="font-family: verdana,
geneva, sans-serif; font-size: 14px">Email: ${email}</span></li>   <li
style="text-align: inherit; font-family: verdana, geneva, sans-serif;
font-size: 14px; font-size: 14px"><span style="font-family: verdana,
geneva, sans-serif; font-size: 14px">Rol: ${role}</span></li>
</ul><div></div></div></td>       </tr>     </tbody></table><table
class="module" role="module" data-type="spacer" border="0"
cellpadding="0" cellspacing="0" width="100%" style="table-layout:
fixed;" data-muid="noXVUxSTfKbdSVM2Xrua2t">       <tbody><tr>
<td style="padding:0px 0px 30px 0px;" role="module-content" bgcolor="">
        </td>       </tr>     </tbody></table><table class="module"
role="module" data-type="spacer" border="0" cellpadding="0"
cellspacing="0" width="100%" style="table-layout: fixed;"
data-muid="51LxsNyTDYV3Xp5k5vET2o">       <tbody><tr>         <td
style="padding:0px 0px 30px 0px;" role="module-content" bgcolor="">
    </td>       </tr>     </tbody></table><table class="module"
role="module" data-type="spacer" border="0" cellpadding="0"
cellspacing="0" width="100%" style="table-layout: fixed;"
data-muid="aQTmVGoZvs6GLJLWsiastG">       <tbody><tr>         <td
style="padding:0px 0px 40px 0px;" role="module-content" bgcolor="">
    </td>       </tr>     </tbody></table><table class="module"
role="module" data-type="spacer" border="0" cellpadding="0"
cellspacing="0" width="100%" style="table-layout: fixed;"
data-muid="eAq5DwvRYWV4D7T3oBCXhH">       <tbody><tr>         <td
style="padding:0px 0px 30px 0px;" role="module-content" bgcolor="">
    </td>       </tr>     </tbody></table></td>
             </tr>                                     </table>
                           <!--[if mso]>
  </td>                                 </tr>
   </table>                             </center>
     <![endif]-->                           </td>
</tr>                       </table>                     </td>
         </tr>                 </table>               </td>
</tr>           </table>         </div>       </center>     </body>
</html>`;
    return contactToEnredaTemplate;
}


exports.contactFormHandler = functions.firestore
    .document('contact/{contactId}')
    .onCreate((snapshot, context) => {
        const contactId = context.params.contactId;
        return adminFirebase.firestore().doc(`contact/${contactId}`).set({contactId}, {
            merge:
                true
        })
            .then(() => {
                return adminFirebase.firestore().collection('mail').add({
                    to: snapshot.get('email'),
                    message: {
                        subject: 'Enreda: gracias por contactar',
                        html:
                            createContactToUserTemplate(snapshot.get('name')),
                    }
                }).then(() => {
                    return adminFirebase.firestore().collection('mail').add({
                        to: 'escuchamos@enredaempleo.org',
                        message: {
                            subject: 'Hemos recibido una solicitud de contacto',
                            html:
                                createContactToEnredaTemplate(snapshot.get('name'),
                                    snapshot.get('email'), snapshot.get('text')),
                        }
                    }).then(() => console.log('Queued email for delivery!'));
                });
            });
    });

function createContactToUserTemplate(name) {
    const contactToUserTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD
XHTML 1.0 Strict//EN"
"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"> <html
data-editor-version="2" class="sg-campaigns"
xmlns="http://www.w3.org/1999/xhtml">     <head>       <meta
http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1,
minimum-scale=1, maximum-scale=1">       <!--[if !mso]><!-->       <meta
http-equiv="X-UA-Compatible" content="IE=Edge">       <!--<![endif]-->
     <!--[if (gte mso 9)|(IE)]>       <xml>
<o:OfficeDocumentSettings>           <o:AllowPNG/>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>       </xml>       <![endif]-->
<!--[if (gte mso 9)|(IE)]>   <style type="text/css">     body {width:
600px;margin: 0 auto;}     table {border-collapse: collapse;}     table,
td {mso-table-lspace: 0pt;mso-table-rspace: 0pt;}     img
{-ms-interpolation-mode: bicubic;}   </style> <![endif]-->       <style
type="text/css">     body, p, div {       font-family:
verdana,geneva,sans-serif;       font-size: 16px;     }     body {
color: #516775;     }     body a {       color: #993300;
text-decoration: none;     }     p { margin: 0; padding: 0; }
table.wrapper {       width:100% !important;       table-layout: fixed;
      -webkit-font-smoothing: antialiased;
-webkit-text-size-adjust: 100%;       -moz-text-size-adjust: 100%;
-ms-text-size-adjust: 100%;     }     img.max-width {       max-width:
100% !important;     }     .column.of-2 {       width: 50%;     }
.column.of-3 {       width: 33.333%;     }     .column.of-4 {
width: 25%;     }     @media screen and (max-width:480px) {
.preheader .rightColumnContent,       .footer .rightColumnContent {
    text-align: left !important;       }       .preheader
.rightColumnContent div,       .preheader .rightColumnContent span,
  .footer .rightColumnContent div,       .footer .rightColumnContent span
{         text-align: left !important;       }       .preheader
.rightColumnContent,       .preheader .leftColumnContent {
font-size: 80% !important;         padding: 5px 0;       }
table.wrapper-mobile {         width: 100% !important;
table-layout: fixed;       }       img.max-width {         height: auto
!important;         max-width: 100% !important;       }
a.bulletproof-button {         display: block !important;         width:
auto !important;         font-size: 80%;         padding-left: 0
!important;         padding-right: 0 !important;       }       .columns
{         width: 100% !important;       }       .column {
display: block !important;         width: 100% !important;
padding-left: 0 !important;         padding-right: 0 !important;
margin-left: 0 !important;         margin-right: 0 !important;       }
     .social-icon-column {         display: inline-block !important;
  }     }   </style>       <!--user entered Head Start-->       <!--End
Head user entered-->     </head>     <body>       <center
class="wrapper" data-link-color="#993300"
data-body-style="font-size:16px; font-family:verdana,geneva,sans-serif;
color:#516775; background-color:#F9F5F2;">         <div class="webkit">
          <table cellpadding="0" cellspacing="0" border="0" width="100%"
class="wrapper" bgcolor="#F9F5F2">             <tr>               <td
valign="top" bgcolor="#F9F5F2" width="100%">                 <table
width="100%" role="content-container" class="outer" align="center"
cellpadding="0" cellspacing="0" border="0">                   <tr>
               <td width="100%">                       <table
width="100%" cellpadding="0" cellspacing="0" border="0">
         <tr>                           <td>
<!--[if mso]>     <center>     <table><tr><td width="600">
<![endif]-->                                     <table width="100%"
cellpadding="0" cellspacing="0" border="0" style="width:100%;
max-width:600px;" align="center">
<tr>                                         <td
role="modules-container" style="padding:0px 0px 0px 0px; color:#516775;
text-align:left;" bgcolor="#F9F5F2" width="100%" align="left"><table
class="module preheader preheader-hide" role="module"
data-type="preheader" border="0" cellpadding="0" cellspacing="0"
width="100%" style="display: none !important; mso-hide: all; visibility:
hidden; opacity: 0; color: transparent; height: 0; width: 0;">     <tr>
      <td role="module-content">         <p>Enreda: te ayudamos a
construir tu futuro</p>       </td>     </tr>   </table><table
class="module" role="module" data-type="spacer" border="0"
cellpadding="0" cellspacing="0" width="100%" style="table-layout:
fixed;" data-muid="bdzDb4B4pnnez4W7L1KpxJ">       <tbody><tr>
<td style="padding:0px 0px 30px 0px;" role="module-content" bgcolor="">
        </td>       </tr>     </tbody></table><table class="wrapper"
role="module" data-type="image" border="0" cellpadding="0"
cellspacing="0" width="100%" style="table-layout: fixed;"
data-muid="bKZJcGfRPJb7R2nzyp6ZB6">       <tbody><tr>         <td
style="font-size:6px; line-height:10px; padding:0px 0px 0px 0px;"
valign="top" align="center">                    <a
href="https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/landing.jpg?alt=media&token=32f29414-27bd-46e5-af96-94d65aa730fb"><img
class="max-width" border="0" style="display:block; color:#000000;
text-decoration:none; font-family:Helvetica, arial, sans-serif;
font-size:16px; max-width:100% !important; width:100%; height:auto
!important;"
src="http://cdn.mcauto-images-production.sendgrid.net/c2af2ef38a422013/f122e378-4bec-41c0-9b33-a9525ee1efea/2048x1366.jpg"
alt="" width="600" data-responsive="true"
data-proportionally-constrained="false"></a></td>       </tr>
</tbody></table><table class="module" role="module" data-type="text"
border="0" cellpadding="0" cellspacing="0" width="100%"
style="table-layout: fixed;" data-muid="gNWHzBzkFeWH4JDKd2Aikk"
data-mc-module-version="2019-10-22">       <tbody><tr>         <td
style="background-color:#ffffff; padding:50px 0px 10px 0px;
line-height:30px; text-align:inherit;" height="100%" valign="top"
bgcolor="#ffffff"><div><div style="font-family: inherit; text-align:
center"><span style="color: #516775; font-size: 28px; font-family:
georgia, serif"><strong>Hola
${name}!</strong></span></div><div></div></div></td>       </tr>
</tbody></table><table class="module" role="module" data-type="text"
border="0" cellpadding="0" cellspacing="0" width="100%"
style="table-layout: fixed;" data-muid="bA2FfEE6abadx6yKoMr3F9"
data-mc-module-version="2019-10-22">       <tbody><tr>         <td
style="background-color:#ffffff; padding:10px 40px 50px 40px;
line-height:22px; text-align:inherit;" height="100%" valign="top"
bgcolor="#ffffff"><div><div style="font-family: inherit; text-align:
center"><span style="font-family: verdana, geneva, sans-serif">Esto es
un mensaje de confirmación de que nos ha llegado tu mensaje. Pronto nos
pondremos en contacto contigo.</span></div> <div style="font-family:
inherit; text-align: center"><br></div> <div style="font-family:
inherit; text-align: center"><span style="font-family: verdana, geneva,
sans-serif">Gracias por usar nuestro
servicio.</span></div><div></div></div></td>       </tr>
</tbody></table><table class="module" role="module" data-type="spacer"
border="0" cellpadding="0" cellspacing="0" width="100%"
style="table-layout: fixed;" data-muid="dnNq8YR2nu8DNzse1aZUWt">
<tbody><tr>         <td style="padding:0px 0px 30px 0px;"
role="module-content" bgcolor="">         </td>       </tr>
</tbody></table><table class="module" role="module" data-type="text"
border="0" cellpadding="0" cellspacing="0" width="100%"
style="table-layout: fixed;"
data-muid="a480059a-7a08-4b9a-b00b-908370582008"
data-mc-module-version="2019-10-22">     <tbody>       <tr>         <td
style="padding:18px 0px 18px 0px; line-height:22px; text-align:inherit;"
height="100%" valign="top" bgcolor="" role="module-content"><div><div
style="font-family: inherit; text-align: center"><a
href="https://www.enredaempleo.org/"><span style="font-size: 12px">El
equipo de Enreda</span></a></div><div></div></div></td>       </tr>
</tbody>   </table><table class="module" role="module"
data-type="spacer" border="0" cellpadding="0" cellspacing="0"
width="100%" style="table-layout: fixed;"
data-muid="f5F8P1n4pQyU8o7DNMMEyW">       <tbody><tr>         <td
style="padding:0px 0px 30px 0px;" role="module-content" bgcolor="">
    </td>       </tr>     </tbody></table></td>
             </tr>                                     </table>
                           <!--[if mso]>
  </td>                                 </tr>
   </table>                             </center>
     <![endif]-->                           </td>
</tr>                       </table>                     </td>
         </tr>                 </table>               </td>
</tr>           </table>         </div>       </center>     </body>
</html>`;
    return contactToUserTemplate;
}

function createContactToEnredaTemplate(name, email, text) {
    const contactToEnredaTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD
XHTML 1.0 Strict//EN"
"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"> <html
data-editor-version="2" class="sg-campaigns"
xmlns="http://www.w3.org/1999/xhtml">     <head>       <meta
http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1,
minimum-scale=1, maximum-scale=1">       <!--[if !mso]><!-->       <meta
http-equiv="X-UA-Compatible" content="IE=Edge">       <!--<![endif]-->
     <!--[if (gte mso 9)|(IE)]>       <xml>
<o:OfficeDocumentSettings>           <o:AllowPNG/>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>       </xml>       <![endif]-->
<!--[if (gte mso 9)|(IE)]>   <style type="text/css">     body {width:
600px;margin: 0 auto;}     table {border-collapse: collapse;}     table,
td {mso-table-lspace: 0pt;mso-table-rspace: 0pt;}     img
{-ms-interpolation-mode: bicubic;}   </style> <![endif]-->       <style
type="text/css">     body, p, div {       font-family:
verdana,geneva,sans-serif;       font-size: 16px;     }     body {
color: #516775;     }     body a {       color: #993300;
text-decoration: none;     }     p { margin: 0; padding: 0; }
table.wrapper {       width:100% !important;       table-layout: fixed;
      -webkit-font-smoothing: antialiased;
-webkit-text-size-adjust: 100%;       -moz-text-size-adjust: 100%;
-ms-text-size-adjust: 100%;     }     img.max-width {       max-width:
100% !important;     }     .column.of-2 {       width: 50%;     }
.column.of-3 {       width: 33.333%;     }     .column.of-4 {
width: 25%;     }     @media screen and (max-width:480px) {
.preheader .rightColumnContent,       .footer .rightColumnContent {
    text-align: left !important;       }       .preheader
.rightColumnContent div,       .preheader .rightColumnContent span,
  .footer .rightColumnContent div,       .footer .rightColumnContent span
{         text-align: left !important;       }       .preheader
.rightColumnContent,       .preheader .leftColumnContent {
font-size: 80% !important;         padding: 5px 0;       }
table.wrapper-mobile {         width: 100% !important;
table-layout: fixed;       }       img.max-width {         height: auto
!important;         max-width: 100% !important;       }
a.bulletproof-button {         display: block !important;         width:
auto !important;         font-size: 80%;         padding-left: 0
!important;         padding-right: 0 !important;       }       .columns
{         width: 100% !important;       }       .column {
display: block !important;         width: 100% !important;
padding-left: 0 !important;         padding-right: 0 !important;
margin-left: 0 !important;         margin-right: 0 !important;       }
     .social-icon-column {         display: inline-block !important;
  }     }   </style>       <!--user entered Head Start-->       <!--End
Head user entered-->     </head>     <body>       <center
class="wrapper" data-link-color="#993300"
data-body-style="font-size:16px; font-family:verdana,geneva,sans-serif;
color:#516775; background-color:#F9F5F2;">         <div class="webkit">
          <table cellpadding="0" cellspacing="0" border="0" width="100%"
class="wrapper" bgcolor="#F9F5F2">             <tr>               <td
valign="top" bgcolor="#F9F5F2" width="100%">                 <table
width="100%" role="content-container" class="outer" align="center"
cellpadding="0" cellspacing="0" border="0">                   <tr>
               <td width="100%">                       <table
width="100%" cellpadding="0" cellspacing="0" border="0">
         <tr>                           <td>
<!--[if mso]>     <center>     <table><tr><td width="600">
<![endif]-->                                     <table width="100%"
cellpadding="0" cellspacing="0" border="0" style="width:100%;
max-width:600px;" align="center">
<tr>                                         <td
role="modules-container" style="padding:0px 0px 0px 0px; color:#516775;
text-align:left;" bgcolor="#F9F5F2" width="100%" align="left"><table
class="module preheader preheader-hide" role="module"
data-type="preheader" border="0" cellpadding="0" cellspacing="0"
width="100%" style="display: none !important; mso-hide: all; visibility:
hidden; opacity: 0; color: transparent; height: 0; width: 0;">     <tr>
      <td role="module-content">         <p>Enreda: te ayudamos a
construir tu futuro</p>       </td>     </tr>   </table><table
class="module" role="module" data-type="spacer" border="0"
cellpadding="0" cellspacing="0" width="100%" style="table-layout:
fixed;" data-muid="iqe7juSSgLbdm3gXWExpsY">       <tbody><tr>
<td style="padding:0px 0px 30px 0px;" role="module-content" bgcolor="">
        </td>       </tr>     </tbody></table><table class="wrapper"
role="module" data-type="image" border="0" cellpadding="0"
cellspacing="0" width="100%" style="table-layout: fixed;"
data-muid="eUYR8ZuwyTirQCAuyEc98X">       <tbody><tr>         <td
style="font-size:6px; line-height:10px; padding:0px 0px 0px 0px;"
valign="top" align="center">           <img class="max-width" border="0"
style="display:block; color:#000000; text-decoration:none;
font-family:Helvetica, arial, sans-serif; font-size:16px; max-width:100%
!important; width:100%; height:auto !important;"
src="http://cdn.mcauto-images-production.sendgrid.net/c2af2ef38a422013/f122e378-4bec-41c0-9b33-a9525ee1efea/2048x1366.jpg"
alt="" width="600" data-responsive="true"
data-proportionally-constrained="false">         </td>       </tr>
</tbody></table><table class="module" role="module" data-type="text"
border="0" cellpadding="0" cellspacing="0" width="100%"
style="table-layout: fixed;" data-muid="8VquPM2ZMj7RJRhAUE6wmF"
data-mc-module-version="2019-10-22">       <tbody><tr>         <td
style="background-color:#ffffff; padding:50px 0px 10px 0px;
line-height:30px; text-align:inherit;" height="100%" valign="top"
bgcolor="#ffffff"><div><div style="font-family: inherit; text-align:
center"><span style="font-size: 18px">Hemos recibido una solicitud de
contacto</span></div><div></div></div></td>       </tr>
</tbody></table><table class="module" role="module" data-type="text"
border="0" cellpadding="0" cellspacing="0" width="100%"
style="table-layout: fixed;" data-muid="keQHYG1b1ztewxwhDtuCpS"
data-mc-module-version="2019-10-22">       <tbody><tr>         <td
style="background-color:#ffffff; padding:10px 40px 20px 40px;
line-height:22px; text-align:inherit;" height="100%" valign="top"
bgcolor="#ffffff"><div><div style="font-family: inherit; text-align:
center"><span style="font-family: verdana, geneva, sans-serif;
font-size: 14px">Datos del contacto:</span></div> <ul>   <li
style="text-align: inherit; font-size: 14px; font-size: 14px"><span
style="font-size: 14px">Nombre: ${name}</span></li>   <li
style="text-align: inherit; font-family: verdana, geneva, sans-serif;
font-size: 14px; font-size: 14px"><span style="font-family: verdana,
geneva, sans-serif; font-size: 14px">Email: ${email}</span></li>   <li
style="text-align: inherit; font-family: verdana, geneva, sans-serif;
font-size: 14px; font-size: 14px"><span style="font-family: verdana,
geneva, sans-serif; font-size: 14px">Asunto: ${text}</span></li>
</ul><div></div></div></td>       </tr>     </tbody></table><table
class="module" role="module" data-type="spacer" border="0"
cellpadding="0" cellspacing="0" width="100%" style="table-layout:
fixed;" data-muid="noXVUxSTfKbdSVM2Xrua2t">       <tbody><tr>
<td style="padding:0px 0px 30px 0px;" role="module-content" bgcolor="">
        </td>       </tr>     </tbody></table><table class="module"
role="module" data-type="spacer" border="0" cellpadding="0"
cellspacing="0" width="100%" style="table-layout: fixed;"
data-muid="51LxsNyTDYV3Xp5k5vET2o">       <tbody><tr>         <td
style="padding:0px 0px 30px 0px;" role="module-content" bgcolor="">
    </td>       </tr>     </tbody></table><table class="module"
role="module" data-type="spacer" border="0" cellpadding="0"
cellspacing="0" width="100%" style="table-layout: fixed;"
data-muid="aQTmVGoZvs6GLJLWsiastG">       <tbody><tr>         <td
style="padding:0px 0px 40px 0px;" role="module-content" bgcolor="">
    </td>       </tr>     </tbody></table><table class="module"
role="module" data-type="spacer" border="0" cellpadding="0"
cellspacing="0" width="100%" style="table-layout: fixed;"
data-muid="eAq5DwvRYWV4D7T3oBCXhH">       <tbody><tr>         <td
style="padding:0px 0px 30px 0px;" role="module-content" bgcolor="">
    </td>       </tr>     </tbody></table></td>
             </tr>                                     </table>
                           <!--[if mso]>
  </td>                                 </tr>
   </table>                             </center>
     <![endif]-->                           </td>
</tr>                       </table>                     </td>
         </tr>                 </table>               </td>
</tr>           </table>         </div>       </center>     </body>
</html>`;
    return contactToEnredaTemplate;
}

exports.sendEmailOnCreateResource = functions.firestore
    .document('resources/{resourceId}')
    .onCreate((snapshot, context) => {
        const resourceId = context.params.resourceId;
        const interests = [];
        Object.values(snapshot.get('interests')).forEach((key) => {
            interests.push(key);
        });
        const title = snapshot.get('title');
        const resourceType = snapshot.get('resourceType');
        const resourceStatus = snapshot.get('status');
        if (resourceStatus !== 'A actualizar') {
                return adminFirebase.firestore().collection('users').get().then((snapshot) => {
                    snapshot.forEach((user) => {
                        if (user.get('role') === 'Desempleado') {

                            const payload = {
                                notification: {
                                    title: 'enREDa',
                                    body: `Nuevo recurso: ${title}`,
                                    sound: "default"
                                },
                                data: {
                                    resourceId: resourceId,
                                    click_action: "FLUTTER_NOTIFICATION_CLICK",
                                    title: 'enREDa',
                                    body: `Nuevos recursos basados en tus intereses`,
                                }
                            };
                            const options = {
                                priority: "high",
                                timeToLive: 60 * 60 * 24
                            };
                            
                            // Si el recurso es de ocio, se envia a todo los desempleados
                            if (resourceType === 'iGkqdz7uiWuXAFz1O8PY') {
                                return adminFirebase.messaging().sendToTopic(user.get('userId'),payload, options);
                            }
                            else {
                                if (user.get('unemployedType') === 'T1' || user.get('unemployedType') === 'T2') {
                                    return adminFirebase.messaging().sendToTopic(user.get('userId'),payload, options);
                                } 
                                // Si el recurso es de habilidades sociales 
                                else if (resourceType === 'GOw01m2HPro4I8xd6rSj'){
                                    // Si el desempleado tiene la habilidad "Habilidades sociales"
                                    if (user.get('motivation').abilities.includes('kv0ZGalD2ViPdTx0BMm6')) {
                                        return adminFirebase.messaging().sendToTopic(user.get('userId'),payload, options);
                                    }  
                                } 
                                // Si el recurso es de Financación
                                else if (resourceType === 'PPX3Ufeg9YfzH4YA0SkU'){
                                    // Si el desempleado tiene la habilidad "Financiacion"
                                    if (user.get('motivation').abilities.includes('5X4lcOCqMTAZ4UwQLl03')) {
                                        return adminFirebase.messaging().sendToTopic(user.get('userId'),payload, options);
                                    }  
                                } 
                                // Si el recurso es de mentoria
                                else if (resourceType === 'lUubulxiAGo4llxFJrkl'){
                                    // Si el desempleado tiene la habilidad "Apoyo profesional al sector laboral" 
                                    if (user.get('motivation').abilities.includes('3ywxTQBRJ6wzgMiVx9GE')) {
                                        return adminFirebase.messaging().sendToTopic(user.get('userId'),payload, options);
                                    }
                                }
                                // Si el recurso es de Apoyo y orientacion para el empleo
                                else if (resourceType === 'MvCHSFzASskxlkBzPElb'){ 
                                    // Si el desempleado tiene la habilidad "Apoyo profesional al sector laboral"
                                    if (user.get('motivation').abilities.includes('RrBucTiz917syI4jyJKz')) {
                                        return adminFirebase.messaging().sendToTopic(user.get('userId'),payload, options);
                                    }
                                } 
                                // Si el recurso es de programa para la emprendeduria 
                                else if (resourceType === '4l9BLhP7cwXohUvQzMOT'){
                                    // Si el desempleado tiene la habilidad "Emprenduderia"
                                    if (user.get('motivation').abilities.includes('0m7igV4HhWcXwWabBKK5')) {
                                        return adminFirebase.messaging().sendToTopic(user.get('userId'),payload, options);
                                    }  
                                } 
                                // Si el recurso es de formacion
                                else if (resourceType === 'N9KdlBYmxUp82gOv8oJC'){
                                    // Si el desempleado tiene la habilidad "Formacion"
                                    if (user.get('motivation').abilities.includes('nMWfKP0yOqQf8Zv4A3n6')) {
                                        return adminFirebase.messaging().sendToTopic(user.get('userId'),payload, options);
                                    }  
                                }  
                                else {
                                    const interestsUser = [];
                                    user.get('interests').interests.forEach((i) => {
                                        interestsUser.push(i);
                                    });
                                    interestsUser.forEach((interestUser) => {
                                        if (interests.indexOf(interestUser) > -1) {
                                            return adminFirebase.messaging().sendToTopic(user.get('userId'),payload, options);
                                        }
                                    })
                                }
                            }
                        }
                    });
                })
        } 
});

// Web Scrapping
const findResourcesFromSPEGC = async () => {
    let url = 'https://www.spegc.org/formacion-y-eventos/'

    let browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    let page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image') {
            req.abort();
        }
        else {
            req.continue();
        }
    });
    await page.goto(url)

    //let resourcesUpdated = []
    const data = await page.evaluate(() => {
        let dataResources = []
        document.querySelectorAll('.spegc-event-item')
        .forEach(element => {

            let name = element.querySelector('.spegc-event-details h3').textContent;
            let interest = element.querySelector('.spegc-event-details h4').textContent;
            let resourceType = element.querySelector('.spegc-event-details h5').textContent;
            let description = element.querySelector('.spegc-event-details p').textContent;
            let href = element.querySelector('.spegc-event-details a').getAttribute("href");
            
            if (resourceType === 'Cursos y talleres') {
                resourceType = 'N9KdlBYmxUp82gOv8oJC'
            } else if (resourceType === 'Eventos profesionales') {
                resourceType = 'EsV5yvTXtyIrVobpefB6'
            } else {
                resourceType = 'E19QFsYBxlcw3edEF2Qp'
            }

            if (interest === 'Emprendimiento') {
                interest = 'BVBV4H4mrghFRnQK3tOA' 
            } else if (interest === 'Innovación turística') {
                interest = 'TRVa15HNc516NCdCOAeG' 
            } else if (interest === 'Gestión empresarial') {
                interest = 'BVBV4H4mrghFRnQK3tOA' 
            } else if (interest === 'Internacionalización') {
                interest = 'BVBV4H4mrghFRnQK3tOA'
            } else if (interest === 'Competencias digitales avanzadas') {
                interest = 'GTe4CPQHW0yIgVgRt03k' 
            } else if (interest === 'Audiovisual') {
                interest = '8lOJhlXeeTsbsDqy8DTk' 
            } else if (interest === 'Datos y analítica') {
                interest = 'eKoGjUxkRY1AqTZR3Tky' 
            } else if (interest === 'i+D+i') {
                interest = 'GTe4CPQHW0yIgVgRt03k' 
            } else if (interest === 'Innovación rural') {
                interest = 'GTe4CPQHW0yIgVgRt03k'
            } else if (interest === 'Marketing y diseño') {
                interest = '8lOJhlXeeTsbsDqy8DTk' 
            } else if (interest === 'Sostenibilidad') {
                interest = 'eKoGjUxkRY1AqTZR3Tky' 
            } else {
                interest = 'ecLsXVpU4GOnYQpSCL8y' 
            }

            let resource = {
                title: name,
                description: description,
                resourceType: resourceType,
                interests: [interest],
                createdby: 'SPEGC Scrapper',
                updatedby: 'SPEGC Scrapper',
                capacity: 100,
                assistants: '0',
                link: href,
                duration: '-',
                organizer: 'btTAIYUkGSgqlEAnaZJB',
                organizationType: 'Organización',
                status:'A actualizar',
                address: {
                    city: 'U39M922HHR5FEVJtN3hN',
                    country: 'i0GHKqdCWBYeAYcAMa7I',
                    place: '-',
                    province: 'mi3tu6DK1GU4yZIQJ1dZ',
                    street: '-'
        
                },
            }
            dataResources.push(resource)
            
        });
        return dataResources
    })
    
    await browser.close()
    return data
}

exports.extractResourcesFromSPEG = functions.runWith(options).pubsub.topic('scrappingSPEG').onPublish(() => {
    return findResourcesFromSPEGC().then(res => {
        res.forEach( resource => {
            return resourceToCreate.where("title", "==", resource.title).get().then(
                (snapshot) => {
                    if (snapshot.size === 0) {
                        resourceToCreate.add(resource)
                    } 
                })
            })
        })
    });

exports.updateResourceFromSPEG = functions.runWith(options).pubsub.topic('updatingSPEG').onPublish(() => {
    return adminFirebase.firestore().collection('resources').where("status", "==", 'A actualizar').limit(1).get()
        .then((snapshot) => {
            snapshot.forEach((docResource) => {
                scrapToCreate.add({
                    resource: docResource.data().resourceId,
                    link: docResource.data().link,
                    updated: false
                })
            });
                
         })
});

exports.createScrapp = functions.runWith(options).firestore
    .document('scrapps/{scrapId}')
    .onCreate((snapshot, context) => {
        const scrap = snapshot.data();
        return findResourceDetailFromSPEGC(scrap.link).then(res => {
            const doc = adminFirebase.firestore().doc(`resources/${scrap.resource}`);
            doc.update({
                modality:'Semipresencial',
                address: {
                    city: 'U39M922HHR5FEVJtN3hN',
                    country: 'i0GHKqdCWBYeAYcAMa7I',
                    place: res[0].place,
                    province: 'mi3tu6DK1GU4yZIQJ1dZ',
                    street: '-'
                },
                maximumDate: adminFirebase.firestore.Timestamp.fromMillis(res[0].limit) ,
                start: adminFirebase.firestore.Timestamp.fromMillis(res[0].start),
                end: adminFirebase.firestore.Timestamp.fromMillis(res[0].end),
                status: 'Disponible',
                enable: true
         });
        });
});


const findResourceDetailFromSPEGC = async (url) => {
    let browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    let page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image') {
            req.abort();
        }
        else {
            req.continue();
        }
    });
    await page.goto(url)
    let data = await page.evaluate(() => {
        var dataresource = [];
        var value = document.querySelector('.col-md-9').innerHTML;

        const lenghFirstPosition = '<i class="far fa-calendar-times"></i> Límite de inscripción: '.length;

        const firstPositionStart = value.indexOf('<i class="far fa-calendar-times"></i> Límite de inscripción: ');
        var endPositionBr = value.indexOf('<br>');
        const limit = value.slice(firstPositionStart + lenghFirstPosition, endPositionBr);
        const sizeFechas = 'Fechas: '.length;

        value = value.substr(value.indexOf('Fechas: '));
        const datePositionStart = value.indexOf('Fechas: ') + sizeFechas;
        endPositionBr = value.indexOf('<br>');
        const date = value.slice(datePositionStart, endPositionBr)

        value = value.substr(value.indexOf('<h4>Lugar </h4>'));
        value = value.substr(value.indexOf('<p>'));
        value = value.slice(3, value.indexOf('</p>'));
        const place = value.slice(value.indexOf('>') + 1, value.indexOf('</a>'));

        var datePartsLimit = limit.split("/");
        var datePartsLimitHour = datePartsLimit[2].split(" ");
        var datePartsLimitMin = datePartsLimitHour[1].split(":");
        var dateObjectLimit = new Date(+datePartsLimitHour[0], datePartsLimit[1] - 1, +datePartsLimit[0], +datePartsLimitMin[0], +datePartsLimitMin[1]);
        var limitDate = new Date( Date.parse(dateObjectLimit.toString()) );

        var dateStart = date.slice(0, date.indexOf(' - '));
        var dateEnd = date.slice(date.indexOf(' - ') + 3);
        if (dateEnd.length === 5) {
            var dateStartSplit = dateStart.split(" ");
            dateEnd = dateStartSplit[0] + " " + dateEnd;
        }

        var datePartsStart = dateStart.split("/");
        var datePartsStartHour = datePartsStart[2].split(" ");
        var datePartsStartMin = datePartsStartHour[1].split(":");
        var dateObjectStart = new Date(+datePartsStartHour[0], datePartsStart[1] - 1, +datePartsStart[0], +datePartsStartMin[0], +datePartsStartMin[1]);
        var startDate = new Date( Date.parse(dateObjectStart.toString()) );

        var datePartsEnd = dateEnd.split("/");
        var datePartsEndHour = datePartsEnd[2].split(" ");
        var datePartsEndMin = datePartsEndHour[1].split(":");
        var dateObjectEnd = new Date(+datePartsEndHour[0], datePartsEnd[1] - 1, +datePartsEnd[0], +datePartsEndMin[0], +datePartsEndMin[1]);
        var endDate = new Date( Date.parse(dateObjectEnd.toString()) );

        const extractDetailObject = {
            limit: limitDate.getTime(),
            start: startDate.getTime(),
            end: endDate.getTime(),
            place: place
        }

        dataresource.push(extractDetailObject)

        return dataresource
    })
    await browser.close()
    return data
}


exports.deleteResource = functions.firestore
    .document('resources/{resourceId}')
    .onDelete((snapshot, context) => {
        const deletedResource = snapshot.data();
        if (deletedResource.participants !== undefined && deletedResource.participants.length > 0) {
            deletedResource.participants.forEach((user) => {
                        const payload = {
                            notification: {
                                title: 'enREDa',
                                body: `Ha sido cancelado o suspendido el recurso: ${deletedResource.title}`,
                                sound: "default"
                            },
                            data: {
                                click_action: "FLUTTER_NOTIFICATION_CLICK",
                                title: 'enREDa',
                                body: `Ha sido cancelado o suspendido el recurso: ${deletedResource.title}`,
                            }
                        };
                        const options = {
                            priority: "high",
                            timeToLive: 60 * 60 * 24
                        };
                        return adminFirebase.messaging().sendToTopic(user, payload, options);
                    })
            } 
    });

    exports.updateResourceEmail = functions.firestore
    .document('resources/{resourceId}')
    .onUpdate((change, context) => {
        const newValue = change.after.data();
        const previousValue = change.before.data();
        if (((JSON.stringify(newValue.address) !== JSON.stringify(previousValue.address)) || (!newValue.end.isEqual(previousValue.end))
            || (!newValue.start.isEqual(previousValue.start)) || (newValue.duration !== previousValue.duration))) {
            const payload = {
                notification: {
                    title: 'enREDa',
                    body: `Ha cambiado el recurso: ${previousValue.title}`,
                    sound: "default"
                },
                data: {
                    resourceId: previousValue.resourceId,
                    click_action: "FLUTTER_NOTIFICATION_CLICK",
                    title: 'enREDa',
                    body: `Ha cambiado el recurso: ${previousValue.title}`,
                }
            };
            const options = {
                priority: "high",
                timeToLive: 60 * 60 * 24
            };
            previousValue.participants.forEach((user) => {
                return adminFirebase.messaging().sendToTopic(user, payload, options);
            })
        }
        
    });

    exports.scheduleWeekEmail = functions.runWith(options).pubsub.topic('scheduleWeekEmail').onPublish(() => {
        const payload = {
            notification: {
                title: 'enREDa',
                body: `Nuevos recursos basados en tus intereses`,
                sound: "default"
            },
            data: {
                click_action: "FLUTTER_NOTIFICATION_CLICK",
                title: 'enREDa',
                body: `Nuevos recursos basados en tus intereses`,
            }
        };
        const options = {
            priority: "high",
            timeToLive: 60 * 60 * 24
        };
        return adminFirebase.messaging().sendToTopic('weeknotification',payload, options);
    });

    exports.createCertificate = functions.firestore
    .document('certificates/{certificateId}')
    .onCreate((snapshot, context) => {
        const certificateId = context.params.certificateId;
        return adminFirebase.firestore().doc(`certificates/${certificateId}`).set({certificateId}, {merge: true})
            .then(() => {
                let creator = snapshot.get('creator');
                if (creator === '') {
                    let resource = snapshot.get('resource');
                    return adminFirebase.firestore().collection('resources').where("resourceId", "==", resource).get()
                    .then((snapshot2) => {
                        snapshot2.forEach((resourceEach) => {
                            let organizer = resourceEach.data().organizer;
                            return adminFirebase.firestore().doc(`certificates/${certificateId}`).set({
                                creator: organizer
                            }, {merge: true})
                                .then(() => {
                                    console.log("Successfully added certificateId to new certificate");
                                });
                            });
                    });
                }
                console.log("Successfully added certificateId to new certificate");
            });
    }); 
