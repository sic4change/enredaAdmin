// /* We need to use playwright with @sparticuz/chromium library to execute Chrome in Google Cloud Function server
//    Check the npm library page if it's deprecated some day */


const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onDocumentDeleted } = require('firebase-functions/v2/firestore');
const { onMessagePublished } = require('firebase-functions/v2/pubsub');
const { onObjectFinalized } = require('firebase-functions/v2/storage');
const { onRequest } = require('firebase-functions/v2/https');
const { onSchedule } = require("firebase-functions/v2/scheduler");



const { logger } = require('firebase-functions');

const adminFirebase = require('firebase-admin');

adminFirebase.initializeApp();

var options = { memory: '2GB', timeoutSeconds: 540 };

const db = adminFirebase.firestore();
const scrapToCreate = db.collection('scrapps')

const { Firestore } = require('@google-cloud/firestore');
const otherFirestore = new Firestore({
  projectId: 'enreda-d3b41',
  databaseId: 'kpis',
});


const { chromium: playwright } = require("playwright-core");
const chromium = require("@sparticuz/chromium");
// const { setTimeout } = require('node:timers/promises');
const { OpenAI } = require("openai");
// const puppeteer = require('puppeteer');
// const functions = require('firebase-functions');
// const axios = require('axios'); // Axios version more than 0.21.1 will fail
// const cheerio = require('cheerio');
// const adminFirebase = require('firebase-admin');
// const { setTimeout } = require('node:timers/promises');
const ExcelJS = require('exceljs');
// const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
// const { logger } = require('firebase-functions');
// adminFirebase.initializeApp(functions.config().firebase);

// const db = adminFirebase.firestore();
// const scrapToCreate = db.collection('scrapps')

// var options = { memory: '2GB', timeoutSeconds: 540, }

// const firestore = require('@google-cloud/firestore');
// const client = new firestore.v1.FirestoreAdminClient();
const bucket = 'gs://enreda_bucket_eu';
// const firestore = require('@google-cloud/firestore');
// const client = new firestore.v1.FirestoreAdminClient();
// const bucket = 'gs://enreda_bucket_eu';
const openaiModel = "gpt-4o-mini";
const orchestratorTemperature = 1.0;


const { defineSecret } = require('firebase-functions/params');
const openaiApiKey = defineSecret('OPENAI_API_KEY');

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

exports.createUser = onDocumentCreated('users/{userId}', async (event) => {
  const snapshot = event.data;
  const userId = event.params.userId;
  const createDate = new Date();

  const emailRaw = snapshot.get('email');
  if (!emailRaw) {
    console.error('Email is missing in created user');
    return;
  }

  const email = emailRaw.trim().toLowerCase();
  const userDocs = await adminFirebase.firestore().collection('users').where("email", "==", email).get();

  // Si existen múltiples usuarios con el mismo email, eliminar el duplicado sin userId
  if (userDocs.size > 1) {
    console.log('User already exists, checking duplicates...');
    userDocs.forEach(async (doc) => {
      if (!doc.get('userId')) {
        await adminFirebase.firestore().collection("users").doc(userId).delete();
        console.log(`Duplicate user with email ${email} removed.`);
      }
    });
    return;
  }

  // Usuario único, continuar con creación
  console.log('Creating new user...');

  const photoUserDefault = 'https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/user_default.jpg?alt=media&token=d85b7cc4-7c25-414a-bdc3-63e2ba4a2e95';
  const role = snapshot.get('role');
  const phone = snapshot.get('phone');
  const address = snapshot.get('address') || {};
  const country = address.country;
  let active = snapshot.get('active');
  let birthday = snapshot.get('birthday') || adminFirebase.firestore.Timestamp.now();

  // Controlamos inactivos en Perú si no hay valor explícito
  if (active === undefined) {
    active = !(country === 'WMHqCzqISX6KNVs9b3iN' && role !== 'Desempleado');
  } else {
    active = String(active) === 'true';
  }

  const profilePic = snapshot.get('profilePic');
  const photoURL = profilePic ? profilePic.src : photoUserDefault;

  const commonUserData = {
    userId,
    role,
    email,
    active,
    birthday,
    createDate,
  };

  if (role === 'Mentor') {
    const trust = snapshot.get('trust') ?? false;
    commonUserData.trust = trust;
  }

  await adminFirebase.firestore().doc(`users/${userId}`).set(commonUserData, { merge: true });

  await adminFirebase.auth().createUser({
    uid: userId,
    email: email,
    displayName: `${snapshot.get('firstName')} ${snapshot.get('lastName')}`,
    password: 'enreda_' + userId.slice(-3),
    photoURL,
    disabled: !active,
  });

  const claims = {};
  switch (role) {
    case 'Mentor':
      claims.mentor = true;
      break;
    case 'Desempleado':
      claims.unemployed = true;
      break;
    case 'Organización':
      claims.organization = true;
      break;
    case 'Admin Zona':
      claims.admin = true;
      break;
    case 'Super Admin':
      claims['super-admin'] = true;
      break;
  }

  await adminFirebase.auth().setCustomUserClaims(userId, claims);

  console.log(`User ${userId} created and claims set successfully.`);
});


exports.updateUser = onDocumentUpdated('users/{userId}', async (event) => {
  const userId = event.params.userId;
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();

  if (!before || !after) {
    console.log('No user data found in update event.');
    return;
  }

  try {
    const promises = [];

    // Cambio de email
    if (after.email !== before.email) {
      promises.push(
        adminFirebase.auth().updateUser(userId, { email: after.email }).then(() => {
          console.log(`Changed email from ${before.email} to ${after.email}`);
        })
      );
    }

    // Cambio de nombre o apellido
    if (after.firstName !== before.firstName || after.lastName !== before.lastName) {
      const displayName = `${after.firstName} ${after.lastName}`;
      promises.push(
        adminFirebase.auth().updateUser(userId, { displayName }).then(() => {
          console.log('Changed display name');
        })
      );
    }

    // Cambio de estado activo
    if (after.active !== before.active) {
      promises.push(
        adminFirebase.auth().updateUser(userId, { disabled: !after.active }).then(() => {
          console.log('Changed active status');
        })
      );
    }

    // Cambio de nivel de confianza
    if (after.trust !== before.trust) {
      const trust = after.trust;
      const resourcesSnapshot = await adminFirebase.firestore()
        .collection('resources')
        .where("organizer", "==", userId)
        .get();

      resourcesSnapshot.forEach((resource) => {
        promises.push(
          adminFirebase.firestore().doc(`resources/${resource.data().resourceId}`).set({ trust }, { merge: true }).then(() => {
            console.log('Updated trust field in related resources');
          })
        );
      });
    }

    // Cambio de avatar
    if (
      after.profilePic?.src &&
      (before.profilePic?.src !== after.profilePic?.src)
    ) {
      promises.push(
        adminFirebase.auth().updateUser(userId, { photoURL: after.profilePic.src }).then(() => {
          console.log('Updated photoURL');
        })
      );
    }

    await Promise.all(promises);
  } catch (error) {
    console.error('Error updating Firebase Auth or resources:', error);
  }
});

// exports.deleteUser = functions.firestore
//     .document('users/{userId}')
//     .onDelete((snapshot, context) => {
//         const userId = context.params.userId;
//         return adminFirebase.auth().deleteUser(userId).then(() => {
//             console.log("Successfully deleted user from auth");
//         }).then(() => {
//             const bucket = adminFirebase.storage().bucket();
//             return bucket.deleteFiles({
//                 prefix: `users/${userId}`
//             });
//         });
//     });

exports.createOrganization = onDocumentCreated('organizations/{organizationId}', async (event) => {
  const snapshot = event.data;
  const organizationId = event.params.organizationId;
  const email = snapshot.data().email;
  const trust = snapshot.data().trust !== undefined ? snapshot.data().trust : false;

  try {
    // Añadir organizationId y trust al propio documento de organización
    await adminFirebase.firestore().doc(`organizations/${organizationId}`).set({ organizationId, trust }, { merge: true });
    logger.log(`Successfully added organizationId (${organizationId}) to new organization`);

    // Buscar usuarios con el mismo email y asignarles la organización
    const userQuerySnapshot = await adminFirebase.firestore().collection('users').where('email', '==', email).get();

    const updateUserPromises = userQuerySnapshot.docs.map((userDoc) => {
      return adminFirebase.firestore().collection('users').doc(userDoc.id).set({ organization: organizationId }, { merge: true })
        .then(() => {
          logger.log(`Successfully added organizationId to user (${userDoc.id})`);
        });
    });

    await Promise.all(updateUserPromises);
  } catch (error) {
    logger.error('Error creating organization or updating users:', error);
    throw new Error(`Function createOrganization failed: ${error.message}`);
  }
});

exports.updateOrganization = onDocumentUpdated('organizations/{organizationId}', async (event) => {
  const organizationId = event.params.organizationId;
  const beforeData = event.data?.before?.data();
  const afterData = event.data?.after?.data();

  if (!beforeData || !afterData) {
    console.error('Missing data in update trigger.');
    return;
  }

  const db = adminFirebase.firestore();

  try {
    // Actualiza el searchText de todos los recursos relacionados
    const resourcesSnapshot = await db.collection('resources')
      .where('organizer', '==', beforeData.organizationId)
      .get();

    for (const resource of resourcesSnapshot.docs) {
      await updateResourceSearchText(resource, resource.data().resourceId);
    }

    // Si se modifica el campo `trust`, propágalo a todos los recursos
    if (beforeData.trust !== afterData.trust) {
      const trust = afterData.trust;

      for (const resource of resourcesSnapshot.docs) {
        await db.doc(`resources/${resource.data().resourceId}`).set({ trust }, { merge: true });
        console.log(`Successfully updated trust for resource ${resource.data().resourceId}`);
      }
    }
  } catch (error) {
    console.error('Error updating resources after organization update:', error);
  }
});

// exports.deleteOrganization = functions.firestore
//     .document('organizations/{organizationId}')
//     .onDelete((snapshot, context) => {
//         const organizationId = context.params.organizationId;
//         return adminFirebase.firestore().collection('resources').where("organizer", "==", organizationId).get().then(
//             (snapshot) => {
//                 snapshot.forEach((resource) => {
//                     return adminFirebase.firestore().collection("resources").doc(resource.id).delete().then(function () {
//                         console.log("Resource successfully deleted!");
//                         return adminFirebase.firestore().collection("users").where("organization", "==", organizationId).get().then(
//                             (snapshot) => {
//                                 snapshot.forEach((user) => {
//                                     return adminFirebase.firestore().collection("users").doc(user.id).delete().then(function () {
//                                         return adminFirebase.auth().deleteUser(user.id).then(() => {
//                                             console.log("Successfully deleted user from auth");
//                                         }).then(() => {
//                                             const bucket = adminFirebase.storage().bucket();
//                                             return bucket.deleteFiles({
//                                                 prefix: `users/${user.id}`
//                                             });
//                                         });
//                                     })
//                                 })
//                             }
//                         )
//                     }).catch(function (error) {
//                         console.error("Error removing resource: ", error);
//                     });
//                 })
//             }
//         );
//     });

// exports.createCountry = functions.firestore
//     .document('countries/{countryId}')
//     .onCreate((snapshot, context) => {
//         const countryId = context.params.countryId;
//         //return adminFirebase.firestore().collection('resources').where("organizer", "==", countryId).get().then()
//         return adminFirebase.firestore().doc(`countries/${countryId}`).set({ countryId, active: true }, { merge: true })
//             .then(() => {
//                 console.log("Successfully added countryId to new country");
//             });
//     });

// exports.updateCountry = functions.firestore.document('countries/{countryId}')
//     .onUpdate(async (change, context) => {
//         const previousValue = change.before.data();

//         const resources = await adminFirebase.firestore().collection('resources').where("address.country", "==", previousValue.countryId).get();

//         for (const resource of resources.docs) {
//             await updateResourceSearchText(resource, resource.data().resourceId);
//         }

//         console.log('All resources searchText have been modified with the new country');
//         return;
//     });

// exports.deleteCountry = functions.firestore
//     .document('countries/{countryId}')
//     .onDelete((snapshot, context) => {
//         const countryId = context.params.countryId;
//         return adminFirebase.firestore().collection('provinces').where("countryId", "==", countryId).get()
//             .then((snapshot) => {
//                 snapshot.forEach((province) => {
//                     return adminFirebase.firestore().collection("provinces").doc(province.id).delete().then(function () {
//                         console.log("Associated province successfully deleted!");
//                     })
//                 })
//             });
//     });

// exports.createProvince = functions.firestore
//     .document('provinces/{provinceId}')
//     .onCreate((snapshot, context) => {
//         const provinceId = context.params.provinceId;
//         return adminFirebase.firestore().doc(`provinces/${provinceId}`).set({ provinceId, active: true }, { merge: true })
//             .then(() => {
//                 console.log("Successfully added provinceId to new province");
//             });
//     });


// exports.updateProvince = functions.firestore.document('provinces/{provinceId}')
//     .onUpdate(async (change, context) => {
//         const previousValue = change.before.data();

//         const resources = await adminFirebase.firestore().collection('resources').where("address.province", "==", previousValue.provinceId).get();

//         for (const resource of resources.docs) {
//             await updateResourceSearchText(resource, resource.data().resourceId);
//         }

//         console.log('All resources searchText have been modified with the new province');
//         return;
//     });


exports.deleteProvince = onDocumentDeleted('provinces/{provinceId}', async (event) => {
  const provinceId = event.params.provinceId;

  try {
    const citiesSnapshot = await adminFirebase.firestore()
      .collection('cities')
      .where("provinceId", "==", provinceId)
      .get();

    if (citiesSnapshot.empty) {
      console.log(`No cities found for province ${provinceId}`);
      return;
    }

    const deletions = [];

    citiesSnapshot.forEach(cityDoc => {
      deletions.push(
        adminFirebase.firestore().collection("cities").doc(cityDoc.id).delete().then(() => {
          console.log(`Deleted city with ID: ${cityDoc.id}`);
        })
      );
    });

    await Promise.all(deletions);
    console.log(`All cities associated with province ${provinceId} have been deleted.`);
  } catch (error) {
    console.error(`Error deleting cities for province ${provinceId}:`, error);
  }
});

// exports.createCity = functions.firestore
//     .document('cities/{cityId}')
//     .onCreate((snapshot, context) => {
//         const cityId = context.params.cityId;
//         return adminFirebase.firestore().doc(`cities/${cityId}`).set({ cityId, active: true }, { merge: true })
//             .then(() => {
//                 console.log("Successfully added cityId to new city");
//             });
//     });

// exports.updateCity = functions.firestore.document('cities/{cityId}')
//     .onUpdate(async (change, context) => {
//         const previousValue = change.before.data();

//         const resources = await adminFirebase.firestore().collection('resources').where("address.city", "==", previousValue.cityId).get();

//         for (const resource of resources.docs) {
//             await updateResourceSearchText(resource, resource.data().resourceId);
//         }

//         console.log('All resources searchText have been modified with the new city');
//         return;
//     });

// exports.createResource = functions.runWith(options).firestore
//     .document('resources/{resourceId}')
//     .onCreate(async (snapshot, context) => {
//         const resourceId = context.params.resourceId;
//         const doc = adminFirebase.firestore().doc(`resources/${resourceId}`);
//         const onlineUpdate = snapshot.data().modality !== 'Presencial' ? true : false;
//         const countryUpdate = (snapshot.data().address.country === undefined || snapshot.data().address.country === null) ? "undefined" : snapshot.data().address.country;
//         const provinceUpdate = (snapshot.data().address.province === undefined || snapshot.data().address.province === null) ? "undefined" : snapshot.data().address.province;
//         const cityUpdate = (snapshot.data().address.city === undefined || snapshot.data().address.city === null) ? "undefined" : snapshot.data().address.city;
//         const placeUpdate = snapshot.data().address.place;

//         adminFirebase.firestore().doc(`resources/${resourceId}`).set({ resourceLink: `https://enredawebapp.web.app/resources/${resourceId}` }, { merge: true });

//         await updateResourceSearchText(snapshot, resourceId);

//         //Si el creador del recurso es un mentor hay que mirar si el campo trust para ver si el recurso se puede mostrar o no
//         if (snapshot.data().organizerType === 'Mentor') {
//             return adminFirebase.firestore().collection('users').where("userId", "==", snapshot.data().organizer).get()
//                 .then((snapshot) => {
//                     snapshot.forEach((user) => {
//                         if (!user.data().trust) {
//                             return adminFirebase.firestore().doc(`resources/${resourceId}`).set({ resourceId }, { merge: true })
//                                 .then(() => {
//                                     console.log("Successfully added resourceId to new resource");
//                                     doc.update({
//                                         enable: true,
//                                         trust: false,
//                                         online: onlineUpdate,
//                                         status: 'Disponible',
//                                         address: {
//                                             place: placeUpdate,
//                                             country: countryUpdate,
//                                             province: provinceUpdate,
//                                             city: cityUpdate
//                                         },
//                                     });

//                                 })
//                         } else {
//                             return adminFirebase.firestore().doc(`resources/${resourceId}`).set({ resourceId }, { merge: true })
//                                 .then(() => {
//                                     console.log("Successfully added resourceId to new resource");
//                                     doc.update({
//                                         enable: true,
//                                         trust: true,
//                                         online: onlineUpdate,
//                                         status: 'Disponible',
//                                         address: {
//                                             place: placeUpdate,
//                                             country: countryUpdate,
//                                             province: provinceUpdate,
//                                             city: cityUpdate
//                                         },
//                                     });

//                                 })
//                         }
//                     })
//                 });
//             //Si el creador del recurso es una organization hay que mirar si el campo trust para ver si el recurso se puede mostrar o no
//         } else if (snapshot.data().organizerType === 'Organización') {
//             return adminFirebase.firestore().doc(`resources/${resourceId}`).set({ resourceId }, { merge: true })
//                 .then(() => {
//                     console.log("Successfully added resourceId to new resource");
//                     // Comprobamos si es un recurso creado de la SPEGC por web scrapping
//                     if (snapshot.data().organizer === 'btTAIYUkGSgqlEAnaZJB') {
//                         doc.update({
//                             end: adminFirebase.firestore.Timestamp.now(),
//                             start: adminFirebase.firestore.Timestamp.now(),
//                             lastupdate: adminFirebase.firestore.Timestamp.now(),
//                             createdate: adminFirebase.firestore.Timestamp.now(),
//                             maximumDate: adminFirebase.firestore.Timestamp.now(),
//                             trust: true
//                         });
//                     } else {
//                         return adminFirebase.firestore().collection('organizations').where("organizationId", "==", snapshot.data().organizer).get()
//                             .then((snapshot) => {
//                                 snapshot.forEach((organization) => {
//                                     if (!organization.data().trust) {
//                                         doc.update({
//                                             enable: true,
//                                             trust: false,
//                                             online: onlineUpdate,
//                                             status: 'Disponible',
//                                             address: {
//                                                 place: placeUpdate,
//                                                 country: countryUpdate,
//                                                 province: provinceUpdate,
//                                                 city: cityUpdate
//                                             },
//                                         });
//                                     } else {
//                                         doc.update({
//                                             enable: true,
//                                             trust: true,
//                                             online: onlineUpdate,
//                                             status: 'Disponible',
//                                             address: {
//                                                 place: placeUpdate,
//                                                 country: countryUpdate,
//                                                 province: provinceUpdate,
//                                                 city: cityUpdate
//                                             },
//                                         });
//                                     }
//                                 })
//                             });
//                     }
//                 }
//                 )
//             //Si el creador del recurso es una organization hay que mirar si el campo trust para ver si el recurso se puede mostrar o no
//         } else if (snapshot.data().organizerType === 'Entidad Social') {
//             return adminFirebase.firestore().doc(`resources/${resourceId}`).set({ resourceId }, { merge: true })
//                 .then(() => {
//                     console.log("Successfully added resourceId to new resource");
//                     // Comprobamos si es un recurso creado de la SPEGC por web scrapping
//                     if (snapshot.data().organizer === 'btTAIYUkGSgqlEAnaZJB') {
//                         doc.update({
//                             end: adminFirebase.firestore.Timestamp.now(),
//                             start: adminFirebase.firestore.Timestamp.now(),
//                             lastupdate: adminFirebase.firestore.Timestamp.now(),
//                             createdate: adminFirebase.firestore.Timestamp.now(),
//                             maximumDate: adminFirebase.firestore.Timestamp.now(),
//                             trust: true
//                         });
//                     } else {
//                         return adminFirebase.firestore().collection('socialEntities').where("socialEntityId", "==", snapshot.data().organizer).get()
//                             .then((snapshot) => {
//                                 snapshot.forEach((organization) => {
//                                     if (!organization.data().trust) {
//                                         doc.update({
//                                             enable: true,
//                                             trust: false,
//                                             online: onlineUpdate,
//                                             status: 'Disponible',
//                                             address: {
//                                                 place: placeUpdate,
//                                                 country: countryUpdate,
//                                                 province: provinceUpdate,
//                                                 city: cityUpdate
//                                             },
//                                         });
//                                     } else {
//                                         doc.update({
//                                             enable: true,
//                                             trust: true,
//                                             online: onlineUpdate,
//                                             status: 'Disponible',
//                                             address: {
//                                                 place: placeUpdate,
//                                                 country: countryUpdate,
//                                                 province: provinceUpdate,
//                                                 city: cityUpdate
//                                             },
//                                         });
//                                     }
//                                 })
//                             });
//                     }
//                 }
//                 )
//         } else if (snapshot.data().organizerType === 'Empresa') {
//             return adminFirebase.firestore().doc(`resources/${resourceId}`).set({ resourceId }, { merge: true })
//                 .then(() => {
//                     console.log("Added new company resource");
//                     return adminFirebase.firestore().collection('companies').where("companyId", "==", snapshot.data().organizer).get()
//                             .then((snapshot) => {
//                                 snapshot.forEach((organization) => {
//                                     if (!organization.data().trust) {
//                                         doc.update({
//                                             enable: false,
//                                             trust: false,
//                                         });
//                                     } else {
//                                         doc.update({
//                                             enable: true,
//                                             trust: true,
//                                         });
//                                     }
//                                 })
//                             });
//                 }
//                 )
//         } else {
//             return adminFirebase.firestore().doc(`resources/${resourceId}`).set({ resourceId }, { merge: true })
//                 .then(() => {
//                     console.log("Successfully added resourceId to new resource");
//                     const doc = adminFirebase.firestore().doc(`resources/${resourceId}`);
//                     doc.update({
//                         enable: true,
//                         trust: true,
//                         online: onlineUpdate,
//                         status: 'Disponible',
//                         country: countryUpdate,
//                         province: provinceUpdate,
//                         city: cityUpdate
//                     });
//                 })
//         }

//     });

exports.createJobOffer = onDocumentCreated('jobOffers/{jobOfferId}', async (event) => {
    const jobOfferId = event.params.jobOfferId;
  
    try {
      await adminFirebase.firestore()
        .doc(`jobOffers/${jobOfferId}`)
        .set({ jobOfferId }, { merge: true });
  
      console.log("Successfully added jobOfferId to new jobOffer");
    } catch (error) {
      console.error("Error adding jobOfferId to new jobOffer:", error);
    }
  });

exports.storage = onObjectFinalized(
    {
      region: 'europe-west1',
    },
    async (event) => {
    const object = event.data;
  
    if (!object || !object.name || !object.bucket) {
      logger.error('❌ No object data available in event.');
      return;
    }
  
    const bucket = object.bucket;
    const pathToFile = object.name;
    const downloadToken = object.metadata?.firebaseStorageDownloadTokens;
  
    if (!downloadToken) {
      logger.warn(`⚠ No download token found for file: ${pathToFile}`);
      return;
    }
  
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(
      pathToFile
    )}?alt=media&token=${downloadToken}`;
  
    const path = pathToFile.substring(0, pathToFile.lastIndexOf('/'));
    const pathToCollection = pathToFile.substring(0, pathToFile.indexOf('/'));
  
    const resourcePhoto = { src: url };
    const logoPic = { src: url };
    const profilePic = { src: url };
  
    if (pathToCollection === 'resourcesPictures') {
      await adminFirebase.firestore().doc(path).set({ resourcePhoto }, { merge: true });
      logger.info('✔ Resource photo successfully updated');
    } else if (pathToCollection === 'organizations') {
      await adminFirebase.firestore().doc(path).set({ logoPic }, { merge: true });
      logger.info('✔ Organization logo successfully updated');
    } else if (pathToCollection === 'users') {
      await adminFirebase.firestore().doc(path).set({ profilePic }, { merge: true });
      logger.info('✔ User profile picture successfully updated');
    } else {
      logger.warn(`⚠ No matching collection found for: ${pathToCollection}`);
    }
  });

  exports.deleteResourcePicture = onDocumentDeleted('resourcesPictures/{resourcePictureId}', async (event) => {
    try {
      const snapshot = event.data;
      if (!snapshot) {
        console.log("No snapshot data found on deletion event.");
        return;
      }
  
      const deletedData = snapshot.data();
      const resourcePictureId = deletedData?.id;
  
      if (!resourcePictureId) {
        console.log("No resourcePictureId found in deleted document data.");
        return;
      }
  
      // Obtener el bucket de Firebase Storage
      const bucket = adminFirebase.storage().bucket();
  
      // Eliminar todos los archivos con el prefijo del recurso
      await bucket.deleteFiles({
        prefix: `resourcesPictures/${resourcePictureId}`
      });
  
      console.log(`Successfully deleted files with prefix resourcesPictures/${resourcePictureId}`);
    } catch (error) {
      console.error("Error deleting resource picture files:", error);
    }
  });

// exports.createResourceType = functions.firestore
//     .document('resourcesTypes/{resourceTypeId}')
//     .onCreate((snapshot, context) => {
//         const resourceTypeId = context.params.resourceTypeId;
//         return adminFirebase.firestore().doc(`resourcesTypes/${resourceTypeId}`).set({ resourceTypeId }, { merge: true })
//             .then(() => {
//                 console.log("Successfully added resourceTypeId to new resourceType");
//             });
//     });

// exports.checkResourceDate = functions.pubsub.topic('checkResourceDate').onPublish((message, context) => {
//     return adminFirebase.firestore().collection('resources').get().then((snapshot) => {
//         snapshot.forEach((resource) => {
//             const data = resource.data();
//             const now = adminFirebase.firestore.Timestamp.now().toMillis();
//             const endMillis = data.end.toMillis();
//             const maximumDateMillis = data.maximumDate.toMillis();
//             if (data.end && data.maximumDate && endMillis && maximumDateMillis) {
//                 if (endMillis <= now || maximumDateMillis <= now) {
//                     if (data.status !== 'A actualizar' && data.status !== 'edition') {
//                         const doc = adminFirebase.firestore().doc(`resources/${data.resourceId}`);
//                         doc.update({
//                             enable: false,
//                             status: 'No disponible'
//                         }).then(() => {
//                             console.log(`Document ${data.resourceId} successfully updated`);
//                         }).catch((error) => {
//                             console.error(`Error updating document ${data.resourceId}:`, error);
//                         });
//                     }
//                 }
//             }
//         });
//     });
// });

exports.updateResource = onDocumentUpdated('resources/{resourceId}', async (event) => {
  const resourceId = event.params.resourceId;
  const newValue = event.data?.after?.data();
  const previousValue = event.data?.before?.data();
  if (!newValue || !previousValue) return;

  await updateResourceSearchText(event.data.after, resourceId);

  const resourceType = newValue.resourceType;

  if (newValue.status === 'Disponible' && previousValue.status === 'A actualizar') {
    const title = newValue.title;
    const interests = Object.values(newValue.interests);

    const payload = {
      notification: {
        title: 'Enreda',
        body: `Nuevo recurso: ${title}`,
      },
      data: {
        resourceId,
        click_action: "FLUTTER_NOTIFICATION_CLICK",
        title: 'Enreda',
        body: `Nuevos recursos basados en tus intereses`
      }
    };

    const options = {
      priority: "high",
      timeToLive: 60 * 60 * 24
    };

    const userSnap = await adminFirebase.firestore().collection('users').get();

    const sendToUser = async (user) => {
      const uid = user.get('userId');
      if (user.get('role') !== 'Desempleado') return;

      const abilities = user.get('motivation')?.abilities || [];
      const userInterests = user.get('interests')?.interests || [];

      const send = () => adminFirebase.messaging().sendToTopic(uid, payload, options);

      switch (resourceType) {
        case 'iGkqdz7uiWuXAFz1O8PY': return send(); // Ocio
        case 'GOw01m2HPro4I8xd6rSj': if (abilities.includes('kv0ZGalD2ViPdTx0BMm6')) return send(); break;
        case 'PPX3Ufeg9YfzH4YA0SkU': if (abilities.includes('5X4lcOCqMTAZ4UwQLl03')) return send(); break;
        case 'lUubulxiAGo4llxFJrkl': if (abilities.includes('3ywxTQBRJ6wzgMiVx9GE')) return send(); break;
        case 'MvCHSFzASskxlkBzPElb': if (abilities.includes('RrBucTiz917syI4jyJKz')) return send(); break;
        case '4l9BLhP7cwXohUvQzMOT': if (abilities.includes('0m7igV4HhWcXwWabBKK5')) return send(); break;
        case 'N9KdlBYmxUp82gOv8oJC': if (abilities.includes('nMWfKP0yOqQf8Zv4A3n6')) return send(); break;
        default:
          if (interests.some(i => userInterests.includes(i))) return send();
      }
    };

    await Promise.all(userSnap.docs.map(sendToUser));
  }

  if (newValue.modality !== previousValue.modality) {
    const onlineUpdate = newValue.modality !== 'Presencial';
    const { country, province, city, place } = newValue.address || {};
    await adminFirebase.firestore().doc(`resources/${resourceId}`).update({
      online: onlineUpdate,
      address: {
        place,
        country: country ?? "undefined",
        province: province ?? "undefined",
        city: city ?? "undefined"
      }
    });
  }

  if (newValue.maximumDate !== previousValue.maximumDate) {
    const now = adminFirebase.firestore.Timestamp.now().toMillis();
    const maxDate = newValue.maximumDate.toMillis();
    if (!newValue.notExpire && maxDate <= now) {
      if (!['A actualizar', 'Completo', 'edition'].includes(newValue.status)) {
        await adminFirebase.firestore().doc(`resources/${resourceId}`).update({
          enable: false,
          status: 'No disponible'
        });
      }
    } else {
      if (!['A actualizar', 'Completo', 'edition'].includes(newValue.status)) {
        await adminFirebase.firestore().doc(`resources/${resourceId}`).update({
          enable: true,
          status: 'Disponible'
        });
      }
    }
  }

  if (newValue.capacity !== previousValue.capacity) {
    if (previousValue.assistants <= newValue.capacity) {
      await adminFirebase.firestore().doc(`resources/${resourceId}`).set({ capacity: newValue.capacity }, { merge: true });
      if (previousValue.assistants === newValue.capacity) {
        await adminFirebase.firestore().doc(`resources/${resourceId}`).set({ status: 'Completo' }, { merge: true });
      }
    } else {
      await adminFirebase.firestore().doc(`resources/${resourceId}`).set({ capacity: previousValue.capacity }, { merge: true });
    }
  }

  if (newValue.assistants !== previousValue.assistants) {
    const status = newValue.assistants === newValue.capacity ? 'Completo' : previousValue.status;
    await adminFirebase.firestore().doc(`resources/${resourceId}`).update({
      assistants: newValue.participants?.length?.toString() ?? '0',
      status
    });
  }

  if (newValue.participants !== previousValue.participants && newValue.participantsString === previousValue.participantsString) {
    logger.log("Actualización desde app móvil detectada");
    let difference, adding;
    if (previousValue.participants.length > newValue.participants.length) {
      difference = previousValue.participants.filter(x => !newValue.participants.includes(x));
      adding = false;
    } else {
      difference = newValue.participants.filter(x => !previousValue.participants.includes(x));
      adding = true;
    }
    const participant = difference[0];
    if (participant) {
      await adminFirebase.firestore().doc(`resources/${resourceId}`).set({ participantsString: newValue.participants.join() }, { merge: true });
      const snapshot = await adminFirebase.firestore().collection('users').where('userId', '==', participant).get();
      const promises = snapshot.docs.map(user => {
        let resources = user.get('resources') || [];
        if (adding) resources.push(resourceId);
        else resources = resources.filter(r => r !== resourceId);
        return adminFirebase.firestore().doc(`users/${participant}`).set({
          resources,
          resourcesString: resources.join()
        }, { merge: true });
      });
      await Promise.all(promises);
    }
  }

  if (newValue.invitationsList !== previousValue.invitationsList) {
    const getName = async (collection, id) => {
      if (id) {
        const doc = await adminFirebase.firestore().collection(collection).doc(id).get();
        return doc.data()?.name || '';
      }
      return '';
    };

    const [country, province, city, category] = await Promise.all([
      getName('countries', newValue.address?.country),
      getName('provinces', newValue.address?.province),
      getName('cities', newValue.address?.city),
      getName('resourcesCategories', newValue.resourceCategory)
    ]);

    const description = `${category} en ${city}, ${province}, ${country}`;
    const title = newValue.title;

    const sendPromises = [...new Set(newValue.invitationsList)].map(email => {
      return adminFirebase.firestore().collection('mail').add({
        to: email,
        message: {
          subject: `${title} ¡Este recurso podría interesarte!`,
          html: resourceInvitationTemplate(title, resourceId, description),
        }
      }).then(() => logger.log(`Email enviado a ${email}`))
        .catch(err => logger.error(`Error enviando a ${email}`, err));
    });
    await Promise.all(sendPromises);
  }
});

// exports.createAbility = functions.firestore
//     .document('abilities/{abilityId}')
//     .onCreate((snapshot, context) => {
//         const abilityId = context.params.abilityId;
//         return adminFirebase.firestore().doc(`abilities/${abilityId}`).set({ abilityId }, { merge: true })
//             .then(() => {
//                 console.log("Successfully added abilityId to new ability");
//             });
//     });

// exports.createInterest = functions.firestore
//     .document('interests/{interestId}')
//     .onCreate((snapshot, context) => {
//         const interestId = context.params.interestId;
//         return adminFirebase.firestore().doc(`interests/${interestId}`).set({ interestId }, { merge: true })
//             .then(() => {
//                 console.log("Successfully added interestId to new interest");
//             });
//     });

// exports.createSpecificInterest = functions.firestore
//     .document('specificInterests/{specificInterestId}')
//     .onCreate((snapshot, context) => {
//         const specificInterestId = context.params.specificInterestId;
//         return adminFirebase.firestore().doc(`specificInterests/${specificInterestId}`).set({ specificInterestId }, { merge: true })
//             .then(() => {
//                 console.log("Successfully added specificInterestId to new specificInterest");
//             });
//     });

exports.createJobOfferApplication = onDocumentCreated(
  {
    document: "jobOfferApplications/{jobOfferApplicationId}",
    memory: "256MiB",
  },
  async (event) => {
    const jobOfferApplicationId = event.params.jobOfferApplicationId;

    try {
      await db
        .doc(`jobOfferApplications/${jobOfferApplicationId}`)
        .set({ jobOfferApplicationId }, { merge: true });

      console.log(
        `✅ JobOfferApplicationId ${jobOfferApplicationId} añadido correctamente.`
      );
    } catch (error) {
      console.error(
        `❌ Error al añadir jobOfferApplicationId ${jobOfferApplicationId}:`,
        error
      );
      throw new Error("Firestore write failed.");
    }
  }
);
exports.sendEmailActiveUsers = onDocumentUpdated('users/{userId}', async (event) => {
  const userId = event.params.userId;

  const before = event.data?.before?.data();
  const after = event.data?.after?.data();

  if (
    before &&
    after &&
    !before.active &&
    after.active &&
    after.address?.country === 'WMHqCzqISX6KNVs9b3iN' &&
    after.role !== 'Desempleado'
  ) {
    try {
      const htmlToSend = createWelcomeToUserTemplate(
        after.firstName,
        after.email.trim().toLowerCase(),
        'enreda_' + userId.slice(-3)
      );

      await adminFirebase.firestore().collection('mail').add({
        to: after.email,
        message: {
          subject: 'Equipo Enreda',
          html: htmlToSend,
        }
      });

      console.log("Successfully sent welcome email to active user.");
    } catch (error) {
      console.error("Error sending welcome email:", error);
    }
  }
});

// exports.sendEmailNewUsers = functions.firestore
//     .document('users/{userId}')
//     .onCreate((snapshot, context) => {
//         const userId = context.params.userId;
//         const role = snapshot.get('role');
//         const phone = snapshot.get('phone');
//         const address = snapshot.get('address');
//         const country = address.country;
//         let active = snapshot.get('active')
//         //Controlamos inactivos en Peru
//         if (active === undefined) {
//             if (country === 'WMHqCzqISX6KNVs9b3iN' && role !== 'Desempleado') {
//                 active = false
//             } else {
//                 active = true
//             }
//         }
//         let htmlToSendToNewUser = (active) ? createWelcomeToUserTemplate(snapshot.get('firstName'), snapshot.get('email').trim().toLowerCase(), 'enreda_' + userId.slice(-3)) : createWelcomeToInactiveUserTemplate(snapshot.get('firstName'));
//         return adminFirebase.firestore().collection('mail').add({
//             to: snapshot.get('email'),
//             message: {
//                 subject: 'Equipo Enreda',
//                 html: htmlToSendToNewUser,
//             }
//         }).then(() => {
//             return adminFirebase.firestore().collection('mail').add({
//                 to: 'escuchamos@enredas.org',
//                 message: {
//                     subject: 'Tenemos un nuevo integrante',
//                     html:
//                         createWelcomeToEnredaTemplate(snapshot.get('firstName'),
//                             snapshot.get('email'), snapshot.get('role')),
//                 }
//             }).then(() => console.log('Queued email for delivery!'));
//         });
//     });

function createWelcomeToUserTemplate(name, email, password) {
    const contactToUserTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="es">
 <head>
  <meta charset="UTF-8">
  <meta content="width=device-width, initial-scale=1" name="viewport">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta content="telephone=no" name="format-detection">
  <title>nuevo email</title><!--[if (mso 16)]>
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
a { color: inherit; }     
@media only screen and (max-width:600px) {p, ul li, ol li, a { line-height:150%!important } h1, h2, h3, h1 a, h2 a, h3 a { line-height:120% } h1 { font-size:36px!important; text-align:left } h2 { font-size:26px!important; text-align:left } h3 { font-size:20px!important; text-align:left } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size:36px!important; text-align:left } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size:26px!important; text-align:left } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size:20px!important; text-align:left } .es-menu td a { font-size:12px!important } .es-header-body p, .es-header-body ul li, .es-header-body ol li, .es-header-body a { font-size:14px!important } .es-content-body p, .es-content-body ul li, .es-content-body ol li, .es-content-body a { font-size:16px!important } .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size:14px!important } .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size:12px!important } *[class="gmail-fix"] { display:none!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align:right!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-button-border { display:inline-block!important } a.es-button, button.es-button { font-size:20px!important; display:inline-block!important } .es-adaptive table, .es-left, .es-right { width:100%!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .es-adapt-td { display:block!important; width:100%!important } .adapt-img { width:100%!important; height:auto!important } .es-m-p0 { padding:0!important } .es-m-p0r { padding-right:0!important } .es-m-p0l { padding-left:0!important } .es-m-p0t { padding-top:0!important } .es-m-p0b { padding-bottom:0!important } .es-m-p20b { padding-bottom:20px!important } .es-mobile-hidden, .es-hidden { display:none!important } tr.es-desk-hidden, td.es-desk-hidden, table.es-desk-hidden { width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } tr.es-desk-hidden { display:table-row!important } table.es-desk-hidden { display:table!important } td.es-desk-menu-hidden { display:table-cell!important } .es-menu td { width:1%!important } table.es-table-not-adapt, .esd-block-html table { width:auto!important } table.es-social { display:inline-block!important } table.es-social td { display:inline-block!important } .es-m-p5 { padding:5px!important } .es-m-p5t { padding-top:5px!important } .es-m-p5b { padding-bottom:5px!important } .es-m-p5r { padding-right:5px!important } .es-m-p5l { padding-left:5px!important } .es-m-p10 { padding:10px!important } .es-m-p10t { padding-top:10px!important } .es-m-p10b { padding-bottom:10px!important } .es-m-p10r { padding-right:10px!important } .es-m-p10l { padding-left:10px!important } .es-m-p15 { padding:15px!important } .es-m-p15t { padding-top:15px!important } .es-m-p15b { padding-bottom:15px!important } .es-m-p15r { padding-right:15px!important } .es-m-p15l { padding-left:15px!important } .es-m-p20 { padding:20px!important } .es-m-p20t { padding-top:20px!important } .es-m-p20r { padding-right:20px!important } .es-m-p20l { padding-left:20px!important } .es-m-p25 { padding:25px!important } .es-m-p25t { padding-top:25px!important } .es-m-p25b { padding-bottom:25px!important } .es-m-p25r { padding-right:25px!important } .es-m-p25l { padding-left:25px!important } .es-m-p30 { padding:30px!important } .es-m-p30t { padding-top:30px!important } .es-m-p30b { padding-bottom:30px!important } .es-m-p30r { padding-right:30px!important } .es-m-p30l { padding-left:30px!important } .es-m-p35 { padding:35px!important } .es-m-p35t { padding-top:35px!important } .es-m-p35b { padding-bottom:35px!important } .es-m-p35r { padding-right:35px!important } .es-m-p35l { padding-left:35px!important } .es-m-p40 { padding:40px!important } .es-m-p40t { padding-top:40px!important } .es-m-p40b { padding-bottom:40px!important } .es-m-p40r { padding-right:40px!important } .es-m-p40l { padding-left:40px!important } .es-desk-hidden { display:table-row!important; width:auto!important; overflow:visible!important; max-height:inherit!important } .h-auto { height:auto!important } }
@media screen and (max-width:384px) {.mail-message-content { width:414px!important } }
</style>
 </head>
 <body style="width:100%;font-family:arial, 'helvetica neue', helvetica, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
  <div dir="ltr" class="es-wrapper-color" lang="es" style="background-color:#FAFAFA"><!--[if gte mso 9]>
			<v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
				<v:fill type="tile" color="#fafafa"></v:fill>
			</v:background>
		<![endif]-->
   <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#FAFAFA">
     <tr>
      <td valign="top" style="padding:0;Margin:0">
       <table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
         <tr>
          <td align="center" style="padding:0;Margin:0">
           <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
             <tr>
              <td align="left" bgcolor="#054D5E" style="padding:0;Margin:0;background-color:#054d5e;border-radius:20px">
               <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                 <tr>
                  <td align="center" valign="top" style="padding:0;Margin:0;width:600px">
                   <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:separate;border-spacing:0px;border-radius:25px" role="presentation">
                     <tr class="es-visible-simple-html-only">
                      <td align="center" style="padding:0;Margin:0;padding-top:25px;font-size:0px"><img class="adapt-img" src="https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/images%2Fmailing-bienvenida.png?alt=media&amp;token=4e53355c-52bd-4ef1-895c-a85fd56bcadd" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="600"></td>
                     </tr>
                     <tr>
                      <td align="center" class="es-m-txt-c" style="padding:0;Margin:0;padding-bottom:25px;padding-top:35px"><h1 style="Margin:0;line-height:36px;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:30px;font-style:normal;font-weight:bold;color:#ffffff"><strong>¡Hola ${name}!</strong></h1></td>
                     </tr>
                     <tr>
                      <td align="left" style="Margin:0;padding-top:10px;padding-bottom:40px;padding-left:40px;padding-right:40px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px">Te informamos de que te has registrado exitosamente en el programa Enreda.</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px"><br>Debes acceder con tu email <a>${email}</a></p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px">Además hemos establecido para ti la contraseña por defecto: ${password}</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px"><br></p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px">Una vez que inicies sesión, te recomendamos que la cambies.</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px"><br></p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px">Gracias.</p></td>
                     </tr>
                     <tr>
                      <td align="center" style="padding:25px;Margin:0"><span class="es-button-border" style="border-style:solid;border-color:#18c5c1;background:#18c5c1;border-width:2px;display:inline-block;border-radius:25px;width:auto"><a href="https://enredawebapp.web.app/" class="es-button es-button-1719310999593" target="_blank" style="mso-style-priority:100 !important;text-decoration:none;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;color:#FFFFFF;font-size:18px;padding:10px 30px;display:inline-block;background:#18c5c1;border-radius:25px;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-weight:normal;font-style:normal;line-height:22px;width:auto;text-align:center;mso-padding-alt:0;mso-border-alt:10px solid #18c5c1">Ir a Enreda</a></span></td>
                     </tr>
                     <tr>
                      <td align="center" style="padding:0;Margin:0;padding-bottom:25px;padding-left:40px;padding-right:40px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:18px;color:#ffffff;font-size:12px">El equipo de Enreda</p></td>
                     </tr>
                   </table></td>
                 </tr>
               </table></td>
             </tr>
           </table></td>
         </tr>
       </table>
       <table cellpadding="0" cellspacing="0" class="es-footer" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top">
         <tr>
          <td align="center" style="padding:0;Margin:0">
           <table class="es-footer-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px" role="none">
             <tr>
              <td align="left" style="padding:20px;Margin:0">
               <table cellspacing="0" cellpadding="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                 <tr>
                  <td align="center" style="padding:0;Margin:0;width:560px">
                   <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                     <tr>
                      <td class="es-m-p0l" align="center" style="padding:0;Margin:0;font-size:0px"><img src="https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/images%2Flogo-s4c-sec.png?alt=media&amp;token=2e09f421-62dd-4381-af4f-ec7ef95f2b55" alt width="98" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></td>
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



// function createWelcomeToInactiveUserTemplate(name) {
//     const contactToUserTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD
//     XHTML 1.0 Strict//EN"
//     "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"> <html
//     data-editor-version="2" class="sg-campaigns"
//     xmlns="http://www.w3.org/1999/xhtml">     <head>       <meta
//     http-equiv="Content-Type" content="text/html; charset=utf-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1,
//     minimum-scale=1, maximum-scale=1">       <!--[if !mso]><!-->       <meta
//     http-equiv="X-UA-Compatible" content="IE=Edge">       <!--<![endif]-->
//          <!--[if (gte mso 9)|(IE)]>       <xml>
//     <o:OfficeDocumentSettings>           <o:AllowPNG/>
//     <o:PixelsPerInch>96</o:PixelsPerInch>
//     </o:OfficeDocumentSettings>       </xml>       <![endif]-->
//     <!--[if (gte mso 9)|(IE)]>   <style type="text/css">     body {width:
//     600px;margin: 0 auto;}     table {border-collapse: collapse;}     table,
//     td {mso-table-lspace: 0pt;mso-table-rspace: 0pt;}     img
//     {-ms-interpolation-mode: bicubic;}   </style> <![endif]-->       <style
//     type="text/css">     body, p, div {       font-family:
//     verdana,geneva,sans-serif;       font-size: 16px;     }     body {
//     color: #516775;     }     body a {       color: #993300;
//     text-decoration: none;     }     p { margin: 0; padding: 0; }
//     table.wrapper {       width:100% !important;       table-layout: fixed;
//           -webkit-font-smoothing: antialiased;
//     -webkit-text-size-adjust: 100%;       -moz-text-size-adjust: 100%;
//     -ms-text-size-adjust: 100%;     }     img.max-width {       max-width:
//     100% !important;     }     .column.of-2 {       width: 50%;     }
//     .column.of-3 {       width: 33.333%;     }     .column.of-4 {
//     width: 25%;     }     @media screen and (max-width:480px) {
//     .preheader .rightColumnContent,       .footer .rightColumnContent {
//         text-align: left !important;       }       .preheader
//     .rightColumnContent div,       .preheader .rightColumnContent span,
//       .footer .rightColumnContent div,       .footer .rightColumnContent span
//     {         text-align: left !important;       }       .preheader
//     .rightColumnContent,       .preheader .leftColumnContent {
//     font-size: 80% !important;         padding: 5px 0;       }
//     table.wrapper-mobile {         width: 100% !important;
//     table-layout: fixed;       }       img.max-width {         height: auto
//     !important;         max-width: 100% !important;       }
//     a.bulletproof-button {         display: block !important;         width:
//     auto !important;         font-size: 80%;         padding-left: 0
//     !important;         padding-right: 0 !important;       }       .columns
//     {         width: 100% !important;       }       .column {
//     display: block !important;         width: 100% !important;
//     padding-left: 0 !important;         padding-right: 0 !important;
//     margin-left: 0 !important;         margin-right: 0 !important;       }
//          .social-icon-column {         display: inline-block !important;
//       }     }   </style>       <!--user entered Head Start-->       <!--End
//     Head user entered-->     </head>     <body>       <center
//     class="wrapper" data-link-color="#993300"
//     data-body-style="font-size:16px; font-family:verdana,geneva,sans-serif;
//     color:#516775; background-color:#F9F5F2;">         <div class="webkit">
//               <table cellpadding="0" cellspacing="0" border="0" width="100%"
//     class="wrapper" bgcolor="#F9F5F2">             <tr>               <td
//     valign="top" bgcolor="#F9F5F2" width="100%">                 <table
//     width="100%" role="content-container" class="outer" align="center"
//     cellpadding="0" cellspacing="0" border="0">                   <tr>
//                    <td width="100%">                       <table
//     width="100%" cellpadding="0" cellspacing="0" border="0">
//              <tr>                           <td>
//     <!--[if mso]>     <center>     <table><tr><td width="600">
//     <![endif]-->                                     <table width="100%"
//     cellpadding="0" cellspacing="0" border="0" style="width:100%;
//     max-width:600px;" align="center">
//     <tr>                                         <td
//     role="modules-container" style="padding:0px 0px 0px 0px; color:#516775;
//     text-align:left;" bgcolor="#F9F5F2" width="100%" align="left"><table
//     class="module preheader preheader-hide" role="module"
//     data-type="preheader" border="0" cellpadding="0" cellspacing="0"
//     width="100%" style="display: none !important; mso-hide: all; visibility:
//     hidden; opacity: 0; color: transparent; height: 0; width: 0;">     <tr>
//           <td role="module-content">         <p></p>       </td>     </tr>
//     </table><table class="module" role="module" data-type="spacer"
//     border="0" cellpadding="0" cellspacing="0" width="100%"
//     style="table-layout: fixed;" data-muid="bdzDb4B4pnnez4W7L1KpxJ">
//     <tbody><tr>         <td style="padding:0px 0px 30px 0px;"
//     role="module-content" bgcolor="">         </td>       </tr>
//     </tbody></table><table class="wrapper" role="module" data-type="image"
//     border="0" cellpadding="0" cellspacing="0" width="100%"
//     style="table-layout: fixed;" data-muid="bKZJcGfRPJb7R2nzyp6ZB6">
//     <tbody><tr>         <td style="font-size:6px; line-height:10px;
//     padding:0px 0px 0px 0px;" valign="top" align="center">           <img
//     class="max-width" border="0" style="display:block; color:#000000;
//     text-decoration:none; font-family:Helvetica, arial, sans-serif;
//     font-size:16px; max-width:100% !important; width:100%; height:auto
//     !important;"
//     src="http://cdn.mcauto-images-production.sendgrid.net/c2af2ef38a422013/f122e378-4bec-41c0-9b33-a9525ee1efea/2048x1366.jpg"
//     alt="" width="600" data-responsive="true"
//     data-proportionally-constrained="false">         </td>       </tr>
//     </tbody></table><table class="module" role="module" data-type="text"
//     border="0" cellpadding="0" cellspacing="0" width="100%"
//     style="table-layout: fixed;" data-muid="gNWHzBzkFeWH4JDKd2Aikk"
//     data-mc-module-version="2019-10-22">       <tbody><tr>         <td
//     style="background-color:#ffffff; padding:50px 0px 10px 0px;
//     line-height:30px; text-align:inherit;" height="100%" valign="top"
//     bgcolor="#ffffff"><div><div style="font-family: inherit; text-align:
//     center"><span style="color: #516775; font-size: 28px; font-family:
//     georgia, serif"><strong>Hola
//     ${name}!</strong></span></div><div></div></div></td>       </tr>
//     </tbody></table><table class="module" role="module" data-type="text"
//     border="0" cellpadding="0" cellspacing="0" width="100%"
//     style="table-layout: fixed;" data-muid="bA2FfEE6abadx6yKoMr3F9"
//     data-mc-module-version="2019-10-22">       <tbody><tr>         <td
//     style="background-color:#ffffff; padding:10px 40px 50px 40px;
//     line-height:22px; text-align:inherit;" height="100%" valign="top"
//     bgcolor="#ffffff"><div><div style="font-family: inherit; text-align:
//     center"><span style="font-family: verdana, geneva, sans-serif">Te
//     informamos de que te has registrado exitosamente en el programa
//     enREDa.&nbsp;</span></div> <div style="font-family: inherit; text-align:
//     center">Vamos a proceder a validar tus datos. En breve nos pondremos en
//     contacto contigo y podrás acceder a la plataforma enREDA.</div> <div style="font-family:
//     inherit; text-align: center">Gracias.</div><div></div></div></td>
//     </tr>     </tbody></table><table border="0" cellpadding="0"
//     cellspacing="0" class="module" data-role="module-button"
//     data-type="button" role="module" style="table-layout:fixed" width="100%"
//     data-muid="bKHWQMgPkL5opYCkxiM6aS"><tbody><tr><td align="center"
//     class="outer-td" style="padding:20px 0px 0px 0px;" bgcolor=""><table
//     border="0" cellpadding="0" cellspacing="0"
//     class="button-css__deep-table___2OZyb wrapper-mobile"
//     style="text-align:center"><tbody><tr><td align="center"
//     bgcolor="#993300" class="inner-td" style="border-radius:6px;
//     font-size:16px; text-align:center; background-color:inherit;"></td></tr></tbody></table></td></tr></tbody></table><table
//     class="module" role="module" data-type="text" border="0" cellpadding="0"
//     cellspacing="0" width="100%" style="table-layout: fixed;"
//     data-muid="d21b8641-6eaf-4354-9938-61022423da11">     <tbody>       <tr>
//              <td style="padding:18px 0px 18px 0px; line-height:22px;
//     text-align:inherit;" height="100%" valign="top" bgcolor=""
//     role="module-content"><div><div style="font-family: inherit; text-align:
//     center"><a 'href=https://www.enredaempleo.org'><span style="font-size:
//     12px">El equipo de Enreda</span></a></div><div></div></div></td>
//     </tr>     </tbody>   </table><table class="module" role="module"
//     data-type="spacer" border="0" cellpadding="0" cellspacing="0"
//     width="100%" style="table-layout: fixed;"
//     data-muid="qkfYAswHNSwNpwb1p7m4gC">       <tbody><tr>         <td
//     style="padding:0px 0px 30px 0px;" role="module-content" bgcolor="">
//         </td>       </tr>     </tbody></table><table class="module"
//     role="module" data-type="spacer" border="0" cellpadding="0"
//     cellspacing="0" width="100%" style="table-layout: fixed;"
//     data-muid="f5F8P1n4pQyU8o7DNMMEyW">       <tbody><tr>         <td
//     style="padding:0px 0px 30px 0px;" role="module-content" bgcolor="">
//         </td>       </tr>     </tbody></table></td>
//                  </tr>                                     </table>
//                                <!--[if mso]>
//       </td>                                 </tr>
//        </table>                             </center>
//          <![endif]-->                           </td>
//     </tr>                       </table>                     </td>
//              </tr>                 </table>               </td>
//     </tr>           </table>         </div>       </center>     </body>
//     </html>`;
//     return contactToUserTemplate;
// }

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


// exports.contactFormHandler = functions.firestore
//     .document('contact/{contactId}')
//     .onCreate((snapshot, context) => {
//         const contactId = context.params.contactId;
//         return adminFirebase.firestore().doc(`contact/${contactId}`).set({ contactId }, {
//             merge:
//                 true
//         })
//             .then(() => {
//                 return adminFirebase.firestore().collection('mail').add({
//                     to: snapshot.get('email'),
//                     message: {
//                         subject: 'Enreda: gracias por contactar',
//                         html:
//                             createContactToUserTemplate(snapshot.get('name')),
//                     }
//                 }).then(() => {
//                     return adminFirebase.firestore().collection('mail').add({
//                         to: 'escuchamos@enredas.org',
//                         message: {
//                             subject: 'Hemos recibido una solicitud de contacto',
//                             html:
//                                 createContactToEnredaTemplate(snapshot.get('name'),
//                                     snapshot.get('email'), snapshot.get('text')),
//                         }
//                     }).then(() => console.log('Queued email for delivery!'));
//                 });
//             });
//     });

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

exports.sendEmailOnCreateResource = onDocumentCreated('resources/{resourceId}', async (event) => {
  const snapshot = event.data;
  const resourceId = event.params.resourceId;
  const data = snapshot.data();

  const interests = Object.values(data.interests || {});
  const title = data.title;
  const resourceType = data.resourceType;
  const resourceStatus = data.status;

  if (resourceStatus === 'A actualizar') return;

  const usersSnapshot = await adminFirebase.firestore().collection('users').get();

  const payload = {
    notification: {
      title: 'Enreda',
      body: `Nuevo recurso: ${title}`,
    },
    data: {
      resourceId: resourceId,
      click_action: "FLUTTER_NOTIFICATION_CLICK",
      title: 'Enreda',
      body: `Nuevos recursos basados en tus intereses`
    }
  };

  const options = {
    priority: "high",
    timeToLive: 60 * 60 * 24
  };

  const promises = [];

  usersSnapshot.forEach((userDoc) => {
    const user = userDoc.data();
    if (user.role !== 'Desempleado') return;

    const userId = user.userId;

    const sendNotification = () => {
      logger.log(`Enviando notificación a ${userId}`);
      return adminFirebase.messaging().sendToTopic(userId, payload, options);
    };

    const abilities = user.motivation?.abilities || [];
    const userInterests = user.interests?.interests || [];
    const unemployedType = user.unemployedType;

    const shouldSend =
      // Ocio → todos los desempleados
      resourceType === 'iGkqdz7uiWuXAFz1O8PY' ||

      // T1 o T2 → todos los recursos
      unemployedType === 'T1' || unemployedType === 'T2' ||

      // Habilidades específicas por tipo de recurso
      (resourceType === 'GOw01m2HPro4I8xd6rSj' && abilities.includes('kv0ZGalD2ViPdTx0BMm6')) ||
      (resourceType === 'PPX3Ufeg9YfzH4YA0SkU' && abilities.includes('5X4lcOCqMTAZ4UwQLl03')) ||
      (resourceType === 'lUubulxiAGo4llxFJrkl' && abilities.includes('3ywxTQBRJ6wzgMiVx9GE')) ||
      (resourceType === 'MvCHSFzASskxlkBzPElb' && abilities.includes('RrBucTiz917syI4jyJKz')) ||
      (resourceType === '4l9BLhP7cwXohUvQzMOT' && abilities.includes('0m7igV4HhWcXwWabBKK5')) ||
      (resourceType === 'N9KdlBYmxUp82gOv8oJC' && abilities.includes('nMWfKP0yOqQf8Zv4A3n6')) ||

      // Por intereses comunes
      interests.some((i) => userInterests.includes(i));

    if (shouldSend) {
      promises.push(sendNotification());
    }
  });

  return Promise.all(promises);
});

/*
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
    await page.waitForSelector('.spegc-event-item');
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
*/
// exports.updateCountry = onDocumentUpdated('countries/{countryId}', async (event) => {
//     const change = event;
//     const previousValue = change.data?.before?.fields;
//     const countryId = previousValue?.countryId?.stringValue;
//     if (!countryId) {
//       logger.warn('No countryId found in previous document');
//       return;
//     }
    
//     const db = adminFirebase.firestore();
//     const resourcesSnapshot = await db
//       .collection('resources')
//       .where('address.country', '==', countryId)
//       .get();
    
//     for (const resource of resourcesSnapshot.docs) {
//       const data = resource.data();
//       await updateResourceSearchText(resource, data.resourceId);
//     }
    
//     logger.info('All resources searchText have been modified with the new country');
//     return;
//   });

// exports.deleteCountry = functions.firestore
//     .document('countries/{countryId}')
//     .onDelete((snapshot, context) => {
//         const countryId = context.params.countryId;
//         return adminFirebase.firestore().collection('provinces').where("countryId", "==", countryId).get()
//             .then((snapshot) => {
//                 snapshot.forEach((province) => {
//                     return adminFirebase.firestore().collection("provinces").doc(province.id).delete().then(function () {
//                         console.log("Associated province successfully deleted!");
//                     })
//                 })
//             });
//     });

// exports.createProvince = functions.firestore
//     .document('provinces/{provinceId}')
//     .onCreate((snapshot, context) => {
//         const provinceId = context.params.provinceId;
//         return adminFirebase.firestore().doc(`provinces/${provinceId}`).set({ provinceId, active: true }, { merge: true })
//             .then(() => {
//                 console.log("Successfully added provinceId to new province");
//             });
//     });


exports.updateProvince = onDocumentUpdated(
  {
    document: "provinces/{provinceId}",
    memory: "256MiB",
  },
  async (event) => {
    const beforeData = event.data?.before?.data();

    if (!beforeData || !beforeData.provinceId) {
      console.warn("⚠️ No previous province data found.");
      return;
    }

    try {
      const resourcesSnap = await db
        .collection("resources")
        .where("address.province", "==", beforeData.provinceId)
        .get();

      const updatePromises = resourcesSnap.docs.map((doc) =>
        updateResourceSearchText(doc, doc.data().resourceId)
      );

      await Promise.all(updatePromises);

      console.log("✅ All related resources updated with new province info.");
    } catch (error) {
      console.error("❌ Error updating related resources:", error);
      throw new Error("Update failed.");
    }
  }
);

// exports.deleteProvince = functions.firestore
//     .document('provinces/{provinceId}')
//     .onDelete((snapshot, context) => {
//         const provinceId = context.params.provinceId;
//         return adminFirebase.firestore().collection('cities').where("provinceId", "==", provinceId).get()
//             .then((snapshot) => {
//                 snapshot.forEach((city) => {
//                     return adminFirebase.firestore().collection("cities").doc(city.id).delete().then(function () {
//                         console.log("Associated city successfully deleted!");
//                     })
//                 })
//             });
//     });

exports.createCity = onDocumentCreated('cities/{cityId}', async (event) => {
  const cityId = event.params.cityId;

  try {
    await adminFirebase.firestore().doc(`cities/${cityId}`).set(
      { cityId, active: true },
      { merge: true }
    );
    logger.info(`✅ Successfully added cityId ${cityId} to new city`);
  } catch (error) {
    logger.error(`❌ Error creating city ${cityId}:`, error);
  }
});

// exports.updateCity = functions.firestore.document('cities/{cityId}')
//     .onUpdate(async (change, context) => {
//         const previousValue = change.before.data();

//         const resources = await adminFirebase.firestore().collection('resources').where("address.city", "==", previousValue.cityId).get();

//         for (const resource of resources.docs) {
//             await updateResourceSearchText(resource, resource.data().resourceId);
//         }

//         console.log('All resources searchText have been modified with the new city');
//         return;
//     });

// exports.createResource = functions.runWith(options).firestore
//     .document('resources/{resourceId}')
//     .onCreate(async (snapshot, context) => {
//         const resourceId = context.params.resourceId;
//         const doc = adminFirebase.firestore().doc(`resources/${resourceId}`);
//         const onlineUpdate = snapshot.data().modality !== 'Presencial' ? true : false;
//         const countryUpdate = (snapshot.data().address.country === undefined || snapshot.data().address.country === null) ? "undefined" : snapshot.data().address.country;
//         const provinceUpdate = (snapshot.data().address.province === undefined || snapshot.data().address.province === null) ? "undefined" : snapshot.data().address.province;
//         const cityUpdate = (snapshot.data().address.city === undefined || snapshot.data().address.city === null) ? "undefined" : snapshot.data().address.city;
//         const placeUpdate = snapshot.data().address.place;

//         adminFirebase.firestore().doc(`resources/${resourceId}`).set({ resourceLink: `https://enredawebapp.web.app/resources/${resourceId}` }, { merge: true });

//         await updateResourceSearchText(snapshot, resourceId);

//         //Si el creador del recurso es un mentor hay que mirar si el campo trust para ver si el recurso se puede mostrar o no
//         if (snapshot.data().organizerType === 'Mentor') {
//             return adminFirebase.firestore().collection('users').where("userId", "==", snapshot.data().organizer).get()
//                 .then((snapshot) => {
//                     snapshot.forEach((user) => {
//                         if (!user.data().trust) {
//                             return adminFirebase.firestore().doc(`resources/${resourceId}`).set({ resourceId }, { merge: true })
//                                 .then(() => {
//                                     console.log("Successfully added resourceId to new resource");
//                                     doc.update({
//                                         enable: true,
//                                         trust: false,
//                                         online: onlineUpdate,
//                                         status: 'Disponible',
//                                         address: {
//                                             place: placeUpdate,
//                                             country: countryUpdate,
//                                             province: provinceUpdate,
//                                             city: cityUpdate
//                                         },
//                                     });

//                                 })
//                         } else {
//                             return adminFirebase.firestore().doc(`resources/${resourceId}`).set({ resourceId }, { merge: true })
//                                 .then(() => {
//                                     console.log("Successfully added resourceId to new resource");
//                                     doc.update({
//                                         enable: true,
//                                         trust: true,
//                                         online: onlineUpdate,
//                                         status: 'Disponible',
//                                         address: {
//                                             place: placeUpdate,
//                                             country: countryUpdate,
//                                             province: provinceUpdate,
//                                             city: cityUpdate
//                                         },
//                                     });

//                                 })
//                         }
//                     })
//                 });
//             //Si el creador del recurso es una organization hay que mirar si el campo trust para ver si el recurso se puede mostrar o no
//         } else if (snapshot.data().organizerType === 'Organización') {
//             return adminFirebase.firestore().doc(`resources/${resourceId}`).set({ resourceId }, { merge: true })
//                 .then(() => {
//                     console.log("Successfully added resourceId to new resource");
//                     // Comprobamos si es un recurso creado de la SPEGC por web scrapping
//                     if (snapshot.data().organizer === 'btTAIYUkGSgqlEAnaZJB') {
//                         doc.update({
//                             end: adminFirebase.firestore.Timestamp.now(),
//                             start: adminFirebase.firestore.Timestamp.now(),
//                             lastupdate: adminFirebase.firestore.Timestamp.now(),
//                             createdate: adminFirebase.firestore.Timestamp.now(),
//                             maximumDate: adminFirebase.firestore.Timestamp.now(),
//                             trust: true
//                         });
//                     } else {
//                         return adminFirebase.firestore().collection('organizations').where("organizationId", "==", snapshot.data().organizer).get()
//                             .then((snapshot) => {
//                                 snapshot.forEach((organization) => {
//                                     if (!organization.data().trust) {
//                                         doc.update({
//                                             enable: true,
//                                             trust: false,
//                                             online: onlineUpdate,
//                                             status: 'Disponible',
//                                             address: {
//                                                 place: placeUpdate,
//                                                 country: countryUpdate,
//                                                 province: provinceUpdate,
//                                                 city: cityUpdate
//                                             },
//                                         });
//                                     } else {
//                                         doc.update({
//                                             enable: true,
//                                             trust: true,
//                                             online: onlineUpdate,
//                                             status: 'Disponible',
//                                             address: {
//                                                 place: placeUpdate,
//                                                 country: countryUpdate,
//                                                 province: provinceUpdate,
//                                                 city: cityUpdate
//                                             },
//                                         });
//                                     }
//                                 })
//                             });
//                     }
//                 }
//                 )
//         } else {
//             return adminFirebase.firestore().doc(`resources/${resourceId}`).set({ resourceId }, { merge: true })
//                 .then(() => {
//                     console.log("Successfully added resourceId to new resource");
//                     const doc = adminFirebase.firestore().doc(`resources/${resourceId}`);
//                     doc.update({
//                         enable: true,
//                         trust: true,
//                         online: onlineUpdate,
//                         status: 'Disponible',
//                         country: countryUpdate,
//                         province: provinceUpdate,
//                         city: cityUpdate
//                     });
//                 })
//         }

//     });

// exports.storage = functions.storage.object().onFinalize(async (object) => {
//     const bucket = object.bucket;
//     const pathToFile = object.name;
//     const downloadToken = object.metadata.firebaseStorageDownloadTokens;
//     const url = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(
//         pathToFile
//     )}?alt=media&token=${downloadToken}`;
//     const path = pathToFile.substring(0, pathToFile.lastIndexOf('/'));
//     //const title = pathToFile.substring(pathToFile.lastIndexOf('/') + 1);
//     let resourcePhoto = {
//         src: url,
//     }
//     let logoPic = {
//         src: url,
//     }
//     let profilePic = {
//         src: url,
//     }

//     const pathToCollection = pathToFile.substring(0, pathToFile.indexOf('/'));
//     //console.log(`Path to collection: ${pathToCollection}`);
//     if (pathToCollection === 'resourcesPictures') {
//         return adminFirebase.firestore().doc(path).set({ resourcePhoto }, { merge: true })
//             .then(() => {
//                 console.log("Resource photo successfully updated");
//             });
//     } else if (pathToCollection === 'organizations') {
//         return adminFirebase.firestore().doc(path).set({ logoPic }, { merge: true })
//             .then(() => {
//                 console.log("Organization Logo successfully updated");
//             });
//     }
//     else if (pathToCollection === 'users') {
//         return adminFirebase.firestore().doc(path).set({ profilePic }, { merge: true })
//             .then(() => {
//                 console.log("User profile picture successfully updated after resizing");
//             });
//     }
// });

exports.deleteResourcePicture = onDocumentDeleted('resourcesPictures/{resourcePictureId}', async (event) => {
  try {
    const snapshot = event.data;
    if (!snapshot) {
      console.log("No snapshot data found on deletion event.");
      return;
    }

    const deletedData = snapshot.data();
    const resourcePictureId = deletedData?.id;

    if (!resourcePictureId) {
      console.log("No resourcePictureId found in deleted document data.");
      return;
    }

    // Obtener el bucket de Firebase Storage
    const bucket = adminFirebase.storage().bucket();

    // Eliminar todos los archivos con el prefijo del recurso
    await bucket.deleteFiles({
      prefix: `resourcesPictures/${resourcePictureId}`
    });

    console.log(`Successfully deleted files with prefix resourcesPictures/${resourcePictureId}`);
  } catch (error) {
    console.error("Error deleting resource picture files:", error);
  }
});

// exports.createResourceType = functions.firestore
//     .document('resourcesTypes/{resourceTypeId}')
//     .onCreate((snapshot, context) => {
//         const resourceTypeId = context.params.resourceTypeId;
//         return adminFirebase.firestore().doc(`resourcesTypes/${resourceTypeId}`).set({ resourceTypeId }, { merge: true })
//             .then(() => {
//                 console.log("Successfully added resourceTypeId to new resourceType");
//             });
//     });

// exports.checkResourceDate = functions.pubsub.topic('checkResourceDate').onPublish((message, context) => {
//     return adminFirebase.firestore().collection('resources').get().then((snapshot) => {
//         snapshot.forEach((resource) => {
//             if (resource.data().end.toMillis() <= adminFirebase.firestore.Timestamp.now().toMillis() ||
//                 resource.data().maximumDate.toMillis() <= adminFirebase.firestore.Timestamp.now().toMillis()
//             ) {
//                 if (resource.data().status !== 'A actualizar') {
//                     const doc = adminFirebase.firestore().doc(`resources/${resource.data().resourceId}`);
//                     doc.update({
//                         enable: false,
//                         status: 'No disponible'
//                     });
//                 }
//             }
//         });
//     });
// });

// exports.updateResource = functions.firestore.document('resources/{resourceId}')
//     .onUpdate(async (change, context) => {
//         const resourceId = context.params.resourceId;
//         const newValue = change.after.data();
//         const previousValue = change.before.data();

//         await updateResourceSearchText(change.after, resourceId);

//         // Tras web scrapping cuando pasa de 'A actualizar a 'Disponible' hay que enviar el mail
//         if ((newValue.status === 'Disponible') && (previousValue.status === 'A actualizar')) {
//             const interests = [];
//             Object.values(newValue.interests).forEach((key) => {
//                 interests.push(key);
//             });
//             const title = newValue.title;
//             const resourceType = newValue.resourceType;
//             const resourceStatus = newValue.status;

//             const payload = {
//                 notification: {
//                     title: 'Enreda',
//                     body: `Nuevo recurso: ${title}`,
//                     sound: "default"
//                 },
//                 data: {
//                     resourceId: resourceId,
//                     click_action: "FLUTTER_NOTIFICATION_CLICK",
//                     title: 'Enreda',
//                     body: `Nuevos recursos basados en tus intereses`,
//                 }
//             };
//             const options = {
//                 priority: "high",
//                 timeToLive: 60 * 60 * 24
//             };

//             if (resourceStatus !== 'A actualizar') {
//                 functions.logger.log('INTERESTS', interests);
//                 const promises = interests.map((interest) => {
//                     return adminFirebase.firestore().collection('users').get().then((snapshot) => {
//                         snapshot.forEach((user) => {
//                             if (user.get('role') === 'Desempleado') {
//                                 // Si el recurso es de ocio, se envia a todo los desempleados
//                                 if (resourceType === 'iGkqdz7uiWuXAFz1O8PY') {
//                                     return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
//                                 }
//                                 else {
//                                     if (user.get('unemployedType') === 'T1' || user.get('unemployedType') === 'T2') {
//                                         return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
//                                     }
//                                     // Si el recurso es de habilidades sociales 
//                                     else if (resourceType === 'GOw01m2HPro4I8xd6rSj') {
//                                         // Si el desempleado tiene la habilidad "Habilidades sociales"
//                                         if (user.get('motivation').abilities.includes('kv0ZGalD2ViPdTx0BMm6')) {
//                                             return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
//                                         }
//                                     }
//                                     // Si el recurso es de Financación
//                                     else if (resourceType === 'PPX3Ufeg9YfzH4YA0SkU') {
//                                         // Si el desempleado tiene la habilidad "Financiacion"
//                                         if (user.get('motivation').abilities.includes('5X4lcOCqMTAZ4UwQLl03')) {
//                                             return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
//                                         }
//                                     }
//                                     // Si el recurso es de mentoria
//                                     else if (resourceType === 'lUubulxiAGo4llxFJrkl') {
//                                         // Si el desempleado tiene la habilidad "Apoyo profesional al sector laboral"
//                                         if (user.get('motivation').abilities.includes('3ywxTQBRJ6wzgMiVx9GE')) {
//                                             return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
//                                         }
//                                     }
//                                     // Si el recurso es de Apoyo y orientacion para el empleo
//                                     else if (resourceType === 'MvCHSFzASskxlkBzPElb') {
//                                         // Si el desempleado tiene la habilidad "Apoyo profesional al sector laboral"
//                                         if (user.get('motivation').abilities.includes('RrBucTiz917syI4jyJKz')) {
//                                             return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
//                                         }
//                                     }
//                                     // Si el recurso es de programa para la emprendeduria 
//                                     else if (resourceType === '4l9BLhP7cwXohUvQzMOT') {
//                                         // Si el desempleado tiene la habilidad "Emprenduderia"
//                                         if (user.get('motivation').abilities.includes('0m7igV4HhWcXwWabBKK5')) {
//                                             return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
//                                         }
//                                     }
//                                     // Si el recurso es de formacion
//                                     else if (resourceType === 'N9KdlBYmxUp82gOv8oJC') {
//                                         // Si el desempleado tiene la habilidad "Formacion"
//                                         if (user.get('motivation').abilities.includes('nMWfKP0yOqQf8Zv4A3n6')) {
//                                             return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
//                                         }
//                                     }
//                                     else {
//                                         const interestsUser = [];
//                                         user.get('interests').interests.forEach((i) => {
//                                             interestsUser.push(i);
//                                         });
//                                         interestsUser.forEach((interestUser) => {
//                                             if (interestUser === interest) {
//                                                 return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
//                                             }
//                                         })
//                                     }
//                                 }

//                             }
//                         });
//                     })
//                 });
//                 return Promise.all(promises);
//             }
//         }

//         //Cuando se modifica la modalidad
//         if (newValue.modality !== previousValue.modality) {
//             const onlineUpdate = newValue.data().modality !== 'Presencial' ? true : false;
//             const doc = adminFirebase.firestore().doc(`resources/${resourceId}`);
//             const countryUpdate = (newValue.data().address.country === undefined || newValue.data().address.country === null) ? "undefined" : newValue.data().address.country;
//             const provinceUpdate = (newValue.data().address.province === undefined || newValue.data().address.province === null) ? "undefined" : newValue.data().address.province;
//             const cityUpdate = (newValue.data().address.city === undefined || newValue.data().address.city === null) ? "undefined" : newValue.data().address.city;
//             const placeUpdate = newValue.data().address.place;
//             doc.update({
//                 online: onlineUpdate,
//                 address: {
//                     place: placeUpdate,
//                     country: countryUpdate,
//                     province: provinceUpdate,
//                     city: cityUpdate
//                 },
//             });
//         }

//         //Cuando se modifica la fecha limite de inscripcion
//         if (newValue.maximumDate !== previousValue.maximumDate) {
//             if (!newValue.notExpire && newValue.maximumDate.toMillis() <= adminFirebase.firestore.Timestamp.now().toMillis()) {
//                 if ((newValue.status !== 'A actualizar') && (newValue.status !== 'Completo')) {
//                     const doc = adminFirebase.firestore().doc(`resources/${resourceId}`);
//                     doc.update({
//                         enable: false,
//                         status: 'No disponible'
//                     });
//                 }
//             } else {
//                 if ((newValue.status !== 'A actualizar') && (newValue.status !== 'Completo')) {
//                     const doc = adminFirebase.firestore().doc(`resources/${resourceId}`);
//                     doc.update({
//                         enable: true,
//                         status: 'Disponible'
//                     });
//                 }
//             }
//         }

//         //Cuando se modifica el aforo y ya hay asistentes inscritos
//         if (newValue.capacity !== previousValue.capacity) {
//             if (previousValue.assistants <= newValue.capacity) {
//                 return adminFirebase.firestore().doc(`resources/${resourceId}`).set({
//                     capacity: newValue.capacity
//                 }, { merge: true })
//                     .then(() => {
//                         console.log("Changes were applied to capacity");
//                         if (previousValue.assistants === newValue.capacity) {
//                             const status = 'Completo';
//                             return adminFirebase.firestore().doc(`resources/${resourceId}`).set({ status }, { merge: true }).then(() => {
//                                 console.log('Se ha modificado correctamente el evento');
//                             });
//                         }
//                     });
//             } else {
//                 return adminFirebase.firestore().doc(`resources/${resourceId}`).set({
//                     capacity: previousValue.capacity
//                 }, { merge: true })
//                     .then(() => {
//                         console.log("Changes were not applied because the number of assistants were higher than the new capacity");
//                     });
//             }
//         }

//         // // Cuando se añaden asistentes
//         if (newValue.assistants !== previousValue.assistants) {
//             let status = previousValue.status
//             if (newValue.assistants === newValue.capacity) {
//                 status = 'Completo';
//             }
//             const doc = adminFirebase.firestore().doc(`resources/${resourceId}`);
//             doc.update({
//                 assistants: newValue.participants.length.toString(),
//                 status: status
//             });
//         }
//         // Cuando se modifican los participantes (solo desde las apps)
//         if ((newValue.participants !== previousValue.participants) && (newValue.participantsString === previousValue.participantsString)) {
//             console.log("Aqui desde el movil");
//             let difference;
//             let addingParticipants;
        
//             if (previousValue.participants.length > newValue.participants.length) {
//                 difference = previousValue.participants.filter(x => !newValue.participants.includes(x));
//                 addingParticipants = false;
//             } else {
//                 difference = newValue.participants.filter(x => !previousValue.participants.includes(x));
//                 addingParticipants = true;
//             }
        
//             let participant = difference[0];
//             if (participant) {
//                 return adminFirebase.firestore().doc(`resources/${resourceId}`).set({ participantsString: newValue.participants.join() }, { merge: true })
//                     .then(() => adminFirebase.firestore().collection('users').where("userId", "==", participant).get())
//                     .then((snapshot) => {
//                         let promises = [];
//                         snapshot.forEach((user) => {
//                             let resources = user.get('resources') || [];
//                             if (addingParticipants) {
//                                 resources.push(resourceId);
//                             } else {
//                                 resources = resources.filter(resource => resource !== resourceId);
//                             }
//                             promises.push(adminFirebase.firestore().doc(`users/${participant}`).set({ resources, resourcesString: resources.join() }, { merge: true }));
//                         });
//                         return Promise.all(promises);
//                     })
//                     .then(() => {
//                         console.log("Successfully updated resources in user");
//                     })
//                     .catch((error) => {
//                         console.error("Error updating resources:", error);
//                     });
//             } else {
//                 console.log("No participants changed.");
//                 // Handle the case where there is no change.
//             }
//         }   
//         if (newValue.invitationsList !== previousValue.invitationsList) {
//             // Eliminate duplicate emails from the list
//             const uniqueEmailList = [...new Set(newValue.invitationsList)];
        
//             const resourceTitle = newValue.title;
//             const resourceDescription = newValue.description;
//             const sendInvitationPromises = [];
        
//             for (const email of uniqueEmailList) {
//                 let htmlToSendInvitationToUser = resourceInvitationTemplate(
//                     resourceTitle,
//                     resourceId,
//                     resourceDescription 
//                 );
//                 const sendPromise = adminFirebase.firestore().collection('mail').add({
//                     to: email,
//                     message: {
//                         subject: `Invitación: ${resourceTitle}`,
//                         html: htmlToSendInvitationToUser,
//                     }
//                 }).then(() => {
//                     console.log(`Successfully sent ${email}`);
//                 }).catch(error => {
//                     console.error(`Failed to send ${email}`, error);
//                 });
//                 sendInvitationPromises.push(sendPromise);
//             } 
//             return Promise.all(sendInvitationPromises);
//         }
//     });

// exports.createAbility = functions.firestore
//     .document('abilities/{abilityId}')
//     .onCreate((snapshot, context) => {
//         const abilityId = context.params.abilityId;
//         return adminFirebase.firestore().doc(`abilities/${abilityId}`).set({ abilityId }, { merge: true })
//             .then(() => {
//                 console.log("Successfully added abilityId to new ability");
//             });
//     });

// exports.createInterest = functions.firestore
//     .document('interests/{interestId}')
//     .onCreate((snapshot, context) => {
//         const interestId = context.params.interestId;
//         return adminFirebase.firestore().doc(`interests/${interestId}`).set({ interestId }, { merge: true })
//             .then(() => {
//                 console.log("Successfully added interestId to new interest");
//             });
//     });

// exports.createSpecificInterest = functions.firestore
//     .document('specificInterests/{specificInterestId}')
//     .onCreate((snapshot, context) => {
//         const specificInterestId = context.params.specificInterestId;
//         return adminFirebase.firestore().doc(`specificInterests/${specificInterestId}`).set({ specificInterestId }, { merge: true })
//             .then(() => {
//                 console.log("Successfully added specificInterestId to new specificInterest");
//             });
//     });

// exports.sendEmailActiveUsers = functions.firestore.document('users/{userId}')
//     .onUpdate((change, context) => {
//         const userId = context.params.userId;
//         const newValue = change.after.data();
//         const beforeValue = change.before.data();
//         if (!beforeValue.active && newValue.active && newValue.address.country == 'WMHqCzqISX6KNVs9b3iN' && newValue.role !== 'Desempleado') {
//             let htmlToSendToNewUser = createWelcomeToUserTemplate(newValue.firstName, newValue.email.trim().toLowerCase(), 'enreda_' + userId.slice(-3));
//             return adminFirebase.firestore().collection('mail').add({
//                 to: newValue.email,
//                 message: {
//                     subject: 'Equipo Enreda',
//                     html: htmlToSendToNewUser,
//                 }
//             }).then(() => {
//                 console.log("Successfully send email");
//             });
//         }
//     });

exports.sendEmailNewUsers = onDocumentCreated('users/{userId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    console.error("No event data found.");
    return;
  }

  const userId = event.params.userId;
  const role = snapshot.get('role');
  const phone = snapshot.get('phone');
  const address = snapshot.get('address') || {};
  const country = address.country;
  let active = snapshot.get('active');

  // Controlamos inactivos en Perú (country ID: WMHqCzqISX6KNVs9b3iN)
  if (active === undefined) {
    if (country === 'WMHqCzqISX6KNVs9b3iN' && role !== 'Desempleado') {
      active = false;
    } else {
      active = true;
    }
  }

  try {
    const userEmail = snapshot.get('email')?.trim().toLowerCase();
    const firstName = snapshot.get('firstName');

    const htmlToSendToNewUser = active
      ? createWelcomeToUserTemplate(firstName, userEmail, 'enreda_' + userId.slice(-3))
      : createWelcomeToInactiveUserTemplate(firstName);

    // Correo al nuevo usuario
    await adminFirebase.firestore().collection('mail').add({
      to: userEmail,
      message: {
        subject: 'Equipo Enreda',
        html: htmlToSendToNewUser,
      },
    });

    // Correo al equipo Enreda
    await adminFirebase.firestore().collection('mail').add({
      to: 'escuchamos@enredas.org',
      message: {
        subject: 'Tenemos un nuevo integrante',
        html: createWelcomeToEnredaTemplate(firstName, snapshot.get('email'), role),
      },
    });

    console.log('Queued welcome emails successfully!');
  } catch (error) {
    console.error('Error sending welcome emails:', error);
  }
});

function createWelcomeToUserTemplate(name, email, password) {
    const contactToUserTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="es">
 <head>
  <meta charset="UTF-8">
  <meta content="width=device-width, initial-scale=1" name="viewport">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta content="telephone=no" name="format-detection">
  <title>nuevo email</title><!--[if (mso 16)]>
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
a { color: inherit; }     
@media only screen and (max-width:600px) {p, ul li, ol li, a { line-height:150%!important } h1, h2, h3, h1 a, h2 a, h3 a { line-height:120% } h1 { font-size:36px!important; text-align:left } h2 { font-size:26px!important; text-align:left } h3 { font-size:20px!important; text-align:left } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size:36px!important; text-align:left } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size:26px!important; text-align:left } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size:20px!important; text-align:left } .es-menu td a { font-size:12px!important } .es-header-body p, .es-header-body ul li, .es-header-body ol li, .es-header-body a { font-size:14px!important } .es-content-body p, .es-content-body ul li, .es-content-body ol li, .es-content-body a { font-size:16px!important } .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size:14px!important } .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size:12px!important } *[class="gmail-fix"] { display:none!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align:right!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-button-border { display:inline-block!important } a.es-button, button.es-button { font-size:20px!important; display:inline-block!important } .es-adaptive table, .es-left, .es-right { width:100%!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .es-adapt-td { display:block!important; width:100%!important } .adapt-img { width:100%!important; height:auto!important } .es-m-p0 { padding:0!important } .es-m-p0r { padding-right:0!important } .es-m-p0l { padding-left:0!important } .es-m-p0t { padding-top:0!important } .es-m-p0b { padding-bottom:0!important } .es-m-p20b { padding-bottom:20px!important } .es-mobile-hidden, .es-hidden { display:none!important } tr.es-desk-hidden, td.es-desk-hidden, table.es-desk-hidden { width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } tr.es-desk-hidden { display:table-row!important } table.es-desk-hidden { display:table!important } td.es-desk-menu-hidden { display:table-cell!important } .es-menu td { width:1%!important } table.es-table-not-adapt, .esd-block-html table { width:auto!important } table.es-social { display:inline-block!important } table.es-social td { display:inline-block!important } .es-m-p5 { padding:5px!important } .es-m-p5t { padding-top:5px!important } .es-m-p5b { padding-bottom:5px!important } .es-m-p5r { padding-right:5px!important } .es-m-p5l { padding-left:5px!important } .es-m-p10 { padding:10px!important } .es-m-p10t { padding-top:10px!important } .es-m-p10b { padding-bottom:10px!important } .es-m-p10r { padding-right:10px!important } .es-m-p10l { padding-left:10px!important } .es-m-p15 { padding:15px!important } .es-m-p15t { padding-top:15px!important } .es-m-p15b { padding-bottom:15px!important } .es-m-p15r { padding-right:15px!important } .es-m-p15l { padding-left:15px!important } .es-m-p20 { padding:20px!important } .es-m-p20t { padding-top:20px!important } .es-m-p20r { padding-right:20px!important } .es-m-p20l { padding-left:20px!important } .es-m-p25 { padding:25px!important } .es-m-p25t { padding-top:25px!important } .es-m-p25b { padding-bottom:25px!important } .es-m-p25r { padding-right:25px!important } .es-m-p25l { padding-left:25px!important } .es-m-p30 { padding:30px!important } .es-m-p30t { padding-top:30px!important } .es-m-p30b { padding-bottom:30px!important } .es-m-p30r { padding-right:30px!important } .es-m-p30l { padding-left:30px!important } .es-m-p35 { padding:35px!important } .es-m-p35t { padding-top:35px!important } .es-m-p35b { padding-bottom:35px!important } .es-m-p35r { padding-right:35px!important } .es-m-p35l { padding-left:35px!important } .es-m-p40 { padding:40px!important } .es-m-p40t { padding-top:40px!important } .es-m-p40b { padding-bottom:40px!important } .es-m-p40r { padding-right:40px!important } .es-m-p40l { padding-left:40px!important } .es-desk-hidden { display:table-row!important; width:auto!important; overflow:visible!important; max-height:inherit!important } .h-auto { height:auto!important } }
@media screen and (max-width:384px) {.mail-message-content { width:414px!important } }
</style>
 </head>
 <body style="width:100%;font-family:arial, 'helvetica neue', helvetica, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
  <div dir="ltr" class="es-wrapper-color" lang="es" style="background-color:#FAFAFA"><!--[if gte mso 9]>
			<v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
				<v:fill type="tile" color="#fafafa"></v:fill>
			</v:background>
		<![endif]-->
   <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#FAFAFA">
     <tr>
      <td valign="top" style="padding:0;Margin:0">
       <table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
         <tr>
          <td align="center" style="padding:0;Margin:0">
           <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
             <tr>
              <td align="left" bgcolor="#054D5E" style="padding:0;Margin:0;background-color:#054d5e;border-radius:20px">
               <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                 <tr>
                  <td align="center" valign="top" style="padding:0;Margin:0;width:600px">
                   <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:separate;border-spacing:0px;border-radius:25px" role="presentation">
                     <tr class="es-visible-simple-html-only">
                      <td align="center" style="padding:0;Margin:0;padding-top:25px;font-size:0px"><img class="adapt-img" src="https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/images%2Fmailing-bienvenida.png?alt=media&amp;token=4e53355c-52bd-4ef1-895c-a85fd56bcadd" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="600"></td>
                     </tr>
                     <tr>
                      <td align="center" class="es-m-txt-c" style="padding:0;Margin:0;padding-bottom:25px;padding-top:35px"><h1 style="Margin:0;line-height:36px;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:30px;font-style:normal;font-weight:bold;color:#ffffff"><strong>¡Hola ${name}!</strong></h1></td>
                     </tr>
                     <tr>
                      <td align="left" style="Margin:0;padding-top:10px;padding-bottom:40px;padding-left:40px;padding-right:40px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px">Te informamos de que te has registrado exitosamente en el programa Enreda.</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px"><br>Debes acceder con tu email <a>${email}</a></p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px">Además hemos establecido para ti la contraseña por defecto: ${password}</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px"><br></p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px">Una vez que inicies sesión, te recomendamos que la cambies.</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px"><br></p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px">Gracias.</p></td>
                     </tr>
                     <tr>
                      <td align="center" style="padding:25px;Margin:0"><span class="es-button-border" style="border-style:solid;border-color:#18c5c1;background:#18c5c1;border-width:2px;display:inline-block;border-radius:25px;width:auto"><a href="https://enredawebapp.web.app/" class="es-button es-button-1719310999593" target="_blank" style="mso-style-priority:100 !important;text-decoration:none;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;color:#FFFFFF;font-size:18px;padding:10px 30px;display:inline-block;background:#18c5c1;border-radius:25px;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-weight:normal;font-style:normal;line-height:22px;width:auto;text-align:center;mso-padding-alt:0;mso-border-alt:10px solid #18c5c1">Ir a Enreda</a></span></td>
                     </tr>
                     <tr>
                      <td align="center" style="padding:0;Margin:0;padding-bottom:25px;padding-left:40px;padding-right:40px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:18px;color:#ffffff;font-size:12px">El equipo de Enreda</p></td>
                     </tr>
                   </table></td>
                 </tr>
               </table></td>
             </tr>
           </table></td>
         </tr>
       </table>
       <table cellpadding="0" cellspacing="0" class="es-footer" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top">
         <tr>
          <td align="center" style="padding:0;Margin:0">
           <table class="es-footer-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px" role="none">
             <tr>
              <td align="left" style="padding:20px;Margin:0">
               <table cellspacing="0" cellpadding="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                 <tr>
                  <td align="center" style="padding:0;Margin:0;width:560px">
                   <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                     <tr>
                      <td class="es-m-p0l" align="center" style="padding:0;Margin:0;font-size:0px"><img src="https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/images%2Flogo-s4c-sec.png?alt=media&amp;token=2e09f421-62dd-4381-af4f-ec7ef95f2b55" alt width="98" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></td>
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



// function createWelcomeToInactiveUserTemplate(name) {
//     const contactToUserTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD
//     XHTML 1.0 Strict//EN"
//     "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"> <html
//     data-editor-version="2" class="sg-campaigns"
//     xmlns="http://www.w3.org/1999/xhtml">     <head>       <meta
//     http-equiv="Content-Type" content="text/html; charset=utf-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1,
//     minimum-scale=1, maximum-scale=1">       <!--[if !mso]><!-->       <meta
//     http-equiv="X-UA-Compatible" content="IE=Edge">       <!--<![endif]-->
//          <!--[if (gte mso 9)|(IE)]>       <xml>
//     <o:OfficeDocumentSettings>           <o:AllowPNG/>
//     <o:PixelsPerInch>96</o:PixelsPerInch>
//     </o:OfficeDocumentSettings>       </xml>       <![endif]-->
//     <!--[if (gte mso 9)|(IE)]>   <style type="text/css">     body {width:
//     600px;margin: 0 auto;}     table {border-collapse: collapse;}     table,
//     td {mso-table-lspace: 0pt;mso-table-rspace: 0pt;}     img
//     {-ms-interpolation-mode: bicubic;}   </style> <![endif]-->       <style
//     type="text/css">     body, p, div {       font-family:
//     verdana,geneva,sans-serif;       font-size: 16px;     }     body {
//     color: #516775;     }     body a {       color: #993300;
//     text-decoration: none;     }     p { margin: 0; padding: 0; }
//     table.wrapper {       width:100% !important;       table-layout: fixed;
//           -webkit-font-smoothing: antialiased;
//     -webkit-text-size-adjust: 100%;       -moz-text-size-adjust: 100%;
//     -ms-text-size-adjust: 100%;     }     img.max-width {       max-width:
//     100% !important;     }     .column.of-2 {       width: 50%;     }
//     .column.of-3 {       width: 33.333%;     }     .column.of-4 {
//     width: 25%;     }     @media screen and (max-width:480px) {
//     .preheader .rightColumnContent,       .footer .rightColumnContent {
//         text-align: left !important;       }       .preheader
//     .rightColumnContent div,       .preheader .rightColumnContent span,
//       .footer .rightColumnContent div,       .footer .rightColumnContent span
//     {         text-align: left !important;       }       .preheader
//     .rightColumnContent,       .preheader .leftColumnContent {
//     font-size: 80% !important;         padding: 5px 0;       }
//     table.wrapper-mobile {         width: 100% !important;
//     table-layout: fixed;       }       img.max-width {         height: auto
//     !important;         max-width: 100% !important;       }
//     a.bulletproof-button {         display: block !important;         width:
//     auto !important;         font-size: 80%;         padding-left: 0
//     !important;         padding-right: 0 !important;       }       .columns
//     {         width: 100% !important;       }       .column {
//     display: block !important;         width: 100% !important;
//     padding-left: 0 !important;         padding-right: 0 !important;
//     margin-left: 0 !important;         margin-right: 0 !important;       }
//          .social-icon-column {         display: inline-block !important;
//       }     }   </style>       <!--user entered Head Start-->       <!--End
//     Head user entered-->     </head>     <body>       <center
//     class="wrapper" data-link-color="#993300"
//     data-body-style="font-size:16px; font-family:verdana,geneva,sans-serif;
//     color:#516775; background-color:#F9F5F2;">         <div class="webkit">
//               <table cellpadding="0" cellspacing="0" border="0" width="100%"
//     class="wrapper" bgcolor="#F9F5F2">             <tr>               <td
//     valign="top" bgcolor="#F9F5F2" width="100%">                 <table
//     width="100%" role="content-container" class="outer" align="center"
//     cellpadding="0" cellspacing="0" border="0">                   <tr>
//                    <td width="100%">                       <table
//     width="100%" cellpadding="0" cellspacing="0" border="0">
//              <tr>                           <td>
//     <!--[if mso]>     <center>     <table><tr><td width="600">
//     <![endif]-->                                     <table width="100%"
//     cellpadding="0" cellspacing="0" border="0" style="width:100%;
//     max-width:600px;" align="center">
//     <tr>                                         <td
//     role="modules-container" style="padding:0px 0px 0px 0px; color:#516775;
//     text-align:left;" bgcolor="#F9F5F2" width="100%" align="left"><table
//     class="module preheader preheader-hide" role="module"
//     data-type="preheader" border="0" cellpadding="0" cellspacing="0"
//     width="100%" style="display: none !important; mso-hide: all; visibility:
//     hidden; opacity: 0; color: transparent; height: 0; width: 0;">     <tr>
//           <td role="module-content">         <p></p>       </td>     </tr>
//     </table><table class="module" role="module" data-type="spacer"
//     border="0" cellpadding="0" cellspacing="0" width="100%"
//     style="table-layout: fixed;" data-muid="bdzDb4B4pnnez4W7L1KpxJ">
//     <tbody><tr>         <td style="padding:0px 0px 30px 0px;"
//     role="module-content" bgcolor="">         </td>       </tr>
//     </tbody></table><table class="wrapper" role="module" data-type="image"
//     border="0" cellpadding="0" cellspacing="0" width="100%"
//     style="table-layout: fixed;" data-muid="bKZJcGfRPJb7R2nzyp6ZB6">
//     <tbody><tr>         <td style="font-size:6px; line-height:10px;
//     padding:0px 0px 0px 0px;" valign="top" align="center">           <img
//     class="max-width" border="0" style="display:block; color:#000000;
//     text-decoration:none; font-family:Helvetica, arial, sans-serif;
//     font-size:16px; max-width:100% !important; width:100%; height:auto
//     !important;"
//     src="http://cdn.mcauto-images-production.sendgrid.net/c2af2ef38a422013/f122e378-4bec-41c0-9b33-a9525ee1efea/2048x1366.jpg"
//     alt="" width="600" data-responsive="true"
//     data-proportionally-constrained="false">         </td>       </tr>
//     </tbody></table><table class="module" role="module" data-type="text"
//     border="0" cellpadding="0" cellspacing="0" width="100%"
//     style="table-layout: fixed;" data-muid="gNWHzBzkFeWH4JDKd2Aikk"
//     data-mc-module-version="2019-10-22">       <tbody><tr>         <td
//     style="background-color:#ffffff; padding:50px 0px 10px 0px;
//     line-height:30px; text-align:inherit;" height="100%" valign="top"
//     bgcolor="#ffffff"><div><div style="font-family: inherit; text-align:
//     center"><span style="color: #516775; font-size: 28px; font-family:
//     georgia, serif"><strong>Hola
//     ${name}!</strong></span></div><div></div></div></td>       </tr>
//     </tbody></table><table class="module" role="module" data-type="text"
//     border="0" cellpadding="0" cellspacing="0" width="100%"
//     style="table-layout: fixed;" data-muid="bA2FfEE6abadx6yKoMr3F9"
//     data-mc-module-version="2019-10-22">       <tbody><tr>         <td
//     style="background-color:#ffffff; padding:10px 40px 50px 40px;
//     line-height:22px; text-align:inherit;" height="100%" valign="top"
//     bgcolor="#ffffff"><div><div style="font-family: inherit; text-align:
//     center"><span style="font-family: verdana, geneva, sans-serif">Te
//     informamos de que te has registrado exitosamente en el programa
//     enREDa.&nbsp;</span></div> <div style="font-family: inherit; text-align:
//     center">Vamos a proceder a validar tus datos. En breve nos pondremos en
//     contacto contigo y podrás acceder a la plataforma enREDA.</div> <div style="font-family:
//     inherit; text-align: center">Gracias.</div><div></div></div></td>
//     </tr>     </tbody></table><table border="0" cellpadding="0"
//     cellspacing="0" class="module" data-role="module-button"
//     data-type="button" role="module" style="table-layout:fixed" width="100%"
//     data-muid="bKHWQMgPkL5opYCkxiM6aS"><tbody><tr><td align="center"
//     class="outer-td" style="padding:20px 0px 0px 0px;" bgcolor=""><table
//     border="0" cellpadding="0" cellspacing="0"
//     class="button-css__deep-table___2OZyb wrapper-mobile"
//     style="text-align:center"><tbody><tr><td align="center"
//     bgcolor="#993300" class="inner-td" style="border-radius:6px;
//     font-size:16px; text-align:center; background-color:inherit;"></td></tr></tbody></table></td></tr></tbody></table><table
//     class="module" role="module" data-type="text" border="0" cellpadding="0"
//     cellspacing="0" width="100%" style="table-layout: fixed;"
//     data-muid="d21b8641-6eaf-4354-9938-61022423da11">     <tbody>       <tr>
//              <td style="padding:18px 0px 18px 0px; line-height:22px;
//     text-align:inherit;" height="100%" valign="top" bgcolor=""
//     role="module-content"><div><div style="font-family: inherit; text-align:
//     center"><a 'href=https://www.enredaempleo.org'><span style="font-size:
//     12px">El equipo de Enreda</span></a></div><div></div></div></td>
//     </tr>     </tbody>   </table><table class="module" role="module"
//     data-type="spacer" border="0" cellpadding="0" cellspacing="0"
//     width="100%" style="table-layout: fixed;"
//     data-muid="qkfYAswHNSwNpwb1p7m4gC">       <tbody><tr>         <td
//     style="padding:0px 0px 30px 0px;" role="module-content" bgcolor="">
//         </td>       </tr>     </tbody></table><table class="module"
//     role="module" data-type="spacer" border="0" cellpadding="0"
//     cellspacing="0" width="100%" style="table-layout: fixed;"
//     data-muid="f5F8P1n4pQyU8o7DNMMEyW">       <tbody><tr>         <td
//     style="padding:0px 0px 30px 0px;" role="module-content" bgcolor="">
//         </td>       </tr>     </tbody></table></td>
//                  </tr>                                     </table>
//                                <!--[if mso]>
//       </td>                                 </tr>
//        </table>                             </center>
//          <![endif]-->                           </td>
//     </tr>                       </table>                     </td>
//              </tr>                 </table>               </td>
//     </tr>           </table>         </div>       </center>     </body>
//     </html>`;
//     return contactToUserTemplate;
// }

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


exports.contactFormHandler = onDocumentCreated('contact/{contactId}', async (event) => {
  const contactId = event.params.contactId;
  const data = event.data?.data();

  if (!data) {
    console.error('No data found in event payload.');
    return;
  }

  const { name, email, text } = data;

  try {
    // Añade el ID al documento recién creado
    await adminFirebase.firestore().doc(`contact/${contactId}`).set({ contactId }, { merge: true });

    // Correo de confirmación al usuario
    await adminFirebase.firestore().collection('mail').add({
      to: email,
      message: {
        subject: 'Enreda: gracias por contactar',
        html: createContactToUserTemplate(name),
      }
    });

    // Notificación interna a Enreda
    await adminFirebase.firestore().collection('mail').add({
      to: 'escuchamos@enredas.org',
      message: {
        subject: 'Hemos recibido una solicitud de contacto',
        html: createContactToEnredaTemplate(name, email, text),
      }
    });

    console.log('Correos encolados correctamente.');
  } catch (error) {
    console.error('Error en el manejo del formulario de contacto:', error);
    throw new Error('Fallo en el manejo del formulario de contacto');
  }
});

// function createContactToUserTemplate(name) {
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
//       <td role="module-content">         <p>Enreda: te ayudamos a
// construir tu futuro</p>       </td>     </tr>   </table><table
// class="module" role="module" data-type="spacer" border="0"
// cellpadding="0" cellspacing="0" width="100%" style="table-layout:
// fixed;" data-muid="bdzDb4B4pnnez4W7L1KpxJ">       <tbody><tr>
// <td style="padding:0px 0px 30px 0px;" role="module-content" bgcolor="">
//         </td>       </tr>     </tbody></table><table class="wrapper"
// role="module" data-type="image" border="0" cellpadding="0"
// cellspacing="0" width="100%" style="table-layout: fixed;"
// data-muid="bKZJcGfRPJb7R2nzyp6ZB6">       <tbody><tr>         <td
// style="font-size:6px; line-height:10px; padding:0px 0px 0px 0px;"
// valign="top" align="center">                    <a
// href="https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/landing.jpg?alt=media&token=32f29414-27bd-46e5-af96-94d65aa730fb"><img
// class="max-width" border="0" style="display:block; color:#000000;
// text-decoration:none; font-family:Helvetica, arial, sans-serif;
// font-size:16px; max-width:100% !important; width:100%; height:auto
// !important;"
// src="http://cdn.mcauto-images-production.sendgrid.net/c2af2ef38a422013/f122e378-4bec-41c0-9b33-a9525ee1efea/2048x1366.jpg"
// alt="" width="600" data-responsive="true"
// data-proportionally-constrained="false"></a></td>       </tr>
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
// center"><span style="font-family: verdana, geneva, sans-serif">Esto es
// un mensaje de confirmación de que nos ha llegado tu mensaje. Pronto nos
// pondremos en contacto contigo.</span></div> <div style="font-family:
// inherit; text-align: center"><br></div> <div style="font-family:
// inherit; text-align: center"><span style="font-family: verdana, geneva,
// sans-serif">Gracias por usar nuestro
// servicio.</span></div><div></div></div></td>       </tr>
// </tbody></table><table class="module" role="module" data-type="spacer"
// border="0" cellpadding="0" cellspacing="0" width="100%"
// style="table-layout: fixed;" data-muid="dnNq8YR2nu8DNzse1aZUWt">
// <tbody><tr>         <td style="padding:0px 0px 30px 0px;"
// role="module-content" bgcolor="">         </td>       </tr>
// </tbody></table><table class="module" role="module" data-type="text"
// border="0" cellpadding="0" cellspacing="0" width="100%"
// style="table-layout: fixed;"
// data-muid="a480059a-7a08-4b9a-b00b-908370582008"
// data-mc-module-version="2019-10-22">     <tbody>       <tr>         <td
// style="padding:18px 0px 18px 0px; line-height:22px; text-align:inherit;"
// height="100%" valign="top" bgcolor="" role="module-content"><div><div
// style="font-family: inherit; text-align: center"><a
// href="https://www.enredaempleo.org/"><span style="font-size: 12px">El
// equipo de Enreda</span></a></div><div></div></div></td>       </tr>
// </tbody>   </table><table class="module" role="module"
// data-type="spacer" border="0" cellpadding="0" cellspacing="0"
// width="100%" style="table-layout: fixed;"
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

// exports.sendEmailOnCreateResource = functions.firestore
//     .document('resources/{resourceId}')
//     .onCreate((snapshot, context) => {
//         const resourceId = context.params.resourceId;
//         const interests = [];
//         Object.values(snapshot.get('interests')).forEach((key) => {
//             interests.push(key);
//         });
//         const title = snapshot.get('title');
//         const resourceType = snapshot.get('resourceType');
//         const resourceStatus = snapshot.get('status');
//         if (resourceStatus !== 'A actualizar') {
//             return adminFirebase.firestore().collection('users').get().then((snapshot) => {
//                 snapshot.forEach((user) => {
//                     if (user.get('role') === 'Desempleado') {

//                         const payload = {
//                             notification: {
//                                 title: 'Enreda',
//                                 body: `Nuevo recurso: ${title}`,
//                                 sound: "default"
//                             },
//                             data: {
//                                 resourceId: resourceId,
//                                 click_action: "FLUTTER_NOTIFICATION_CLICK",
//                                 title: 'Enreda',
//                                 body: `Nuevos recursos basados en tus intereses`,
//                             }
//                         };
//                         const options = {
//                             priority: "high",
//                             timeToLive: 60 * 60 * 24
//                         };

//                         // Si el recurso es de ocio, se envia a todo los desempleados
//                         if (resourceType === 'iGkqdz7uiWuXAFz1O8PY') {
//                             return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
//                         }
//                         else {
//                             if (user.get('unemployedType') === 'T1' || user.get('unemployedType') === 'T2') {
//                                 return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
//                             }
//                             // Si el recurso es de habilidades sociales 
//                             else if (resourceType === 'GOw01m2HPro4I8xd6rSj') {
//                                 // Si el desempleado tiene la habilidad "Habilidades sociales"
//                                 if (user.get('motivation').abilities.includes('kv0ZGalD2ViPdTx0BMm6')) {
//                                     return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
//                                 }
//                             }
//                             // Si el recurso es de Financación
//                             else if (resourceType === 'PPX3Ufeg9YfzH4YA0SkU') {
//                                 // Si el desempleado tiene la habilidad "Financiacion"
//                                 if (user.get('motivation').abilities.includes('5X4lcOCqMTAZ4UwQLl03')) {
//                                     return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
//                                 }
//                             }
//                             // Si el recurso es de mentoria
//                             else if (resourceType === 'lUubulxiAGo4llxFJrkl') {
//                                 // Si el desempleado tiene la habilidad "Apoyo profesional al sector laboral" 
//                                 if (user.get('motivation').abilities.includes('3ywxTQBRJ6wzgMiVx9GE')) {
//                                     return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
//                                 }
//                             }
//                             // Si el recurso es de Apoyo y orientacion para el empleo
//                             else if (resourceType === 'MvCHSFzASskxlkBzPElb') {
//                                 // Si el desempleado tiene la habilidad "Apoyo profesional al sector laboral"
//                                 if (user.get('motivation').abilities.includes('RrBucTiz917syI4jyJKz')) {
//                                     return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
//                                 }
//                             }
//                             // Si el recurso es de programa para la emprendeduria 
//                             else if (resourceType === '4l9BLhP7cwXohUvQzMOT') {
//                                 // Si el desempleado tiene la habilidad "Emprenduderia"
//                                 if (user.get('motivation').abilities.includes('0m7igV4HhWcXwWabBKK5')) {
//                                     return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
//                                 }
//                             }
//                             // Si el recurso es de formacion
//                             else if (resourceType === 'N9KdlBYmxUp82gOv8oJC') {
//                                 // Si el desempleado tiene la habilidad "Formacion"
//                                 if (user.get('motivation').abilities.includes('nMWfKP0yOqQf8Zv4A3n6')) {
//                                     return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
//                                 }
//                             }
//                             else {
//                                 const interestsUser = [];
//                                 user.get('interests').interests.forEach((i) => {
//                                     interestsUser.push(i);
//                                 });
//                                 interestsUser.forEach((interestUser) => {
//                                     if (interests.indexOf(interestUser) > -1) {
//                                         return adminFirebase.messaging().sendToTopic(user.get('userId'), payload, options);
//                                     }
//                                 })
//                             }
//                         }
//                     }
//                 });
//             })
//         }
//     });

// /*
// const findResourcesFromSPEGC = async () => {
//     let url = 'https://www.spegc.org/formacion-y-eventos/'
//     let browser = await puppeteer.launch({
//         headless: true,
//         args: ['--no-sandbox', '--disable-setuid-sandbox']
//     })
//     let page = await browser.newPage()
//     await page.setViewport({ width: 1920, height: 1080 });
//     await page.setRequestInterception(true);
//     page.on('request', (req) => {
//         if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image') {
//             req.abort();
//         }
//         else {
//             req.continue();
//         }
//     });
//     await page.goto(url)
//     await page.waitForSelector('.spegc-event-item');
//     //let resourcesUpdated = []
//     const data = await page.evaluate(() => {
//         let dataResources = []
//         document.querySelectorAll('.spegc-event-item')
//             .forEach(element => {
//                 let name = element.querySelector('.spegc-event-details h3').textContent;
//                 let interest = element.querySelector('.spegc-event-details h4').textContent;
//                 let resourceType = element.querySelector('.spegc-event-details h5').textContent;
//                 let description = element.querySelector('.spegc-event-details p').textContent;
//                 let href = element.querySelector('.spegc-event-details a').getAttribute("href");

//                 if (resourceType === 'Cursos y talleres') {
//                     resourceType = 'N9KdlBYmxUp82gOv8oJC'
//                 } else if (resourceType === 'Eventos profesionales') {
//                     resourceType = 'EsV5yvTXtyIrVobpefB6'
//                 } else {
//                     resourceType = 'E19QFsYBxlcw3edEF2Qp'
//                 }

//                 if (interest === 'Emprendimiento') {
//                     interest = 'BVBV4H4mrghFRnQK3tOA'
//                 } else if (interest === 'Innovación turística') {
//                     interest = 'TRVa15HNc516NCdCOAeG'
//                 } else if (interest === 'Gestión empresarial') {
//                     interest = 'BVBV4H4mrghFRnQK3tOA'
//                 } else if (interest === 'Internacionalización') {
//                     interest = 'BVBV4H4mrghFRnQK3tOA'
//                 } else if (interest === 'Competencias digitales avanzadas') {
//                     interest = 'GTe4CPQHW0yIgVgRt03k'
//                 } else if (interest === 'Audiovisual') {
//                     interest = '8lOJhlXeeTsbsDqy8DTk'
//                 } else if (interest === 'Datos y analítica') {
//                     interest = 'eKoGjUxkRY1AqTZR3Tky'
//                 } else if (interest === 'i+D+i') {
//                     interest = 'GTe4CPQHW0yIgVgRt03k'
//                 } else if (interest === 'Innovación rural') {
//                     interest = 'GTe4CPQHW0yIgVgRt03k'
//                 } else if (interest === 'Marketing y diseño') {
//                     interest = '8lOJhlXeeTsbsDqy8DTk'
//                 } else if (interest === 'Sostenibilidad') {
//                     interest = 'eKoGjUxkRY1AqTZR3Tky'
//                 } else {
//                     interest = 'ecLsXVpU4GOnYQpSCL8y'
//                 }

//                 let resource = {
//                     title: name,
//                     description: description,
//                     resourceType: resourceType,
//                     interests: [interest],
//                     createdby: 'SPEGC Scrapper',
//                     updatedby: 'SPEGC Scrapper',
//                     capacity: 100,
//                     assistants: '0',
//                     link: href,
//                     duration: '-',
//                     organizer: 'btTAIYUkGSgqlEAnaZJB',
//                     organizationType: 'Organización',
//                     status: 'A actualizar',
//                     address: {
//                         city: 'U39M922HHR5FEVJtN3hN',
//                         country: 'i0GHKqdCWBYeAYcAMa7I',
//                         place: '-',
//                         province: 'mi3tu6DK1GU4yZIQJ1dZ',
//                         street: '-'

//                     },
//                 }
//                 dataResources.push(resource)

//             });
//         return dataResources
//     })

//     await browser.close()
//     return data
// }
// */
      
// // Web Scraping
exports.extractResourcesFromFormacionCamaraToledo = onMessagePublished({
  topic: 'scrappingFormacionCamaraToledo',
  memory: '1GiB',
}, async (message, context) => {
  const browser = await playwright.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true, // importante: headless debe ser booleano
  });

  const pageContext = await browser.newContext();
  const page = await pageContext.newPage();
  await page.goto('https://camaratoledo.com/formacion-espana-emprende/');

  const jobCards = await page.locator('div[data-elementor-type="loop-item"]').filter({ hasNotText: 'PRÓXIMAMENTE' }).filter({ hasNotText: 'FINALIZADO' }).all();
  console.log(`Nº de ofertas: ${jobCards.length}`);

  for (const jobCard of jobCards) {
    const jobLink = await jobCard.locator('.elementor-button-link').first().getAttribute('href');
    if (jobLink && jobLink.startsWith('https://camaratoledo.com/formacion')) {
      await jobCard.locator('.elementor-button-link').first().click();

      const body = await page.locator('body').getAttribute('class');
      const postIdMatch = body.match(/postid-(\d+)/);
      if (!postIdMatch || !postIdMatch[1]) {
        logger.error('No se pudo extraer el ID del post.');
        continue;
      }
      const postID = postIdMatch[1];
      const jobID = `camfor_${postID}`;

      const jobTitle = await page.locator('h1').first().innerText();

      let jobLocation = '';
      try {
        jobLocation = await page.getByText("Lugar").first().innerText();
        jobLocation = jobLocation.replace("Lugar", "").replace(":", "").trim();
      } catch {
        const altLocation = page.locator('.elementor-inner-section').filter({ hasText: 'Lugar' }).first();
        jobLocation = await altLocation.innerText();
        jobLocation = jobLocation.replace("Lugar", "").trim();
      }

      const descriptionElement = page.locator('.e-con-inner').filter({ hasText: 'DIRIGIDO' }).first();
      const jobDescription = await descriptionElement.innerText();

      const maximumDate = new Date(2050, 12, 31, 23, 59, 0);
      let randomImage = randomImages[Math.floor(Math.random() * randomImages.length)];

      const jobOffer = {
        address: {
          city: "vYcgz8Vy6qDj4Q5Pena6",
          country: "i0GHKqdCWBYeAYcAMa7I",
          place: jobLocation,
          province: "r7WT8mAsUdTAlPCKWstT",
        },
        assistants: 0,
        capacity: 99,
        contractType: "",
        createdate: adminFirebase.firestore.Timestamp.now(),
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
        resourceCategory: "6ag9Px7zkFpHgRe17PQk",
        resourcePhoto: randomImage,
        resourceType: "N9KdlBYmxUp82gOv8oJC",
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
        await db.collection("resources").add(jobOffer);
      } else {
        console.log(`No se insertó el recurso duplicado: ${jobTitle}`);
      }

      await page.goBack();
    }
  }

  await pageContext.close();
  await browser.close();
});

exports.extractResourcesFromEmpleoCamaraToledo = onMessagePublished(
  {
    topic: 'scrappingEmpleoCamaraToledo',
    memory: '1GiB',
  },
  async (event) => {
    const browser = await playwright.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('https://gestionandote.com/agencia/camaratoledo/ofertas');

    const jobCards = await page.locator('.card-ofertas').all();
    console.log(`Nº de ofertas: ${jobCards.length}`);

    for (const jobCard of jobCards) {
      const postID = await jobCard.getByRole('heading').locator('span').innerText();
      const jobID = `camemp_${postID}`;
      const jobTitle = await jobCard.getByRole('heading').locator('a').innerText();
      const jobLink = await jobCard.getByRole('heading').locator('a').getAttribute('href');
      const jobLocation = await jobCard.locator('.c-lugar').innerText();
      const jobDescription = await jobCard.locator('.c-desc').innerText();

      const maximumDate = new Date(2050, 12, 31, 23, 59, 0);
      const randomImage = randomImages[Math.floor(Math.random() * randomImages.length)];

      const jobOffer = {
        address: {
          city: "vYcgz8Vy6qDj4Q5Pena6",
          country: "i0GHKqdCWBYeAYcAMa7I",
          place: jobLocation,
          province: "r7WT8mAsUdTAlPCKWstT",
        },
        assistants: 0,
        capacity: 99,
        contractType: "",
        createdate: adminFirebase.firestore.Timestamp.now(),
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

      const query = await db.collection("resources").where("scrappingId", "==", jobID).get();
      if (query.empty) {
        console.log(`Insertando recurso: ${jobTitle}`);
        await db.collection("resources").add(jobOffer);
      } else {
        console.log(`Recurso duplicado no insertado: ${jobTitle}`);
      }
    }

    await context.close();
    await browser.close();
  }
);

exports.extractResourcesFromIPETA = onMessagePublished(
  {
    topic: 'scrappingIPETA',
    memory: '1GiB',
  },
  async (event) => {
    const browser = await playwright.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('https://ipetalavera.es/instituto/empleo/ofertas-de-empleo/');
    await page.waitForSelector('.jet-listing-grid__items', { state: 'attached' });

    const jobCards = await page.locator(".jet-listing-grid__item").all();
    logger.info(`Nº de ofertas: ${jobCards.length}`);

    for (const jobCard of jobCards) {
      const jobLink = await jobCard.locator(".elementor-button-link").getAttribute("href");
      const postId = await jobCard.getAttribute('data-post-id');
      const jobID = `ipeta_${postId}`;
      const jobTitle = await jobCard.locator('.elementor-element-e13832e > div > h2 > a').textContent();
      const jobDate = await jobCard.locator('.elementor-element-084441b > div > p').textContent();

      const listItems = await jobCard.locator('.elementor-icon-list-text').all();
      const jobLocation = await listItems[0].textContent();
      const capacityText = await listItems[1].textContent();
      const jobCapacity = parseInt(capacityText.match(/\d+/)[0]);
      const maximumDate = new Date(2050, 12, 31, 23, 59, 0);
      let randomImage = randomImages[Math.floor(Math.random() * randomImages.length)];

      let jobDescription = '';
      if (jobLink && jobLink.startsWith('https://ipetalavera.es/ofertas-de-trabajo')) {
        await page.goto(jobLink);
        jobDescription = await page.locator('.elementor-element-bd55b8f > div').textContent();
        await page.goBack();
      }

      const jobOffer = {
        address: {
          city: "vYcgz8Vy6qDj4Q5Pena6",
          country: "i0GHKqdCWBYeAYcAMa7I",
          place: jobLocation.toUpperCase(),
          province: "r7WT8mAsUdTAlPCKWstT",
        },
        assistants: 0,
        capacity: jobCapacity,
        contractType: "",
        createdate: adminFirebase.firestore.Timestamp.now(), // puedes parsear jobDate si lo necesitas
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
        logger.info(`Insertando recurso: ${jobTitle}`);
        await db.collection("resources").add(jobOffer);
      } else {
        logger.info(`No se insertó el recurso duplicado: ${jobTitle}`);
      }
    }

    await context.close();
    await browser.close();
  }
);

exports.extractResourcesFromSPEG = onMessagePublished( 
    {
    topic: 'scrappingSPEG',
    memory: '1GiB',
    }, async (event) => {
    const browser = await playwright.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: true,
      });
  
    const context = await browser.newContext();
    const page = await context.newPage();
  
    await page.goto('https://www.spegc.org/formacion-y-eventos/');
  
    const jobCards = await page.getByRole('article').filter({ hasNotText: 'Plazo finalizado' }).all();
    logger.info(`📄 Nº de ofertas: ${jobCards.length}`);
  
    for (const jobCard of jobCards) {
      let jobDescription = '';
      let jobID = '';
      let jobLocation = '';
      let jobDuration = 'Indefinido';
      let jobModality = 'Presencial';
      let maximumDate = new Date(2050, 12, 31, 23, 59, 0);
  
      const jobTitle = await jobCard.locator('h3').innerText();
      const randomImage = randomImages[Math.floor(Math.random() * randomImages.length)];
      const jobLink = await jobCard.locator('.spegc-event-details a').getAttribute('href');
  
      if (jobLink && jobLink.startsWith('https://www.spegc.org/formacion-y-eventos/')) {
        await jobCard.locator('.spegc-event-details a').click();
  
        const descriptionDiv = await page.locator('article > div').all();
        jobDescription = await descriptionDiv[3].innerText();
  
        const postId = await page.getByRole('article').getAttribute('id');
        jobID = `spegc_${postId.split('-')[1]}`;
  
        const locationElement = page.getByText("Lugar:").first();
        if (await locationElement.count() > 0) {
          const locationText = await locationElement.innerText();
          jobLocation = locationText.trim().split('Lugar:')[1].toUpperCase();
        }
  
        const durationElement = page.getByText("Duración:").first();
        if (await durationElement.count() > 0) {
          const durationText = await durationElement.innerText();
          jobDuration = durationText.trim().split('Duración:')[1];
        }
  
        const modalityElement = page.getByText("Modalidad:").first();
        if (await modalityElement.count() > 0) {
          const modalityText = await modalityElement.innerText();
          jobModality = modalityText.trim().split('Modalidad:')[1];
        }
  
        const maxDateElement = page.getByText("Límite de inscripción:").first();
        if (await maxDateElement.count() > 0) {
          const maxDateText = (await maxDateElement.innerText()).trim().split('Límite de inscripción:')[1];
          const [datePart, timePart] = maxDateText.trim().split(" ");
          const [day, month, year] = datePart.split("/");
          const [hours, minutes] = timePart.split(":");
  
          maximumDate = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hours),
            parseInt(minutes)
          );
        }
  
        await page.goBack();
      }
  
      const jobOffer = {
        address: {
          city: "U39M922HHR5FEVJtN3hN",
          country: "i0GHKqdCWBYeAYcAMa7I",
          place: jobLocation,
          province: "mi3tu6DK1GU4yZIQJ1dZ",
        },
        assistants: 0,
        capacity: 99,
        contractType: "",
        createdate: adminFirebase.firestore.Timestamp.now(),
        createdby: "Web scrapping",
        description: jobDescription,
        duration: jobDuration,
        enable: true,
        end: maximumDate,
        interests: [],
        lastupdate: adminFirebase.firestore.Timestamp.now(),
        link: jobLink,
        maximumDate: adminFirebase.firestore.Timestamp.fromDate(maximumDate),
        modality: jobModality,
        notExpire: true,
        online: false,
        organizer: "VrpgKatmJG4h4pxgvpZZ",
        organizerType: "Organización",
        resourceCategory: "6ag9Px7zkFpHgRe17PQk",
        resourcePhoto: randomImage,
        resourceType: "N9KdlBYmxUp82gOv8oJC",
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
        logger.info(`🆕 Insertando recurso: ${jobTitle}`);
        await db.collection("resources").add(jobOffer);
      } else {
        logger.info(`⛔ Recurso duplicado no insertado: ${jobTitle}`);
      }
    }
  
    await context.close();
    await browser.close();
  });

exports.updateResourceFromSPEG = onMessagePublished('updatingSPEG', (event) => {
    return adminFirebase.firestore()
      .collection('resources')
      .where('status', '==', 'A actualizar')
      .limit(1)
      .get()
      .then((snapshot) => {
        const writes = [];
  
        snapshot.forEach((docResource) => {
          const data = docResource.data();
  
          writes.push(
            scrapToCreate.add({
              resource: data.resourceId,
              link: data.link,
              updated: false,
            })
          );
  
          logger.info(`🛠 Recurso ${data.resourceId} marcado para actualización desde SPEG`);
        });
  
        return Promise.all(writes);
      })
      .catch((error) => {
        logger.error('❌ Error en updateResourceFromSPEG:', error);
      });
  });

  exports.extractJobOffersFromSEPE = onMessagePublished({
    topic: 'scrappingSEPE',
    memory: '1GiB',
  }, async (event) => {
    const browser = await playwright.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true, // importante: headless debe ser booleano
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("https://www.gobiernodecanarias.org/empleo/sce/principal/componentes/buscadores_angular/index_ofertas_empleo.jsp?Title_prop=null&cod_buscar=null");
  
    await page.waitForSelector(".article", { state: "attached" });
    const paginationElements = await page.locator(".ngx-pagination li").all();
    await paginationElements[6].click();
  
    let searching = true;
  
    while (searching) {
      await page.waitForSelector(".article", { state: "attached" });
      const jobCards = await page.locator(".article").all();
      console.log(`Nº de ofertas en la página: ${jobCards.length}`);
  
      for (const jobCard of jobCards) {
        try {
          const jobTitle = await jobCard.getByRole("heading").innerText();
          await jobCard.locator("a").click();
  
          const dialog = page.locator(".mdc-dialog__container");
          const tdElements = await dialog.locator("td").all();
  
          const offerId = await tdElements[1].innerText();
          const jobID = `sepeofe_${offerId}`;
          const jobLocation = await tdElements[3].innerText();
          const capacityText = await tdElements[7].innerText();
          const jobCapacity = parseInt(capacityText);
          const jobLink = await dialog.getByText("enlace").getAttribute("href");
  
          const tableElements = await dialog.getByRole("table").all();
          const tableTDElements = await tableElements[1].locator("td").all();
          let jobDescription = "";
          for (let i = 0; i < tableTDElements.length; i++) {
            const label = await tableTDElements[i++].innerText();
            const value = await tableTDElements[i].innerText();
            jobDescription += `· ${label} ${value}\n`;
          }
  
          await dialog.getByRole("button").first().click();
  
          const maximumDate = new Date(2050, 12, 31, 23, 59, 0);
          const randomImage = randomImages[Math.floor(Math.random() * randomImages.length)];
  
          let provinceId = "mi3tu6DK1GU4yZIQJ1dZ";
          let cityId = "U39M922HHR5FEVJtN3hN";
          const island = jobLocation.split(",")[1]?.trim().toUpperCase();
          if (["TENERIFE", "LA GOMERA", "EL HIERRO", "LA PALMA"].includes(island)) {
            provinceId = "XFtEq16heJenhrEid57m";
            cityId = "RtnVLp0Ziuu5jYHVTyzM";
          }
  
          const jobOffer = {
            address: {
              city: cityId,
              country: "i0GHKqdCWBYeAYcAMa7I",
              place: jobLocation,
              province: provinceId,
            },
            assistants: 0,
            capacity: jobCapacity,
            contractType: "",
            createdate: adminFirebase.firestore.Timestamp.now(),
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
            await db.collection("resources").add(jobOffer);
          } else {
            console.log(`No se insertó el recurso duplicado: ${jobTitle}`);
            searching = false;
          }
        } catch (err) {
          console.error("Error procesando una oferta:", err);
        }
      }
  
      console.log(`Navegando a página anterior...`);
      await paginationElements[0].click();
    }
  
    await context.close();
    await browser.close();
  });

exports.extractEmployabilityFromSEPE = onMessagePublished(
    {
      topic: 'scrappingEmployabilitySEPE',
      memory: '1GiB',
      timeoutSeconds: 540,
      region: 'us-central1',
    },
    async (event) => {
      const months = {
        enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
        julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
      };
  
      const browser = await playwright.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: true,
      });
  
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto('https://www3.gobiernodecanarias.org/empleo/infotemporal/infotemporales');
      await page.waitForSelector('.element.ng-star-inserted', { state: 'attached' });
  
      const jobCards = await page.locator('.element.ng-star-inserted').all();
      logger.info(`Nº de ofertas: ${jobCards.length}`);
  
      for (const jobCard of jobCards) {
        var jobID = '';
        var modality = 'Presencial';
        var jobDescription = '';
        var jobLocation = '';
        var jobDuration = 'Indefinido';
        var startDate = Date.now();

        await jobCard.getByRole('button').last().click();
        const jobTitle = await jobCard.locator('.title').innerText();
        //console.log(`TÍTULO: ${jobTitle}`);
            
        modality = await jobCard.getByText('resencial').first().innerText();
        if (modality === 'No Presencial') {
            modality = 'Online';
        }
        //console.log(`MODALIDAD: ${modality}`);

        const descriptionDivText = await jobCard.getByText('Descripción:').locator('..').innerText();
        jobDescription = descriptionDivText.split("Descripción:")[1].trim();
        //console.log(`DESCRIPCIÓN: ${jobDescription}`);

        const durationDivText = await jobCard.getByText('Duración:').locator('..').last().innerText();
        jobDuration = durationDivText.split("Duración:")[1].trim();
        //console.log(`DURACIÓN: ${jobDuration}`);

        let maxDateDivText = await jobCard.getByText('Fecha límite de inscripción:').locator('..').innerText();
        var maximumDateString = maxDateDivText.split("Fecha límite de inscripción:")[1].trim();
        var dateSplit = maximumDateString.split(' ');
        var day = parseInt(dateSplit[1]);
        var month = months[dateSplit[3].toLowerCase()];
        var year = parseInt(dateSplit[5]);
        const maximumDate = new Date(year, month, day, 23, 59, 0);
        //console.log(`FECHA LÍMITE: ${maximumDate}`);

            
        const startDateDivText = await jobCard.getByText('Fecha de inicio:').locator('..').innerText();
        var startDateString = startDateDivText.split("Fecha de inicio:")[1].trim();
        dateSplit = startDateString.split(' ');
        day = parseInt(dateSplit[1]);
        month = months[dateSplit[3].toLowerCase()];
        year = parseInt(dateSplit[5]);
        startDate = new Date(year, month, day, 23, 59, 0);
        //console.log(`FECHA INICIO: ${startDate}`);

        const endDateDivText = await jobCard.getByText('Fecha final:').locator('..').innerText();
        var endDateString = endDateDivText.split("Fecha final:")[1].trim();
        dateSplit = endDateString.split(' ');
        day = parseInt(dateSplit[1]);
        month = months[dateSplit[3].toLowerCase()];
        year = parseInt(dateSplit[5]);
        var endDate = maximumDate;
        endDate = new Date(year, month, day, 23, 59, 0);
        //console.log(`FECHA FINAL: ${endDate}`);

        var provinceId = "mi3tu6DK1GU4yZIQJ1dZ";
        var cityId = "U39M922HHR5FEVJtN3hN";
        if (modality === 'Presencial') {
            var island = '';
            const locationDivButton = jobCard.getByText('Isla').first().locator('..').getByRole('button');
            const locationDivButtonCount = await locationDivButton.count();
            if (locationDivButtonCount > 0) {
                await locationDivButton.click();
                island = await page.getByRole('dialog').locator('td').first().innerText();
                await page.getByRole('dialog').getByRole('button').click();
            } else {
                jobLocation = await jobCard.getByText('Isla').first().locator('..').innerText();
                jobLocation = jobLocation.split(':')[1].trim();
                island = jobLocation.split("/")[0].trim().toUpperCase();
                jobLocation = jobLocation.split("/")[1].trim();
            }
            //console.log(`LOCALIZACIÓN: ${island} --> ${jobLocation}`);
                
            if (island === 'TENERIFE' || island === 'LA GOMERA' || island === 'EL HIERRO' || island === 'LA PALMA') {
                provinceId = "XFtEq16heJenhrEid57m";
                cityId = 'RtnVLp0Ziuu5jYHVTyzM';
            }
        }
            
            
        jobID = `sepeemp_${jobTitle}_${startDate.toLocaleDateString('es-ES', {timeZone: 'Atlantic/Canary', })}`;
        //console.log(`JOB ID: ${jobID}`);
        // No hay link especfico para cada recurso
        let jobLink = 'https://www.gobiernodecanarias.org/empleo/sce/principal/areas_tematicas/empleo/orientacion_para_el_empleo/acciones_de_la_red_de_empleabilidad_canaria.html';
        let randomImage = randomImages[Math.floor(Math.random() * randomImages.length)];
        var jobCapacity = 99;   
    
        let jobOffer = {
            address: {
                // TODO: Ahora mismo solo guarda Las Palmas o Sta. Cruz, en la Base de Datos faltarían muchísimas ciudades
                city: cityId,
                country: "i0GHKqdCWBYeAYcAMa7I",
                place: jobLocation,
                province: provinceId,
            },
            assistants: 0,
            capacity: jobCapacity,
            contractType: "",
            createdate: adminFirebase.firestore.Timestamp.now(),
            createdby: "Web scrapping",
            description: jobDescription,
            duration: 'Indefinido',
            enable: true,
            end: endDate,
            interests: [],
            lastupdate: adminFirebase.firestore.Timestamp.now(),
            link: jobLink,
            maximumDate: adminFirebase.firestore.Timestamp.fromDate(maximumDate),
            modality: modality,
            notExpire: true,
            online: false,
            organizer: "VrpgKatmJG4h4pxgvpZZ", // SIC4Change
            organizerType: "Organización",
            resourceCategory: "6ag9Px7zkFpHgRe17PQk",
            resourcePhoto: randomImage,
            resourceType: "N9KdlBYmxUp82gOv8oJC",
            salary: "",
            start: startDate,
            status: "Disponible",
            title: jobTitle,
            trust: true,
            updatedby: "Web scrapping",
            scrappingId: jobID,
        };

        const query = await db.collection("resources").where("scrappingId", "==", jobID).get();
        if (query.empty) {
          logger.info(`Insertando recurso: ${jobTitle}`);
          await db.collection("resources").add(jobOffer);
        } else {
          logger.info(`No se insertó el recurso duplicado: ${jobTitle}`);
        }
      }
  
      await context.close();
      await browser.close();
    }
  );

// // No se está usando, si algún día se usa hay que migrar de Puppeteer a Playwright
// exports.extractResourcesFromFundaula = functions.runWith(options).pubsub.topic('scrappingFundaula').onPublish(async (message) => {
//     const browser = await puppeteer.launch({
//         headless: true,
//         args: ['--no-sandbox', '--disable-setuid-sandbox']
//     })
//     const page = await browser.newPage();
//     await page.goto('https://www.fundaula.es/cursos/digitales?p=12354&locale=es-ES');
//     const links = [];

//     // "Conocimientos Digitales" tab
//     await page.waitForSelector('.box-filtro-size');
//     await setTimeout(2000);
//     var filterButtons = await page.$$('.box-filtro-size');
//     for (let i = 0; i < filterButtons.length; i++) {
//         let button = filterButtons[i];  
//         await button.evaluate(b => b.click());
//         await setTimeout(2000);
//     }
//     await page.waitForSelector('box-curso');
//     var jobCards = await page.$$('box-curso');
//     console.log(`Nº de ofertas TAB 1: ${jobCards.length}`);
//     for (let i = 0; i < jobCards.length; i++) {
//         let jobCard = jobCards[i];    
//         const a = await jobCard.$('a');
//         const href = await a.getProperty('href');
//         const link = await href.jsonValue();
//         links.push(link);
//     }

//     // "Conocimientos Técnicos" tab
//     const tabButtons = await page.$$('.menu_fund span');
//     await tabButtons[1].evaluate(b => b.click());
//     await setTimeout(2000);
//     await page.waitForSelector('.box-filtro-size');
//     await setTimeout(2000);
//     filterButtons = await page.$$('.box-filtro-size');
//     for (let i = 0; i < filterButtons.length; i++) {
//         let button = filterButtons[i];  
//         await button.evaluate(b => b.click());
//         await setTimeout(2000);
//     }
//     await page.waitForSelector('box-curso');
//     jobCards = await page.$$('box-curso');
//     console.log(`Nº de tarjetas desplegables TAB 2: ${jobCards.length}`);
//     for (let i = 0; i < jobCards.length; i++) {
//         let jobCard = jobCards[i];    
//         const detailsButton = await jobCard.$('.box-curso-tercerafila-2');
//         await detailsButton.evaluate(b => b.click());
//         await setTimeout(2000);
//         const aElements = await page.$$('.subcomponente-container-new a');
//         for (let j = 0; j < aElements.length; j++) {
//             const href = await aElements[j].getProperty('href');
//             const link = await href.jsonValue();
//             links.push(link);
//         }
//         await detailsButton.evaluate(b => b.click());
//         await setTimeout(2000);
//     }

//     // "Conocimientos Técnicos" tab
//     await tabButtons[2].evaluate(b => b.click());
//     await setTimeout(2000);
//     await page.waitForSelector('.box-filtro-size');
//     await setTimeout(2000);
//     filterButtons = await page.$$('.box-filtro-size');
//     for (let i = 0; i < filterButtons.length; i++) {
//         let button = filterButtons[i];  
//         await button.evaluate(b => b.click());
//         await setTimeout(2000);
//     }
//     await page.waitForSelector('box-curso');
//     jobCards = await page.$$('box-curso');
//     console.log(`Nº de ofertas TAB 3: ${jobCards.length}`);
//     for (let i = 0; i < jobCards.length; i++) {
//         let jobCard = jobCards[i];    
//         const a = await jobCard.$('a');
//         const href = await a.getProperty('href');
//         const link = await href.jsonValue();
//         links.push(link);
//     }

//     // All jobs
//     console.log(`Nº de ofertas TOTALES: ${links.length}`);
//     for (let i = 0; i < links.length; i++) {
//         //console.log('----------------------------------');
//         const jobLink = links[i];
//         await page.goto(links[i]);
//         //console.log(`LINK ---> ${jobLink}`);
//         const mainDiv = await page.waitForSelector('.subcontainer');

//         const titleElement = await mainDiv.waitForSelector('h1');
//         var jobTitle = await titleElement.evaluate(element => element.textContent.trim());
//         //console.log(`TÍTULO ---> ${jobTitle}`);

//         const pElements = await mainDiv.$$('p');
//         var jobDescription = '';
//         for (let j = 0; j < pElements.length; j++) {
//             text = await pElements[j].evaluate(element => element.textContent.trim());
//             var jobDescription = `${jobDescription} ${text}`;
//         }
//         //console.log(`DESCRIPCIÓN ---> ${jobDescription}`);

//         const infoSpanElements = await mainDiv.$$('.text_courseaddinfo');
//         const jobDuration = await infoSpanElements[0].evaluate(e => e.textContent);
//         //console.log(`DURACIÓN ---> ${jobDuration}`);

//         const jobModality = await infoSpanElements[1].evaluate(e => e.textContent);
//         //console.log(`MODALIDAD ---> ${jobModality}`);

//         const jobID = `fundaula_${jobLink}`;
//         const maximumDate = new Date(2050, 12, 31, 23, 59, 0);
//         let randomImage = randomImages[Math.floor(Math.random() * randomImages.length)];

//         let jobOffer = {
//             address: {
//                 city: "U39M922HHR5FEVJtN3hN", 
//                 country: "i0GHKqdCWBYeAYcAMa7I",
//                 place: "", 
//                 province: "mi3tu6DK1GU4yZIQJ1dZ",
//             },
//             assistants: 0,
//             capacity: 99, 
//             contractType: "",
//             createdate: adminFirebase.firestore.Timestamp.now(),
//             createdby: "Web scrapping",
//             description: jobDescription,
//             duration: jobDuration,
//             enable: true,
//             end: adminFirebase.firestore.Timestamp.fromDate(maximumDate), 
//             interests: [],
//             lastupdate: adminFirebase.firestore.Timestamp.now(),
//             link: jobLink,
//             maximumDate: adminFirebase.firestore.Timestamp.fromDate(maximumDate),
//             modality: jobModality,
//             notExpire: true,
//             online: false,
//             organizer: "VrpgKatmJG4h4pxgvpZZ", // SIC4Change
//             organizerType: "Organización",
//             resourceCategory: "6ag9Px7zkFpHgRe17PQk",
//             resourcePhoto: randomImage,
//             resourceType: "N9KdlBYmxUp82gOv8oJC",
//             salary: "", 
//             start: adminFirebase.firestore.Timestamp.now(),
//             status: "Disponible",
//             title: jobTitle,
//             trust: true,
//             updatedby: "Web scrapping",
//             scrappingId: jobID,
//         };

//         const query = await db.collection("resourcesTestFundaula").where("scrappingId", "==", jobID).get();
//         if (query.empty) {
//             console.log(`Insertando recurso ${jobTitle}`);
//             db.collection("resourcesTestFundaula").add(jobOffer);
//         }
//     }
    
//     await browser.close();
//   });

exports.createScrapp = onDocumentCreated("scrapps/{scrapId}", async (event) => {
  const snapshot = event.data;
  const scrap = snapshot.data();

  try {
    const res = await findResourceDetailFromSPEGC(scrap.link);
    const details = res[0];

    const docRef = adminFirebase.firestore().doc(`resources/${scrap.resource}`);
    await docRef.update({
      modality: "Semipresencial",
      address: {
        city: "U39M922HHR5FEVJtN3hN",
        country: "i0GHKqdCWBYeAYcAMa7I",
        place: details.place,
        province: "mi3tu6DK1GU4yZIQJ1dZ",
        street: "-",
      },
      maximumDate: adminFirebase.firestore.Timestamp.fromMillis(details.limit),
      start: adminFirebase.firestore.Timestamp.fromMillis(details.start),
      end: adminFirebase.firestore.Timestamp.fromMillis(details.end),
      status: "Disponible",
      enable: true,
    });

    logger.log(`Successfully updated resource ${scrap.resource} with scrapped details.`);
  } catch (error) {
    logger.error(`Failed to update resource from scrapp: ${error.message}`, error);
    throw new Error("createScrapp failed");
  }
});



const findResourceDetailFromSPEGC = async (url) => {
  const browser = await playwright.chromium.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  const data = await page.evaluate(() => {
    try {
      const dataresource = [];
      const value = document.querySelector('.col-md-9')?.innerHTML ?? '';

      const limitIcon = '<i class="far fa-calendar-times"></i> Límite de inscripción: ';
      const startLimit = value.indexOf(limitIcon);
      if (startLimit === -1) throw new Error("No se encontró la fecha límite.");

      const lengthLimitText = limitIcon.length;
      const limitStr = value.slice(startLimit + lengthLimitText, value.indexOf('<br>', startLimit)).trim();

      const sizeFechas = 'Fechas: '.length;
      let fechasBlock = value.substr(value.indexOf('Fechas: '));
      const dateStr = fechasBlock.slice(sizeFechas, fechasBlock.indexOf('<br>')).trim();

      let placeBlock = value.substr(value.indexOf('<h4>Lugar </h4>'));
      placeBlock = placeBlock.slice(placeBlock.indexOf('<p>') + 3, placeBlock.indexOf('</p>')).trim();
      const place = placeBlock.includes('</a>') ? placeBlock.slice(placeBlock.indexOf('>') + 1, placeBlock.indexOf('</a>')) : placeBlock;

      // Parse date limit
      const parseDate = (str) => {
        const [day, month, yearTime] = str.split('/');
        const [year, hourMin] = yearTime.split(' ');
        const [hour, min] = hourMin.split(':');
        return new Date(+year, +month - 1, +day, +hour, +min);
      };

      const dateLimit = parseDate(limitStr);
      const [startStr, endStrRaw] = dateStr.split(' - ');
      const endStr = endStrRaw.length === 5 ? startStr.split(' ')[0] + ' ' + endStrRaw : endStrRaw;

      const dateStart = parseDate(startStr);
      const dateEnd = parseDate(endStr);

      dataresource.push({
        limit: dateLimit.getTime(),
        start: dateStart.getTime(),
        end: dateEnd.getTime(),
        place: place,
      });

      return dataresource;
    } catch (err) {
      console.error("Scraping error in page.evaluate:", err);
      return [];
    }
  });

  await browser.close();
  return data;
};


// exports.deleteResource = functions.firestore
//     .document('resources/{resourceId}')
//     .onDelete((snapshot, context) => {
//         const deletedResource = snapshot.data();
//         if (deletedResource.participants !== undefined && deletedResource.participants.length > 0) {
//             deletedResource.participants.forEach((user) => {
//                 const payload = {
//                     notification: {
//                         title: 'Enreda',
//                         body: `Ha sido cancelado o suspendido el recurso: ${deletedResource.title}`,
//                         sound: "default"
//                     },
//                     data: {
//                         click_action: "FLUTTER_NOTIFICATION_CLICK",
//                         title: 'Enreda',
//                         body: `Ha sido cancelado o suspendido el recurso: ${deletedResource.title}`,
//                     }
//                 };
//                 const options = {
//                     priority: "high",
//                     timeToLive: 60 * 60 * 24
//                 };
//                 return adminFirebase.messaging().sendToTopic(user, payload, options);
//             })
//         }
//     });
exports.updateResourceEmail = onDocumentUpdated('resources/{resourceId}', async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
  
    if (!before || !after) {
      logger.warn('⚠️ No se encontraron datos válidos en before/after');
      return;
    }
  
    const hasChanged =
      JSON.stringify(after.address) !== JSON.stringify(before.address) ||
      !after.start?.isEqual?.(before.start) ||
      !after.end?.isEqual?.(before.end) ||
      after.duration !== before.duration;
  
    if (!hasChanged) {
      logger.info(`ℹ️ Recurso ${before.resourceId} no ha cambiado en campos relevantes.`);
      return;
    }
  
    const payload = {
      notification: {
        title: 'Enreda',
        body: `Ha cambiado el recurso: ${before.title}`,
      },
      data: {
        resourceId: before.resourceId,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        title: 'Enreda',
        body: `Ha cambiado el recurso: ${before.title}`,
      },
    };
  
    const options = {
      priority: 'high',
      timeToLive: 60 * 60 * 24, // 1 día en segundos
    };
  
    const participants = before.participants || [];
    const messaging = adminFirebase.messaging();

    await Promise.all(
      participants.map((userTopic) =>
        messaging.send({
          topic: userTopic,
          notification: payload.notification,
          data: payload.data,
          android: {
            priority: options.priority,
            ttl: options.timeToLive * 1000, // convertir a milisegundos
          },
        }).catch((err) => {
          logger.error(`❌ Error enviando notificación al topic ${userTopic}`, err);
        })
      )
    );
  
    logger.info(`✔ Notificaciones enviadas a ${participants.length} participantes del recurso ${before.resourceId}`);
  });

  exports.scheduleWeekEmail = onMessagePublished('scheduleWeekEmail', async (event) => {
    try {
      const payload = {
        notification: {
          title: 'Enreda',
          body: `Nuevos recursos basados en tus intereses`,
        },
        data: {
          click_action: "FLUTTER_NOTIFICATION_CLICK",
          title: 'Enreda',
          body: `Nuevos recursos basados en tus intereses`,
        }
      };
  
      const options = {
        priority: "high",
        timeToLive: 60 * 60 * 24
      };
  
      await adminFirebase.messaging().send({
        topic: 'weeknotification',
        notification: payload.notification,
        data: payload.data,
        android: {
          priority: options.priority,
          ttl: options.timeToLive * 1000, // TTL en milisegundos
          notification: {
            sound: 'default'
          }
        }
      });
  
      logger.info('✔ Notificación semanal enviada al topic "weeknotification"');
    } catch (error) {
      logger.error('❌ Error enviando la notificación semanal:', error);
    }
  });

exports.createCertificate = onDocumentCreated('certificates/{certificateId}', async (event) => {
  const certificateId = event.params.certificateId;
  const snapshot = event.data;
  if (!snapshot) {
    logger.error('No snapshot found in event');
    return;
  }

  const data = snapshot.data();
  if (!data) {
    logger.error('Snapshot data is undefined');
    return;
  }

  await adminFirebase.firestore()
    .doc(`certificates/${certificateId}`)
    .set({ certificateId }, { merge: true });

  const creator = data.creator || '';
  if (creator === '') {
    const resourceId = data.resource;
    if (!resourceId) {
      logger.warn(`Resource ID not found in certificate ${certificateId}`);
      return;
    }

    const querySnapshot = await adminFirebase.firestore()
      .collection('resources')
      .where('resourceId', '==', resourceId)
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      logger.warn(`No resource found with resourceId: ${resourceId}`);
      return;
    }

    const resourceDoc = querySnapshot.docs[0];
    const organizer = resourceDoc.data().organizer;

    await adminFirebase.firestore()
      .doc(`certificates/${certificateId}`)
      .set({ creator: organizer }, { merge: true });

    logger.info(`Successfully added creator to certificate ${certificateId}`);
  } else {
    logger.info(`Creator already present in certificate ${certificateId}`);
  }
});

async function updateResourceSearchText(resource, resourceId) {
        let resourceTypeName = '';
        let organizerName = '';
        let countryName = '';
        let provinceName = '';
        let cityName = '';
        let document;
    
        if (resource.data().resourceType) {
            document = await adminFirebase.firestore().collection('resourcesTypes').doc(resource.data().resourceType).get();
            resourceTypeName = document.data().name;
        }
    
        if (resource.data().organizerType === "Organización" && resource.data().organizer) {
            document = await adminFirebase.firestore().collection('organizations').doc(resource.data().organizer).get();
            organizerName = document.data().name;
        }

        if (resource.data().organizerType === "Entidad Social" && resource.data().organizer) {
            document = await adminFirebase.firestore().collection('socialEntities').doc(resource.data().organizer).get();
            organizerName = document.data().name;
        }

        if (resource.data().organizerType === "Empresa" && resource.data().organizer) {
            document = await adminFirebase.firestore().collection('companies').doc(resource.data().organizer).get();
            organizerName = document.data().name;
        }
    
        if (resource.data().address.country && resource.data().address.country != "undefined") {
            document = await adminFirebase.firestore().collection('countries').doc(resource.data().address.country).get();
            countryName = document.data().name;
        }
    
        if (resource.data().address.province && resource.data().address.province != "undefined") {
            document = await adminFirebase.firestore().collection('provinces').doc(resource.data().address.province).get();
            provinceName = document.data().name;
        }
    
        if (resource.data().address.city && resource.data().address.city != "undefined") {
            document = await adminFirebase.firestore().collection('cities').doc(resource.data().address.city).get();
            cityName = document.data().name;
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


// exports.scheduledFirestoreExport = functions.pubsub.schedule('every 24 hours').onRun((context) => {
//     const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
//     const databaseName = client.databasePath(projectId, '(default)');
//     return client.exportDocuments({
//         name: databaseName,
//         outputUriPrefix: bucket,
//         collectionIds: []
//     }).then(responses => {
//         const response = responses[0];
//         console.log(`Operation Name: ${response['name']}`);
//     }).catch(err => {
//         console.error(err);
//         throw new Error('Export operation failed');
//     });
// });

exports.updateCertificationRequest = onDocumentUpdated(
  'certificationsRequests/{certificationRequestId}',
  async (event) => {
    const after = event.data?.after?.data();
    const before = event.data?.before?.data();

    if (!after || !before) {
      logger.warn('❌ No se pudieron obtener los datos before/after del documento.');
      return;
    }

    const certificationRequestId = event.params.certificationRequestId;
    const userId = after.unemployedRequesterId;
    const competencyId = after.competencyId;

    if (after.certified !== before.certified) {
      try {
        const snapshot = await adminFirebase.firestore()
          .collection('users')
          .where("userId", "==", userId)
          .get();

        if (snapshot.empty) {
          logger.warn(`⚠️ No se encontró usuario con userId: ${userId}`);
          return;
        }

        const updates = snapshot.docs.map(async (user) => {
          const competencies = user.get('competencies') || {};
          competencies[competencyId] = "certified";

          await adminFirebase.firestore()
            .doc(`users/${user.id}`)
            .set({ competencies }, { merge: true });

          logger.info(`✔ Competencia certificada actualizada para el usuario ${user.id}`);
        });

        await Promise.all(updates);
      } catch (error) {
        logger.error('❌ Error actualizando certificación en competencias:', error);
      }
    }
  }
);

// exports.certificationRequestForm = functions.firestore
//     .document('certificationsRequests/{certificationRequestId}')
//     .onCreate((snapshot, context) => {
//         const certificationRequestId = context.params.certificationRequestId;
//         const certifierName = snapshot.get('certifierName');
//         const competencyName = snapshot.get('competencyName');
//         const unemployedRequesterName = snapshot.get('unemployedRequesterName');

//         return adminFirebase.firestore().doc(`certificationsRequests/${certificationRequestId}`).set({ certificationRequestId }, {
//             merge: true
//         })
//             .then(() => {
//                 return adminFirebase.firestore().collection('mail').add({
//                     to: snapshot.get('email'),
//                     message: {
//                         subject: `${unemployedRequesterName} necesita que le certifiques una competencia.`,
//                         html:
//                             createCertificationRequestTemplate(certifierName,
//                                 competencyName, unemployedRequesterName, certificationRequestId),
//                     }
//                 }).then(() => console.log('Queued email!'));
//             });
//     });




function createCertificationRequestTemplate(certifierName, competencyName, unemployedRequesterName, certificationRequestId) {
    const certificationRequestTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="es">
    <head>
    <meta charset="UTF-8">
    <meta content="width=device-width, initial-scale=1" name="viewport">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta content="telephone=no" name="format-detection">
    <title>Copia de (1) nuevo email</title><!--[if (mso 16)]>
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
    [data-ogsb] .es-button.es-button-1719310999593 {
        padding:10px 30px!important;
    }
    @media only screen and (max-width:600px) {p, ul li, ol li, a { line-height:150%!important } h1, h2, h3, h1 a, h2 a, h3 a { line-height:120% } h1 { font-size:36px!important; text-align:left } h2 { font-size:26px!important; text-align:left } h3 { font-size:20px!important; text-align:left } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size:36px!important; text-align:left } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size:26px!important; text-align:left } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size:20px!important; text-align:left } .es-menu td a { font-size:12px!important } .es-header-body p, .es-header-body ul li, .es-header-body ol li, .es-header-body a { font-size:14px!important } .es-content-body p, .es-content-body ul li, .es-content-body ol li, .es-content-body a { font-size:16px!important } .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size:14px!important } .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size:12px!important } *[class="gmail-fix"] { display:none!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align:right!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-button-border { display:inline-block!important } a.es-button, button.es-button { font-size:20px!important; display:inline-block!important } .es-adaptive table, .es-left, .es-right { width:100%!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .es-adapt-td { display:block!important; width:100%!important } .adapt-img { width:100%!important; height:auto!important } .es-m-p0 { padding:0!important } .es-m-p0r { padding-right:0!important } .es-m-p0l { padding-left:0!important } .es-m-p0t { padding-top:0!important } .es-m-p0b { padding-bottom:0!important } .es-m-p20b { padding-bottom:20px!important } .es-mobile-hidden, .es-hidden { display:none!important } tr.es-desk-hidden, td.es-desk-hidden, table.es-desk-hidden { width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } tr.es-desk-hidden { display:table-row!important } table.es-desk-hidden { display:table!important } td.es-desk-menu-hidden { display:table-cell!important } .es-menu td { width:1%!important } table.es-table-not-adapt, .esd-block-html table { width:auto!important } table.es-social { display:inline-block!important } table.es-social td { display:inline-block!important } .es-m-p5 { padding:5px!important } .es-m-p5t { padding-top:5px!important } .es-m-p5b { padding-bottom:5px!important } .es-m-p5r { padding-right:5px!important } .es-m-p5l { padding-left:5px!important } .es-m-p10 { padding:10px!important } .es-m-p10t { padding-top:10px!important } .es-m-p10b { padding-bottom:10px!important } .es-m-p10r { padding-right:10px!important } .es-m-p10l { padding-left:10px!important } .es-m-p15 { padding:15px!important } .es-m-p15t { padding-top:15px!important } .es-m-p15b { padding-bottom:15px!important } .es-m-p15r { padding-right:15px!important } .es-m-p15l { padding-left:15px!important } .es-m-p20 { padding:20px!important } .es-m-p20t { padding-top:20px!important } .es-m-p20r { padding-right:20px!important } .es-m-p20l { padding-left:20px!important } .es-m-p25 { padding:25px!important } .es-m-p25t { padding-top:25px!important } .es-m-p25b { padding-bottom:25px!important } .es-m-p25r { padding-right:25px!important } .es-m-p25l { padding-left:25px!important } .es-m-p30 { padding:30px!important } .es-m-p30t { padding-top:30px!important } .es-m-p30b { padding-bottom:30px!important } .es-m-p30r { padding-right:30px!important } .es-m-p30l { padding-left:30px!important } .es-m-p35 { padding:35px!important } .es-m-p35t { padding-top:35px!important } .es-m-p35b { padding-bottom:35px!important } .es-m-p35r { padding-right:35px!important } .es-m-p35l { padding-left:35px!important } .es-m-p40 { padding:40px!important } .es-m-p40t { padding-top:40px!important } .es-m-p40b { padding-bottom:40px!important } .es-m-p40r { padding-right:40px!important } .es-m-p40l { padding-left:40px!important } .es-desk-hidden { display:table-row!important; width:auto!important; overflow:visible!important; max-height:inherit!important } .h-auto { height:auto!important } }
    @media screen and (max-width:384px) {.mail-message-content { width:414px!important } }
    </style>
    </head>
    <body style="width:100%;font-family:arial, 'helvetica neue', helvetica, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
    <div dir="ltr" class="es-wrapper-color" lang="es" style="background-color:#FAFAFA"><!--[if gte mso 9]>
                <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
                    <v:fill type="tile" color="#fafafa"></v:fill>
                </v:background>
            <![endif]-->
    <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#FAFAFA">
        <tr>
        <td valign="top" style="padding:0;Margin:0">
        <table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
            <tr>
            <td align="center" style="padding:0;Margin:0">
            <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                <tr>
                <td align="left" bgcolor="#054D5E" style="padding:0;Margin:0;background-color:#054d5e;border-radius:20px">
                <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                    <tr>
                    <td align="center" valign="top" style="padding:0;Margin:0;width:600px">
                    <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:separate;border-spacing:0px;border-radius:25px" role="presentation">
                        <tr class="es-visible-simple-html-only">
                        <td align="center" style="padding:0;Margin:0;padding-top:25px;font-size:0px"><a target="_blank" href="https://www.enredas.org/" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#5C68E2;font-size:14px"><img class="adapt-img" src="https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/images%2Fask-certification.png?alt=media&token=cebcfd88-73a5-44f3-a660-45f6043a6170" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="600"></a></td>
                        </tr>
                        <tr>
                        <td align="center" class="es-m-txt-c" style="padding:0;Margin:0;padding-bottom:25px;padding-top:35px"><h1 style="Margin:0;line-height:24px;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:20px;font-style:normal;font-weight:bold;color:#ffffff"><strong>Solicitud de Certificación de competencia</strong></h1></td>
                        </tr>
                        <tr>
                        <td align="left" style="padding:0;Margin:0;padding-top:10px;padding-left:40px;padding-right:40px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px;text-align:center">Hola ${certifierName},</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px;text-align:center"><br></p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px">Desde la web de Enreda, ${unemployedRequesterName} está solicitando la certificación de la siguiente competencia:</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px"><br></p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px;text-align:center"><strong>${competencyName}</strong></p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px;text-align:center"><br></p></td>
                        </tr>
                        <tr>
                        <td align="center" style="Margin:0;padding-top:10px;padding-bottom:25px;padding-left:25px;padding-right:25px"><span class="es-button-border" style="border-style:solid;border-color:#18c5c1;background:#18c5c1;border-width:2px;display:inline-block;border-radius:25px;width:auto"><a href="https://enredawebapp.web.app/competencies/${certificationRequestId}" class="es-button es-button-1719310999593" target="_blank" style="mso-style-priority:100 !important;text-decoration:none;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;color:#FFFFFF;font-size:16px;padding:10px 30px;display:inline-block;background:#18c5c1;border-radius:25px;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-weight:normal;font-style:normal;line-height:19px;width:auto;text-align:center;mso-padding-alt:0;mso-border-alt:10px solid #18c5c1">Certificar competencia</a></span></td>
                        </tr>
                        <tr>
                        <td align="center" style="Margin:0;padding-top:10px;padding-bottom:25px;padding-left:40px;padding-right:40px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px">¡Muchas gracias!</p></td>
                        </tr>
                        <tr>
                        <td align="center" style="padding:0;Margin:0;padding-bottom:25px;padding-left:40px;padding-right:40px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:18px;color:#ffffff;font-size:12px">El equipo de Enreda</p></td>
                        </tr>
                    </table></td>
                    </tr>
                </table></td>
                </tr>
            </table></td>
            </tr>
        </table>
        <table cellpadding="0" cellspacing="0" class="es-footer" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top">
            <tr>
            <td align="center" style="padding:0;Margin:0">
            <table class="es-footer-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px" role="none">
                <tr>
                <td align="left" style="padding:20px;Margin:0">
                <table cellspacing="0" cellpadding="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                    <tr>
                    <td align="center" style="padding:0;Margin:0;width:560px">
                    <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                        <tr>
                        <td class="es-m-p0l" align="center" style="padding:0;Margin:0;font-size:0px"><a href="https://www.sic4change.org/" target="_blank" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#333333;font-size:12px"><img src="https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/images%2Flogo-s4c-sec.png?alt=media&token=2e09f421-62dd-4381-af4f-ec7ef95f2b55" alt width="98" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a></td>
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
    return certificationRequestTemplate;
}



exports.updateResourceCategory = onDocumentUpdated('testOne/{testOneId}', async (event) => {
  const testOneId = event.params.testOneId;
  const before = event.data.before.data();
  const after = event.data.after.data();

  if (before.run === after.run) {
    return;
  }

  console.log(`Triggered by change in 'run' field in document: ${testOneId}`);

  try {
    const snapshot = await adminFirebase.firestore().collection('resources').get();
    const batch = adminFirebase.firestore().batch();

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.resourceType === 'kUM5r4lSikIPLMZlQ7FD') {
        const ref = adminFirebase.firestore().doc(`resources/${data.resourceId}`);
        batch.set(ref, { resourceCategory: 'POUBGFk5gU6c5X1DKo1b' }, { merge: true });
      }
    });

    await batch.commit();
    console.log("Successfully updated resourceCategory for matching resources.");
  } catch (err) {
    console.error("Error updating resourceCategory:", err);
    throw new Error('Export resource category operation failed: ' + err.message);
  }
});


exports.resourceInvitation = onDocumentCreated('resourcesInvitations/{resourceInvitationId}', (event) => {
    const snapshot = event.data;
    const resourceInvitationId = event.params.resourceInvitationId;
  
    const unemployedName = snapshot.get('unemployedName');
    const unemployedEmail = snapshot.get('unemployedEmail');
    const resourceId = snapshot.get('resourceId');
    const resourceTitle = snapshot.get('resourceTitle');
    const resourceDates = snapshot.get('resourceDates');
    const resourceDuration = snapshot.get('resourceDuration');
    const resourceDescription = snapshot.get('resourceDescription');
  
    return adminFirebase.firestore().doc(`resourcesInvitations/${resourceInvitationId}`).set({ resourceInvitationId }, { merge: true })
      .then(() => {
        return adminFirebase.firestore().collection('mail').add({
          to: unemployedEmail,
          message: {
            subject: `Invitación: ${resourceTitle}.`,
            html: createResourceInvitationTemplate(
              unemployedName,
              resourceTitle,
              resourceId,
              resourceDates,
              resourceDuration,
              resourceDescription
            ),
          },
        });
      })
      .then(() => logger.info('📧 Email de invitación encolado correctamente'))
      .catch((error) => logger.error('❌ Error en resourceInvitation:', error));
  });
    



  exports.scheduledFirestoreExport = onSchedule(
    {
      schedule: "every 24 hours",
      timeZone: "Europe/Madrid", // Ajusta si necesario
      memory: "512MiB",
      retryConfig: {
        retryCount: 3,
        minBackoffSeconds: 10,
        maxBackoffSeconds: 60,
      },
    },
    async (event) => {
      const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
      const databaseName = client.databasePath(projectId, "(default)");
  
      try {
        const [response] = await client.exportDocuments({
          name: databaseName,
          outputUriPrefix: bucket,
          collectionIds: [], // Exporta todas las colecciones
        });
  
        console.log(`📁 Firestore export operation started: ${response.name}`);
      } catch (err) {
        console.error("❌ Firestore export failed:", err);
        throw new Error("Export operation failed: " + err.message);
      }
    }
  );

// exports.updateCertificationRequest = functions.firestore.document('certificationsRequests/{certificationRequestId}')
//     .onUpdate((change, context) => {
//         const certificationRequestId = context.params.certificationRequestId;
//         const newValue = change.after.data();
//         const previousValue = change.before.data();
//         const userId = newValue.unemployedRequesterId;
//         const competencyId = newValue.competencyId;
//         if (newValue.certified !== previousValue.certified) {
//             return adminFirebase.firestore().collection('users').where("userId", "==", userId).get().then(
//                 (snapshot) => {
//                     snapshot.forEach((user) => {
//                         const competencies = user.get('competencies');
//                         competencies[competencyId] = "certified";
//                         return adminFirebase.firestore().doc(`users/${userId}`).set({ competencies }, { merge: true })
//                             .then(() => {
//                                 console.log("Successfully change certified competency status");
//                             })
//                     })
//                 });
//         }
//     });

exports.certificationRequestForm = onDocumentCreated('certificationsRequests/{certificationRequestId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    console.error("No event data found.");
    return;
  }

  const certificationRequestId = event.params.certificationRequestId;
  const certifierName = snapshot.get('certifierName');
  const competencyName = snapshot.get('competencyName');
  const unemployedRequesterName = snapshot.get('unemployedRequesterName');
  const email = snapshot.get('email');

  try {
    await adminFirebase.firestore().doc(`certificationsRequests/${certificationRequestId}`).set(
      { certificationRequestId },
      { merge: true }
    );

    await adminFirebase.firestore().collection('mail').add({
      to: email,
      message: {
        subject: `${unemployedRequesterName} necesita que le certifiques una competencia.`,
        html: createCertificationRequestTemplate(
          certifierName,
          competencyName,
          unemployedRequesterName,
          certificationRequestId
        ),
      },
    });

    console.log('Queued email!');
  } catch (error) {
    console.error('Error processing certificationRequestForm:', error);
  }
});




function createCertificationRequestTemplate(certifierName, competencyName, unemployedRequesterName, certificationRequestId) {
    const certificationRequestTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="es">
    <head>
    <meta charset="UTF-8">
    <meta content="width=device-width, initial-scale=1" name="viewport">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta content="telephone=no" name="format-detection">
    <title>Copia de (1) nuevo email</title><!--[if (mso 16)]>
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
    [data-ogsb] .es-button.es-button-1719310999593 {
        padding:10px 30px!important;
    }
    @media only screen and (max-width:600px) {p, ul li, ol li, a { line-height:150%!important } h1, h2, h3, h1 a, h2 a, h3 a { line-height:120% } h1 { font-size:36px!important; text-align:left } h2 { font-size:26px!important; text-align:left } h3 { font-size:20px!important; text-align:left } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size:36px!important; text-align:left } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size:26px!important; text-align:left } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size:20px!important; text-align:left } .es-menu td a { font-size:12px!important } .es-header-body p, .es-header-body ul li, .es-header-body ol li, .es-header-body a { font-size:14px!important } .es-content-body p, .es-content-body ul li, .es-content-body ol li, .es-content-body a { font-size:16px!important } .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size:14px!important } .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size:12px!important } *[class="gmail-fix"] { display:none!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align:right!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-button-border { display:inline-block!important } a.es-button, button.es-button { font-size:20px!important; display:inline-block!important } .es-adaptive table, .es-left, .es-right { width:100%!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .es-adapt-td { display:block!important; width:100%!important } .adapt-img { width:100%!important; height:auto!important } .es-m-p0 { padding:0!important } .es-m-p0r { padding-right:0!important } .es-m-p0l { padding-left:0!important } .es-m-p0t { padding-top:0!important } .es-m-p0b { padding-bottom:0!important } .es-m-p20b { padding-bottom:20px!important } .es-mobile-hidden, .es-hidden { display:none!important } tr.es-desk-hidden, td.es-desk-hidden, table.es-desk-hidden { width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } tr.es-desk-hidden { display:table-row!important } table.es-desk-hidden { display:table!important } td.es-desk-menu-hidden { display:table-cell!important } .es-menu td { width:1%!important } table.es-table-not-adapt, .esd-block-html table { width:auto!important } table.es-social { display:inline-block!important } table.es-social td { display:inline-block!important } .es-m-p5 { padding:5px!important } .es-m-p5t { padding-top:5px!important } .es-m-p5b { padding-bottom:5px!important } .es-m-p5r { padding-right:5px!important } .es-m-p5l { padding-left:5px!important } .es-m-p10 { padding:10px!important } .es-m-p10t { padding-top:10px!important } .es-m-p10b { padding-bottom:10px!important } .es-m-p10r { padding-right:10px!important } .es-m-p10l { padding-left:10px!important } .es-m-p15 { padding:15px!important } .es-m-p15t { padding-top:15px!important } .es-m-p15b { padding-bottom:15px!important } .es-m-p15r { padding-right:15px!important } .es-m-p15l { padding-left:15px!important } .es-m-p20 { padding:20px!important } .es-m-p20t { padding-top:20px!important } .es-m-p20r { padding-right:20px!important } .es-m-p20l { padding-left:20px!important } .es-m-p25 { padding:25px!important } .es-m-p25t { padding-top:25px!important } .es-m-p25b { padding-bottom:25px!important } .es-m-p25r { padding-right:25px!important } .es-m-p25l { padding-left:25px!important } .es-m-p30 { padding:30px!important } .es-m-p30t { padding-top:30px!important } .es-m-p30b { padding-bottom:30px!important } .es-m-p30r { padding-right:30px!important } .es-m-p30l { padding-left:30px!important } .es-m-p35 { padding:35px!important } .es-m-p35t { padding-top:35px!important } .es-m-p35b { padding-bottom:35px!important } .es-m-p35r { padding-right:35px!important } .es-m-p35l { padding-left:35px!important } .es-m-p40 { padding:40px!important } .es-m-p40t { padding-top:40px!important } .es-m-p40b { padding-bottom:40px!important } .es-m-p40r { padding-right:40px!important } .es-m-p40l { padding-left:40px!important } .es-desk-hidden { display:table-row!important; width:auto!important; overflow:visible!important; max-height:inherit!important } .h-auto { height:auto!important } }
    @media screen and (max-width:384px) {.mail-message-content { width:414px!important } }
    </style>
    </head>
    <body style="width:100%;font-family:arial, 'helvetica neue', helvetica, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
    <div dir="ltr" class="es-wrapper-color" lang="es" style="background-color:#FAFAFA"><!--[if gte mso 9]>
                <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
                    <v:fill type="tile" color="#fafafa"></v:fill>
                </v:background>
            <![endif]-->
    <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#FAFAFA">
        <tr>
        <td valign="top" style="padding:0;Margin:0">
        <table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
            <tr>
            <td align="center" style="padding:0;Margin:0">
            <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                <tr>
                <td align="left" bgcolor="#054D5E" style="padding:0;Margin:0;background-color:#054d5e;border-radius:20px">
                <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                    <tr>
                    <td align="center" valign="top" style="padding:0;Margin:0;width:600px">
                    <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:separate;border-spacing:0px;border-radius:25px" role="presentation">
                        <tr class="es-visible-simple-html-only">
                        <td align="center" style="padding:0;Margin:0;padding-top:25px;font-size:0px"><a target="_blank" href="https://www.enredas.org/" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#5C68E2;font-size:14px"><img class="adapt-img" src="https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/images%2Fask-certification.png?alt=media&token=cebcfd88-73a5-44f3-a660-45f6043a6170" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="600"></a></td>
                        </tr>
                        <tr>
                        <td align="center" class="es-m-txt-c" style="padding:0;Margin:0;padding-bottom:25px;padding-top:35px"><h1 style="Margin:0;line-height:24px;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:20px;font-style:normal;font-weight:bold;color:#ffffff"><strong>Solicitud de Certificación de competencia</strong></h1></td>
                        </tr>
                        <tr>
                        <td align="left" style="padding:0;Margin:0;padding-top:10px;padding-left:40px;padding-right:40px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px;text-align:center">Hola ${certifierName},</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px;text-align:center"><br></p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px">Desde la web de Enreda, ${unemployedRequesterName} está solicitando la certificación de la siguiente competencia:</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px"><br></p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px;text-align:center"><strong>${competencyName}</strong></p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px;text-align:center"><br></p></td>
                        </tr>
                        <tr>
                        <td align="center" style="Margin:0;padding-top:10px;padding-bottom:25px;padding-left:25px;padding-right:25px"><span class="es-button-border" style="border-style:solid;border-color:#18c5c1;background:#18c5c1;border-width:2px;display:inline-block;border-radius:25px;width:auto"><a href="https://enredawebapp.web.app/competencies/${certificationRequestId}" class="es-button es-button-1719310999593" target="_blank" style="mso-style-priority:100 !important;text-decoration:none;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;color:#FFFFFF;font-size:16px;padding:10px 30px;display:inline-block;background:#18c5c1;border-radius:25px;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-weight:normal;font-style:normal;line-height:19px;width:auto;text-align:center;mso-padding-alt:0;mso-border-alt:10px solid #18c5c1">Certificar competencia</a></span></td>
                        </tr>
                        <tr>
                        <td align="center" style="Margin:0;padding-top:10px;padding-bottom:25px;padding-left:40px;padding-right:40px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px">¡Muchas gracias!</p></td>
                        </tr>
                        <tr>
                        <td align="center" style="padding:0;Margin:0;padding-bottom:25px;padding-left:40px;padding-right:40px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:18px;color:#ffffff;font-size:12px">El equipo de Enreda</p></td>
                        </tr>
                    </table></td>
                    </tr>
                </table></td>
                </tr>
            </table></td>
            </tr>
        </table>
        <table cellpadding="0" cellspacing="0" class="es-footer" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top">
            <tr>
            <td align="center" style="padding:0;Margin:0">
            <table class="es-footer-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px" role="none">
                <tr>
                <td align="left" style="padding:20px;Margin:0">
                <table cellspacing="0" cellpadding="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                    <tr>
                    <td align="center" style="padding:0;Margin:0;width:560px">
                    <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                        <tr>
                        <td class="es-m-p0l" align="center" style="padding:0;Margin:0;font-size:0px"><a href="https://www.sic4change.org/" target="_blank" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#333333;font-size:12px"><img src="https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/images%2Flogo-s4c-sec.png?alt=media&token=2e09f421-62dd-4381-af4f-ec7ef95f2b55" alt width="98" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a></td>
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
    return certificationRequestTemplate;
}



// exports.updateResourceCategory = functions.firestore.document('testOne/{testOnetId}')
//     .onUpdate((change, context) => {
//         const testOnetId = context.params.testOnetIdId;
//         const newValue = change.after.data();
//         const previousValue = change.before.data();
//         if (newValue.run !== previousValue.run) {
//             return adminFirebase.firestore().collection('resources').get().then(
//                 (snapshot) => {
//                     snapshot.forEach((resource) => {
//                         resourceId = resource.get('resourceId');
//                         if (resource.get('resourceType') === 'kUM5r4lSikIPLMZlQ7FD') {
//                             return adminFirebase.firestore().doc(`resources/${resource.data().resourceId}`).set({ resourceCategory: 'POUBGFk5gU6c5X1DKo1b' }, { merge: true })
//                                 .then(() => {
//                                     console.log("Successfully added resource category");
//                                 }).catch(err => {
//                                     console.error(err);
//                                     throw new Error('Export resource category operation failed:' + err);
//                                 });
//                         }
//                     })
//                 });
//         }
//     });


//     exports.resourceInvitation = functions.firestore
//     .document('resourcesInvitations/{resourceInvitationId}')
//     .onCreate(async (snapshot, context) => {
//         const resourceInvitationId = context.params.resourceInvitationId;
//         const unemployedName = snapshot.get('unemployedName');
//         const unemployedEmail = snapshot.get('unemployedEmail');
//         const resourceId = snapshot.get('resourceId');
//         const resourceTitle = snapshot.get('resourceTitle');
//         const resourceDescription = snapshot.get('resourceDescription');
//         await adminFirebase.firestore().doc(`resourcesInvitations/${resourceInvitationId}`).set({ resourceInvitationId }, {
//             merge: true
//         });
//         await adminFirebase.firestore().collection('mail').add({
//             to: unemployedEmail,
//             message: {
//                 subject: `${resourceTitle} ¡Este recurso podría interesarte!`,
//                 html: createResourceInvitationTemplate(unemployedName, resourceTitle, resourceId, resourceDescription),
//             }
//         });
//         return console.log('Queued email!');
            
//     });


    function createResourceInvitationTemplate(unemployedName, resourceTitle, resourceId, resourceDescription ) {
        const invitationTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="es">
            <head>
            <meta charset="UTF-8">
            <meta content="width=device-width, initial-scale=1" name="viewport">
            <meta name="x-apple-disable-message-reformatting">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta content="telephone=no" name="format-detection">
            <title>Invitación recurso</title><!--[if (mso 16)]>
                <style type="text/css">
                a {text-decoration: none;}
                </style>
                <![endif]--><!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--><!--[if gte mso 9]>
            <noscript>
                    <xml>
                    <o:OfficeDocumentSettings>
                    <o:AllowPNG></o:AllowPNG>
                    <o:PixelsPerInch>96</o:PixelsPerInch>
                    </o:OfficeDocumentSettings>
                    </xml>
                </noscript>
            <![endif]-->
            <style type="text/css">
            #outlook a {
                padding:0;
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
            @media only screen and (max-width:600px) {p, ul li, ol li, a { line-height:150%!important } h1, h2, h3, h1 a, h2 a, h3 a { line-height:120% } h1 { font-size:36px!important; text-align:left } h2 { font-size:26px!important; text-align:left } h3 { font-size:20px!important; text-align:left } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size:36px!important; text-align:left } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size:26px!important; text-align:left } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size:20px!important; text-align:left } .es-menu td a { font-size:12px!important } .es-header-body p, .es-header-body ul li, .es-header-body ol li, .es-header-body a { font-size:14px!important } .es-content-body p, .es-content-body ul li, .es-content-body ol li, .es-content-body a { font-size:16px!important } .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size:14px!important } .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size:12px!important } *[class="gmail-fix"] { display:none!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align:right!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-button-border { display:inline-block!important } a.es-button, button.es-button { font-size:20px!important; display:inline-block!important } .es-adaptive table, .es-left, .es-right { width:100%!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .es-adapt-td { display:block!important; width:100%!important } .adapt-img { width:100%!important; height:auto!important } .es-m-p0 { padding:0!important } .es-m-p0r { padding-right:0!important } .es-m-p0l { padding-left:0!important } .es-m-p0t { padding-top:0!important } .es-m-p0b { padding-bottom:0!important } .es-m-p20b { padding-bottom:20px!important } .es-mobile-hidden, .es-hidden { display:none!important } tr.es-desk-hidden, td.es-desk-hidden, table.es-desk-hidden { width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } tr.es-desk-hidden { display:table-row!important } table.es-desk-hidden { display:table!important } td.es-desk-menu-hidden { display:table-cell!important } .es-menu td { width:1%!important } table.es-table-not-adapt, .esd-block-html table { width:auto!important } table.es-social { display:inline-block!important } table.es-social td { display:inline-block!important } .es-m-p5 { padding:5px!important } .es-m-p5t { padding-top:5px!important } .es-m-p5b { padding-bottom:5px!important } .es-m-p5r { padding-right:5px!important } .es-m-p5l { padding-left:5px!important } .es-m-p10 { padding:10px!important } .es-m-p10t { padding-top:10px!important } .es-m-p10b { padding-bottom:10px!important } .es-m-p10r { padding-right:10px!important } .es-m-p10l { padding-left:10px!important } .es-m-p15 { padding:15px!important } .es-m-p15t { padding-top:15px!important } .es-m-p15b { padding-bottom:15px!important } .es-m-p15r { padding-right:15px!important } .es-m-p15l { padding-left:15px!important } .es-m-p20 { padding:20px!important } .es-m-p20t { padding-top:20px!important } .es-m-p20r { padding-right:20px!important } .es-m-p20l { padding-left:20px!important } .es-m-p25 { padding:25px!important } .es-m-p25t { padding-top:25px!important } .es-m-p25b { padding-bottom:25px!important } .es-m-p25r { padding-right:25px!important } .es-m-p25l { padding-left:25px!important } .es-m-p30 { padding:30px!important } .es-m-p30t { padding-top:30px!important } .es-m-p30b { padding-bottom:30px!important } .es-m-p30r { padding-right:30px!important } .es-m-p30l { padding-left:30px!important } .es-m-p35 { padding:35px!important } .es-m-p35t { padding-top:35px!important } .es-m-p35b { padding-bottom:35px!important } .es-m-p35r { padding-right:35px!important } .es-m-p35l { padding-left:35px!important } .es-m-p40 { padding:40px!important } .es-m-p40t { padding-top:40px!important } .es-m-p40b { padding-bottom:40px!important } .es-m-p40r { padding-right:40px!important } .es-m-p40l { padding-left:40px!important } .es-desk-hidden { display:table-row!important; width:auto!important; overflow:visible!important; max-height:inherit!important } .h-auto { height:auto!important } }
            @media screen and (max-width:384px) {.mail-message-content { width:414px!important } }
            </style>
            </head>
            <body style="width:100%;font-family:arial, 'helvetica neue', helvetica, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
            <div dir="ltr" class="es-wrapper-color" lang="es" style="background-color:#FAFAFA"><!--[if gte mso 9]>
                        <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
                            <v:fill type="tile" color="#fafafa"></v:fill>
                        </v:background>
                    <![endif]-->
            <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#FAFAFA">
                <tr>
                <td valign="top" style="padding:0;Margin:0">
                <table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
                    <tr>
                    <td align="center" style="padding:0;Margin:0">
                    <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                        <tr>
                        <td align="left" bgcolor="#054D5E" style="padding:0;Margin:0;background-color:#054d5e;border-radius:20px">
                        <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                            <tr>
                            <td align="center" valign="top" style="padding:0;Margin:0;width:600px">
                            <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:separate;border-spacing:0px;border-radius:25px" role="presentation">
                                <tr class="es-visible-simple-html-only">
                                <td align="center" style="padding:0;Margin:0;padding-top:25px;font-size:0px"><a target="_blank" href="https://enredawebapp.web.app/" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#5C68E2;font-size:14px"><img class="adapt-img" src="https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/images%2Finvitation_photo.png?alt=media&token=35c0cfd8-3f49-493e-a8cb-255931a4c2cd" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="600"></a></td>
                                </tr>
                                <tr>
                                <td align="center" class="es-m-txt-c" style="padding:0;Margin:0;padding-bottom:25px;padding-top:35px"><h1 style="Margin:0;line-height:36px;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:30px;font-style:normal;font-weight:bold;color:#ffffff"><strong>¡Hola ${unemployedName}!</strong></h1></td>
                                </tr>
                                <tr>
                                <td align="left" style="Margin:0;padding-top:10px;padding-bottom:15px;padding-left:40px;padding-right:40px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px;text-align:center">Este recurso podría interesarte:</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px"><br></p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:24px;color:#ffffff;font-size:16px;text-align:center"><strong>${resourceTitle}</strong></p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px;text-align:center">${resourceDescription}</p></td>
                                </tr>
                                <tr>
                                <td align="center" style="padding:25px;Margin:0"><span class="es-button-border" style="border-style:solid;border-color:#18c5c1;background:#18c5c1;border-width:2px;display:inline-block;border-radius:25px;width:auto"><a href="https://enredawebapp.web.app/resources/${resourceId}" class="es-button es-button-1719310999593" target="_blank" style="mso-style-priority:100 !important;text-decoration:none;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;color:#FFFFFF;font-size:18px;padding:10px 30px;display:inline-block;background:#18c5c1;border-radius:25px;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-weight:normal;font-style:normal;line-height:21.6px;width:auto;text-align:center;mso-padding-alt:0;mso-border-alt:10px solid #18c5c1">Ver recurso</a></span></td>
                                </tr>
                                <tr>
                                <td align="center" style="padding:0;Margin:0;padding-bottom:25px;padding-left:40px;padding-right:40px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:18px;color:#ffffff;font-size:12px">El equipo de Enreda</p></td>
                                </tr>
                            </table></td>
                            </tr>
                        </table></td>
                        </tr>
                    </table></td>
                    </tr>
                </table>
                <table cellpadding="0" cellspacing="0" class="es-footer" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top">
                    <tr>
                    <td align="center" style="padding:0;Margin:0">
                    <table class="es-footer-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px" role="none">
                        <tr>
                        <td align="left" style="padding:20px;Margin:0">
                        <table cellspacing="0" cellpadding="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                            <tr>
                            <td align="center" style="padding:0;Margin:0;width:560px">
                            <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                <tr>
                                <td class="es-m-p0l" align="center" style="padding:0;Margin:0;font-size:0px"><a href="https://www.sic4change.org/" target="_blank" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#333333;font-size:12px"><img src="https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/images%2Flogo-s4c-sec.png?alt=media&token=2e09f421-62dd-4381-af4f-ec7ef95f2b55" alt width="98" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a></td>
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
        return invitationTemplate;
    }


    function resourceInvitationTemplate(resourceTitle, resourceId, resourceDescription ) {
        const listInvitationTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="es">
            <head>
            <meta charset="UTF-8">
            <meta content="width=device-width, initial-scale=1" name="viewport">
            <meta name="x-apple-disable-message-reformatting">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta content="telephone=no" name="format-detection">
            <title>Lista invitación recurso</title><!--[if (mso 16)]>
                <style type="text/css">
                a {text-decoration: none;}
                </style>
                <![endif]--><!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--><!--[if gte mso 9]>
            <noscript>
                    <xml>
                    <o:OfficeDocumentSettings>
                    <o:AllowPNG></o:AllowPNG>
                    <o:PixelsPerInch>96</o:PixelsPerInch>
                    </o:OfficeDocumentSettings>
                    </xml>
                </noscript>
            <![endif]-->
            <style type="text/css">
            #outlook a {
                padding:0;
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
            @media only screen and (max-width:600px) {p, ul li, ol li, a { line-height:150%!important } h1, h2, h3, h1 a, h2 a, h3 a { line-height:120% } h1 { font-size:36px!important; text-align:left } h2 { font-size:26px!important; text-align:left } h3 { font-size:20px!important; text-align:left } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size:36px!important; text-align:left } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size:26px!important; text-align:left } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size:20px!important; text-align:left } .es-menu td a { font-size:12px!important } .es-header-body p, .es-header-body ul li, .es-header-body ol li, .es-header-body a { font-size:14px!important } .es-content-body p, .es-content-body ul li, .es-content-body ol li, .es-content-body a { font-size:16px!important } .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size:14px!important } .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size:12px!important } *[class="gmail-fix"] { display:none!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align:right!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-button-border { display:inline-block!important } a.es-button, button.es-button { font-size:20px!important; display:inline-block!important } .es-adaptive table, .es-left, .es-right { width:100%!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .es-adapt-td { display:block!important; width:100%!important } .adapt-img { width:100%!important; height:auto!important } .es-m-p0 { padding:0!important } .es-m-p0r { padding-right:0!important } .es-m-p0l { padding-left:0!important } .es-m-p0t { padding-top:0!important } .es-m-p0b { padding-bottom:0!important } .es-m-p20b { padding-bottom:20px!important } .es-mobile-hidden, .es-hidden { display:none!important } tr.es-desk-hidden, td.es-desk-hidden, table.es-desk-hidden { width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } tr.es-desk-hidden { display:table-row!important } table.es-desk-hidden { display:table!important } td.es-desk-menu-hidden { display:table-cell!important } .es-menu td { width:1%!important } table.es-table-not-adapt, .esd-block-html table { width:auto!important } table.es-social { display:inline-block!important } table.es-social td { display:inline-block!important } .es-m-p5 { padding:5px!important } .es-m-p5t { padding-top:5px!important } .es-m-p5b { padding-bottom:5px!important } .es-m-p5r { padding-right:5px!important } .es-m-p5l { padding-left:5px!important } .es-m-p10 { padding:10px!important } .es-m-p10t { padding-top:10px!important } .es-m-p10b { padding-bottom:10px!important } .es-m-p10r { padding-right:10px!important } .es-m-p10l { padding-left:10px!important } .es-m-p15 { padding:15px!important } .es-m-p15t { padding-top:15px!important } .es-m-p15b { padding-bottom:15px!important } .es-m-p15r { padding-right:15px!important } .es-m-p15l { padding-left:15px!important } .es-m-p20 { padding:20px!important } .es-m-p20t { padding-top:20px!important } .es-m-p20r { padding-right:20px!important } .es-m-p20l { padding-left:20px!important } .es-m-p25 { padding:25px!important } .es-m-p25t { padding-top:25px!important } .es-m-p25b { padding-bottom:25px!important } .es-m-p25r { padding-right:25px!important } .es-m-p25l { padding-left:25px!important } .es-m-p30 { padding:30px!important } .es-m-p30t { padding-top:30px!important } .es-m-p30b { padding-bottom:30px!important } .es-m-p30r { padding-right:30px!important } .es-m-p30l { padding-left:30px!important } .es-m-p35 { padding:35px!important } .es-m-p35t { padding-top:35px!important } .es-m-p35b { padding-bottom:35px!important } .es-m-p35r { padding-right:35px!important } .es-m-p35l { padding-left:35px!important } .es-m-p40 { padding:40px!important } .es-m-p40t { padding-top:40px!important } .es-m-p40b { padding-bottom:40px!important } .es-m-p40r { padding-right:40px!important } .es-m-p40l { padding-left:40px!important } .es-desk-hidden { display:table-row!important; width:auto!important; overflow:visible!important; max-height:inherit!important } .h-auto { height:auto!important } }
            @media screen and (max-width:384px) {.mail-message-content { width:414px!important } }
            </style>
            </head>
            <body style="width:100%;font-family:arial, 'helvetica neue', helvetica, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
            <div dir="ltr" class="es-wrapper-color" lang="es" style="background-color:#FAFAFA"><!--[if gte mso 9]>
                        <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
                            <v:fill type="tile" color="#fafafa"></v:fill>
                        </v:background>
                    <![endif]-->
            <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#FAFAFA">
                <tr>
                <td valign="top" style="padding:0;Margin:0">
                <table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
                    <tr>
                    <td align="center" style="padding:0;Margin:0">
                    <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                        <tr>
                        <td align="left" bgcolor="#054D5E" style="padding:0;Margin:0;background-color:#054d5e;border-radius:20px">
                        <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                            <tr>
                            <td align="center" valign="top" style="padding:0;Margin:0;width:600px">
                            <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:separate;border-spacing:0px;border-radius:25px" role="presentation">
                                <tr class="es-visible-simple-html-only">
                                <td align="center" style="padding:0;Margin:0;padding-top:25px;font-size:0px"><a target="_blank" href="https://enredawebapp.web.app/" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#5C68E2;font-size:14px"><img class="adapt-img" src="https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/images%2Finvitation_photo.png?alt=media&token=35c0cfd8-3f49-493e-a8cb-255931a4c2cd" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="600"></a></td>
                                </tr>
                                <tr>
                                <td align="center" class="es-m-txt-c" style="padding:0;Margin:0;padding-bottom:10px;padding-top:35px"><h1 style="Margin:0;line-height:36px;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:30px;font-style:normal;font-weight:bold;color:#ffffff"><strong>¡Hola!</strong></h1></td>
                                </tr>
                                <tr>
                                <td align="left" style="Margin:0;padding-top:10px;padding-bottom:15px;padding-left:40px;padding-right:40px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px;text-align:center">Este recurso podría interesarte:</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px"><br></p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:24px;color:#ffffff;font-size:16px;text-align:center"><strong>${resourceTitle}</strong></p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ffffff;font-size:14px;text-align:center">${resourceDescription}</p></td>
                                </tr>
                                <tr>
                                <td align="center" style="padding:25px;Margin:0"><span class="es-button-border" style="border-style:solid;border-color:#18c5c1;background:#18c5c1;border-width:2px;display:inline-block;border-radius:25px;width:auto"><a href="https://enredawebapp.web.app/resources/${resourceId}" class="es-button es-button-1719310999593" target="_blank" style="mso-style-priority:100 !important;text-decoration:none;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;color:#FFFFFF;font-size:18px;padding:10px 30px;display:inline-block;background:#18c5c1;border-radius:25px;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-weight:normal;font-style:normal;line-height:21.6px;width:auto;text-align:center;mso-padding-alt:0;mso-border-alt:10px solid #18c5c1">Ver recurso</a></span></td>
                                </tr>
                                <tr>
                                <td align="center" style="padding:0;Margin:0;padding-bottom:25px;padding-left:40px;padding-right:40px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:18px;color:#ffffff;font-size:12px">El equipo de Enreda</p></td>
                                </tr>
                            </table></td>
                            </tr>
                        </table></td>
                        </tr>
                    </table></td>
                    </tr>
                </table>
                <table cellpadding="0" cellspacing="0" class="es-footer" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top">
                    <tr>
                    <td align="center" style="padding:0;Margin:0">
                    <table class="es-footer-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px" role="none">
                        <tr>
                        <td align="left" style="padding:20px;Margin:0">
                        <table cellspacing="0" cellpadding="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                            <tr>
                            <td align="center" style="padding:0;Margin:0;width:560px">
                            <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                <tr>
                                <td class="es-m-p0l" align="center" style="padding:0;Margin:0;font-size:0px"><a href="https://www.sic4change.org/" target="_blank" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#333333;font-size:12px"><img src="https://firebasestorage.googleapis.com/v0/b/enreda-d3b41.appspot.com/o/images%2Flogo-s4c-sec.png?alt=media&token=2e09f421-62dd-4381-af4f-ec7ef95f2b55" alt width="98" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a></td>
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
        return listInvitationTemplate;
    }


  exports.createChatQuestion = onDocumentCreated('chatQuestions/{id}', async (event) => {
    const id = event.params.id;
  
    await adminFirebase.firestore()
      .doc(`chatQuestions/${id}`)
      .set({ id }, { merge: true });
  
    console.log(`Successfully added id ${id} to chatQuestions document.`);
  });

// exports.createExperience = functions.firestore
//     .document('experiences/{id}')
//     .onCreate((snapshot, context) => {
//         const id = context.params.id;
//         return adminFirebase.firestore().doc(`experiences/${id}`).set({ id: id }, { merge: true });
//     });
    
exports.createSocialEntity = onDocumentCreated('socialEntities/{socialEntityId}', async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      logger.warn('No data in event snapshot.');
      return;
    }
  
    const socialEntityId = event.params.socialEntityId;
    const contactEmail = snapshot.data()?.contactEmail;
  
    try {
      // Añade el ID al documento de entidad social
      await adminFirebase.firestore().doc(`socialEntities/${socialEntityId}`).set(
        { socialEntityId },
        { merge: true }
      );
  
      // Busca el usuario por email
      const userQuerySnapshot = await adminFirebase
        .firestore()
        .collection('users')
        .where('email', '==', contactEmail)
        .get();
  
      const updates = userQuerySnapshot.docs.map((userDoc) =>
        adminFirebase.firestore().collection('users').doc(userDoc.id).set(
          { socialEntityId },
          { merge: true }
        )
      );
  
      await Promise.all(updates);
      logger.info(`Successfully updated ${updates.length} user(s) with socialEntityId`);
  
    } catch (error) {
      logger.error('❌ Error processing createSocialEntity:', error);
      throw error;
    }
  });

  exports.createCompany = onDocumentCreated('companies/{companyId}', async (event) => {
    try {
      const snapshot = event.data;
      const companyId = event.params.companyId;
  
      if (!snapshot) {
        logger.error('No snapshot data found on company creation.');
        return;
      }
  
      const data = snapshot.data();
      const contactEmail = data?.contactEmail;
  
      if (!contactEmail) {
        logger.warn(`Missing contactEmail in company ${companyId}`);
        return;
      }
  
      // Agregar el companyId al documento de la empresa
      await adminFirebase.firestore().doc(`companies/${companyId}`).set(
        { companyId },
        { merge: true }
      );
      logger.info(`✅ companyId ${companyId} añadido al documento de la empresa`);
  
      // Buscar usuarios con ese email y actualizarles el campo companyId
      const usersSnap = await adminFirebase.firestore()
        .collection('users')
        .where('email', '==', contactEmail)
        .get();
  
      if (usersSnap.empty) {
        logger.info(`No users found with email ${contactEmail}`);
        return;
      }
  
      const updates = usersSnap.docs.map((userDoc) =>
        adminFirebase.firestore()
          .collection('users')
          .doc(userDoc.id)
          .set({ companyId }, { merge: true })
      );
  
      await Promise.all(updates);
      logger.info(`✅ Campo companyId añadido a ${updates.length} usuario(s) con email ${contactEmail}`);
    } catch (error) {
      logger.error('❌ Error en createCompany:', error);
    }
  });
   

// exports.createIpilEntry = functions.firestore
//     .document('ipilEntry/{ipilId}')
//     .onCreate((snapshot, context) => {
//         const ipilId = context.params.ipilId;
//         return adminFirebase.firestore().doc(`ipilEntry/${ipilId}`).set({ ipilId }, { merge: true })
//             .then(() => {
//                 console.log("Successfully added ipilId to new ipilEntry");
//             });
//     });

exports.createInitialReport = onDocumentCreated(
  {
    document: "initialReports/{initialReportId}",
    region: "europe-west1",
    memory: "256MiB",
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.error("❌ No snapshot found.");
      return;
    }

    const initialReportId = event.params.initialReportId;
    const reportData = snapshot.data();
    const userId = reportData.userId;
    const startDateItinerary = adminFirebase.firestore.Timestamp.now();

    try {
      // Añadir el campo initialReportId al propio documento
      await db.doc(`initialReports/${initialReportId}`).set(
        { initialReportId },
        { merge: true }
      );
      console.log("✅ Added initialReportId to initialReport");

      // Buscar al usuario y actualizarlo con initialReportId y startDateItinerary
      const userSnapshot = await db
        .collection("users")
        .where("userId", "==", userId)
        .get();

      const updatePromises = userSnapshot.docs.map((userDoc) =>
        db.doc(`users/${userDoc.id}`).set(
          {
            initialReportId,
            startDateItinerary,
          },
          { merge: true }
        )
      );

      await Promise.all(updatePromises);
      console.log("✅ User(s) updated with initialReport info.");
    } catch (error) {
      console.error("❌ Error in createInitialReport function:", error);
      throw new Error("Function failed: " + error.message);
    }
  }
);

exports.createClosureReport = onDocumentCreated("closureReports/{closureReportId}", async (event) => {
  const snapshot = event.data;
  const closureReportId = event.params.closureReportId;
  const userId = snapshot.data().userId;

  try {
    // Añade el campo closureReportId al documento creado
    await adminFirebase.firestore()
      .doc(`closureReports/${closureReportId}`)
      .set({ closureReportId }, { merge: true });

    console.log("Successfully added closureReportId to new closureReport");

    // Busca el usuario correspondiente al userId
    const usersSnapshot = await adminFirebase.firestore()
      .collection("users")
      .where("userId", "==", userId)
      .get();

    // Actualiza el documento del usuario con el closureReportId
    const updatePromises = usersSnapshot.docs.map(userDoc => {
      return adminFirebase.firestore().doc(`users/${userDoc.id}`).set({
        closureReportId
      }, { merge: true });
    });

    await Promise.all(updatePromises);
    console.log("Successfully added closureReportId to user(s)");

  } catch (error) {
    console.error("Error creating closureReport:", error);
    throw new Error("createClosureReport failed");
  }
});

exports.createFollowReport = onDocumentCreated("followReports/{followReportId}", async (event) => {
  const snapshot = event.data;
  const followReportId = event.params.followReportId;
  const userId = snapshot.data().userId;

  try {
    await adminFirebase.firestore().doc(`followReports/${followReportId}`).set({ followReportId }, { merge: true });
    console.log("Successfully added followReportId to new followReport");

    const usersSnapshot = await adminFirebase.firestore()
      .collection("users")
      .where("userId", "==", userId)
      .get();

    const updatePromises = usersSnapshot.docs.map(userDoc => {
      return adminFirebase.firestore().collection("users").doc(userDoc.id).set({
        followReportId: followReportId
      }, { merge: true });
    });

    await Promise.all(updatePromises);
    console.log("Successfully added followReportId to user(s)");

  } catch (error) {
    console.error("Error creating followReport:", error);
    throw new Error("createFollowReport failed");
  }
});

exports.createDerivationReport = onDocumentCreated("derivationReports/{derivationReportId}", async (event) => {
  const snapshot = event.data;
  const derivationReportId = event.params.derivationReportId;
  const userId = snapshot.data().userId;

  try {
    // Agregamos el ID al documento derivationReport
    await adminFirebase.firestore()
      .doc(`derivationReports/${derivationReportId}`)
      .set({ derivationReportId }, { merge: true });

    console.log("Successfully added derivationReportId to new derivationReport");

    // Buscamos el usuario asociado
    const usersSnapshot = await adminFirebase.firestore()
      .collection("users")
      .where("userId", "==", userId)
      .get();

    // Para cada usuario (debería ser solo uno), añadimos la referencia al informe
    const updatePromises = usersSnapshot.docs.map(userDoc => {
      return adminFirebase.firestore().collection("users").doc(userDoc.id).set({
        derivationReportId: derivationReportId
      }, { merge: true });
    });

    await Promise.all(updatePromises);
    console.log("Successfully added derivationReportId to user(s)");

  } catch (error) {
    console.error("Error creating derivationReport:", error);
    throw new Error("createDerivationReport failed");
  }
});

//     exports.createIpilObjectives = functions.firestore
//         .document('ipilObjectives/{ipilObjectivesId}')
//         .onCreate((snapshot, context) => {
//             const ipilObjectivesId = context.params.ipilObjectivesId;
//             const userId = snapshot.data().userId;

//             return adminFirebase.firestore().doc(`ipilObjectives/${ipilObjectivesId}`).set({ ipilObjectivesId}, { merge: true })
//                 .then(() => {
//                     console.log("Successfully added ipilObjectivesId to new ipilObjectives");
//                     return adminFirebase.firestore().collection('users').where("userId", "==", userId).get().then(
//                         (snapshot) => {
//                             snapshot.forEach((user) => {
//                                 return adminFirebase.firestore().collection("users").doc(user.id).set({ ipilObjectivesId: ipilObjectivesId }, { merge: true })
//                                     .then(() => {
//                                         console.log("Successfully add ipilObjectives in organization user");
//                                     })
//                             })
//                         });
//                 });
//         });

exports.createExternalSocialEntity = onDocumentCreated('externalSocialEntities/{externalSocialEntityId}', async (event) => {
    const snapshot = event.data;
    const externalSocialEntityId = event.params.externalSocialEntityId;
  
    if (!snapshot || !snapshot.data) {
      logger.warn(`⚠️ Documento no encontrado o sin datos para: ${externalSocialEntityId}`);
      return;
    }
  
    try {
      await updateExternalSocialEntitySearchText(snapshot, externalSocialEntityId);
  
      await adminFirebase.firestore()
        .doc(`externalSocialEntities/${externalSocialEntityId}`)
        .set({ externalSocialEntityId }, { merge: true });
  
      logger.info(`✔ Successfully added externalSocialEntityId to new externalSocialEntity: ${externalSocialEntityId}`);
    } catch (error) {
      logger.error(`❌ Error creating externalSocialEntity ${externalSocialEntityId}:`, error);
      throw new Error(`createExternalSocialEntity failed for ${externalSocialEntityId}`);
    }
  });

        async function updateExternalSocialEntitySearchText(externalEntity, externalEntityId) {
            let countryName = '';
            let provinceName = '';
            let cityName = '';
            let document;
        
            if (externalEntity.data().address.country && externalEntity.data().address.country != "undefined") {
                document = await adminFirebase.firestore().collection('countries').doc(externalEntity.data().address.country).get();
                countryName = document.data().name;
            }
        
            if (externalEntity.data().address.province && externalEntity.data().address.province != "undefined") {
                document = await adminFirebase.firestore().collection('provinces').doc(externalEntity.data().address.province).get();
                provinceName = document.data().name;
            }
        
            if (externalEntity.data().address.city && externalEntity.data().address.city != "undefined") {
                document = await adminFirebase.firestore().collection('cities').doc(externalEntity.data().address.city).get();
                cityName = document.data().name;
            }
        
            await adminFirebase.firestore().doc(`externalSocialEntities/${externalEntityId}`).set({ searchText: `${externalEntity.data().name};${externalEntity.data().category};${externalEntity.data().subCategory};${externalEntity.data().subGeographicZone};${countryName};${provinceName};${cityName}` }, { merge: true }).then(() => {
                console.log(`Entidad social externa actualizada: ${externalEntity.data().name}, ${countryName}, ${provinceName}, ${cityName}`);
            });
        }


exports.updateExternalSocialEntity = onDocumentUpdated(
  "externalSocialEntities/{externalSocialEntityId}",
  async (event) => {
    const externalSocialEntityId = event.params.externalSocialEntityId;

    if (!event.data) {
      logger.warn("No event data found in onUpdate trigger");
      return;
    }

    const afterSnap = event.data.after;
    if (!afterSnap) {
      logger.warn("No 'after' snapshot found in event");
      return;
    }

    try {
      await updateExternalSocialEntitySearchText(afterSnap, externalSocialEntityId);
      logger.info(`Successfully updated search text for ${externalSocialEntityId}`);
    } catch (error) {
      logger.error(`Error updating search text for ${externalSocialEntityId}:`, error);
    }
  }
);



exports.deleteDocumentationParticipant = onDocumentDeleted('documentationParticipants/{documentationParticipantId}', async (event) => {
    const snapshot = event.data;
    const documentationParticipantId = event.params.documentationParticipantId;
  
    if (!snapshot) {
      logger.warn(`❗ No snapshot data for deleted document ID: ${documentationParticipantId}`);
      return;
    }
  
    const data = snapshot.data();
    const userId = data?.userId;
    const documentName = data?.file?.title;
  
    if (!userId || !documentName) {
      logger.warn(`❗ Missing userId or documentName for ID: ${documentationParticipantId}`);
      return;
    }
  
    const filePath = `users/${userId}/files/${documentName}`;
  
    try {
      const bucket = adminFirebase.storage().bucket();
      await bucket.file(filePath).delete();
      logger.info(`✅ Successfully deleted file: ${filePath}`);
    } catch (error) {
      logger.error(`❌ Error deleting file at ${filePath}:`, error);
    }
  });

exports.createGenerateDocument = onDocumentCreated({
  document: 'jobOfferApplications/{jobOfferApplicationId}',
  secrets: [openaiApiKey]
}, async (event) => {
    const openai = new OpenAI({
      apiKey: openaiApiKey.value(),
    });
    const snapshot = event.data;
    const jobOfferApplicationId = event.params.jobOfferApplicationId;
  
    if (!snapshot) {
      logger.warn(`No snapshot data for jobOfferApplicationId: ${jobOfferApplicationId}`);
      return;
    }
  
    const jobOfferApplicationData = snapshot.data();
    const { jobOfferId, userId } = jobOfferApplicationData;
  
    try {
      const jobOfferDoc = await adminFirebase.firestore().collection('jobOffers').doc(jobOfferId).get();
      const userDoc = await adminFirebase.firestore().collection('users').doc(userId).get();
  
      const [formationSnapshot, experienceSnapshot] = await Promise.all([
        adminFirebase.firestore().collection('experiences')
          .where('userId', '==', userId).where('type', '==', 'Formativa').get(),
        adminFirebase.firestore().collection('experiences')
          .where('userId', '==', userId).where('type', '==', 'Profesional').get(),
      ]);
  
      const criteria = jobOfferDoc.exists ? {
        offerCompetencies: jobOfferDoc.data().criteria[3].competencies.join(';'),
        offerCompetenciesWeight: jobOfferDoc.data().criteria[3].weight.toString(),
        offerLanguage: jobOfferDoc.data().criteria[2].requirementText,
        offerLanguageWeight: jobOfferDoc.data().criteria[2].weight.toString(),
        offerFormation: jobOfferDoc.data().criteria[0].requirementText,
        offerFormationWeight: jobOfferDoc.data().criteria[0].weight.toString(),
        offerExperience: jobOfferDoc.data().criteria[1].requirementText,
        offerExperienceWeight: jobOfferDoc.data().criteria[1].weight.toString(),
      } : null;
  
      const userFields = userDoc.exists ? {
        competencies: Object.keys(userDoc.data().competencies).join(';'),
        languages: userDoc.data().languages.join(';')
      } : { competencies: null, languages: null };
  
      const formationFields = formationSnapshot.empty ? '' :
        formationSnapshot.docs.map(doc => doc.data().nameFormation).filter(Boolean).join(';');
  
      const experienceFields = experienceSnapshot.empty ? '' : experienceSnapshot.docs.map(doc => {
        const data = doc.data();
        if (!data.professionActivitiesText) return null;
        let startYear = data.startDate?.toDate().getFullYear();
        let endYear = data.endDate ? data.endDate.toDate().getFullYear() : 'Actualidad';
        return `${data.professionActivitiesText} - ${startYear} - ${endYear}`;
      }).filter(Boolean).join(';');
  
      const promptPre = `Objetivo: Generar un JSON con resultados numéricos basados en la comparación de listas y criterios de evaluación específicos.\n
      Tareas:\n
      1. Evaluar Competencias:\n
          * Compara los elementos de la lista ${criteria.offerCompetencies} (separados por ;) con la lista ${userFields.competencies} (separados por ;).\n
          * Calcula un puntaje de 0 a ${criteria.offerCompetenciesWeight}:\n
              * 0: Ningún elemento coincide exactamente.\n
              * ${criteria.offerCompetenciesWeight}: Todos los elementos de la primera lista están contenidos exactamente en la segunda.\n
          * Agrega el resultado al campo "89QFQO49uloGU3vXaA2Z" del JSON.\n
      2. Evaluar Idiomas:\n
          * Compara los idiomas requeridos ${criteria.offerLanguage} con los idiomas dominados ${userFields.languages} (separados por ;).\n
          * Calcula un puntaje de 0 a ${criteria.offerLanguageWeight}:\n
              * 0: Ningún idioma coincide.\n
              * ${criteria.offerLanguageWeight}: Todos los idiomas requeridos coinciden exactamente.\n
          * Agrega el resultado al campo "xxxP0JVB9xkwjdrXk1vE" del JSON.\n
      3. Evaluar Formación Académica:\n
          * Compara los requisitos en ${criteria.offerFormation} con las formaciones en ${formationFields} (separados por ;).\n
          * Calcula un puntaje de 0 a ${criteria.offerFormationWeight}:\n
              * 0: Ninguna formación coincide.\n
              * ${criteria.offerFormationWeight}: Todas las formaciones coinciden exactamente.\n
          * Agrega el resultado al campo "8NUZxq3TCK4Q98S5ZDYB" del JSON.\n
      4. Evaluar Experiencia Laboral:\n
          * Compara los requisitos de experiencia en ${criteria.offerExperience} con las experiencias del aplicante a la oferta listadas en ${experienceFields} (separados por ;), cada una con años de inicio y fin.\n
          * Regla especial: Si el año de fin es “Actualidad, se considera que sigue activa.\n
          * Calcula un puntaje de 0 a ${criteria.offerExperienceWeight}:\n
              * 0: Ninguna experiencia de la oferta se ve reflejada en las del usuario.\n
              * ${criteria.offerExperienceWeight}: Todas las experiencias requeridas se encuentran entre las que posee el aplicante, distribuidas de cualquier forma.\n
          * Agrega el resultado al campo "RR2kOQfkmuSgFdHg7BWp" del JSON.\n
      Resultado esperado:\n
      El JSON debe incluir estos campos:\n
      {\n
        "89QFQO49uloGU3vXaA2Z": <numeric_value>,\n
        "xxxP0JVB9xkwjdrXk1vE": <numeric_value>,\n
        "8NUZxq3TCK4Q98S5ZDYB": <numeric_value>,\n
        "RR2kOQfkmuSgFdHg7BWp": <numeric_value>\n
       }/n`;

      const openaiResponse = await openai.chat.completions.create({
        model: openaiModel,
        temperature: orchestratorTemperature,
        messages: [{ role: 'system', content: [{ type: 'text', text: promptPre }] }]
      });
  
      const assistantResponsePre = openaiResponse.choices[0].message.content.trim().replace(/"/g, '');
  
      const generateData = {
        jobOfferApplicationId,
        jobOfferId,
        userId,
        ...criteria,
        ...userFields,
        formationFields,
        experienceFields,
        openAIResponse: assistantResponsePre
      };
  
      await adminFirebase.firestore().collection('generate').add(generateData);
      logger.info(`Documento creado exitosamente para ${jobOfferApplicationId}`);
    } catch (error) {
      logger.error('Error creando el documento en generate:', error);
      throw new Error('createGenerateDocument failed');
    }
  });

  exports.addEvaluationsField = onDocumentCreated('generate/{docId}', async (event) => {
    try {
      const snapshot = event.data;
      if (!snapshot) {
        logger.error('No snapshot data received.');
        return;
      }
  
      const { jobOfferApplicationId, openAIResponse } = snapshot.data();
  
      if (!jobOfferApplicationId) {
        logger.error('❌ jobOfferApplicationId is missing in the document.');
        return;
      }
  
      if (!openAIResponse) {
        logger.error('❌ openAIResponse is missing in the document.');
        return;
      }
  
      // Extrae el JSON del string de respuesta de OpenAI
      const extractJson = (inputText) => {
        const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
        const match = inputText.match(jsonRegex);
  
        if (match && match[1]) {
          let rawJson = match[1].trim();
          logger.info("📄 Texto extraído como JSON:", rawJson);
  
          rawJson = rawJson.replace(/(\w+)\s*:/g, '"$1":');
  
          try {
            return JSON.parse(rawJson);
          } catch (error) {
            logger.error("❌ Error al parsear JSON:", error);
          }
        }
        return null;
      };
  
      // Suma los valores numéricos del JSON como puntuación
      const calculateMatchValue = (data) => {
        if (!data) return null;
        return Object.values(data)
          .filter(value => typeof value === 'number')
          .reduce((sum, value) => sum + value, 0);
      };
  
      const resultJsonEvaluation = extractJson(openAIResponse);
      const matchValue = calculateMatchValue(resultJsonEvaluation);
  
      if (!resultJsonEvaluation) {
        logger.error('❌ No se pudo extraer un JSON válido de la respuesta OpenAI.');
        return;
      }
  
      // Busca la aplicación correspondiente
      const querySnapshot = await adminFirebase.firestore()
        .collection('jobOfferApplications')
        .where('jobOfferApplicationId', '==', jobOfferApplicationId)
        .get();
  
      if (querySnapshot.empty) {
        logger.error(`❌ No documents found with jobOfferApplicationId: ${jobOfferApplicationId}`);
        return;
      }
  
      // Actualiza cada documento encontrado
      const updates = querySnapshot.docs.map(doc => {
        return doc.ref.set({
          evaluations: resultJsonEvaluation,
          match: matchValue
        }, { merge: true });
      });
  
      await Promise.all(updates);
  
      logger.info(`✔ Evaluations field updated for jobOfferApplicationId: ${jobOfferApplicationId}`);
    } catch (error) {
      logger.error('❌ Error adding evaluations field:', error);
    }
  });

/*
exports.updateProvisional = functions.runWith(options).firestore.document('provisional/{provisionalId}')
    .onUpdate(async (change, context) => {
 
//         const resources = await adminFirebase.firestore().collection('resources').get();
 
//         console.log(`Recursos: ${resources.size}`);
 
//         var i = 1;
//         for (const resource of resources.docs) {
//             //console.log(`Recurso: ${resource.data().title}`);
//             let resourceTypeName = '';
//             let organizerName = '';
//             let countryName = '';
//             let provinceName = '';
//             let cityName = '';
//             let document;
 
//             if (resource.data().resourceType) {
//                 document = await adminFirebase.firestore().collection('resourcesTypes').doc(resource.data().resourceType).get();
//                 resourceTypeName = document.data().name;
//                 //console.log(`Tipo de recurso: ${resourceTypeName}`)
//             }
 
//             if (resource.data().organizer) {
//                 document = await adminFirebase.firestore().collection('organizations').doc(resource.data().organizer).get();
//                 organizerName = document.data().name;
//                 //console.log(`Organizador: ${organizerName}`)
//             }
 
//             if (resource.data().address.country) {
//                 document = await adminFirebase.firestore().collection('countries').doc(resource.data().address.country).get();
//                 countryName = document.data().name;
//                 //console.log(`País: ${countryName}`)
//             }
 
//             if (resource.data().address.province) {
//                 document = await adminFirebase.firestore().collection('provinces').doc(resource.data().address.province).get();
//                 provinceName = document.data().name;
//                 //console.log(`Provincia: ${provinceName}`)
//             }
 
//             if (resource.data().address.city) {
//                 document = await adminFirebase.firestore().collection('cities').doc(resource.data().address.city).get();
//                 cityName = document.data().name;
//                 //console.log(`Provincia: ${cityName}`)
//             }
 
//             await adminFirebase.firestore().doc(`resources/${resource.data().resourceId}`).set({ searchText: `${resource.data().title};${resourceTypeName};${organizerName};${countryName};${provinceName};${cityName}` }, { merge: true }).then(() => {
//                 console.log(`${i++} - Recurso actualizado: ${resource.data().title}, ${resourceTypeName}, ${organizerName}, ${countryName}, ${provinceName}, ${cityName}`);
//             });
//         }
 
//         console.log('FUNCIÓN COMPLETADA CORRECTAMENTE');
//     });
// */

// const { Firestore } = require('@google-cloud/firestore');
// const otherFirestore = new Firestore({
//   projectId: adminFirebase.instanceId().app.options.projectId,
//   keyFilename: 'enreda-d3b41-firebase-adminsdk-ndmgv-7115331f1e.json',
//   databaseId: 'kpis', 
// });


async function updateTotalParticipants() {
    try {
        const participantsCollectionRef = otherFirestore.collection('kpis').doc('fse').collection('participants');
        const informRef = otherFirestore.collection('kpis').doc('fse').collection('inform').doc('inform');
    
        const participantsSnapshot = await participantsCollectionRef.get();
        const totalParticipants = participantsSnapshot.size;

        let unemployedCount = 0;
        let unemployed_including_long_term_unemployedCount = 0;
        let long_term_unemployedCount = 0;
        let inactiveCount = 0;
        let employed_including_self_employedCount = 0;
        let manCount = 0;
        let womanCount = 0;
        let notBinaryCount = 0;
        let minorCount = 0;
        let age18to29Count = 0;
        let over54Count = 0;
        let cine02Count = 0;
        let cine24Count = 0;
        let cine58Count = 0;
        let disabilityCount = 0;
        let foreignCount = 0;
        let foreignNotEuropeCount = 0;
        let ethnicMinorityCount = 0;
        let homelessCount = 0;
        let ruralAreasCount = 0;
        let searchingJobCount = 0;
        let joinedToEducationSystemCount = 0;
        let obtainedQualificationCount = 0;
        let obtanidedJobCount = 0;

        const currentDate = new Date();

        participantsSnapshot.forEach(doc => {
            const data = doc.data();
            const laborSituation = data.laborSituation;
            const educationLevel = data.educationLevel;
            const disabilityState = data.disabilityState;
            const nationality = data.nationality;
            const region = data.region;
            const ipilData = data.ipilData;
            const gender = data.gender;

            if (gender === 'Hombre') {
                manCount++;
            } else if (gender === 'Mujer') {
                womanCount++;
            } else {
                notBinaryCount++;
            }

            if (laborSituation === 'Inactiva') {
                inactiveCount++;
            }

            if (laborSituation === 'Desempleada larga duración') {
                long_term_unemployedCount++;
            }

            if (laborSituation === 'Desempleada larga duración' || 
                laborSituation === 'Desempleada corta duración') {
                unemployed_including_long_term_unemployedCount++;
            }

            if (laborSituation === 'Desempleada larga duración' || 
                laborSituation === 'Desempleada corta duración' || 
                laborSituation === 'Inactiva') {
                unemployedCount++;
            }

            if (laborSituation === 'Ocupada cuenta propia' || 
                laborSituation === 'Ocupada cuenta ajena') {
                employed_including_self_employedCount++;
            }

            if (data.birthday) {
                const birthDate = new Date(data.birthday._seconds * 1000);
                let age = currentDate.getFullYear() - birthDate.getFullYear();
                const monthDifference = currentDate.getMonth() - birthDate.getMonth();
                if (monthDifference < 0 || (monthDifference === 0 && currentDate.getDate() < birthDate.getDate())) {
                  age--;
                }
                if (age < 18) {
                    minorCount++;
                  } else if (age >= 18 && age <= 29) {
                    age18to29Count++;
                  } else if (age > 54) {
                    over54Count++;
                  }
            }

            if (educationLevel === '1er ciclo 2ria (Max CINE 0-2)') {
                cine02Count++;
            }

            if (educationLevel === '2do ciclo 2ria (CINE 3) o postsecundaria (CINE 4)') {
                cine24Count++;
            }

            if (educationLevel === 'Superior o 3ria (CINE 5 a 8)') {
                cine58Count++;
            }

            if (disabilityState === 'Concedida') {
                disabilityCount++;
            }

            if (nationality !== 'España') {
                foreignCount++;
            }

            if (region !== 'Europe') {
                foreignNotEuropeCount++;
            }

            if (data.vulnerabilityOptions && data.vulnerabilityOptions.includes('Minoría étnica')) {
                ethnicMinorityCount++;
            }

            if (data.vulnerabilityOptions && data.vulnerabilityOptions.includes('Situación sinhogarismo')) {
                homelessCount++;
            }

            if (data.vulnerabilityOptions && data.vulnerabilityOptions.includes('Ruralidad')) {
                ruralAreasCount++;
            }

            if (ipilData && ipilData.includes('npaF0hzJRC7OwYSnO7Zr')) {
                searchingJobCount++;
            }

            if (ipilData && ipilData.includes('JUI5As4qjMByZKIoYeva')) {
                joinedToEducationSystemCount++;
            }

            if (ipilData && ipilData.includes('9GfMP3tp4sWZ91TWnABu')) {
                obtainedQualificationCount++;
            }

            if (ipilData && ipilData.includes('iKHgUq7ItDmSvtPnXJFP')) {
                obtanidedJobCount++;
            }

        });

        console.log(`Total participants: ${totalParticipants}`);
        console.log(`Total participants mujeres: ${womanCount}`);
        console.log(`Total participants hombres: ${manCount}`);
        console.log(`Total participants no binario: ${notBinaryCount}`);
        console.log(`Inactive participants: ${inactiveCount}`);
        console.log(`Long-term unemployed participants: ${long_term_unemployedCount}`);
        console.log(`Unemployed (including long-term): ${unemployed_including_long_term_unemployedCount}`);
        console.log(`Unemployed participants: ${unemployedCount}`);
        console.log(`Employed (including self-employed): ${employed_including_self_employedCount}`);
        console.log(`Minors (under 18): ${minorCount}`);
        console.log(`Participants aged 18-29: ${age18to29Count}`);
        console.log(`Participants over 54: ${over54Count}`);
        console.log(`Participants cine02Count: ${cine02Count}`);
        console.log(`Participants cine24Count: ${cine24Count}`);
        console.log(`Participants cine58Count: ${cine58Count}`);
        console.log(`Participants disability: ${disabilityCount}`);
        console.log(`Participants foreig: ${foreignCount}`);
        console.log(`Participants foreig not europe: ${foreignNotEuropeCount}`);
        console.log(`Participants from ethnic minorities: ${ethnicMinorityCount}`);
        console.log(`Participants homeless: ${homelessCount}`);
        console.log(`Participants rural areas: ${ruralAreasCount}`);
        console.log(`Participants search job: ${searchingJobCount}`);
        console.log(`Participants joined to education system: ${joinedToEducationSystemCount}`);
        console.log(`Participants obtained qualification: ${obtainedQualificationCount}`);
        console.log(`Participants obtained job: ${obtanidedJobCount}`);
  
        await informRef.update({ 
            total: totalParticipants, 
            woman: womanCount,
            man: manCount,
            notBinaryCount: notBinaryCount,
            unemployed: unemployedCount,
            unemployed_including_long_term_unemployed: unemployed_including_long_term_unemployedCount,
            long_term_unemployed: long_term_unemployedCount,
            inactive: inactiveCount,
            employed_including_self_employed: employed_including_self_employedCount,
            minors_under_18_years: minorCount,
            number_of_young_people_aged_18_to_29_years: age18to29Count,
            participants_over_54_years: over54Count,
            participants_with_primary_education_or_less_ISCED_0_to_2: cine02Count,
            participants_with_secondary_or_post_secondary_education_ISCED_3_to_4: cine24Count,
            participants_with_tertiary_education_or_above: cine58Count,
            participants_of_foreign_origin: foreignCount,
            third_country_nationals: foreignNotEuropeCount,
            participants_from_minorities_including_marginalized_communities_such_as_Roma: ethnicMinorityCount,
            homeless_or_excluded_from_housing: homelessCount,
            participants_from_rural_areas: ruralAreasCount,
            searchingJob : searchingJobCount,
            joinedToEducationSystem: joinedToEducationSystemCount,
            obtainedQualification: obtainedQualificationCount,
            obtanidedJob: obtanidedJobCount
        });
  
        console.log(`Document successfully updated in kpis/fse/inform/inform`);
    } catch (error) {
        console.error('Error updating total participants and unemployed in kpis/fse/inform/inform: ', error);
    }
  }

exports.copyParticipantsToKpis = onDocumentUpdated('initialReports/{reportId}', async (event) => {
    try {
      const before = event.data?.before?.data();
      const after = event.data?.after?.data();
      const reportId = event.params.reportId;
  
      if (!before || !after) {
        logger.error('Missing before or after data.');
        return;
      }
  
      // Ejecutar solo si el informe pasa de no-finalizado a finalizado
      if (before.finished !== true && after.finished === true) {
        const userId = after.userId;
        const userSnap = await adminFirebase.firestore().collection('users').doc(userId).get();
  
        if (!userSnap.exists) {
          logger.warn(`No existe el usuario con ID: ${userId}`);
          return;
        }
  
        const userData = userSnap.data();
  
        // Omitir si es un usuario de test
        if (userData.test) {
          logger.info(`Usuario ${userId} marcado como test, omitiendo...`);
          return;
        }
  
        // Buscar región según nacionalidad
        let region = null;
        if (userData.nationality) {
          const nationsSnap = await adminFirebase.firestore()
            .collection('nations')
            .where('translations.es', '==', userData.nationality)
            .get();
  
          if (!nationsSnap.empty) {
            const nationData = nationsSnap.docs[0].data();
            region = nationData.region || null;
          }
        }
  
        // Recuperar resultados IPIL
        let ipilData = [];
        const ipilSnap = await adminFirebase.firestore()
          .collection('ipilEntry')
          .where('userId', '==', userId)
          .get();
  
        ipilSnap.forEach(doc => {
          const entry = doc.data();
          if (entry.results) ipilData = ipilData.concat(entry.results);
        });
  
        // Construir y guardar documento participante
        const participantData = {
          userId,
          gender: userData.gender ?? null,
          birthday: userData.birthday ?? null,
          nationality: userData.nationality ?? null,
          assignedEntityId: userData.assignedEntityId ?? null,
          socialEntityId: userData.socialEntityId ?? null,
          laborSituation: after.laborSituation ?? null,
          educationLevel: after.educationLevel ?? null,
          vulnerabilityOptions: after.vulnerabilityOptions ?? null,
          region,
          ipilData,
        };
  
        await otherFirestore
          .collection('kpis')
          .doc('fse')
          .collection('participants')
          .doc(userId)
          .set(participantData, { merge: true });
  
        logger.info(`✅ Participante ${userId} copiado en kpis/fse/participants`);
  
        await updateTotalParticipants();
      }
    } catch (error) {
      logger.error('❌ Error en copyParticipantsToKpis:', error);
    }
  });

exports.removeParticipantsToKpisFinishedToFalse = onDocumentUpdated('initialReports/{reportId}', async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  const reportId = event.params.reportId;

  if (!before || !after) {
    console.warn('Missing before or after data');
    return;
  }

  // Detecta cambio de finished: true -> false
  if (before.finished !== false && after.finished === false) {
    try {
      const participantId = after.userId;

      const participantRef = otherFirestore
        .collection('kpis')
        .doc('fse')
        .collection('participants')
        .doc(participantId);

      const participantSnap = await participantRef.get();

      if (!participantSnap.exists) {
        console.log(`No existe participante con ID: ${participantId}`);
        return;
      }

      await participantRef.delete();
      await updateTotalParticipants();

      console.log(`Participante ${participantId} eliminado de kpis/fse/participants.`);
    } catch (error) {
      console.error('Error al eliminar participante de kpis/fse/participants:', error);
    }
  }
});

exports.removeParticipantOnInitialReportDeletion = onDocumentDeleted(
    "initialReports/{reportId}",
    async (event) => {
      const deletedValue = event.data?.data();
  
      if (!deletedValue) {
        logger.warn("⚠ No data found in deleted snapshot.");
        return;
      }
  
      const userId = deletedValue.userId;
  
      try {
        const participantRef = otherFirestore
          .collection("kpis")
          .doc("fse")
          .collection("participants")
          .doc(userId);
  
        const participantSnap = await participantRef.get();
  
        if (!participantSnap.exists) {
          logger.info(`ℹ Participante con userId ${userId} no encontrado en KPIs.`);
          return;
        }
  
        await participantRef.delete();
        await updateTotalParticipants(); // ← Asegúrate que esta función esté definida y accesible
  
        logger.info(
          `✅ Participante ${userId} eliminado correctamente de kpis/fse/participants.`
        );
      } catch (error) {
        logger.error(
          "❌ Error al eliminar el participante de la base de datos de KPIs:",
          error
        );
      }
    }
  );

//   exports.removeParticipantOnUserDeletion = functions.firestore
//   .document('users/{userId}')
//   .onDelete(async (snap, context) => {
//     const userId = context.params.userId;

//     try {
//       const participantRef = otherFirestore.collection('kpis').doc('fse').collection('participants').doc(userId);
//       const participantSnap = await participantRef.get();

//       if (!participantSnap.exists) {
//         console.log('No such participant!');
//         return;
//       }

//       await participantRef.delete();
//       await updateTotalParticipants();

//       console.log('Participant document successfully removed from kpis/fse/participants database in kpi Firestore');
//     } catch (error) {
//       console.error('Error removing participant document from kpis/fse/participants database in kpi Firestore: ', error);
//     }
//   });


exports.removeParticipantOnUserTestChange = onDocumentUpdated('users/{userId}', async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    const userId = event.params.userId;
  
    if (!before || !after) {
      logger.warn('Missing before or after data in document update.');
      return;
    }
  
    // Condición para eliminar participante
    if (before.test === false && after.finished !== false) {
      try {
        const participantRef = otherFirestore
          .collection('kpis')
          .doc('fse')
          .collection('participants')
          .doc(userId);
  
        const participantSnap = await participantRef.get();
  
        if (!participantSnap.exists) {
          logger.info(`No participant found for userId: ${userId}`);
          return;
        }
  
        await participantRef.delete();
        await updateTotalParticipants();
  
        logger.info(`✅ Participant with userId ${userId} successfully removed from kpis/fse/participants`);
      } catch (error) {
        logger.error(`❌ Error removing participant for userId ${userId}:`, error);
      }
    } else {
      logger.info(`No participant removal needed for userId ${userId}`);
    }
  });

exports.exportParticipantsToExcel = onRequest(async (req, res) => {
  try {
    const usersSnapshot = await otherFirestore
      .collection("kpis")
      .doc("fse")
      .collection("participants")
      .get();

    const users = [];

    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      const birthday = data.birthday
        ? new Date(data.birthday._seconds * 1000).toISOString().split("T")[0]
        : "";
      users.push({
        userId: doc.id,
        gender: data.gender || "",
        birthday: birthday || "",
        nationality: data.nationality || "",
        assignedEntityId: data.assignedEntityId || "",
        socialEntityId: data.socialEntityId || "",
        laborSituation: data.laborSituation || "",
        educationLevel: data.educationLevel || "",
        vulnerabilityOptions: data.vulnerabilityOptions || "",
        ipilData: data.ipilData || "",
      });
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Participants");

    worksheet.columns = [
      { header: "userId", key: "userId", width: 30 },
      { header: "gender", key: "gender", width: 30 },
      { header: "birthday", key: "birthday", width: 30 },
      { header: "nationality", key: "nationality", width: 30 },
      { header: "assignedEntityId", key: "assignedEntityId", width: 30 },
      { header: "socialEntityId", key: "socialEntityId", width: 30 },
      { header: "laborSituation", key: "laborSituation", width: 30 },
      { header: "educationLevel", key: "educationLevel", width: 30 },
      { header: "vulnerabilityOptions", key: "vulnerabilityOptions", width: 30 },
      { header: "ipilData", key: "ipilData", width: 30 },
    ];

    users.forEach((user) => {
      worksheet.addRow(user);
    });

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", 'attachment; filename="participants.xlsx"');
    res.status(200).send(buffer);
  } catch (error) {
    logger.error("Error generating Excel file:", error);
    res.status(500).send("Error generating Excel file");
  }
});

exports.exportKpisToExcel = onRequest(async (req, res) => {
  try {
    const informsSnapshot = await otherFirestore.collection('kpis').doc('fse').collection('inform').get();
    const informs = [];

    informsSnapshot.forEach(doc => {
      const data = doc.data();
      informs.push({
        total: data.total || 0,
        woman: data.woman || 0,
        man: data.man || 0,
        notBinary: data.notBinary || 0,
        unemployed: data.unemployed || 0,
        unemployed_including_long_term_unemployed: data.unemployed_including_long_term_unemployed || 0,
        long_term_unemployed: data.long_term_unemployed || 0,
        inactive: data.inactive || 0,
        employed_including_self_employed: data.employed_including_self_employed || 0,
        minors_under_18_years: data.minors_under_18_years || 0,
        number_of_young_people_aged_18_to_29_years: data.number_of_young_people_aged_18_to_29_years || 0,
        participants_over_54_years: data.participants_over_54_years || 0,
        participants_with_primary_education_or_less_ISCED_0_to_2: data.participants_with_primary_education_or_less_ISCED_0_to_2 || 0,
        participants_with_secondary_or_post_secondary_education_ISCED_3_to_4: data.participants_with_secondary_or_post_secondary_education_ISCED_3_to_4 || 0,
        participants_with_tertiary_education_or_above: data.participants_with_tertiary_education_or_above || 0,
        participants_with_disabilities: data.participants_with_disabilities || 0,
        third_country_nationals: data.third_country_nationals || 0,
        participants_of_foreign_origin: data.participants_of_foreign_origin || 0,
        participants_from_minorities_including_marginalized_communities_such_as_Roma: data.participants_from_minorities_including_marginalized_communities_such_as_Roma || 0,
        homeless_or_excluded_from_housing: data.homeless_or_excluded_from_housing || 0,
        participants_from_rural_areas: data.participants_from_rural_areas || 0,
        searchingJob: data.searchingJob || 0,
        joinedToEducationSystem: data.joinedToEducationSystem || 0,
        obtainedQualification: data.obtainedQualification || 0,
        obtanidedJob: data.obtanidedJob || 0
      });
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('FSE kpis');

    worksheet.columns = [
      { header: 'Número total de participantes', key: 'total', width: 30 },
      { header: 'Número total de mujeres', key: 'woman', width: 30 },
      { header: 'Número total de hombres', key: 'man', width: 30 },
      { header: 'Número total de no binarios', key: 'notBinary', width: 30 },
      { header: 'Desempleado', key: 'unemployed', width: 30 },
      { header: 'Desempleados, incluidos los de larga duración', key: 'unemployed_including_long_term_unemployed', width: 30 },
      { header: 'Desempleados de larga duración', key: 'long_term_unemployed', width: 30 },
      { header: 'Inactivo', key: 'inactive', width: 30 },
      { header: 'Empleados, incluso por cuenta propia', key: 'employed_including_self_employed', width: 30 },
      { header: 'Menores (menos de 18 años)', key: 'minors_under_18_years', width: 30 },
      { header: 'Número de personas jóvenes de edades comprendidas entre los 18 y los 29 años', key: 'number_of_young_people_aged_18_to_29_years', width: 30 },
      { header: 'Participantes de más de 54 años', key: 'participants_over_54_years', width: 30 },
      { header: 'Participantes con el primer ciclo de enseñanza secundaria como máximoCINE0a2', key: 'participants_with_primary_education_or_less_ISCED_0_to_2', width: 30 },
      { header: 'Participantes con el segundo ciclo de enseñanza secundaria o con enseñanza postsecundaria CINE2a4', key: 'participants_with_secondary_or_post_secondary_education_ISCED_3_to_4', width: 30 },
      { header: 'Participantes con enseñanza superior o terciaria', key: 'participants_with_tertiary_education_or_above', width: 30 },
      { header: 'Participantes con discapacidad', key: 'participants_with_disabilities', width: 30 },
      { header: 'Nacionales de terceros países', key: 'third_country_nationals', width: 30 },
      { header: 'Participantes de origen extranjero', key: 'participants_of_foreign_origin', width: 30 },
      { header: 'Participantes pertenecientes a minorías (incluidas las comunidades marginadas, como la romaní)', key: 'participants_from_minorities_including_marginalized_communities_such_as_Roma', width: 30 },
      { header: 'Personas sin hogar o afectadas por la exclusión en materia de vivienda', key: 'homeless_or_excluded_from_housing', width: 30 },
      { header: 'Participantes de zonas rurales', key: 'participants_from_rural_areas', width: 30 },
      { header: 'Participantes que buscan trabajo tras su participación', key: 'searchingJob', width: 30 },
      { header: 'Participantes que se han integrado en los sistemas de educación o formación tras su participación', key: 'joinedToEducationSystem', width: 30 },
      { header: 'Participantes que obtienen una cualificación tras su participación', key: 'obtainedQualification', width: 30 },
      { header: 'Participantes que obtienen un empleo tras su participación', key: 'obtanidedJob', width: 30 },
    ];

    informs.forEach(inform => worksheet.addRow(inform));

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="kpis_fse.xlsx"');
    res.status(200).send(buffer);
  } catch (error) {
    console.error('Error generating Excel file:', error);
    res.status(500).send('Error generating Excel file');
  }
});

// /* exports.sheduledKpisFSE = functions.pubsub.topic('sheduledKpisFSE').onPublish(async (message, context) => {
//     try {
//         const usersSnapshot = await otherFirestore.collection('kpis').doc('fse').collection('participants').get();
//         const users = [];

//         usersSnapshot.forEach(doc => {
//             const data = doc.data();
//             const birthday = data.birthday ? new Date(data.birthday._seconds * 1000).toISOString().split('T')[0] : '';
//             users.push({
//                 userId: doc.id,
//                 gender: data.gender || '',
//                 birthday: birthday || '',
//                 nationality: data.nationality || '',
//                 assignedEntityId: data.assignedEntityId || '',
//                 socialEntityId: data.socialEntityId || '',
//                 laborSituation: data.laborSituation || '',
//                 educationLevel: data.educationLevel || '',
//                 vulnerabilityOptions: data.vulnerabilityOptions || '',
//                 ipilData: data.ipilData || ''
//             });
//         });

//         const workbook = new ExcelJS.Workbook();
//         const worksheet = workbook.addWorksheet('Participants');

//         worksheet.columns = [
//             { header: 'userId', key: 'userId', width: 30 },
//             { header: 'gender', key: 'gender', width: 30 },
//             { header: 'birthday', key: 'birthday', width: 30 },
//             { header: 'nationality', key: 'nationality', width: 30 },
//             { header: 'assignedEntityId', key: 'assignedEntityId', width: 30 },
//             { header: 'socialEntityId', key: 'socialEntityId', width: 30 },
//             { header: 'laborSituation', key: 'laborSituation', width: 30 },
//             { header: 'educationLevel', key: 'educationLevel', width: 30 },
//             { header: 'vulnerabilityOptions', key: 'vulnerabilityOptions', width: 30 },
//             { header: 'ipilData', key: 'ipilData', width: 30 },
//         ];

//         users.forEach(user => {
//             worksheet.addRow(user);
//         });

//         const buffer = await workbook.xlsx.writeBuffer();
//         const date = new Date().toISOString().replace(/:/g, '-');
//         const fileName = `kpis/fse/participants_${date}.xlsx`;
//         const bucket = adminFirebase.storage().bucket();
//         const file = bucket.file(fileName);

//         await file.save(buffer, {
//             contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//         });

//         console.log('Excel file saved to Firebase Storage');
//     } catch (error) {
//         console.error('Error generating Excel file:', error);
//     }
// }); */

exports.sheduledKpisFSE = onMessagePublished({
    topic: 'sheduledKpisFSE',
    memory: '1GiB',
    region: 'europe-west1'
  }, async () => {
    try {
      const usersSnapshot = await otherFirestore.collection('kpis').doc('fse').collection('participants').get();
      const users = [];
  
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        const birthday = data.birthday ? new Date(data.birthday._seconds * 1000).toISOString().split('T')[0] : '';
        users.push({
          userId: doc.id,
          gender: data.gender || '',
          birthday,
          nationality: data.nationality || '',
          assignedEntityId: data.assignedEntityId || '',
          socialEntityId: data.socialEntityId || '',
          laborSituation: data.laborSituation || '',
          educationLevel: data.educationLevel || '',
          vulnerabilityOptions: data.vulnerabilityOptions || '',
          ipilData: data.ipilData || ''
        });
      });
  
      const workbookParticipants = new ExcelJS.Workbook();
      const worksheetParticipants = workbookParticipants.addWorksheet('Participants');
  
      worksheetParticipants.columns = Object.keys(users[0] || {}).map(key => ({ header: key, key, width: 30 }));
      users.forEach(user => worksheetParticipants.addRow(user));
  
      const bufferParticipants = await workbookParticipants.xlsx.writeBuffer();
      const date = new Date().toISOString().replace(/:/g, '-');
      const fileNameParticipants = `kpis/fse/participants_${date}.xlsx`;
      const bucket = adminFirebase.storage().bucket();
      const fileParticipants = bucket.file(fileNameParticipants);
  
      await fileParticipants.save(bufferParticipants, {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
  
      const [participantsUrl] = await fileParticipants.getSignedUrl({ action: 'read', expires: '01-01-2050' });
  
      logger.info('Participants Excel file saved to Firebase Storage');
      logger.info(`Participants URL: ${participantsUrl}`);
  
      const informsSnapshot = await otherFirestore.collection('kpis').doc('fse').collection('inform').get();
      const informs = informsSnapshot.docs.map(doc => doc.data());
  
      const workbookInforms = new ExcelJS.Workbook();
      const worksheetInforms = workbookInforms.addWorksheet('FSE kpis');
      worksheetInforms.columns = Object.keys(informs[0] || {}).map(key => ({ header: key, key, width: 30 }));
      informs.forEach(inform => worksheetInforms.addRow(inform));
  
      const bufferInforms = await workbookInforms.xlsx.writeBuffer();
      const fileNameInforms = `kpis/fse/informs_${date}.xlsx`;
      const fileInforms = bucket.file(fileNameInforms);
  
      await fileInforms.save(bufferInforms, {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
  
      const [informsUrl] = await fileInforms.getSignedUrl({ action: 'read', expires: '01-01-2050' });
  
      logger.info('Informs Excel file saved to Firebase Storage');
      logger.info(`Informs URL: ${informsUrl}`);
  
      await adminFirebase.firestore().collection('mail').add({
        to: [
          'sic4change@gmail.com',
          'aasencio@sic4change.org',
          'asuarez@sic4change.org',
          'bvillavicencio@sic4change.org',
          'lgarcia@sic4change.org'
        ],
        message: {
          subject: 'Informes Fondo Social Europeo (FSE).',
          html: `
            <p>Hola técnico/a de Enreda,</p>
            <p>Adjunto los informes de participantes y KPIs del Fondo Social Europeo (FSE).</p>
            <p><a href="${participantsUrl}" style="background-color: rgb(0,204,204); color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 4px;">Descargar Participantes</a></p>
            <p><a href="${informsUrl}" style="background-color: rgb(0,204,204); color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 4px;">Descargar KPIs</a></p>
            <p>Un saludo.</p>`
        }
      });
  
      logger.info('✔ Email queued with Excel links');
    } catch (error) {
      logger.error('❌ Error generating or sending Excel files:', error);
    }
  });
  


//   //Llamadas

// //CURL
// //curl -o participants.xlsx https://us-central1-enreda-d3b41.cloudfunctions.net/exportParticipantsToExcel
// //curl -o kpis_fse.xlsx https://us-central1-enreda-d3b41.cloudfunctions.net/exportKpisToExcel

//module.exports = require('./update/updateCountryOnly');
