const puppeteer = require('puppeteer');
const functions = require('firebase-functions');
const axios = require('axios'); // Axios version more than 0.21.1 will fail
const cheerio = require('cheerio');
const adminFirebase = require('firebase-admin');
adminFirebase.initializeApp(functions.config().firebase);

const db = adminFirebase.firestore();
const resourceToCreate = db.collection('resources')
const scrapToCreate = db.collection('scrapps')

var options = { memory: '2GB', timeoutSeconds: 540, }

const firestore = require('@google-cloud/firestore');
const client = new firestore.v1.FirestoreAdminClient();
const bucket = 'gs://enreda_bucket_eu';

let randomImages = ['https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/randomImages%2Frandom1_900x503.png?alt=media&token=a2d3ee76-d2f2-4995-87ad-f40664c18c77',
            'https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/randomImages%2Frandom2_900x503.png?alt=media&token=ad799b1d-dbf5-462d-bc44-603fb022558b',
            'https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/randomImages%2Frandom3_900x503.jpeg?alt=media&token=19d9b695-a66b-4f37-94ed-265d9366b828',
            'https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/randomImages%2Frandom4_900x503.jpeg?alt=media&token=7921a55b-df81-4610-b317-895b21abb97c',
            'https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/randomImages%2Frandom5_900x503.jpeg?alt=media&token=04a51582-6286-4c05-ab7c-8dd5326202c7',
            'https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/randomImages%2Frandom6_900x503.png?alt=media&token=ef0e854b-10b9-4780-832b-e74b3a164839',
            'https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/randomImages%2Frandom7_900x503.png?alt=media&token=bf0c4e7b-34ad-4e82-8361-14179c287cc0',
            'https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/randomImages%2Frandom8_900x503.png?alt=media&token=3d99fff9-668e-4c54-8207-8c950b2692dd',
            'https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/randomImages%2Frandom9_900x503_900x503.png?alt=media&token=cb467ba0-5bcb-46c5-a0d9-823614a242ba',
            'https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/randomImages%2Frandom10_900x503.png?alt=media&token=cffc6844-7b46-4d1f-ac40-ec4e31c39c6b',
            'https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/randomImages%2Frandom11_900x503.png?alt=media&token=84e21fe2-5f01-4758-add6-df6828b4a915',
            'https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/randomImages%2Frandom12_900x503.png?alt=media&token=80df0c4d-315c-4a9b-bfc8-3acdd884cea0',
            'https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/randomImages%2Frandom13_900x503.jpeg?alt=media&token=e5919c65-3180-46c6-87e4-342233ac7eab',
            'https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/randomImages%2Frandom14_900x503.png?alt=media&token=9502e094-8d1d-4a43-bd0a-b73ef66cda14',
            'https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/randomImages%2Frandom15_900x503.png?alt=media&token=58a20f56-7c98-41a0-b7ed-aa01741d47f3',
            'https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/randomImages%2Frandom16_900x503.png_900x503.png?alt=media&token=c1938799-c628-44ac-855e-72678b591d08'];  

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
                    } else {
                        active = (snapshot.get('active') === 'true') ? true : false
                    }
                    let photoURL = (snapshot.get('profilePic') !== undefined) ? snapshot.get('profilePic').src : photoUserDefault
                    if (role === 'Mentor') {
                        let trust = snapshot.data().trust !== undefined ? snapshot.data().trust : false;
                        return adminFirebase.firestore().doc(`users/${userId}`).set({ userId, role, email, active, trust, birthday }, { merge: true })
                            .then(() => {
                                return adminFirebase.auth().createUser({
                                    uid: userId,
                                    email: email,
                                    displayName: `${snapshot.get('firstName')} ${snapshot.get('lastName')}`,
                                    password: 'enreda_' + userId.slice(-3),
                                    //password:'enreda_1234',
                                    photoURL: photoURL,
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
                        return adminFirebase.firestore().doc(`users/${userId}`).set({ userId, role, email, active, birthday }, { merge: true })
                            .then(() => {
                                return adminFirebase.auth().createUser({
                                    uid: userId,
                                    email: email,
                                    displayName: `${snapshot.get('firstName')} ${snapshot.get('lastName')}`,
                                    password: 'enreda_' + userId.slice(-3),
                                    //password:'enreda_1234',
                                    photoURL: photoURL,
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
                        return adminFirebase.firestore().doc(`resources/${resource.data().resourceId}`).set({ trust }, { merge: true })
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

        return adminFirebase.firestore().doc(`organizations/${organizationId}`).set({ organizationId, trust }, { merge: true })
            .then(() => {
                console.log("Successfully added organizationId to new organization");
                return adminFirebase.firestore().collection('users').where("email", "==", email).get().then(
                    (snapshot) => {
                        snapshot.forEach((user) => {
                            return adminFirebase.firestore().collection("users").doc(user.id).set({ organization: organizationId }, { merge: true })
                                .then(() => {
                                    console.log("Successfully add organizationId in organization user");
                                })
                        })
                    });
            });
    });

exports.updateOrganization = functions.firestore.document('organizations/{organizationId}')
    .onUpdate(async (change, context) => {
        const organizationId = context.params.organizationId;
        const newValue = change.after.data();
        const previousValue = change.before.data();

        const resources = await adminFirebase.firestore().collection('resources').where("organizer", "==", previousValue.organizationId).get();

        for (const resource of resources.docs) {
            await updateResourceSearchText(resource, resource.data().resourceId);
        }

        // Si se cambia el campo trust hay que actualizarlo en todos los recursos
        if (newValue.trust !== previousValue.trust) {
            const trust = newValue.trust;
            return adminFirebase.firestore().collection('resources').where("organizer", "==", previousValue.organizationId).get().then(
                (snapshot) => {
                    snapshot.forEach((resource) => {
                        return adminFirebase.firestore().doc(`resources/${resource.data().resourceId}`).set({ trust }, { merge: true })
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
        return adminFirebase.firestore().doc(`countries/${countryId}`).set({ countryId, active: true }, { merge: true })
            .then(() => {
                console.log("Successfully added countryId to new country");
            });
    });

exports.updateCountry = functions.firestore.document('countries/{countryId}')
    .onUpdate(async (change, context) => {
        const previousValue = change.before.data();

        const resources = await adminFirebase.firestore().collection('resources').where("address.country", "==", previousValue.countryId).get();

        for (const resource of resources.docs) {
            await updateResourceSearchText(resource, resource.data().resourceId);
        }

        console.log('All resources searchText have been modified with the new country');
        return;
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
        return adminFirebase.firestore().doc(`provinces/${provinceId}`).set({ provinceId, active: true }, { merge: true })
            .then(() => {
                console.log("Successfully added provinceId to new province");
            });
    });


exports.updateProvince = functions.firestore.document('provinces/{provinceId}')
    .onUpdate(async (change, context) => {
        const previousValue = change.before.data();

        const resources = await adminFirebase.firestore().collection('resources').where("address.province", "==", previousValue.provinceId).get();

        for (const resource of resources.docs) {
            await updateResourceSearchText(resource, resource.data().resourceId);
        }

        console.log('All resources searchText have been modified with the new province');
        return;
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
        return adminFirebase.firestore().doc(`cities/${cityId}`).set({ cityId, active: true }, { merge: true })
            .then(() => {
                console.log("Successfully added cityId to new city");
            });
    });

exports.updateCity = functions.firestore.document('cities/{cityId}')
    .onUpdate(async (change, context) => {
        const previousValue = change.before.data();

        const resources = await adminFirebase.firestore().collection('resources').where("address.city", "==", previousValue.cityId).get();

        for (const resource of resources.docs) {
            await updateResourceSearchText(resource, resource.data().resourceId);
        }

        console.log('All resources searchText have been modified with the new city');
        return;
    });

exports.createResource = functions.runWith(options).firestore
    .document('resources/{resourceId}')
    .onCreate(async (snapshot, context) => {
        const resourceId = context.params.resourceId;
        const doc = adminFirebase.firestore().doc(`resources/${resourceId}`);
        const onlineUpdate = snapshot.data().modality !== 'Presencial' ? true : false;
        const countryUpdate = (snapshot.data().address.country === undefined || snapshot.data().address.country === null) ? "undefined" : snapshot.data().address.country;
        const provinceUpdate = (snapshot.data().address.province === undefined || snapshot.data().address.province === null) ? "undefined" : snapshot.data().address.province;
        const cityUpdate = (snapshot.data().address.city === undefined || snapshot.data().address.city === null) ? "undefined" : snapshot.data().address.city;
        const placeUpdate = snapshot.data().address.place;

        adminFirebase.firestore().doc(`resources/${resourceId}`).set({ resourceLink: `https://enredawebapp.web.app/resources/${resourceId}` }, { merge: true });

        await updateResourceSearchText(snapshot, resourceId);

        //Si el creador del recurso es un mentor hay que mirar si el campo trust para ver si el recurso se puede mostrar o no
        if (snapshot.data().organizerType === 'Mentor') {
            return adminFirebase.firestore().collection('users').where("userId", "==", snapshot.data().organizer).get()
                .then((snapshot) => {
                    snapshot.forEach((user) => {
                        if (!user.data().trust) {
                            return adminFirebase.firestore().doc(`resources/${resourceId}`).set({ resourceId }, { merge: true })
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
                            return adminFirebase.firestore().doc(`resources/${resourceId}`).set({ resourceId }, { merge: true })
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
            return adminFirebase.firestore().doc(`resources/${resourceId}`).set({ resourceId }, { merge: true })
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
            return adminFirebase.firestore().doc(`resources/${resourceId}`).set({ resourceId }, { merge: true })
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
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(
        pathToFile
    )}?alt=media&token=${downloadToken}`;
    const path = pathToFile.substring(0, pathToFile.lastIndexOf('/'));
    //const title = pathToFile.substring(pathToFile.lastIndexOf('/') + 1);
    let resourcePhoto = {
        src: url,
    }
    let logoPic = {
        src: url,
    }
    let profilePic = {
        src: url,
    }

    const pathToCollection = pathToFile.substring(0, pathToFile.indexOf('/'));
    //console.log(`Path to collection: ${pathToCollection}`);
    if (pathToCollection === 'resourcesPictures') {
        return adminFirebase.firestore().doc(path).set({ resourcePhoto }, { merge: true })
            .then(() => {
                console.log("Resource photo successfully updated");
            });
    } else if (pathToCollection === 'organizations') {
        return adminFirebase.firestore().doc(path).set({ logoPic }, { merge: true })
            .then(() => {
                console.log("Organization Logo successfully updated");
            });
    }
    else if (pathToCollection === 'users') {
        return adminFirebase.firestore().doc(path).set({ profilePic }, { merge: true })
            .then(() => {
                console.log("User profile picture successfully updated after resizing");
            });
    }
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
        return adminFirebase.firestore().doc(`resourcesTypes/${resourceTypeId}`).set({ resourceTypeId }, { merge: true })
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
    .onUpdate(async (change, context) => {
        const resourceId = context.params.resourceId;
        const newValue = change.after.data();
        const previousValue = change.before.data();

        await updateResourceSearchText(change.after, resourceId);

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
                                    return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
                                }
                                else {
                                    if (user.get('unemployedType') === 'T1' || user.get('unemployedType') === 'T2') {
                                        return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
                                    }
                                    // Si el recurso es de habilidades sociales 
                                    else if (resourceType === 'GOw01m2HPro4I8xd6rSj') {
                                        // Si el desempleado tiene la habilidad "Habilidades sociales"
                                        if (user.get('motivation').abilities.includes('kv0ZGalD2ViPdTx0BMm6')) {
                                            return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
                                        }
                                    }
                                    // Si el recurso es de Financación
                                    else if (resourceType === 'PPX3Ufeg9YfzH4YA0SkU') {
                                        // Si el desempleado tiene la habilidad "Financiacion"
                                        if (user.get('motivation').abilities.includes('5X4lcOCqMTAZ4UwQLl03')) {
                                            return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
                                        }
                                    }
                                    // Si el recurso es de mentoria
                                    else if (resourceType === 'lUubulxiAGo4llxFJrkl') {
                                        // Si el desempleado tiene la habilidad "Apoyo profesional al sector laboral"
                                        if (user.get('motivation').abilities.includes('3ywxTQBRJ6wzgMiVx9GE')) {
                                            return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
                                        }
                                    }
                                    // Si el recurso es de Apoyo y orientacion para el empleo
                                    else if (resourceType === 'MvCHSFzASskxlkBzPElb') {
                                        // Si el desempleado tiene la habilidad "Apoyo profesional al sector laboral"
                                        if (user.get('motivation').abilities.includes('RrBucTiz917syI4jyJKz')) {
                                            return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
                                        }
                                    }
                                    // Si el recurso es de programa para la emprendeduria 
                                    else if (resourceType === '4l9BLhP7cwXohUvQzMOT') {
                                        // Si el desempleado tiene la habilidad "Emprenduderia"
                                        if (user.get('motivation').abilities.includes('0m7igV4HhWcXwWabBKK5')) {
                                            return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
                                        }
                                    }
                                    // Si el recurso es de formacion
                                    else if (resourceType === 'N9KdlBYmxUp82gOv8oJC') {
                                        // Si el desempleado tiene la habilidad "Formacion"
                                        if (user.get('motivation').abilities.includes('nMWfKP0yOqQf8Zv4A3n6')) {
                                            return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
                                        }
                                    }
                                    else {
                                        const interestsUser = [];
                                        user.get('interests').interests.forEach((i) => {
                                            interestsUser.push(i);
                                        });
                                        interestsUser.forEach((interestUser) => {
                                            if (interestUser === interest) {
                                                return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
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
            const onlineUpdate = newValue.data().modality !== 'Presencial' ? true : false;
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
                }, { merge: true })
                    .then(() => {
                        console.log("Changes were applied to capacity");
                        if (previousValue.assistants === newValue.capacity) {
                            const status = 'Completo';
                            return adminFirebase.firestore().doc(`resources/${resourceId}`).set({ status }, { merge: true }).then(() => {
                                console.log('Se ha modificado correctamente el evento');
                            });
                        }
                    });
            } else {
                return adminFirebase.firestore().doc(`resources/${resourceId}`).set({
                    capacity: previousValue.capacity
                }, { merge: true })
                    .then(() => {
                        console.log("Changes were not applied because the number of assistants were higher than the new capacity");
                    });
            }
        }

        // // Cuando se añaden asistentes
        if (newValue.assistants !== previousValue.assistants) {
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
        if ((newValue.participants !== previousValue.participants) && (newValue.participantsString === previousValue.participantsString)) {
            console.log("Aqui desde el movil");
            if (previousValue.participants.length > newValue.participants.length) {
                let participants = previousValue.participants.filter(x => !newValue.participants.includes(x));
                let participant = participants[0];
                return adminFirebase.firestore().doc(`resources/${resourceId}`).set({ participantsString: newValue.participants.join() }, { merge: true })
                    .then(() => {
                        return adminFirebase.firestore().collection('users').where("userId", "==", participant).get()
                            .then((snapshot) => {
                                snapshot.forEach((user) => {
                                    let resources = user.get('resources');
                                    if (resources === undefined) {
                                        resources = [];
                                    }
                                    resources = resources.filter(resource => resource !== newValue.resourceId);
                                    return adminFirebase.firestore().doc(`users/${participant}`).set({ resources, resourcesString: resources.join() }, { merge: true })
                                        .then(() => {
                                            return console.log("Successfully updated removed resource in user");
                                        });
                                })
                            });
                    });

            } else {
                let participants = newValue.participants.filter(x => !previousValue.participants.includes(x));
                let participant = participants[0];
                return adminFirebase.firestore().doc(`resources/${resourceId}`).set({ participantsString: newValue.participants.join() }, { merge: true })
                    .then(() => {
                        return adminFirebase.firestore().collection('users').where("userId", "==", participant).get()
                            .then((snapshot) => {
                                snapshot.forEach((user) => {
                                    let resources = user.get('resources');
                                    if (resources === undefined) {
                                        resources = [];
                                    }
                                    resources.push(newValue.resourceId);
                                    return adminFirebase.firestore().doc(`users/${participant}`).set({ resources, resourcesString: resources.join() }, { merge: true })
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
        return adminFirebase.firestore().doc(`abilities/${abilityId}`).set({ abilityId }, { merge: true })
            .then(() => {
                console.log("Successfully added abilityId to new ability");
            });
    });

exports.createInterest = functions.firestore
    .document('interests/{interestId}')
    .onCreate((snapshot, context) => {
        const interestId = context.params.interestId;
        return adminFirebase.firestore().doc(`interests/${interestId}`).set({ interestId }, { merge: true })
            .then(() => {
                console.log("Successfully added interestId to new interest");
            });
    });

exports.createSpecificInterest = functions.firestore
    .document('specificInterests/{specificInterestId}')
    .onCreate((snapshot, context) => {
        const specificInterestId = context.params.specificInterestId;
        return adminFirebase.firestore().doc(`specificInterests/${specificInterestId}`).set({ specificInterestId }, { merge: true })
            .then(() => {
                console.log("Successfully added specificInterestId to new specificInterest");
            });
    });

exports.sendEmailActiveUsers = functions.firestore.document('users/{userId}')
    .onUpdate((change, context) => {
        const userId = context.params.userId;
        const newValue = change.after.data();
        const beforeValue = change.before.data();
        if (!beforeValue.active && newValue.active && newValue.address.country == 'WMHqCzqISX6KNVs9b3iN' && newValue.role !== 'Desempleado') {
            let htmlToSendToNewUser = createWelcomeToUserTemplate(newValue.firstName, newValue.email.trim().toLowerCase(), 'enreda_' + userId.slice(-3));
            return adminFirebase.firestore().collection('mail').add({
                to: newValue.email,
                message: {
                    subject: 'Equipo enREDa',
                    html: htmlToSendToNewUser,
                }
            }).then(() => {
                console.log("Successfully send email");
            });
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
        let htmlToSendToNewUser = (active) ? createWelcomeToUserTemplate(snapshot.get('firstName'), snapshot.get('email').trim().toLowerCase(), 'enreda_' + userId.slice(-3)) : createWelcomeToInactiveUserTemplate(snapshot.get('firstName'));
        return adminFirebase.firestore().collection('mail').add({
            to: snapshot.get('email'),
            message: {
                subject: 'Equipo enREDa',
                html: htmlToSendToNewUser,
            }
        }).then(() => {
            return adminFirebase.firestore().collection('mail').add({
                to: 'escuchamos@enredas.org',
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
    const contactToUserTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" style="width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
<head>
<meta charset="UTF-8">
<meta content="width=device-width, initial-scale=1" name="viewport">
<meta name="x-apple-disable-message-reformatting">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta content="telephone=no" name="format-detection">
<title>New user email</title><!--[if (mso 16)]>
<style type="text/css">
a {text-decoration: none;}
</style>
<![endif]--><!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--><!--[if gte mso 9]>
<xml>
<o:OfficeDocumentSettings>
<o:AllowPNG></o:AllowPNG>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml>
<![endif]-->
<style type="text/css">
#outlook a {
padding:0;
}
.ExternalClass {
width:100%;
}
.ExternalClass,
.ExternalClass p,
.ExternalClass span,
.ExternalClass font,
.ExternalClass td,
.ExternalClass div {
line-height:100%;
}
.es-button {
mso-style-priority:100!important;
text-decoration:none!important;
}
a[x-apple-data-detectors] {
color:inherit!important;
text-decoration:none!important;
font-size:inherit!important;
font-family:inherit!important;
font-weight:inherit!important;
line-height:inherit!important;
}
.es-desk-hidden {
display:none;
float:left;
overflow:hidden;
width:0;
max-height:0;
line-height:0;
mso-hide:all;
}
[data-ogsb] .es-button {
border-width:0!important;
padding:10px 20px 10px 20px!important;
}
[data-ogsb] .es-button.es-button-1 {
padding:15px 30px!important;
}
@media only screen and (max-width:600px) {p, ul li, ol li, a { line-height:150%!important } h1, h2, h3, h1 a, h2 a, h3 a { line-height:120%!important } h1 { font-size:30px!important; text-align:center } h2 { font-size:22px!important; text-align:center } h3 { font-size:20px!important; text-align:center } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size:30px!important } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size:22px!important } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size:20px!important } .es-menu td a { font-size:14px!important } .es-header-body p, .es-header-body ul li, .es-header-body ol li, .es-header-body a { font-size:14px!important } .es-content-body p, .es-content-body ul li, .es-content-body ol li, .es-content-body a { font-size:16px!important } .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size:12px!important } .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size:12px!important } *[class="gmail-fix"] { display:none!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align:right!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-button-border { display:block!important } a.es-button, button.es-button { font-size:20px!important; display:block!important; border-left-width:0px!important; border-right-width:0px!important } .es-btn-fw { border-width:10px 0px!important; text-align:center!important } .es-adaptive table, .es-btn-fw, .es-btn-fw-brdr, .es-left, .es-right { width:100%!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .es-adapt-td { display:block!important; width:100%!important } .adapt-img { width:100%!important; height:auto!important } .es-m-p0 { padding:0px!important } .es-m-p0r { padding-right:0px!important } .es-m-p0l { padding-left:0px!important } .es-m-p0t { padding-top:0px!important } .es-m-p0b { padding-bottom:0!important } .es-m-p20b { padding-bottom:20px!important } .es-mobile-hidden, .es-hidden { display:none!important } tr.es-desk-hidden, td.es-desk-hidden, table.es-desk-hidden { width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } tr.es-desk-hidden { display:table-row!important } table.es-desk-hidden { display:table!important } td.es-desk-menu-hidden { display:table-cell!important } .es-menu td { width:1%!important } table.es-table-not-adapt, .esd-block-html table { width:auto!important } table.es-social { display:inline-block!important } table.es-social td { display:inline-block!important } .es-desk-hidden { display:table-row!important; width:auto!important; overflow:visible!important; max-height:inherit!important } }
</style>
</head>
<body style="width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;font-family:arial, 'helvetica neue', helvetica, sans-serif;padding:0;Margin:0">
<div class="es-wrapper-color" style="background-color:#F6F6F6"><!--[if gte mso 9]>
<v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
<v:fill type="tile" color="#f6f6f6"></v:fill>
</v:background>
<![endif]-->
<table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:no-repeat;background-position:center top;background-color:#F6F6F6">
<tr style="border-collapse:collapse">
<td valign="top" style="padding:0;Margin:0">
<table class="es-content" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
<tr style="border-collapse:collapse">
<td align="center" bgcolor="#ffffff" style="padding:0;Margin:0;background-color:#ffffff">
<table class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#ffffff;width:600px" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center">
<tr style="border-collapse:collapse">
<td align="left" style="padding:0;Margin:0">
<table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
<tr style="border-collapse:collapse">
<td valign="top" align="center" style="padding:0;Margin:0;width:600px">
<table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
<tr style="border-collapse:collapse">
<td align="center" style="padding:0;Margin:0;padding-top:40px;padding-bottom:40px;font-size:0px"><a href="https://www.enredas.org/" target="_blank" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#6AA84F;font-size:14px"><img src="https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/images%2Fenreda-logo_900x503.png?alt=media&token=c2dd6abb-d60a-46df-adf5-0c93849f12ce" alt="Enreda" title="Enreda" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" class="adapt-img" height="38"></a></td>
</tr>
<tr style="border-collapse:collapse">
<td align="center" style="padding:15px;Margin:0;font-size:0px"><a href="https://www.enredas.org/" target="_blank" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#6AA84F;font-size:14px"><img src="https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/images%2Filustracion-email_900x503.png?alt=media&token=64c5ec16-dba7-4dd9-a54c-b94ec90327db" alt="Enreda" title="Enreda" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" class="adapt-img" width="570"></a></td>
</tr>
</table></td>
</tr>
</table></td>
</tr>
</table></td>
</tr>
</table>
<table class="es-content" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
<tr style="border-collapse:collapse">
<td align="center" bgcolor="#ffffff" style="padding:0;Margin:0;background-color:#ffffff">
<table class="es-content-body" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
<tr style="border-collapse:collapse">
<td align="left" style="Margin:0;padding-left:20px;padding-right:20px;padding-bottom:30px;padding-top:40px">
<table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
<tr style="border-collapse:collapse">
<td valign="top" align="center" style="padding:0;Margin:0;width:560px">
<table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
<tr style="border-collapse:collapse">
<td align="center" style="padding:0;Margin:0;padding-bottom:5px"><h2 style="Margin:0;line-height:36px;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:30px;font-style:normal;font-weight:normal;color:#333333;text-align:left"><strong>¡Hola ${name}!</strong></h2></td>
</tr>
</table></td>
</tr>
</table></td>
</tr>
<tr style="border-collapse:collapse">
<td align="left" style="padding:0;Margin:0;padding-bottom:10px;padding-left:20px;padding-right:20px">
<table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
<tr style="border-collapse:collapse">
<td valign="top" align="center" style="padding:0;Margin:0;width:560px">
<table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
<tr style="border-collapse:collapse">
<td align="left" style="padding:0;Margin:0;padding-bottom:10px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:24px;color:#333333;font-size:16px">Te informamos de que te has registrado exitosamente en el programa <strong>enREDa.</strong><br><br>Debes acceder con tu email:&nbsp;<strong><a href="mailto:${email}" target="_blank" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#0b5394;font-size:14px"><strong>${email}</strong></a></strong><br>Además, hemos establecido para ti&nbsp;la contraseña por defecto:&nbsp;<strong>${password}</strong><br>Una vez que inicies sesión, te recomendamos que la cambies.<br><br>Gracias.</p></td>
</tr>
</table></td>
</tr>
</table></td>
</tr>
</table></td>
</tr>
</table>
<table class="es-content" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
<tr style="border-collapse:collapse">
<td align="center" bgcolor="#ffffff" style="padding:0;Margin:0;background-color:#ffffff">
<table class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#efefef;width:600px" cellspacing="0" cellpadding="0" bgcolor="#efefef" align="center">
<tr style="border-collapse:collapse">
<td align="left" bgcolor="#ffffff" style="padding:0;Margin:0;padding-left:20px;padding-right:20px;padding-bottom:40px;background-color:#ffffff">
<table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
<tr style="border-collapse:collapse">
<td valign="top" align="center" style="padding:0;Margin:0;width:560px">
<table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
<tr style="border-collapse:collapse">
<td align="left" style="padding:0;Margin:0;padding-top:10px"><!--[if mso]><a href="https://enredawebapp.web.app/access" target="_blank" hidden>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" esdevVmlButton href="https://enredawebapp.web.app/access"
style="height:49px; v-text-anchor:middle; width:161px" arcsize="31%" stroke="f" fillcolor="#00d0ce">
<w:anchorlock></w:anchorlock>
<center style='color:#ffffff; font-family:arial, "helvetica neue", helvetica, "sans-serif"; font-size:16px; font-weight:400; line-height:16px; mso-text-raise:1px'>IR A ENREDA</center>
</v:roundrect></a>
<![endif]--><!--[if !mso]><!-- --><span class="msohide es-button-border" style="border-style:solid;border-color:#FFFFFF;background:#00d0ce;border-width:0px;display:inline-block;border-radius:15px;width:auto;mso-hide:all"><a href="https://enredawebapp.web.app/access" class="es-button es-button-1" target="_blank" style="mso-style-priority:100 !important;text-decoration:none;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;color:#FFFFFF;font-size:16px;border-style:solid;border-color:#00d0ce;border-width:15px 30px;display:inline-block;background:#00d0ce;border-radius:15px;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-weight:normal;font-style:normal;line-height:19px;width:auto;text-align:center">IR A ENREDA</a></span><!--<![endif]--></td>
</tr>
</table></td>
</tr>
</table></td>
</tr>
</table></td>
</tr>
</table>
<table cellpadding="0" cellspacing="0" class="es-footer" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top">
<tr style="border-collapse:collapse">
<td align="center" bgcolor="#ffffff" style="padding:0;Margin:0;background-color:#ffffff">
<table class="es-footer-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#efefef;width:600px" cellspacing="0" cellpadding="0" bgcolor="#efefef" align="center">
<tr style="border-collapse:collapse">
<td align="left" bgcolor="#ffffff" style="Margin:0;padding-top:10px;padding-bottom:10px;padding-left:20px;padding-right:20px;background-color:#ffffff">
<table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
<tr style="border-collapse:collapse">
<td valign="top" align="center" style="padding:0;Margin:0;width:560px">
<table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
<tr style="border-collapse:collapse">
<td align="center" style="padding:0;Margin:0;font-size:0">
<table class="es-table-not-adapt es-social" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
<tr style="border-collapse:collapse">
<td valign="top" align="center" style="padding:0;Margin:0;padding-right:20px"><a target="_blank" href="https://www.facebook.com/sic4change" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#333333;font-size:12px"><img title="Facebook" src="https://aouuxs.stripocdn.email/content/assets/img/social-icons/circle-gray-bordered/facebook-circle-gray-bordered.png" alt="Fb" height="32" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a></td>
<td valign="top" align="center" style="padding:0;Margin:0;padding-right:20px"><a target="_blank" href="https://twitter.com/sic4change?lang=es" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#333333;font-size:12px"><img title="Twitter" src="https://aouuxs.stripocdn.email/content/assets/img/social-icons/circle-gray-bordered/twitter-circle-gray-bordered.png" alt="Tw" height="32" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a></td>
<td valign="top" align="center" style="padding:0;Margin:0;padding-right:20px"><a target="_blank" href="https://www.linkedin.com/company/sic4change/" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#333333;font-size:12px"><img title="Instagram" src="https://aouuxs.stripocdn.email/content/assets/img/social-icons/circle-gray-bordered/instagram-circle-gray-bordered.png" alt="Inst" height="32" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a></td>
<td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px"><a target="_blank" href="https://www.youtube.com/@sic4change315" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#333333;font-size:12px"><img title="Youtube" src="https://aouuxs.stripocdn.email/content/assets/img/social-icons/circle-gray-bordered/youtube-circle-gray-bordered.png" alt="Yt" height="32" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a></td>
</tr>
</table></td>
</tr>
</table></td>
</tr>
</table></td>
</tr>
</table></td>
</tr>
</table>
<table class="es-content" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
<tr style="border-collapse:collapse">
<td align="center" bgcolor="#ffffff" style="padding:0;Margin:0;background-color:#ffffff">
<table class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px" cellspacing="0" cellpadding="0" align="center">
<tr style="border-collapse:collapse">
<td align="left" style="Margin:0;padding-top:10px;padding-bottom:10px;padding-left:20px;padding-right:20px">
<table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
<tr style="border-collapse:collapse">
<td valign="top" align="center" style="padding:0;Margin:0;width:560px">
<table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
<tr style="border-collapse:collapse">
<td class="es-infoblock made_with" align="center" style="padding:0;Margin:0;line-height:0px;font-size:0px;color:#CCCCCC"><a target="_blank" href="https://www.sic4change.org/" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#CCCCCC;font-size:12px"><img src="https://aouuxs.stripocdn.email/content/guids/CABINET_eb22ad32fbf982ad465230d9976cf211/images/sic4changec.png" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="125"></a></td>
</tr>
</table></td>
</tr>
</table></td>
</tr>
</table></td>
</tr>
</table></td>
</tr>
</table>
</div>
</body>
</html>`;
    return contactToUserTemplate;
}

// function createWelcomeToUserTemplate(name, email, password) {
//     const contactToUserTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD
// XHTML 1.0 Strict//EN"
// "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"> <html
// data-editor-version="2" class="sg-campaigns"
// xmlns="http://www.w3.org/1999/xhtml">     <head>       <meta
// http-equiv="Content-Type" content="text/html; charset=utf-8">
// <meta name="viewport" content="width=device-width, initial-scale=1,
// minimum-scale=1, maximum-scale=1">       <!--[if !mso]><!-->       <meta
// http-equiv="X-UA-Compatible" content="IE=Edge">       <!--<![endif]-->
//      <!--[if (gte mso 9)|(IE)]>       <xml>
// <o:OfficeDocumentSettings>           <o:AllowPNG/>
// <o:PixelsPerInch>96</o:PixelsPerInch>
// </o:OfficeDocumentSettings>       </xml>       <![endif]-->
// <!--[if (gte mso 9)|(IE)]>   <style type="text/css">     body {width:
// 600px;margin: 0 auto;}     table {border-collapse: collapse;}     table,
// td {mso-table-lspace: 0pt;mso-table-rspace: 0pt;}     img
// {-ms-interpolation-mode: bicubic;}   </style> <![endif]-->       <style
// type="text/css">     body, p, div {       font-family:
// verdana,geneva,sans-serif;       font-size: 16px;     }     body {
// color: #516775;     }     body a {       color: #993300;
// text-decoration: none;     }     p { margin: 0; padding: 0; }
// table.wrapper {       width:100% !important;       table-layout: fixed;
//       -webkit-font-smoothing: antialiased;
// -webkit-text-size-adjust: 100%;       -moz-text-size-adjust: 100%;
// -ms-text-size-adjust: 100%;     }     img.max-width {       max-width:
// 100% !important;     }     .column.of-2 {       width: 50%;     }
// .column.of-3 {       width: 33.333%;     }     .column.of-4 {
// width: 25%;     }     @media screen and (max-width:480px) {
// .preheader .rightColumnContent,       .footer .rightColumnContent {
//     text-align: left !important;       }       .preheader
// .rightColumnContent div,       .preheader .rightColumnContent span,
//   .footer .rightColumnContent div,       .footer .rightColumnContent span
// {         text-align: left !important;       }       .preheader
// .rightColumnContent,       .preheader .leftColumnContent {
// font-size: 80% !important;         padding: 5px 0;       }
// table.wrapper-mobile {         width: 100% !important;
// table-layout: fixed;       }       img.max-width {         height: auto
// !important;         max-width: 100% !important;       }
// a.bulletproof-button {         display: block !important;         width:
// auto !important;         font-size: 80%;         padding-left: 0
// !important;         padding-right: 0 !important;       }       .columns
// {         width: 100% !important;       }       .column {
// display: block !important;         width: 100% !important;
// padding-left: 0 !important;         padding-right: 0 !important;
// margin-left: 0 !important;         margin-right: 0 !important;       }
//      .social-icon-column {         display: inline-block !important;
//   }     }   </style>       <!--user entered Head Start-->       <!--End
// Head user entered-->     </head>     <body>       <center
// class="wrapper" data-link-color="#993300"
// data-body-style="font-size:16px; font-family:verdana,geneva,sans-serif;
// color:#516775; background-color:#F9F5F2;">         <div class="webkit">
//           <table cellpadding="0" cellspacing="0" border="0" width="100%"
// class="wrapper" bgcolor="#F9F5F2">             <tr>               <td
// valign="top" bgcolor="#F9F5F2" width="100%">                 <table
// width="100%" role="content-container" class="outer" align="center"
// cellpadding="0" cellspacing="0" border="0">                   <tr>
//                <td width="100%">                       <table
// width="100%" cellpadding="0" cellspacing="0" border="0">
//          <tr>                           <td>
// <!--[if mso]>     <center>     <table><tr><td width="600">
// <![endif]-->                                     <table width="100%"
// cellpadding="0" cellspacing="0" border="0" style="width:100%;
// max-width:600px;" align="center">
// <tr>                                         <td
// role="modules-container" style="padding:0px 0px 0px 0px; color:#516775;
// text-align:left;" bgcolor="#F9F5F2" width="100%" align="left"><table
// class="module preheader preheader-hide" role="module"
// data-type="preheader" border="0" cellpadding="0" cellspacing="0"
// width="100%" style="display: none !important; mso-hide: all; visibility:
// hidden; opacity: 0; color: transparent; height: 0; width: 0;">     <tr>
//       <td role="module-content">         <p></p>       </td>     </tr>
// </table><table class="module" role="module" data-type="spacer"
// border="0" cellpadding="0" cellspacing="0" width="100%"
// style="table-layout: fixed;" data-muid="bdzDb4B4pnnez4W7L1KpxJ">
// <tbody><tr>         <td style="padding:0px 0px 30px 0px;"
// role="module-content" bgcolor="">         </td>       </tr>
// </tbody></table><table class="wrapper" role="module" data-type="image"
// border="0" cellpadding="0" cellspacing="0" width="100%"
// style="table-layout: fixed;" data-muid="bKZJcGfRPJb7R2nzyp6ZB6">
// <tbody><tr>         <td style="font-size:6px; line-height:10px;
// padding:0px 0px 0px 0px;" valign="top" align="center">           <img
// class="max-width" border="0" style="display:block; color:#000000;
// text-decoration:none; font-family:Helvetica, arial, sans-serif;
// font-size:16px; max-width:100% !important; width:100%; height:auto
// !important;"
// src="http://cdn.mcauto-images-production.sendgrid.net/c2af2ef38a422013/f122e378-4bec-41c0-9b33-a9525ee1efea/2048x1366.jpg"
// alt="" width="600" data-responsive="true"
// data-proportionally-constrained="false">         </td>       </tr>
// </tbody></table><table class="module" role="module" data-type="text"
// border="0" cellpadding="0" cellspacing="0" width="100%"
// style="table-layout: fixed;" data-muid="gNWHzBzkFeWH4JDKd2Aikk"
// data-mc-module-version="2019-10-22">       <tbody><tr>         <td
// style="background-color:#ffffff; padding:50px 0px 10px 0px;
// line-height:30px; text-align:inherit;" height="100%" valign="top"
// bgcolor="#ffffff"><div><div style="font-family: inherit; text-align:
// center"><span style="color: #516775; font-size: 28px; font-family:
// georgia, serif"><strong>Hola
// ${name}!</strong></span></div><div></div></div></td>       </tr>
// </tbody></table><table class="module" role="module" data-type="text"
// border="0" cellpadding="0" cellspacing="0" width="100%"
// style="table-layout: fixed;" data-muid="bA2FfEE6abadx6yKoMr3F9"
// data-mc-module-version="2019-10-22">       <tbody><tr>         <td
// style="background-color:#ffffff; padding:10px 40px 50px 40px;
// line-height:22px; text-align:inherit;" height="100%" valign="top"
// bgcolor="#ffffff"><div><div style="font-family: inherit; text-align:
// center"><span style="font-family: verdana, geneva, sans-serif">Te
// informamos de que te has registrado exitosamente en el programa
// enREDa.&nbsp;</span></div> <div style="font-family: inherit; text-align:
// center">Debes acceder con tu email <strong>${email}</strong> . Además hemos establecido para tí la contraseña por defecto: <strong>${password}</strong> .
// Una vez que inicies sesión, te recomendamos que la cambies.</div> <div style="font-family:
// inherit; text-align: center">Gracias.</div><div></div></div></td>
// </tr>     </tbody></table><table border="0" cellpadding="0"
// cellspacing="0" class="module" data-role="module-button"
// data-type="button" role="module" style="table-layout:fixed" width="100%"
// data-muid="bKHWQMgPkL5opYCkxiM6aS"><tbody><tr><td align="center"
// class="outer-td" style="padding:20px 0px 0px 0px;" bgcolor=""><table
// border="0" cellpadding="0" cellspacing="0"
// class="button-css__deep-table___2OZyb wrapper-mobile"
// style="text-align:center"><tbody><tr><td align="center"
// bgcolor="#993300" class="inner-td" style="border-radius:6px;
// font-size:16px; text-align:center; background-color:inherit;"><a
// style="background-color:#993300; border:1px solid #993300;
// border-color:#993300; border-radius:0px; border-width:1px;
// color:#ffffff; display:inline-block;
// font-family:verdana,geneva,sans-serif; font-size:16px;
// font-weight:normal; letter-spacing:1px; line-height:30px; padding:12px
// 20px 12px 20px; text-align:center; text-decoration:none;
// border-style:solid;" href='https://enreda-d3b41.firebaseapp.com'
// target="_blank">Ir a enREDa</a></td></tr></tbody></table></td></tr></tbody></table><table
// class="module" role="module" data-type="text" border="0" cellpadding="0"
// cellspacing="0" width="100%" style="table-layout: fixed;"
// data-muid="d21b8641-6eaf-4354-9938-61022423da11">     <tbody>       <tr>
//          <td style="padding:18px 0px 18px 0px; line-height:22px;
// text-align:inherit;" height="100%" valign="top" bgcolor=""
// role="module-content"><div><div style="font-family: inherit; text-align:
// center"><a 'href=https://www.enredaempleo.org'><span style="font-size:
// 12px">El equipo de Enreda</span></a></div><div></div></div></td>
// </tr>     </tbody>   </table><table class="module" role="module"
// data-type="spacer" border="0" cellpadding="0" cellspacing="0"
// width="100%" style="table-layout: fixed;"
// data-muid="qkfYAswHNSwNpwb1p7m4gC">       <tbody><tr>         <td
// style="padding:0px 0px 30px 0px;" role="module-content" bgcolor="">
//     </td>       </tr>     </tbody></table><table class="module"
// role="module" data-type="spacer" border="0" cellpadding="0"
// cellspacing="0" width="100%" style="table-layout: fixed;"
// data-muid="f5F8P1n4pQyU8o7DNMMEyW">       <tbody><tr>         <td
// style="padding:0px 0px 30px 0px;" role="module-content" bgcolor="">
//     </td>       </tr>     </tbody></table></td>
//              </tr>                                     </table>
//                            <!--[if mso]>
//   </td>                                 </tr>
//    </table>                             </center>
//      <![endif]-->                           </td>
// </tr>                       </table>                     </td>
//          </tr>                 </table>               </td>
// </tr>           </table>         </div>       </center>     </body>
// </html>`;
//     return contactToUserTemplate;
// }


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
        return adminFirebase.firestore().doc(`contact/${contactId}`).set({ contactId }, {
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
                        to: 'escuchamos@enredas.org',
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
                            return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
                        }
                        else {
                            if (user.get('unemployedType') === 'T1' || user.get('unemployedType') === 'T2') {
                                return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
                            }
                            // Si el recurso es de habilidades sociales 
                            else if (resourceType === 'GOw01m2HPro4I8xd6rSj') {
                                // Si el desempleado tiene la habilidad "Habilidades sociales"
                                if (user.get('motivation').abilities.includes('kv0ZGalD2ViPdTx0BMm6')) {
                                    return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
                                }
                            }
                            // Si el recurso es de Financación
                            else if (resourceType === 'PPX3Ufeg9YfzH4YA0SkU') {
                                // Si el desempleado tiene la habilidad "Financiacion"
                                if (user.get('motivation').abilities.includes('5X4lcOCqMTAZ4UwQLl03')) {
                                    return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
                                }
                            }
                            // Si el recurso es de mentoria
                            else if (resourceType === 'lUubulxiAGo4llxFJrkl') {
                                // Si el desempleado tiene la habilidad "Apoyo profesional al sector laboral" 
                                if (user.get('motivation').abilities.includes('3ywxTQBRJ6wzgMiVx9GE')) {
                                    return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
                                }
                            }
                            // Si el recurso es de Apoyo y orientacion para el empleo
                            else if (resourceType === 'MvCHSFzASskxlkBzPElb') {
                                // Si el desempleado tiene la habilidad "Apoyo profesional al sector laboral"
                                if (user.get('motivation').abilities.includes('RrBucTiz917syI4jyJKz')) {
                                    return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
                                }
                            }
                            // Si el recurso es de programa para la emprendeduria 
                            else if (resourceType === '4l9BLhP7cwXohUvQzMOT') {
                                // Si el desempleado tiene la habilidad "Emprenduderia"
                                if (user.get('motivation').abilities.includes('0m7igV4HhWcXwWabBKK5')) {
                                    return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
                                }
                            }
                            // Si el recurso es de formacion
                            else if (resourceType === 'N9KdlBYmxUp82gOv8oJC') {
                                // Si el desempleado tiene la habilidad "Formacion"
                                if (user.get('motivation').abilities.includes('nMWfKP0yOqQf8Zv4A3n6')) {
                                    return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
                                }
                            }
                            else {
                                const interestsUser = [];
                                user.get('interests').interests.forEach((i) => {
                                    interestsUser.push(i);
                                });
                                interestsUser.forEach((interestUser) => {
                                    if (interests.indexOf(interestUser) > -1) {
                                        return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
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
                    status: 'A actualizar',
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

exports.extractResourcesFromFormacionCamaraToledo = functions.runWith(options).pubsub.topic('scrappingFormacionCamaraToledo').onPublish(async (message) => {
    const url = 'https://camaratoledo.com/formacion-espana-emprende/';
    const axiosUrl = await axios(url);
    const html = axiosUrl.data;
    const $ = cheerio.load(html);
    const items = $('div[data-elementor-type="loop-item"]').filter((index, element) => $(element).find('h2').text().trim().toUpperCase() === 'PRÓXIMAMENTE');
    console.log(`Nº de ofertas: ${items.length}`);
    items.each(async (index, item) => {
        const jobLink = $(item).find('.elementor-button-link').attr('href');
        if (jobLink && jobLink.startsWith('https://camaratoledo.com/formacion')) {
            //console.log(`Link: ${jobLink}`);
            const axiosJobUrl = await axios(jobLink);
            const jobHtml = axiosJobUrl.data;
            const $$ = cheerio.load(jobHtml);

            //ID
            const body = $$('body').attr('class');
            const postIdMatch = body.match(/postid-(\d+)/);
            const postID = postIdMatch[1];
            const jobID = `camfor_${postID}`; 
            //Title
            const jobTitle = $$('h1').first().text();
            //Place
            var jobLocation = '';
            const sections = $$('.elementor-inner-section');
            sections.each((index, section) => {
                //Comprobar si contiene un span con el texto "Lugar"
                if ($$(section).find('span').filter((index, span) => $$(span).text() === 'Lugar').length > 0) {
                    jobLocation = $$(section).find('p').text();
                }
            });
            //const jobDuration = $('.elementor-element-ba36254').find('div').find('p').text();
            //Description
            var jobDescription = '';
            const divs = $$('div');
            divs.each((index, div) => {
                //Comprobar si contiene un h3 con el texto "Dirigido"
                if ($$(div).find('h3').filter((index, h3) => $$(h3).text().toUpperCase() === 'DIRIGIDO').length > 0) {
                    jobDescription = $$(div).parent().next('div').find('p').text();
                }
            });

            const maximumDate = new Date(2050, 12, 31, 23, 59, 0);
            let randomImage = randomImages[Math.floor(Math.random() * randomImages.length)];

            let jobOffer = {
                address: {
                    city: "vYcgz8Vy6qDj4Q5Pena6", // Todas en ciudad de Toledo? Porque hay ciudades de las ofertas que no están en la BD
                    country: "i0GHKqdCWBYeAYcAMa7I",
                    place: jobLocation,
                    province: "r7WT8mAsUdTAlPCKWstT",
                },
                assistants: 0,
                capacity: 99,
                contractType: "",
                createdate: adminFirebase.firestore.Timestamp.now(), //jobDate??
                createdby: "Web scrapping",
                description: jobDescription,
                duration: "Indefinido",
                enable: true,
                end: adminFirebase.firestore.Timestamp.fromDate(maximumDate),
                interests: [],
                lastupdate: adminFirebase.firestore.Timestamp.now(),
                link: jobLink,
                maximumDate: adminFirebase.firestore.Timestamp.fromDate(maximumDate),
                modality: "Presencial",
                notExpire: true,
                online: false,
                organizer: "VrpgKatmJG4h4pxgvpZZ",
                organizerType: "Organización",
                resourceCategory: "6ag9Px7zkFpHgRe17PQk", // Formación
                resourcePhoto: randomImage,
                resourceType: "N9KdlBYmxUp82gOv8oJC", // Formación
                salary: "",
                start: adminFirebase.firestore.Timestamp.now(),
                status: "Disponible",
                title: jobTitle,
                trust: true,
                updatedby: "Web scrapping",
                scrappingId: jobID,
            };
            //console.log(`ID: ${jobID}\nTitle: ${jobTitle}\nLocation: ${jobLocation}\nDescription: ${jobDescription}`);
            const query = await db.collection("resources").where("scrappingId", "==", jobID).get();
            if (query.empty) {
                console.log(`Insertando recurso ${jobTitle}`);
                return db.collection("resources").add(jobOffer);
            }
        }
    });
});

exports.extractResourcesFromEmpleoCamaraToledo = functions.runWith(options).pubsub.topic('scrappingEmpleoCamaraToledo').onPublish(async (message) => {
    const url = 'https://gestionandote.com/agencia/camaratoledo/ofertas';
    const axiosUrl = await axios(url);
    const html = axiosUrl.data;
    const $ = cheerio.load(html);
    const jobCards = $('.card-ofertas');
    console.log(`Nº de ofertas: ${jobCards.length}`);

    jobCards.each(async (index, element) => {
        let postID = $(element).find('.c-titulo span').first().text();
        let jobID = `camemp_${postID}`; 
        let jobTitle = $(element).find('.c-titulo a').text();
        let jobLink = $(element).find('.c-titulo a').attr('href');
        let jobLocation = $(element).find('.c-lugar span').first().text();
        let jobDate = $(element).find('.c-fecha').text();
        let jobDescription = $(element).find('.c-desc').text();
        const maximumDate = new Date(2050, 12, 31, 23, 59, 0);
        let randomImage = randomImages[Math.floor(Math.random() * randomImages.length)];
        let jobOffer = {
            address: {
                city: "vYcgz8Vy6qDj4Q5Pena6", // Todas en ciudad de Toledo? Porque hay ciudades de las ofertas que no están en la BD
                country: "i0GHKqdCWBYeAYcAMa7I",
                place: jobLocation,
                province: "r7WT8mAsUdTAlPCKWstT",
            },
            assistants: 0,
            capacity: 99,
            contractType: "",
            createdate: adminFirebase.firestore.Timestamp.now(), //jobDate??
            createdby: "Web scrapping",
            description: jobDescription,
            duration: "Indefinido",
            enable: true,
            end: adminFirebase.firestore.Timestamp.fromDate(maximumDate),
            interests: [],
            lastupdate: adminFirebase.firestore.Timestamp.now(),
            link: `https://gestionandote.com${jobLink}`,
            maximumDate: adminFirebase.firestore.Timestamp.fromDate(maximumDate),
            modality: "Presencial",
            notExpire: true,
            online: false,
            organizer: "VrpgKatmJG4h4pxgvpZZ",
            organizerType: "Organización",
            resourceCategory: "POUBGFk5gU6c5X1DKo1b",
            resourcePhoto: randomImage,
            resourceType: "kUM5r4lSikIPLMZlQ7FD",
            salary: "",
            start: adminFirebase.firestore.Timestamp.now(),
            status: "Disponible",
            title: jobTitle,
            trust: true,
            updatedby: "Web scrapping",
            scrappingId: jobID,
        };
        //console.log(`ID: ${jobID}\nTitle: ${jobTitle}\nLocation: ${jobLocation}\nDate: ${jobDate}\nDescription: ${jobDescription}`);
        const query = await db.collection("resources").where("scrappingId", "==", jobID).get();
        if (query.empty) {
            console.log(`Insertando recurso ${jobTitle}`);
            return db.collection("resources").add(jobOffer);
        }
    });
});

exports.extractResourcesFromIPETA = functions.runWith(options).pubsub.topic('scrappingIPETA').onPublish(async (message) => {
  const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  const page = await browser.newPage();
  await page.goto('https://ipetalavera.es/instituto/empleo/ofertas-de-empleo/');
  // Espera hasta que aparezcan las ofertas de trabajo en la página
  await page.waitForSelector('.jet-listing-grid__items');
  const html = await page.content();
  const $ = cheerio.load(html);
  const jobCards = $('.jet-listing-grid__item');
  console.log(`Nº de ofertas: ${jobCards.length}`);

  jobCards.each(async (index, element) => {
    const jobLink = $(element).find('.elementor-button-link').attr('href');
    var jobDescription = '';
    if (jobLink && jobLink.startsWith('https://ipetalavera.es/ofertas-de-trabajo')) { 
        const axiosJobUrl = await axios(jobLink);
        const jobHtml = axiosJobUrl.data;
        const $$ = cheerio.load(jobHtml);

        jobDescription = $$('.elementor-element-bd55b8f').find('div').find('div').text();
    }
    const postId = $(element).attr('data-post-id');
    const jobID = `ipeta_${postId}`;
    const jobTitle = $(element).find('.elementor-element-e13832e').find('div').find('h2').text();
    //const jobDescription = $(element).find('.elementor-element-c11fb9f').find('div').find('div').text();
    const jobDate = $(element).find('.elementor-element-084441b').find('div').find('p').text();
    const jobLocation = $(element).find('.elementor-icon-list-text').eq(0).text().toUpperCase();
    const capacityText = $(element).find('.elementor-icon-list-text').eq(1).text();
    const jobCapacity = parseInt(capacityText.match(/\d+/)[0]);
    const jobTag = $(element).find('.elementor-icon-list-text').eq(2).text();
    const maximumDate = new Date(2050, 12, 31, 23, 59, 0);
    let randomImage = randomImages[Math.floor(Math.random() * randomImages.length)];
    
    let jobOffer = {
        address: {
            city: "vYcgz8Vy6qDj4Q5Pena6", // Todas en ciudad de Toledo? Porque hay ciudades de las ofertas que no están en la BD
            country: "i0GHKqdCWBYeAYcAMa7I",
            place: jobLocation,
            province: "r7WT8mAsUdTAlPCKWstT",
        },
        assistants: 0,
        capacity: jobCapacity,
        contractType: "",
        createdate: adminFirebase.firestore.Timestamp.now(), //jobDate??
        createdby: "Web scrapping",
        description: jobDescription,
        duration: "Indefinido",
        enable: true,
        end: adminFirebase.firestore.Timestamp.fromDate(maximumDate),
        interests: [],
        lastupdate: adminFirebase.firestore.Timestamp.now(),
        link: jobLink,
        maximumDate: adminFirebase.firestore.Timestamp.fromDate(maximumDate),
        modality: "Presencial",
        notExpire: true,
        online: false,
        organizer: "VrpgKatmJG4h4pxgvpZZ",
        organizerType: "Organización",
        resourceCategory: "POUBGFk5gU6c5X1DKo1b",
        resourcePhoto: randomImage,
        resourceType: "kUM5r4lSikIPLMZlQ7FD",
        salary: "",
        start: adminFirebase.firestore.Timestamp.now(),
        status: "Disponible",
        title: jobTitle,
        trust: true,
        updatedby: "Web scrapping",
        scrappingId: jobID,
    };

    const query = await db.collection("resources").where("scrappingId", "==", jobID).get();
    if (query.empty) {
        console.log(`Insertando recurso ${jobTitle}`);
        return db.collection("resources").add(jobOffer);
    }

    /*console.log(`ID: ${jobID} --> ${jobTitle} (${jobDate}): ${jobDescription}`);
    console.log(`Se imparte en ${jobLocation} y hay ${jobCapacity} vacantes`);
    console.log(`LINK: ${jobLink}`);*/
  });

  await browser.close();
});

exports.extractResourcesFromSPEG = functions.runWith(options).pubsub.topic('scrappingSPEG').onPublish(() => {
    return findResourcesFromSPEGC().then(res => {
        res.forEach(resource => {
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
                modality: 'Semipresencial',
                address: {
                    city: 'U39M922HHR5FEVJtN3hN',
                    country: 'i0GHKqdCWBYeAYcAMa7I',
                    place: res[0].place,
                    province: 'mi3tu6DK1GU4yZIQJ1dZ',
                    street: '-'
                },
                maximumDate: adminFirebase.firestore.Timestamp.fromMillis(res[0].limit),
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
        var limitDate = new Date(Date.parse(dateObjectLimit.toString()));

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
        var startDate = new Date(Date.parse(dateObjectStart.toString()));

        var datePartsEnd = dateEnd.split("/");
        var datePartsEndHour = datePartsEnd[2].split(" ");
        var datePartsEndMin = datePartsEndHour[1].split(":");
        var dateObjectEnd = new Date(+datePartsEndHour[0], datePartsEnd[1] - 1, +datePartsEnd[0], +datePartsEndMin[0], +datePartsEndMin[1]);
        var endDate = new Date(Date.parse(dateObjectEnd.toString()));

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
    return adminFirebase.messaging().sendToTopic('weeknotification', payload, options);
});

exports.createCertificate = functions.firestore
    .document('certificates/{certificateId}')
    .onCreate((snapshot, context) => {
        const certificateId = context.params.certificateId;
        return adminFirebase.firestore().doc(`certificates/${certificateId}`).set({ certificateId }, { merge: true })
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
                                }, { merge: true })
                                    .then(() => {
                                        console.log("Successfully added certificateId to new certificate");
                                    });
                            });
                        });
                }
                console.log("Successfully added certificateId to new certificate");
            });

    }); 

async function updateResourceSearchText(resource, resourceId) {
        //console.log('Calling async updateResourceSearchText()');
        let resourceTypeName = '';
        let organizerName = '';
        let countryName = '';
        let provinceName = '';
        let cityName = '';
        let document;
    
        if (resource.data().resourceType) {
            document = await adminFirebase.firestore().collection('resourcesTypes').doc(resource.data().resourceType).get();
            resourceTypeName = document.data().name;
            //console.log(`Tipo de recurso: ${resourceTypeName}`)
        }
    
        if (resource.data().organizer) {
            document = await adminFirebase.firestore().collection('organizations').doc(resource.data().organizer).get();
            organizerName = document.data().name;
            //console.log(`Organizador: ${organizerName}`)
        }
    
        if (resource.data().address.country && resource.data().address.country != "undefined") {
            document = await adminFirebase.firestore().collection('countries').doc(resource.data().address.country).get();
            countryName = document.data().name;
            //console.log(`País: ${countryName}`)
        }
    
        if (resource.data().address.province && resource.data().address.province != "undefined") {
            document = await adminFirebase.firestore().collection('provinces').doc(resource.data().address.province).get();
            provinceName = document.data().name;
            //console.log(`Provincia: ${provinceName}`)
        }
    
        if (resource.data().address.city && resource.data().address.city != "undefined") {
            document = await adminFirebase.firestore().collection('cities').doc(resource.data().address.city).get();
            cityName = document.data().name;
            //console.log(`Provincia: ${cityName}`)
        }
    
        await adminFirebase.firestore().doc(`resources/${resourceId}`).set({ searchText: `${resource.data().title};${resourceTypeName};${organizerName};${countryName};${provinceName};${cityName}` }, { merge: true }).then(() => {
            console.log(`Recurso actualizado: ${resource.data().title}, ${resourceTypeName}, ${organizerName}, ${countryName}, ${provinceName}, ${cityName}`);
        });
    }


exports.scheduledFirestoreExport = functions.pubsub.schedule('every 24 hours').onRun((context) => {
    const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
    const databaseName = client.databasePath(projectId, '(default)');
    return client.exportDocuments({
        name: databaseName,
        outputUriPrefix: bucket,
        collectionIds: []
    }).then(responses => {
        const response = responses[0];
        console.log(`Operation Name: ${response['name']}`);
    }).catch(err => {
        console.error(err);
        throw new Error('Export operation failed');
    });
});

exports.updateCertificationRequest = functions.firestore.document('certificationsRequests/{certificationRequestId}')
    .onUpdate((change, context) => {
        const certificationRequestId = context.params.certificationRequestId;
        const newValue = change.after.data();
        const previousValue = change.before.data();
        const userId = newValue.unemployedRequesterId;
        const competencyId = newValue.competencyId;
        if (newValue.certified !== previousValue.certified) {
            return adminFirebase.firestore().collection('users').where("userId", "==", userId).get().then(
                (snapshot) => {
                    snapshot.forEach((user) => {
                        const competencies = user.get('competencies');
                        competencies[competencyId] = "certified";
                        return adminFirebase.firestore().doc(`users/${userId}`).set({ competencies }, { merge: true })
                            .then(() => {
                                console.log("Successfully change certified competency status");
                            })
                    })
                });
        }
    });

exports.certificationRequestForm = functions.firestore
    .document('certificationsRequests/{certificationRequestId}')
    .onCreate((snapshot, context) => {
        const certificationRequestId = context.params.certificationRequestId;
        const certifierName = snapshot.get('certifierName');
        const competencyName = snapshot.get('competencyName');
        const unemployedRequesterName = snapshot.get('unemployedRequesterName');

        return adminFirebase.firestore().doc(`certificationsRequests/${certificationRequestId}`).set({ certificationRequestId }, {
            merge: true
        })
            .then(() => {
                return adminFirebase.firestore().collection('mail').add({
                    to: snapshot.get('email'),
                    message: {
                        subject: `${unemployedRequesterName} necesita que le certifiques una competencia.`,
                        html:
                            createCertificationRequestTemplate(certifierName,
                                competencyName, unemployedRequesterName, certificationRequestId),
                    }
                }).then(() => console.log('Queued email!'));
            });
    });


    exports.updateCompetencyCategories = functions.firestore.document('write/{writeId}')
    .onUpdate(async (change, context) => {
        const newValue = change.after.data();
        const previousValue = change.before.data();
        if (newValue.on !== previousValue.on) {

            // return adminFirebase.firestore().collection('competencies').where("name", "==", userId).get().then(
            //     (snapshot) => {
            //         snapshot.forEach((user) => {
            //             const competencies = user.get('competencies');
            //             competencies[competencyId] = "certified";
            //             return adminFirebase.firestore().doc(`competencies/${userId}`).set({ competencies }, { merge: true })
            //                 .then(() => {
            //                     console.log("Successfully change certified competency status");
            //                 })
            //         })
            //     });

            const competenciesCollection = admin.firestore().collection('competencies');

            const updatePromises = competencies.map((competency) => {
                return competenciesCollection
                    .where('name', '==', competency.name)
                    .get()
                    .then((querySnapshot) => {
                        const promises = [];
                        querySnapshot.forEach((doc) => {
                            promises.push(doc.ref.update({
                                competencyCategoryId: competency.competencyCategoryId,
                                competencySubCategoryId: competency.competencySubCategoryId
                            }));
                        });
                        return Promise.all(promises);
                    });
            });
    
            await Promise.all(updatePromises);
        }
    });
    

    const competencies = [
        {
          "competencyCategoryName": "COMPETENCIAS SOCIALES / INTERPERSONALES",
          "competencyCategoryId": "52Btlw7ScRbg5rzer9yW",
          "competencySubCategoryName": "COMUNICACIÓN",
          "competencySubCategoryId": "9l7ndhKMhNsdrPl85igF",
          "name": "Manejo del estrés"
        },
    ]


/*     const competencies = [
        {
          "competencyCategoryName": "COMPETENCIAS SOCIALES / INTERPERSONALES",
          "competencyCategoryId": "gJnRv6pON4SIh8jWNUER",
          "competencySubCategoryName": "COMUNICACIÓN",
          "competencySubCategoryId": "yi101cPfqJdALtdbrHxk",
          "name": "Comunicación escrita"
        },
        {
          "competencyCategoryName": "COMPETENCIAS SOCIALES / INTERPERSONALES",
          "competencyCategoryId": "gJnRv6pON4SIh8jWNUER",
          "competencySubCategoryName": "COMUNICACIÓN",
          "competencySubCategoryId": "yi101cPfqJdALtdbrHxk",
          "name": "Comunicación oral"
        },
        {
          "competencyCategoryName": "COMPETENCIAS SOCIALES / INTERPERSONALES",
          "competencyCategoryId": "gJnRv6pON4SIh8jWNUER",
          "competencySubCategoryName": "COMUNICACIÓN",
          "competencySubCategoryId": "yi101cPfqJdALtdbrHxk",
          "name": "Comunicación visual"
        },
        {
          "competencyCategoryName": "COMPETENCIAS SOCIALES / INTERPERSONALES",
          "competencyCategoryId": "gJnRv6pON4SIh8jWNUER",
          "competencySubCategoryName": "COMUNICACIÓN",
          "competencySubCategoryId": "yi101cPfqJdALtdbrHxk",
          "name": "Comunicación no verbal"
        },
        {
          "competencyCategoryName": "COMPETENCIAS SOCIALES / INTERPERSONALES",
          "competencyCategoryId": "gJnRv6pON4SIh8jWNUER",
          "competencySubCategoryName": "COMUNICACIÓN",
          "competencySubCategoryId": "yi101cPfqJdALtdbrHxk",
          "name": "Comunicación digital"
        },
        {
          "competencyCategoryName": "COMPETENCIAS SOCIALES / INTERPERSONALES",
          "competencyCategoryId": "gJnRv6pON4SIh8jWNUER",
          "competencySubCategoryName": "TRABAJO EN EQUIPO",
          "competencySubCategoryId": "dTw337K0d1U5Vgck2Ksk",
          "name": "Integración en el grupo"
        },
        {
          "competencyCategoryName": "COMPETENCIAS SOCIALES / INTERPERSONALES",
          "competencyCategoryId": "gJnRv6pON4SIh8jWNUER",
          "competencySubCategoryName": "TRABAJO EN EQUIPO",
          "competencySubCategoryId": "dTw337K0d1U5Vgck2Ksk",
          "name": "Coordinación grupal"
        },
        {
          "competencyCategoryName": "COMPETENCIAS SOCIALES / INTERPERSONALES",
          "competencyCategoryId": "gJnRv6pON4SIh8jWNUER",
          "competencySubCategoryName": "TRABAJO EN EQUIPO",
          "competencySubCategoryId": "dTw337K0d1U5Vgck2Ksk",
          "name": "Rigor y confiabilidad"
        },
        {
          "competencyCategoryName": "COMPETENCIAS SOCIALES / INTERPERSONALES",
          "competencyCategoryId": "gJnRv6pON4SIh8jWNUER",
          "competencySubCategoryName": "TRABAJO EN EQUIPO",
          "competencySubCategoryId": "dTw337K0d1U5Vgck2Ksk",
          "name": "Empatía"
        },
        {
          "competencyCategoryName": "COMPETENCIAS SOCIALES / INTERPERSONALES",
          "competencyCategoryId": "gJnRv6pON4SIh8jWNUER",
          "competencySubCategoryName": "TRABAJO EN EQUIPO",
          "competencySubCategoryId": "dTw337K0d1U5Vgck2Ksk",
          "name": "Compartir y recibir retroalimentación"
        },
        {
          "competencyCategoryName": "COMPETENCIAS SOCIALES / INTERPERSONALES",
          "competencyCategoryId": "gJnRv6pON4SIh8jWNUER",
          "competencySubCategoryName": "GESTION DE CONFLICTOS",
          "competencySubCategoryId": "sqI1W1PQXZ02rFEFCPUC",
          "name": "Escucha activa."
        },
        {
          "competencyCategoryName": "COMPETENCIAS SOCIALES / INTERPERSONALES",
          "competencyCategoryId": "gJnRv6pON4SIh8jWNUER",
          "competencySubCategoryName": "GESTION DE CONFLICTOS",
          "competencySubCategoryId": "sqI1W1PQXZ02rFEFCPUC",
          "name": "Mediación"
        },
        {
          "competencyCategoryName": "COMPETENCIAS SOCIALES / INTERPERSONALES",
          "competencyCategoryId": "gJnRv6pON4SIh8jWNUER",
          "competencySubCategoryName": "GESTION DE CONFLICTOS",
          "competencySubCategoryId": "sqI1W1PQXZ02rFEFCPUC",
          "name": "Objetividad"
        },
        {
          "competencyCategoryName": "COMPETENCIAS SOCIALES / INTERPERSONALES",
          "competencyCategoryId": "gJnRv6pON4SIh8jWNUER",
          "competencySubCategoryName": "NEGOCIACIÓN",
          "competencySubCategoryId": "gW4VYWyiyxgdF0a5UQix",
          "name": "Influencia y persuasión."
        },
        {
          "competencyCategoryName": "COMPETENCIAS SOCIALES / INTERPERSONALES",
          "competencyCategoryId": "gJnRv6pON4SIh8jWNUER",
          "competencySubCategoryName": "NEGOCIACIÓN",
          "competencySubCategoryId": "gW4VYWyiyxgdF0a5UQix",
          "name": "Perseverancia"
        },
        {
          "competencyCategoryName": "COMPETENCIAS PERSONALES / INTRAPERSONALES",
          "competencyCategoryId": "52Btlw7ScRbg5rzer9yW",
          "competencySubCategoryName": "LIDERAZGO POSITIVO",
          "competencySubCategoryId": "cjLReWOy3GQMXfP4YN4q",
          "name": "Autoconfianza"
        },
        {
          "competencyCategoryName": "COMPETENCIAS PERSONALES / INTRAPERSONALES",
          "competencyCategoryId": "52Btlw7ScRbg5rzer9yW",
          "competencySubCategoryName": "LIDERAZGO POSITIVO",
          "competencySubCategoryId": "cjLReWOy3GQMXfP4YN4q",
          "name": "Responsabilidad"
        },
        {
          "competencyCategoryName": "COMPETENCIAS PERSONALES / INTRAPERSONALES",
          "competencyCategoryId": "52Btlw7ScRbg5rzer9yW",
          "competencySubCategoryName": "LIDERAZGO POSITIVO",
          "competencySubCategoryId": "cjLReWOy3GQMXfP4YN4q",
          "name": "Autonomía"
        },
        {
          "competencyCategoryName": "COMPETENCIAS PERSONALES / INTRAPERSONALES",
          "competencyCategoryId": "52Btlw7ScRbg5rzer9yW",
          "competencySubCategoryName": "LIDERAZGO POSITIVO",
          "competencySubCategoryId": "cjLReWOy3GQMXfP4YN4q",
          "name": "Motivación e implicación"
        },
        {
          "competencyCategoryName": "COMPETENCIAS PERSONALES / INTRAPERSONALES",
          "competencyCategoryId": "52Btlw7ScRbg5rzer9yW",
          "competencySubCategoryName": "LIDERAZGO POSITIVO",
          "competencySubCategoryId": "cjLReWOy3GQMXfP4YN4q",
          "name": "Movilización de la red"
        },
        {
          "competencyCategoryName": "COMPETENCIAS PERSONALES / INTRAPERSONALES",
          "competencyCategoryId": "52Btlw7ScRbg5rzer9yW",
          "competencySubCategoryName": "AUTOEVALUACIÓN",
          "competencySubCategoryId": "2JCtEdFNkQG1RH953YiC",
          "name": "Introspección y reflexividad"
        },
        {
          "competencyCategoryName": "COMPETENCIAS PERSONALES / INTRAPERSONALES",
          "competencyCategoryId": "52Btlw7ScRbg5rzer9yW",
          "competencySubCategoryName": "AUTOEVALUACIÓN",
          "competencySubCategoryId": "2JCtEdFNkQG1RH953YiC",
          "name": "Ética"
        },
        {
          "competencyCategoryName": "COMPETENCIAS PERSONALES / INTRAPERSONALES",
          "competencyCategoryId": "52Btlw7ScRbg5rzer9yW",
          "competencySubCategoryName": "AUTOEVALUACIÓN",
          "competencySubCategoryId": "2JCtEdFNkQG1RH953YiC",
          "name": "Autocontrol"
        },
        {
          "competencyCategoryName": "COMPETENCIAS PERSONALES / INTRAPERSONALES",
          "competencyCategoryId": "52Btlw7ScRbg5rzer9yW",
          "competencySubCategoryName": "AUTOEVALUACIÓN",
          "competencySubCategoryId": "2JCtEdFNkQG1RH953YiC",
          "name": "Establecimiento de metas"
        },
        {
          "competencyCategoryName": "COMPETENCIAS PERSONALES / INTRAPERSONALES",
          "competencyCategoryId": "52Btlw7ScRbg5rzer9yW",
          "competencySubCategoryName": "ADAPTABILIDAD",
          "competencySubCategoryId": "9l7ndhKMhNsdrPl85igF",
          "name": "Gestión de la incertidumbre y el cambio"
        },
        {
          "competencyCategoryName": "COMPETENCIAS PERSONALES / INTRAPERSONALES",
          "competencyCategoryId": "52Btlw7ScRbg5rzer9yW",
          "competencySubCategoryName": "ADAPTABILIDAD",
          "competencySubCategoryId": "9l7ndhKMhNsdrPl85igF",
          "name": "Manejo del estrés"
        },
        {
          "competencyCategoryName": "COMPETENCIAS PERSONALES / INTRAPERSONALES",
          "competencyCategoryId": "52Btlw7ScRbg5rzer9yW",
          "competencySubCategoryName": "ADAPTABILIDAD",
          "competencySubCategoryId": "9l7ndhKMhNsdrPl85igF",
          "name": "Reactividad"
        },
        {
          "competencyCategoryName": "COMPETENCIAS METODOLÓGICAS",
          "competencyCategoryId": "Cd4BzusrzGwpxv6i1mqJ",
          "competencySubCategoryName": "APRENDER A APRENDER",
          "competencySubCategoryId": "b1BiQVVhEZPcSu2mFtDR",
          "name": "Aprendizaje individual"
        },
        {
          "competencyCategoryName": "COMPETENCIAS METODOLÓGICAS",
          "competencyCategoryId": "Cd4BzusrzGwpxv6i1mqJ",
          "competencySubCategoryName": "APRENDER A APRENDER",
          "competencySubCategoryId": "b1BiQVVhEZPcSu2mFtDR",
          "name": "Aprendizaje colectivo"
        },
        {
          "competencyCategoryName": "COMPETENCIAS METODOLÓGICAS",
          "competencyCategoryId": "Cd4BzusrzGwpxv6i1mqJ",
          "competencySubCategoryName": "APRENDER A APRENDER",
          "competencySubCategoryId": "b1BiQVVhEZPcSu2mFtDR",
          "name": "Apertura sociocultural"
        },
        {
          "competencyCategoryName": "COMPETENCIAS METODOLÓGICAS",
          "competencyCategoryId": "Cd4BzusrzGwpxv6i1mqJ",
          "competencySubCategoryName": "APRENDER A APRENDER",
          "competencySubCategoryId": "b1BiQVVhEZPcSu2mFtDR",
          "name": "Pedagogía"
        },
        {
          "competencyCategoryName": "COMPETENCIAS METODOLÓGICAS",
          "competencyCategoryId": "Cd4BzusrzGwpxv6i1mqJ",
          "competencySubCategoryName": "COMPETENCIAS ANALÍTICAS",
          "competencySubCategoryId": "cCicRy1uL175QKItkF8n",
          "name": "Recolección y procesamiento de datos"
        },
        {
          "competencyCategoryName": "COMPETENCIAS METODOLÓGICAS",
          "competencyCategoryId": "Cd4BzusrzGwpxv6i1mqJ",
          "competencySubCategoryName": "COMPETENCIAS ANALÍTICAS",
          "competencySubCategoryId": "cCicRy1uL175QKItkF8n",
          "name": "Problematización"
        },
        {
          "competencyCategoryName": "COMPETENCIAS METODOLÓGICAS",
          "competencyCategoryId": "Cd4BzusrzGwpxv6i1mqJ",
          "competencySubCategoryName": "COMPETENCIAS ANALÍTICAS",
          "competencySubCategoryId": "cCicRy1uL175QKItkF8n",
          "name": "Análisis de la información"
        },
        {
          "competencyCategoryName": "COMPETENCIAS METODOLÓGICAS",
          "competencyCategoryId": "Cd4BzusrzGwpxv6i1mqJ",
          "competencySubCategoryName": "COMPETENCIAS ANALÍTICAS",
          "competencySubCategoryId": "cCicRy1uL175QKItkF8n",
          "name": "Síntesis de información"
        },
        {
          "competencyCategoryName": "COMPETENCIAS METODOLÓGICAS",
          "competencyCategoryId": "Cd4BzusrzGwpxv6i1mqJ",
          "competencySubCategoryName": "COMPETENCIAS ANALÍTICAS",
          "competencySubCategoryId": "cCicRy1uL175QKItkF8n",
          "name": "Mente crítica"
        },
        {
          "competencyCategoryName": "COMPETENCIAS METODOLÓGICAS",
          "competencyCategoryId": "Cd4BzusrzGwpxv6i1mqJ",
          "competencySubCategoryName": "CREATIVIDAD",
          "competencySubCategoryId": "QLt6N9yE4MMhyH7rUEt5",
          "name": "Curiosidad"
        },
        {
          "competencyCategoryName": "COMPETENCIAS METODOLÓGICAS",
          "competencyCategoryId": "Cd4BzusrzGwpxv6i1mqJ",
          "competencySubCategoryName": "CREATIVIDAD",
          "competencySubCategoryId": "QLt6N9yE4MMhyH7rUEt5",
          "name": "Imaginación"
        },
        {
          "competencyCategoryName": "COMPETENCIAS METODOLÓGICAS",
          "competencyCategoryId": "Cd4BzusrzGwpxv6i1mqJ",
          "competencySubCategoryName": "CREATIVIDAD",
          "competencySubCategoryId": "QLt6N9yE4MMhyH7rUEt5",
          "name": "Iniciativa"
        },
        {
          "competencyCategoryName": "COMPETENCIAS METODOLÓGICAS",
          "competencyCategoryId": "Cd4BzusrzGwpxv6i1mqJ",
          "competencySubCategoryName": "RESOLUCIÓN DE PROBLEMAS",
          "competencySubCategoryId": "QRLfzAVnkklXRs6ZFvJV",
          "name": "Organización"
        },
        {
          "competencyCategoryName": "COMPETENCIAS METODOLÓGICAS",
          "competencyCategoryId": "Cd4BzusrzGwpxv6i1mqJ",
          "competencySubCategoryName": "RESOLUCIÓN DE PROBLEMAS",
          "competencySubCategoryId": "QRLfzAVnkklXRs6ZFvJV",
          "name": "Estrategia"
        },
        {
          "competencyCategoryName": "COMPETENCIAS METODOLÓGICAS",
          "competencyCategoryId": "Cd4BzusrzGwpxv6i1mqJ",
          "competencySubCategoryName": "RESOLUCIÓN DE PROBLEMAS",
          "competencySubCategoryId": "QRLfzAVnkklXRs6ZFvJV",
          "name": "Toma de decisiones"
        },
        {
          "competencyCategoryName": "COMPETENCIAS METODOLÓGICAS",
          "competencyCategoryId": "Cd4BzusrzGwpxv6i1mqJ",
          "competencySubCategoryName": "RESOLUCIÓN DE PROBLEMAS",
          "competencySubCategoryId": "QRLfzAVnkklXRs6ZFvJV",
          "name": "Gestión del tiempo"
        },
        {
          "competencyCategoryName": "COMPETENCIAS METODOLÓGICAS",
          "competencyCategoryId": "Cd4BzusrzGwpxv6i1mqJ",
          "competencySubCategoryName": "RESOLUCIÓN DE PROBLEMAS",
          "competencySubCategoryId": "QRLfzAVnkklXRs6ZFvJV",
          "name": "Conciencia y retrospectiva"
        },
        {
          "competencyCategoryName": "",
          "competencyCategoryId": "",
          "competencySubCategoryName": "",
          "competencySubCategoryId": "",
          "name": ""
        }
       ]; */

function createCertificationRequestTemplate(certifierName, competencyName, unemployedRequesterName, certificationRequestId) {
    const certificationRequestTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" style="width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
        <head>
        <meta charset="UTF-8">
        <meta content="width=device-width, initial-scale=1" name="viewport">
        <meta name="x-apple-disable-message-reformatting">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta content="telephone=no" name="format-detection">
        <title>New Template</title><!--[if (mso 16)]>
        <style type="text/css">
        a {text-decoration: none;}
        </style>
        <![endif]--><!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--><!--[if gte mso 9]>
        <xml>
        <o:OfficeDocumentSettings>
        <o:AllowPNG></o:AllowPNG>
        <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
        </xml>
        <![endif]-->
        <style type="text/css">
        #outlook a {
        padding:0;
        }
        .ExternalClass {
        width:100%;
        }
        .ExternalClass,
        .ExternalClass p,
        .ExternalClass span,
        .ExternalClass font,
        .ExternalClass td,
        .ExternalClass div {
        line-height:100%;
        }
        .es-button {
        mso-style-priority:100!important;
        text-decoration:none!important;
        }
        a[x-apple-data-detectors] {
        color:inherit!important;
        text-decoration:none!important;
        font-size:inherit!important;
        font-family:inherit!important;
        font-weight:inherit!important;
        line-height:inherit!important;
        }
        .es-desk-hidden {
        display:none;
        float:left;
        overflow:hidden;
        width:0;
        max-height:0;
        line-height:0;
        mso-hide:all;
        }
        [data-ogsb] .es-button {
        border-width:0!important;
        padding:10px 20px 10px 20px!important;
        }
        @media only screen and (max-width:600px) {p, ul li, ol li, a { line-height:150%!important } h1, h2, h3, h1 a, h2 a, h3 a { line-height:120%!important } h1 { font-size:30px!important; text-align:center } h2 { font-size:22px!important; text-align:center } h3 { font-size:20px!important; text-align:center } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size:30px!important } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size:22px!important } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size:20px!important } .es-menu td a { font-size:14px!important } .es-header-body p, .es-header-body ul li, .es-header-body ol li, .es-header-body a { font-size:14px!important } .es-content-body p, .es-content-body ul li, .es-content-body ol li, .es-content-body a { font-size:16px!important } .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size:12px!important } .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size:12px!important } *[class="gmail-fix"] { display:none!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align:right!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-button-border { display:block!important } a.es-button, button.es-button { font-size:20px!important; display:block!important; border-left-width:0px!important; border-right-width:0px!important } .es-btn-fw { border-width:10px 0px!important; text-align:center!important } .es-adaptive table, .es-btn-fw, .es-btn-fw-brdr, .es-left, .es-right { width:100%!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .es-adapt-td { display:block!important; width:100%!important } .adapt-img { width:100%!important; height:auto!important } .es-m-p0 { padding:0px!important } .es-m-p0r { padding-right:0px!important } .es-m-p0l { padding-left:0px!important } .es-m-p0t { padding-top:0px!important } .es-m-p0b { padding-bottom:0!important } .es-m-p20b { padding-bottom:20px!important } .es-mobile-hidden, .es-hidden { display:none!important } tr.es-desk-hidden, td.es-desk-hidden, table.es-desk-hidden { width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } tr.es-desk-hidden { display:table-row!important } table.es-desk-hidden { display:table!important } td.es-desk-menu-hidden { display:table-cell!important } .es-menu td { width:1%!important } table.es-table-not-adapt, .esd-block-html table { width:auto!important } table.es-social { display:inline-block!important } table.es-social td { display:inline-block!important } .es-desk-hidden { display:table-row!important; width:auto!important; overflow:visible!important; max-height:inherit!important } }
        </style>
        </head>
        <body style="width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;font-family:arial, 'helvetica neue', helvetica, sans-serif;padding:0;Margin:0">
        <div class="es-wrapper-color" style="background-color:#F6F6F6"><!--[if gte mso 9]>
        <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
        <v:fill type="tile" color="#f6f6f6"></v:fill>
        </v:background>
        <![endif]-->
        <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:no-repeat;background-position:center top;background-color:#F6F6F6">
        <tr style="border-collapse:collapse">
        <td valign="top" style="padding:0;Margin:0">
        <table class="es-content" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
        <tr style="border-collapse:collapse">
        <td align="center" style="padding:0;Margin:0">
        <table class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#ffffff;width:600px" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center">
        <tr style="border-collapse:collapse">
        <td align="left" style="padding:0;Margin:0">
        <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
        <tr style="border-collapse:collapse">
        <td valign="top" align="center" style="padding:0;Margin:0;width:600px">
        <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
        <tr style="border-collapse:collapse">
        <td align="center" style="padding:0;Margin:0;padding-top:20px;padding-bottom:20px;font-size:0px"><a href="https://www.enredas.org/" target="_blank" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#6AA84F;font-size:14px"><img src="https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/images%2Fenreda-logo_900x503.png?alt=media&token=c2dd6abb-d60a-46df-adf5-0c93849f12ce" alt="Enreda" title="Enreda" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="224" class="adapt-img"></a></td>
        </tr>
        <tr style="border-collapse:collapse">
        <td align="center" style="padding:0;Margin:0;font-size:0px"><a href="https://www.enredas.org/" target="_blank" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#6AA84F;font-size:14px"><img src="https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/images%2Fstars2_900x503.jpg?alt=media&token=8c615a74-ee85-4f6d-baf9-fd90f84edd16" alt="Enreda" title="Enreda" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" class="adapt-img" height="400"></a></td>
        </tr>
        </table></td>
        </tr>
        </table></td>
        </tr>
        </table></td>
        </tr>
        </table>
        <table class="es-content" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
        <tr style="border-collapse:collapse">
        <td align="center" style="padding:0;Margin:0">
        <table class="es-content-body" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
        <tr style="border-collapse:collapse">
        <td align="left" style="Margin:0;padding-bottom:15px;padding-top:20px;padding-left:20px;padding-right:20px">
        <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
        <tr style="border-collapse:collapse">
        <td valign="top" align="center" style="padding:0;Margin:0;width:560px">
        <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
        <tr style="border-collapse:collapse">
        <td align="center" style="padding:0;Margin:0;padding-bottom:5px"><h2 style="Margin:0;line-height:31px;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:26px;font-style:normal;font-weight:normal;color:#333333">Solicitud de certificación de competencia</h2></td>
        </tr>
        </table></td>
        </tr>
        </table></td>
        </tr>
        <tr style="border-collapse:collapse">
        <td align="left" style="padding:0;Margin:0;padding-bottom:10px;padding-left:20px;padding-right:20px">
        <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
        <tr style="border-collapse:collapse">
        <td valign="top" align="center" style="padding:0;Margin:0;width:560px">
        <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
        <tr style="border-collapse:collapse">
        <td align="center" style="padding:0;Margin:0;padding-bottom:10px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:24px;color:#333333;font-size:16px">Hola ${certifierName}<br><br>Desde la web&nbsp;<strong>enREDa</strong>,<strong>&nbsp;</strong>${unemployedRequesterName} está solicitando<strong>&nbsp;</strong><br>la certificación de la siguiente competencia:<br><br><strong>${competencyName}</strong><br><br></p></td>
        </tr>
        </table></td>
        </tr>
        </table></td>
        </tr>
        </table></td>
        </tr>
        </table>
        <table class="es-content" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
        <tr style="border-collapse:collapse">
        <td align="center" style="padding:0;Margin:0">
        <table class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#efefef;width:600px" cellspacing="0" cellpadding="0" bgcolor="#efefef" align="center">
        <tr style="border-collapse:collapse">
        <td align="left" style="Margin:0;padding-top:20px;padding-bottom:20px;padding-left:20px;padding-right:20px">
        <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
        <tr style="border-collapse:collapse">
        <td valign="top" align="center" style="padding:0;Margin:0;width:560px">
        <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
        <tr style="border-collapse:collapse">
        <td align="center" style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px"><h3 style="Margin:0;line-height:24px;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:20px;font-style:normal;font-weight:normal;color:#333333">Certificar competencia:</h3></td>
        </tr>
        <tr style="border-collapse:collapse">
        <td align="center" style="padding:0;Margin:0;padding-top:10px"><!--[if mso]><a href="https://enredawebapp.web.app/competencies/${certificationRequestId}" target="_blank" hidden>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" esdevVmlButton href="https://enredawebapp.web.app/competencies/${certificationRequestId}"
        style="height:39px; v-text-anchor:middle; width:117px" arcsize="13%" stroke="f" fillcolor="#00d0ce">
        <w:anchorlock></w:anchorlock>
        <center style='color:#ffffff; font-family:arial, "helvetica neue", helvetica, "sans-serif"; font-size:14px; font-weight:400; line-height:14px; mso-text-raise:1px'>Formulario</center>
        </v:roundrect></a>
        <![endif]--><!--[if !mso]><!-- --><span class="msohide es-button-border" style="border-style:solid;border-color:#FFFFFF;background:#00d0ce;border-width:0px;display:inline-block;border-radius:5px;width:auto;mso-hide:all"><a href="https://enredawebapp.web.app/competencies/${certificationRequestId}" class="es-button" target="_blank" style="mso-style-priority:100 !important;text-decoration:none;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;color:#FFFFFF;font-size:16px;border-style:solid;border-color:#00d0ce;border-width:10px 20px 10px 20px;display:inline-block;background:#00d0ce;border-radius:5px;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-weight:normal;font-style:normal;line-height:19px;width:auto;text-align:center">Formulario</a></span><!--<![endif]--></td>
        </tr>
        </table></td>
        </tr>
        </table></td>
        </tr>
        </table></td>
        </tr>
        </table>
        <table class="es-content" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
        <tr style="border-collapse:collapse">
        <td align="center" style="padding:0;Margin:0">
        <table class="es-content-body" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
        <tr style="border-collapse:collapse">
        <td align="left" style="Margin:0;padding-left:20px;padding-right:20px;padding-top:35px;padding-bottom:35px">
        <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
        <tr style="border-collapse:collapse">
        <td valign="top" align="center" style="padding:0;Margin:0;width:560px">
        <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
        <tr style="border-collapse:collapse">
        <td class="es-m-txt-c" align="center" style="padding:0;Margin:0"><h3 style="Margin:0;line-height:24px;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:20px;font-style:normal;font-weight:normal;color:#333333">¡Muchas gracias!</h3></td>
        </tr>
        </table></td>
        </tr>
        </table></td>
        </tr>
        </table></td>
        </tr>
        </table></td>
        </tr>
        </table>
        </div>
        </body>
        </html>
        `;
    return certificationRequestTemplate;
}



exports.updateResourceCategory = functions.firestore.document('testOne/{testOnetId}')
    .onUpdate((change, context) => {
        const testOnetId = context.params.testOnetIdId;
        const newValue = change.after.data();
        const previousValue = change.before.data();
        if (newValue.run !== previousValue.run) {
            return adminFirebase.firestore().collection('resources').get().then(
                (snapshot) => {
                    snapshot.forEach((resource) => {
                        resourceId = resource.get('resourceId');
                        if (resource.get('resourceType') === 'kUM5r4lSikIPLMZlQ7FD') {
                            return adminFirebase.firestore().doc(`resources/${resource.data().resourceId}`).set({ resourceCategory: 'POUBGFk5gU6c5X1DKo1b' }, { merge: true })
                                .then(() => {
                                    console.log("Successfully added resource category");
                                }).catch(err => {
                                    console.error(err);
                                    throw new Error('Export resource category operation failed:' + err);
                                });
                        }
                    })
                });
        }
    });


    exports.resourceInvitation = functions.firestore
    .document('resourcesInvitations/{resourceInvitationId}')
    .onCreate((snapshot, context) => {
        const resourceInvitationId = context.params.resourceInvitationId;
        const unemployedName = snapshot.get('unemployedName');
        const unemployedEmail = snapshot.get('unemployedEmail');
        const resourceId = snapshot.get('resourceId');
        const resourceTitle = snapshot.get('resourceTitle');
        const resourceDates = snapshot.get('resourceDates');
        const resourceDuration = snapshot.get('resourceDuration');
        const resourceDescription = snapshot.get('resourceDescription');

        return adminFirebase.firestore().doc(`resourcesInvitations/${resourceInvitationId}`).set({resourceInvitationId}, {
            merge:true
        })
            .then(() => {
                return adminFirebase.firestore().collection('mail').add({
                    to: unemployedEmail,
                    message: {
                        subject: `Invitación: ${resourceTitle}.`,
                        html:
                            createResourceInvitationTemplate(unemployedName, resourceTitle, resourceId, resourceDates, resourceDuration, resourceDescription ),
                    }
                }).then(() => console.log('Queued email!'));
                });
            });


    function createResourceInvitationTemplate(unemployedName, resourceTitle, resourceId, resourceDates, resourceDuration, resourceDescription ) {
        const resourceInvitationTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" style="width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
        <head>
        <meta charset="UTF-8">
        <meta content="width=device-width, initial-scale=1" name="viewport">
        <meta name="x-apple-disable-message-reformatting">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta content="telephone=no" name="format-detection">
        <title>New Template</title><!--[if (mso 16)]>
        <style type="text/css">
        a {text-decoration: none;}
        </style>
        <![endif]--><!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--><!--[if gte mso 9]>
        <xml>
        <o:OfficeDocumentSettings>
        <o:AllowPNG></o:AllowPNG>
        <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
        </xml>
        <![endif]--><!--[if !mso]><!-- -->
        <link href="https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i" rel="stylesheet"><!--<![endif]-->
        <style type="text/css">
        #outlook a {
        padding:0;
        }
        .ExternalClass {
        width:100%;
        }
        .ExternalClass,
        .ExternalClass p,
        .ExternalClass span,
        .ExternalClass font,
        .ExternalClass td,
        .ExternalClass div {
        line-height:100%;
        }
        .es-button {
        mso-style-priority:100!important;
        text-decoration:none!important;
        }
        a[x-apple-data-detectors] {
        color:inherit!important;
        text-decoration:none!important;
        font-size:inherit!important;
        font-family:inherit!important;
        font-weight:inherit!important;
        line-height:inherit!important;
        }
        .es-desk-hidden {
        display:none;
        float:left;
        overflow:hidden;
        width:0;
        max-height:0;
        line-height:0;
        mso-hide:all;
        }
        @media only screen and (max-width:600px) {p, ul li, ol li, a { line-height:150%!important } h1, h2, h3, h1 a, h2 a, h3 a { line-height:120%!important } h1 { font-size:30px!important; text-align:center } h2 { font-size:26px!important; text-align:center } h3 { font-size:20px!important; text-align:center } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size:30px!important } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size:26px!important } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size:20px!important } .es-menu td a { font-size:16px!important } .es-header-body p, .es-header-body ul li, .es-header-body ol li, .es-header-body a { font-size:16px!important } .es-content-body p, .es-content-body ul li, .es-content-body ol li, .es-content-body a { font-size:16px!important } .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size:12px!important } .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size:12px!important } *[class="gmail-fix"] { display:none!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align:right!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-button-border { display:block!important } a.es-button, button.es-button { font-size:20px!important; display:block!important; padding-left:0px!important; padding-right:0px!important } .es-btn-fw { border-width:10px 0px!important; text-align:center!important } .es-adaptive table, .es-btn-fw, .es-btn-fw-brdr, .es-left, .es-right { width:100%!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .es-adapt-td { display:block!important; width:100%!important } .adapt-img { width:100%!important; height:auto!important } .es-m-p0 { padding:0px!important } .es-m-p0r { padding-right:0px!important } .es-m-p0l { padding-left:0px!important } .es-m-p0t { padding-top:0px!important } .es-m-p0b { padding-bottom:0!important } .es-m-p20b { padding-bottom:20px!important } .es-mobile-hidden, .es-hidden { display:none!important } tr.es-desk-hidden, td.es-desk-hidden, table.es-desk-hidden { width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } tr.es-desk-hidden { display:table-row!important } table.es-desk-hidden { display:table!important } td.es-desk-menu-hidden { display:table-cell!important } .es-menu td { width:1%!important } table.es-table-not-adapt, .esd-block-html table { width:auto!important } table.es-social { display:inline-block!important } table.es-social td { display:inline-block!important } .es-desk-hidden { display:table-row!important; width:auto!important; overflow:visible!important; max-height:inherit!important } }
        </style>
        </head>
        <body style="width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;padding:0;Margin:0">
        <div class="es-wrapper-color" style="background-color:#F6F6F6"><!--[if gte mso 9]>
        <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
        <v:fill type="tile" color="#f6f6f6"></v:fill>
        </v:background>
        <![endif]-->
        <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#F6F6F6">
        <tr style="border-collapse:collapse">
        <td valign="top" style="padding:0;Margin:0">
        <table class="es-content" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
        <tr style="border-collapse:collapse"></tr>
        <tr style="border-collapse:collapse">
        <td align="center" style="padding:0;Margin:0">
        <table class="es-header-body" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
        <tr style="border-collapse:collapse">
        <td align="left" style="Margin:0;padding-left:10px;padding-right:10px;padding-top:25px;padding-bottom:25px">
        <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
        <tr style="border-collapse:collapse">
        <td valign="top" align="center" style="padding:0;Margin:0;width:580px">
        <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
        <tr style="border-collapse:collapse">
        <td align="center" style="padding:0;Margin:0;font-size:0px"><a href="https://enredawebapp.web.app/" target="_blank" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#CCCCCC;font-size:12px"><img src="https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/images%2Fenreda-logo_900x503.png?alt=media&token=c2dd6abb-d60a-46df-adf5-0c93849f12ce" alt="enREDa" width="224" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" title="enREDa"></a></td>
        </tr>
        </table></td>
        </tr>
        </table></td>
        </tr>
        </table></td>
        </tr>
        </table>
        <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
        <tr style="border-collapse:collapse">
        <td align="center" style="padding:0;Margin:0">
        <table class="es-content-body" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
        <tr style="border-collapse:collapse">
        <td align="left" style="padding:0;Margin:0">
        <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
        <tr style="border-collapse:collapse">
        <td valign="top" align="center" style="padding:0;Margin:0;width:600px">
        <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
        <tr style="border-collapse:collapse">
        <td style="padding:0;Margin:0;position:relative" align="center"><img class="adapt-img" src="https://aouuxs.stripocdn.email/content/guids/bannerImgGuid/images/image16873759157801598.png" alt="Attend our free webinar. How to create effective trigger emails." title="Attend our free webinar. How to create effective trigger emails." width="600" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></td>
        </tr>
        </table></td>
        </tr>
        </table></td>
        </tr>
        </table></td>
        </tr>
        </table>
        <table class="es-content" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
        <tr style="border-collapse:collapse">
        <td align="center" style="padding:0;Margin:0">
        <table class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#ffffff;width:600px" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center">
        <tr style="border-collapse:collapse">
        <td align="left" style="padding:0;Margin:0;padding-top:20px;padding-left:20px;padding-right:20px">
        <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
        <tr style="border-collapse:collapse">
        <td valign="top" align="center" style="padding:0;Margin:0;width:560px">
        <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;border-top:1px solid #efefef" width="100%" cellspacing="0" cellpadding="0" role="presentation">
        <tr style="border-collapse:collapse">
        <td align="center" style="padding:0;Margin:0;padding-bottom:10px;padding-top:25px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:24px;color:#333333;font-size:16px">Hola ${unemployedName}, te invitamos al evento:</p></td>
        </tr>
        <tr style="border-collapse:collapse">
        <td align="center" style="padding:0;Margin:0;padding-top:25px;padding-bottom:25px"><h3 style="Margin:0;line-height:22px;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:18px;font-style:normal;font-weight:bold;color:#333333"><strong>${resourceTitle}</strong></h3><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:24px;color:#333333;font-size:16px">Fechas: ${resourceDates}</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:24px;color:#333333;font-size:16px">Duración: ${resourceDuration}</p></td>
        </tr>
        </table></td>
        </tr>
        <tr style="border-collapse:collapse">
        <td valign="top" align="center" style="padding:0;Margin:0;width:560px">
        <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;border-top:1px solid #efefef" width="100%" cellspacing="0" cellpadding="0" role="presentation">
        <tr style="border-collapse:collapse">
        <td align="center" style="padding:0;Margin:0;padding-bottom:10px;padding-top:25px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:24px;color:#333333;font-size:16px">Aquí aprenderás:</p></td>
        </tr>
        </table></td>
        </tr>
        </table></td>
        </tr>
        <tr style="border-collapse:collapse">
        <td align="left" style="padding:0;Margin:0;padding-left:20px;padding-right:20px">
        <table cellspacing="0" cellpadding="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
        <tr style="border-collapse:collapse">
        <td align="left" style="padding:0;Margin:0;width:560px">
        <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
        <tr style="border-collapse:collapse">
        <td align="left" style="padding:0;Margin:0;padding-left:25px;padding-right:25px;padding-bottom:30px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:21px;color:#333333;font-size:14px">${resourceDescription}</p></td>
        </tr>
        </table></td>
        </tr>
        </table></td>
        </tr>
        <tr style="border-collapse:collapse">
        <td align="left" style="padding:0;Margin:0;padding-left:20px;padding-right:20px;padding-bottom:30px">
        <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
        <tr style="border-collapse:collapse">
        <td valign="top" align="center" style="padding:0;Margin:0;width:560px">
        <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
        <tr style="border-collapse:collapse">
        <td align="center" style="padding:0;Margin:0;padding-top:15px"><!--[if mso]><a href="https://enredawebapp.web.app/resources/${resourceId}" target="_blank" hidden>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" esdevVmlButton href="https://enredawebapp.web.app/resources/${resourceId}"
        style="height:41px; v-text-anchor:middle; width:192px" arcsize="12%" stroke="f" fillcolor="#00d0ce">
        <w:anchorlock></w:anchorlock>
        <center style='color:#ffffff; font-family:arial, "helvetica neue", helvetica, "sans-serif"; font-size:15px; font-weight:400; line-height:15px; mso-text-raise:1px'>Quiero participar</center>
        </v:roundrect></a>
        <![endif]--><!--[if !mso]><!-- --><span class="msohide es-button-border" style="border-style:solid;border-color:#FFFFFF;background:#00D0CE;border-width:0px;display:inline-block;border-radius:5px;width:auto;mso-hide:all"><a href="https://enredawebapp.web.app/resources/${resourceId}" class="es-button" target="_blank" style="mso-style-priority:100 !important;text-decoration:none;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;color:#FFFFFF;font-size:18px;display:inline-block;background:#00D0CE;border-radius:5px;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-weight:normal;font-style:normal;line-height:22px;width:auto;text-align:center;padding:10px 20px 10px 20px;mso-padding-alt:0;mso-border-alt:10px solid #00D0CE">Quiero participar</a></span><!--<![endif]--></td>
        </tr>
        </table></td>
        </tr>
        </table></td>
        </tr>
        </table></td>
        </tr>
        </table>
        <table cellpadding="0" cellspacing="0" class="es-footer" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top">
        <tr style="border-collapse:collapse">
        <td align="center" style="padding:0;Margin:0">
        <table class="es-footer-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#efefef;width:600px" cellspacing="0" cellpadding="0" bgcolor="#efefef" align="center">
        <tr style="border-collapse:collapse">
        <td align="left" style="Margin:0;padding-left:20px;padding-right:20px;padding-top:30px;padding-bottom:30px">
        <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
        <tr style="border-collapse:collapse">
        <td valign="top" align="center" style="padding:0;Margin:0;width:560px">
        <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
        <tr style="border-collapse:collapse">
        <td esdev-links-color="#333333" align="center" style="padding:0;Margin:0"><a name="enREDa" href="" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#333333;font-size:12px"></a><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:20px;color:#666666;font-size:13px">www.enredas.org</p></td>
        </tr>
        </table></td>
        </tr>
        </table></td>
        </tr>
        </table></td>
        </tr>
        </table></td>
        </tr>
        </table>
        </div>
        </body>
        </html>
        `;
        return resourceInvitationTemplate;
    }

/*
exports.updateProvisional = functions.runWith(options).firestore.document('provisional/{provisionalId}')
    .onUpdate(async (change, context) => {
 
        const resources = await adminFirebase.firestore().collection('resources').get();
 
        console.log(`Recursos: ${resources.size}`);
 
        var i = 1;
        for (const resource of resources.docs) {
            //console.log(`Recurso: ${resource.data().title}`);
            let resourceTypeName = '';
            let organizerName = '';
            let countryName = '';
            let provinceName = '';
            let cityName = '';
            let document;
 
            if (resource.data().resourceType) {
                document = await adminFirebase.firestore().collection('resourcesTypes').doc(resource.data().resourceType).get();
                resourceTypeName = document.data().name;
                //console.log(`Tipo de recurso: ${resourceTypeName}`)
            }
 
            if (resource.data().organizer) {
                document = await adminFirebase.firestore().collection('organizations').doc(resource.data().organizer).get();
                organizerName = document.data().name;
                //console.log(`Organizador: ${organizerName}`)
            }
 
            if (resource.data().address.country) {
                document = await adminFirebase.firestore().collection('countries').doc(resource.data().address.country).get();
                countryName = document.data().name;
                //console.log(`País: ${countryName}`)
            }
 
            if (resource.data().address.province) {
                document = await adminFirebase.firestore().collection('provinces').doc(resource.data().address.province).get();
                provinceName = document.data().name;
                //console.log(`Provincia: ${provinceName}`)
            }
 
            if (resource.data().address.city) {
                document = await adminFirebase.firestore().collection('cities').doc(resource.data().address.city).get();
                cityName = document.data().name;
                //console.log(`Provincia: ${cityName}`)
            }
 
            await adminFirebase.firestore().doc(`resources/${resource.data().resourceId}`).set({ searchText: `${resource.data().title};${resourceTypeName};${organizerName};${countryName};${provinceName};${cityName}` }, { merge: true }).then(() => {
                console.log(`${i++} - Recurso actualizado: ${resource.data().title}, ${resourceTypeName}, ${organizerName}, ${countryName}, ${provinceName}, ${cityName}`);
            });
        }
 
        console.log('FUNCIÓN COMPLETADA CORRECTAMENTE');
    });
*/
