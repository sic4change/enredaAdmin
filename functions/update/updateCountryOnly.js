// functions/update/updateCountryOnly.js

// const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
// const { onDocumentCreated } = require('firebase-functions/v2/firestore');
// const { onDocumentDeleted } = require('firebase-functions/v2/firestore');
// const { onMessagePublished } = require('firebase-functions/v2/pubsub');


// const { logger } = require('firebase-functions');

// const adminFirebase = require('firebase-admin');

// adminFirebase.initializeApp();

// var options = { memory: '2GB', timeoutSeconds: 540 };

// const { Firestore } = require('@google-cloud/firestore');
// const otherFirestore = new Firestore({
//   projectId: 'enreda-d3b41',
//   databaseId: 'kpis',
// });


exports.updateCountry = onDocumentUpdated('countries/{countryId}', async (event) => {
  const previousValue = event.data?.before?._fieldsProto;
  const countryId = previousValue?.countryId?.stringValue;

  logger.info('RAW EVENT:', JSON.stringify(event));
  logger.info('Before fields:', event.data?.before?._fieldsProto);
  logger.info('After fields:', event.data?.after?._fieldsProto);

  if (!countryId) {
    logger.warn('No countryId found in previous document');
    return;
  }

  const db = adminFirebase.firestore();
  const resourcesSnapshot = await db
    .collection('resources')
    .where('address.country', '==', countryId)
    .get();

  for (const resource of resourcesSnapshot.docs) {
    const data = resource.data();
    await updateResourceSearchText(resource, data.resourceId);
  }

  logger.info('All resources searchText have been modified with the new country');
  return;
});

exports.createProvince = onDocumentCreated('provinces/{provinceId}', async (event) => {
    const provinceId = event.params.provinceId;
  
    try {
      await adminFirebase.firestore()
        .doc(`provinces/${provinceId}`)
        .set({ provinceId, active: true }, { merge: true });
  
      logger.info(`✔ Successfully added provinceId to new province: ${provinceId}`);
    } catch (error) {
      logger.error(`❌ Failed to set provinceId for ${provinceId}:`, error);
      throw new Error(`createProvince failed for ${provinceId}`);
    }
  });


exports.createCountry = onDocumentCreated('countries/{countryId}', async (event) => {
    const countryId = event.params.countryId;
  
    try {
      await adminFirebase.firestore()
        .doc(`countries/${countryId}`)
        .set({ countryId, active: true }, { merge: true });
  
      logger.info(`✔ Successfully added countryId to new country: ${countryId}`);
    } catch (error) {
      logger.error(`❌ Failed to set countryId for ${countryId}:`, error);
      throw new Error(`createCountry failed for ${countryId}`);
    }
  });

exports.createExperience = onDocumentCreated('experiences/{id}', async (event) => {
    const id = event.params.id;
  
    try {
      await adminFirebase.firestore()
        .doc(`experiences/${id}`)
        .set({ id }, { merge: true });
  
      logger.info(`✔ ID added to experience: ${id}`);
    } catch (error) {
      logger.error(`❌ Failed to set ID for experience ${id}:`, error);
      throw new Error(`createExperience failed for ${id}`);
    }
  });

  exports.createResource = onDocumentCreated(
    {
      ...options,
      document: 'resources/{resourceId}',
    },
    async (event) => {
    const resourceId = event.params.resourceId;
    logger.info(`✔ Recurso creado correctamente: ${resourceId}`);
    const docRef = adminFirebase.firestore().doc(`resources/${resourceId}`);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
        logger.error(`❌ Documento resources/${resourceId} no encontrado.`);
        return;
    }

    const data = docSnap.data();

  
      const onlineUpdate = data.modality !== 'Presencial';
      const address = data.address || {};
      const countryUpdate = address.country ?? 'undefined';
      const provinceUpdate = address.province ?? 'undefined';
      const cityUpdate = address.city ?? 'undefined';
      const placeUpdate = address.place ?? '';
  
      const baseUpdate = {
        enable: true,
        online: onlineUpdate,
        status: 'Disponible',
        address: {
          place: placeUpdate,
          country: countryUpdate,
          province: provinceUpdate,
          city: cityUpdate,
        },
      };
  
      // Agregar el enlace público del recurso
      await docRef.set(
        {
          resourceLink: `https://enredawebapp.web.app/resources/${resourceId}`,
        },
        { merge: true }
      );
  
      // Llamar a la función que actualiza el campo searchText
      await updateResourceSearchText(docSnap, resourceId);
  
      // Lógica por tipo de organizador
      if (data.organizerType === 'Mentor') {
        const userSnap = await adminFirebase
          .firestore()
          .collection('users')
          .where('userId', '==', data.organizer)
          .get();
  
        if (!userSnap.empty) {
          const user = userSnap.docs[0].data();
          const trust = !!user.trust;
  
          await docRef.set({ resourceId }, { merge: true });
          await docRef.update({ ...baseUpdate, trust });
        }
  
      } else if (data.organizerType === 'Organización') {
        await docRef.set({ resourceId }, { merge: true });
  
        if (data.organizer === 'btTAIYUkGSgqlEAnaZJB') {
          const now = adminFirebase.firestore.Timestamp.now();
          await docRef.update({
            end: now,
            start: now,
            lastupdate: now,
            createdate: now,
            maximumDate: now,
            trust: true,
          });
        } else {
          const orgSnap = await adminFirebase
            .firestore()
            .collection('organizations')
            .where('organizationId', '==', data.organizer)
            .get();
  
          if (!orgSnap.empty) {
            const org = orgSnap.docs[0].data();
            const trust = !!org.trust;
  
            await docRef.update({ ...baseUpdate, trust });
          }
        }
  
      } else {
        await docRef.set({ resourceId }, { merge: true });
        await docRef.update({ ...baseUpdate, trust: true });
      }
  
      logger.info(`✔ Recurso creado correctamente: ${resourceId}`);
    }
  );

  exports.createIpilEntry = onDocumentCreated('ipilEntry/{ipilId}', async (event) => {
    const ipilId = event.params.ipilId;
  
    try {
      await adminFirebase.firestore()
        .doc(`ipilEntry/${ipilId}`)
        .set({ ipilId }, { merge: true });
  
      logger.info(`✔ Successfully added ipilId to new ipilEntry: ${ipilId}`);
    } catch (error) {
      logger.error(`❌ Failed to set ipilId for ${ipilId}:`, error);
      throw new Error(`createIpilEntry failed for ${ipilId}`);
    }
  });


exports.createIpilObjectives = onDocumentCreated('ipilObjectives/{ipilObjectivesId}', async (event) => {
    const ipilObjectivesId = event.params.ipilObjectivesId;
    const snapshot = event.data;
  
    if (!snapshot || !snapshot.data) {
      logger.error(`❌ event.data está vacío para: ${ipilObjectivesId}`);
      return;
    }
  
    const data = snapshot.data();
    const userId = data.userId;
  
    try {
      const db = adminFirebase.firestore();
  
      // Guardar ipilObjectivesId en el mismo documento
      await db.doc(`ipilObjectives/${ipilObjectivesId}`).set({ ipilObjectivesId }, { merge: true });
      logger.info(`✔ Successfully added ipilObjectivesId to ipilObjectives/${ipilObjectivesId}`);
  
      // Buscar usuarios por userId y actualizar ipilObjectivesId
      const userQuery = await db.collection('users').where('userId', '==', userId).get();
  
      if (userQuery.empty) {
        logger.warn(`⚠️ No se encontraron usuarios con userId: ${userId}`);
        return;
      }
  
      const updatePromises = userQuery.docs.map((userDoc) => {
        return db.collection('users')
          .doc(userDoc.id)
          .set({ ipilObjectivesId }, { merge: true })
          .then(() => {
            logger.info(`✔ ipilObjectivesId agregado al usuario ${userDoc.id}`);
          });
      });
  
      await Promise.all(updatePromises);
    } catch (error) {
      logger.error(`❌ Error en createIpilObjectives para ${ipilObjectivesId}:`, error);
      throw new Error(`createIpilObjectives failed for ${ipilObjectivesId}`);
    }
  });


exports.updateCity = onDocumentUpdated('cities/{cityId}', async (event) => {
    const previousValue = event.data?.before?._fieldsProto;
    const cityId = previousValue?.cityId?.stringValue;
  
    if (!cityId) {
      logger.warn('No cityId found in previous document');
      return;
    }
  
    const db = adminFirebase.firestore();
    const resourcesSnapshot = await db
      .collection('resources')
      .where('address.city', '==', cityId)
      .get();
  
    for (const resource of resourcesSnapshot.docs) {
      const data = resource.data();
      await updateResourceSearchText(resource, data.resourceId);
    }
  
    logger.info('All resources searchText have been modified with the new city');
  });


exports.createAbility = onDocumentCreated('abilities/{abilityId}', async (event) => {
  const abilityId = event.params.abilityId;

  try {
    await adminFirebase.firestore()
      .doc(`abilities/${abilityId}`)
      .set({ abilityId }, { merge: true });

    console.log(`✔ Successfully added abilityId to new ability: ${abilityId}`);
  } catch (error) {
    console.error(`❌ Failed to set abilityId for ${abilityId}:`, error);
    throw new Error(`createAbility failed for ${abilityId}`);
  }
});

exports.createResourceType = onDocumentCreated('resourcesTypes/{resourceTypeId}', async (event) => {
  const resourceTypeId = event.params.resourceTypeId;

  try {
    await adminFirebase.firestore()
      .doc(`resourcesTypes/${resourceTypeId}`)
      .set({ resourceTypeId }, { merge: true });

    console.log(`✔ Successfully added resourceTypeId to new resourceType: ${resourceTypeId}`);
  } catch (error) {
    console.error(`❌ Failed to set resourceTypeId for ${resourceTypeId}:`, error);
    throw new Error(`createResourceType failed for ${resourceTypeId}`);
  }
});


exports.deleteUser = onDocumentDeleted('users/{userId}', async (event) => {
  const userId = event.params.userId;

  try {
    await adminFirebase.auth().deleteUser(userId);
    console.log(`✔ Successfully deleted user ${userId} from Firebase Auth`);

    const bucket = adminFirebase.storage().bucket();
    await bucket.deleteFiles({ prefix: `users/${userId}` });
    console.log(`✔ Successfully deleted storage files for user ${userId}`);
  } catch (error) {
    console.error(`❌ Error deleting user ${userId}:`, error);
    throw new Error(`deleteUser failed for ${userId}`);
  }
});

exports.deleteResource = onDocumentDeleted('resources/{resourceId}', async (event) => {
  const deletedResource = event.data?.data();

  if (!deletedResource) {
    console.warn('⚠️ No resource data found in delete event');
    return;
  }

  const { participants = [], title = 'un recurso' } = deletedResource;

  if (participants.length === 0) {
    console.log('ℹ️ No participants to notify for deleted resource.');
    return;
  }

  const payload = {
    notification: {
      title: 'Enreda',
      body: `Ha sido cancelado o suspendido el recurso: ${title}`,
    },
    data: {
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
      title: 'Enreda',
      body: `Ha sido cancelado o suspendido el recurso: ${title}`,
    },
  };

  const options = {
    priority: 'high',
    timeToLive: 60 * 60 * 24, // 24 horas
  };

  // Enviar notificación a cada topic de usuario
  const messaging = adminFirebase.messaging();
  await Promise.all(
    participants.map((userTopic) =>
      messaging.send({
        topic: userTopic,
        notification: payload.notification,
        data: payload.data,
        android: {
          priority: options.priority,
          ttl: options.timeToLive * 1000, // convierte a milisegundos
        },
      })
    )
  );

  console.log(`✔ Notificaciones enviadas a ${participants.length} participantes.`);
});

exports.deleteOrganization = onDocumentDeleted('organizations/{organizationId}', async (event) => {
  const organizationId = event.params.organizationId;
  const db = adminFirebase.firestore();

  try {
    // Eliminar recursos asociados a la organización
    const resourcesSnapshot = await db.collection('resources').where('organizer', '==', organizationId).get();

    for (const resource of resourcesSnapshot.docs) {
      await db.collection('resources').doc(resource.id).delete();
      logger.info(`✔ Resource ${resource.id} deleted`);

      // Eliminar usuarios asociados a la organización
      const usersSnapshot = await db.collection('users').where('organization', '==', organizationId).get();

      for (const user of usersSnapshot.docs) {
        const userId = user.id;

        await db.collection('users').doc(userId).delete();
        logger.info(`✔ Firestore user ${userId} deleted`);

        try {
          await adminFirebase.auth().deleteUser(userId);
          logger.info(`✔ Auth user ${userId} deleted`);
        } catch (authError) {
          logger.warn(`⚠️ Could not delete auth user ${userId}: ${authError.message}`);
        }

        try {
          const bucket = adminFirebase.storage().bucket();
          await bucket.deleteFiles({ prefix: `users/${userId}` });
          logger.info(`✔ Storage files for user ${userId} deleted`);
        } catch (storageError) {
          logger.warn(`⚠️ Could not delete storage files for user ${userId}: ${storageError.message}`);
        }
      }
    }
  } catch (error) {
    logger.error(`❌ Error during deleteOrganization for ${organizationId}:`, error);
    throw new Error(`deleteOrganization failed: ${error.message}`);
  }
});

exports.createInterest = onDocumentCreated('interests/{interestId}', async (event) => {
  const interestId = event.params.interestId;

  try {
    await adminFirebase.firestore()
      .doc(`interests/${interestId}`)
      .set({ interestId }, { merge: true });

    logger.info(`✔ Successfully added interestId to new interest: ${interestId}`);
  } catch (error) {
    logger.error(`❌ Failed to set interestId for ${interestId}:`, error);
    throw new Error(`createInterest failed for ${interestId}`);
  }
});

exports.createSpecificInterest = onDocumentCreated('specificInterests/{specificInterestId}', async (event) => {
  const specificInterestId = event.params.specificInterestId;

  try {
    await adminFirebase.firestore()
      .doc(`specificInterests/${specificInterestId}`)
      .set({ specificInterestId }, { merge: true });

    logger.info(`✔ Successfully added specificInterestId to new specificInterest: ${specificInterestId}`);
  } catch (error) {
    logger.error(`❌ Failed to set specificInterestId for ${specificInterestId}:`, error);
    throw new Error(`createSpecificInterest failed for ${specificInterestId}`);
  }
});

exports.removeParticipantOnUserDeletion = onDocumentDeleted('users/{userId}', async (event) => {
  const userId = event.params.userId;

  try {
    const participantRef = otherFirestore.collection('kpis').doc('fse').collection('participants').doc(userId);
    const participantSnap = await participantRef.get();

    if (!participantSnap.exists) {
      logger.info(`ℹ️ Participant document for userId ${userId} does not exist.`);
      return;
    }

    await participantRef.delete();
    await updateTotalParticipants(); // Asegúrate de que esta función esté correctamente definida e importada

    logger.info(`✔ Participant document successfully removed from kpis/fse/participants for userId: ${userId}`);
  } catch (error) {
    logger.error(`❌ Failed to remove participant for userId ${userId}:`, error);
    throw new Error(`removeParticipantOnUserDeletion failed for ${userId}`);
  }
});


exports.checkResourceDate = onMessagePublished('checkResourceDate', async (event) => {
  try {
    const snapshot = await adminFirebase.firestore().collection('resources').get();
    const now = adminFirebase.firestore.Timestamp.now();

    const updates = snapshot.docs.map(async (resourceDoc) => {
      const data = resourceDoc.data();

      const shouldDisable =
        (data.end && data.end.toMillis() <= now.toMillis()) ||
        (data.maximumDate && data.maximumDate.toMillis() <= now.toMillis());

      if (shouldDisable && data.status !== 'A actualizar') {
        await resourceDoc.ref.update({
          enable: false,
          status: 'No disponible',
        });
        logger.info(`⛔ Recurso deshabilitado: ${data.title || data.resourceId}`);
      }
    });

    await Promise.all(updates);
    logger.info('✔ Revisión de fechas de recursos completada');
  } catch (error) {
    logger.error('❌ Error en checkResourceDate:', error);
  }
});

exports.deleteCountry = onDocumentDeleted('countries/{countryId}', (event) => {
  const countryId = event.params.countryId;

  return adminFirebase.firestore().collection('provinces').where("countryId", "==", countryId).get()
    .then((snapshot) => {
      const deletions = snapshot.docs.map((province) => {
        return adminFirebase.firestore().collection("provinces").doc(province.id).delete()
          .then(() => {
            logger.info(`✔ Associated province deleted: ${province.id}`);
          });
      });
      return Promise.all(deletions);
    })
    .catch((error) => {
      logger.error(`❌ Error deleting provinces for country ${countryId}:`, error);
    });
});

async function updateTotalParticipants() {
  try {
    const db = otherFirestore;
    const participantsRef = db.collection('kpis').doc('fse').collection('participants');
    const informRef = db.collection('kpis').doc('fse').collection('inform').doc('inform');

    const snapshot = await participantsRef.get();
    const currentDate = new Date();

    const counters = {
      total: snapshot.size,
      woman: 0,
      man: 0,
      notBinaryCount: 0,
      unemployed: 0,
      unemployed_including_long_term_unemployed: 0,
      long_term_unemployed: 0,
      inactive: 0,
      employed_including_self_employed: 0,
      minors_under_18_years: 0,
      number_of_young_people_aged_18_to_29_years: 0,
      participants_over_54_years: 0,
      participants_with_primary_education_or_less_ISCED_0_to_2: 0,
      participants_with_secondary_or_post_secondary_education_ISCED_3_to_4: 0,
      participants_with_tertiary_education_or_above: 0,
      participants_with_disabilities: 0,
      participants_of_foreign_origin: 0,
      third_country_nationals: 0,
      participants_from_minorities_including_marginalized_communities_such_as_Roma: 0,
      homeless_or_excluded_from_housing: 0,
      participants_from_rural_areas: 0,
      searchingJob: 0,
      joinedToEducationSystem: 0,
      obtainedQualification: 0,
      obtanidedJob: 0,
    };

    snapshot.forEach(doc => {
      const data = doc.data();
      const { gender, laborSituation, educationLevel, disabilityState, nationality, region, birthday, ipilData, vulnerabilityOptions } = data;

      // Género
      if (gender === 'Hombre') counters.man++;
      else if (gender === 'Mujer') counters.woman++;
      else counters.notBinaryCount++;

      // Situación laboral
      if (laborSituation === 'Inactiva') counters.inactive++;
      if (laborSituation === 'Desempleada larga duración') counters.long_term_unemployed++;
      if (['Desempleada corta duración', 'Desempleada larga duración'].includes(laborSituation))
        counters.unemployed_including_long_term_unemployed++;
      if (['Inactiva', 'Desempleada corta duración', 'Desempleada larga duración'].includes(laborSituation))
        counters.unemployed++;
      if (['Ocupada cuenta ajena', 'Ocupada cuenta propia'].includes(laborSituation))
        counters.employed_including_self_employed++;

      // Edad
      if (birthday?.seconds) {
        const birthDate = new Date(birthday.seconds * 1000);
        let age = currentDate.getFullYear() - birthDate.getFullYear();
        const m = currentDate.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && currentDate.getDate() < birthDate.getDate())) age--;

        if (age < 18) counters.minors_under_18_years++;
        else if (age <= 29) counters.number_of_young_people_aged_18_to_29_years++;
        else if (age > 54) counters.participants_over_54_years++;
      }

      // Educación
      if (educationLevel === '1er ciclo 2ria (Max CINE 0-2)') counters.participants_with_primary_education_or_less_ISCED_0_to_2++;
      if (educationLevel === '2do ciclo 2ria (CINE 3) o postsecundaria (CINE 4)') counters.participants_with_secondary_or_post_secondary_education_ISCED_3_to_4++;
      if (educationLevel === 'Superior o 3ria (CINE 5 a 8)') counters.participants_with_tertiary_education_or_above++;

      // Otras características
      if (disabilityState === 'Concedida') counters.participants_with_disabilities++;
      if (nationality !== 'España') counters.participants_of_foreign_origin++;
      if (region !== 'Europe') counters.third_country_nationals++;

      if (vulnerabilityOptions?.includes('Minoría étnica'))
        counters.participants_from_minorities_including_marginalized_communities_such_as_Roma++;
      if (vulnerabilityOptions?.includes('Situación sinhogarismo'))
        counters.homeless_or_excluded_from_housing++;
      if (vulnerabilityOptions?.includes('Ruralidad'))
        counters.participants_from_rural_areas++;

      if (ipilData?.includes('npaF0hzJRC7OwYSnO7Zr')) counters.searchingJob++;
      if (ipilData?.includes('JUI5As4qjMByZKIoYeva')) counters.joinedToEducationSystem++;
      if (ipilData?.includes('9GfMP3tp4sWZ91TWnABu')) counters.obtainedQualification++;
      if (ipilData?.includes('iKHgUq7ItDmSvtPnXJFP')) counters.obtanidedJob++;
    });

    // Log para verificación
    console.log('Actualizando datos de participantes con:', counters);

    await informRef.update(counters);
    console.log('✔ Documento kpis/fse/inform/inform actualizado correctamente');
  } catch (error) {
    console.error('❌ Error actualizando total de participantes:', error);
  }
}


async function updateResourceSearchText(resource, resourceId) {
    const db = adminFirebase.firestore();
  
    const data = resource.data();
  
    let resourceTypeName = '';
    let organizerName = '';
    let countryName = '';
    let provinceName = '';
    let cityName = '';
  
    // Utilidad para cargar documentos si existen
    async function getNameFromCollection(collection, docId) {
      if (!docId || docId === 'undefined') return '';
      const docSnap = await db.collection(collection).doc(docId).get();
      return docSnap.exists ? docSnap.data().name || '' : '';
    }
  
    resourceTypeName = await getNameFromCollection('resourcesTypes', data.resourceType);
  
    if (data.organizerType === 'Organización') {
      organizerName = await getNameFromCollection('organizations', data.organizer);
    } else if (data.organizerType === 'Entidad Social') {
      organizerName = await getNameFromCollection('socialEntities', data.organizer);
    }
  
    if (data.address) {
      countryName = await getNameFromCollection('countries', data.address.country);
      provinceName = await getNameFromCollection('provinces', data.address.province);
      cityName = await getNameFromCollection('cities', data.address.city);
    }
  
    const searchText = [
      data.title,
      resourceTypeName,
      organizerName,
      countryName,
      provinceName,
      cityName,
    ].filter(Boolean).join(';');
  
    await db.doc(`resources/${resourceId}`).set({ searchText }, { merge: true });
  
    console.log(`✔ Recurso actualizado: ${data.title} → ${searchText}`);
  }
  
  