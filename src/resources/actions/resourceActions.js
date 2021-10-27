import { database } from '../../firebase/firebaseConfig';

export const addUserToResource = (id, data, basePath, userId) => {

    database.collection('resources').where( 'resourceId', '==', id).get().then(
        querySnapshot => {
            const resource = querySnapshot.docs.map(doc => doc.data())[0];
            let participantsUpdated
            let assistantsUpdated = Number(resource.assistants)
            if (resource.participants === undefined) {
                participantsUpdated = []
            } else {
                participantsUpdated = resource.participants;
                participantsUpdated.push(userId)
            }
            const resourceRef = database.collection('resources').doc(id);
            assistantsUpdated++
            resourceRef.update({
                participants: participantsUpdated,
                participantsString: participantsUpdated.join(),
                assistants: assistantsUpdated.toString()
            })

        });
}

export const addResourceToUser = (id, data, basePath, userId) => {
    database.collection('users').where( 'userId', '==', userId).get().then(
        querySnapshot => {
            const user = querySnapshot.docs.map(doc => doc.data())[0];
            let resourcesInUser = user.resourcesString;
            if (resourcesInUser === undefined) {
                resourcesInUser = id + ',';
            } else {
                resourcesInUser = resourcesInUser + id + ',';
            }
            const userRef = database.collection('users').doc(userId);
            userRef.update({
                resourcesString: resourcesInUser
            })

        });
}

export const removeUserFromResource = (id, data, basePath, userId) => {

    database.collection('resources').where( 'resourceId', '==', id).get().then(
        querySnapshot => {
            const resource = querySnapshot.docs.map(doc => doc.data())[0];

            let participantsUpdated = resource.participants;
            let assistantsUpdated = Number(resource.assistants)

            participantsUpdated = participantsUpdated.filter(e => e !== userId);

            const resourceRef = database.collection('resources').doc(id);
            assistantsUpdated--
            resourceRef.update({
                participants: participantsUpdated,
                participantsString: participantsUpdated.join(),
                assistants: assistantsUpdated.toString()
            })

        });
}

export const removeResourceToUser = (id, data, basePath, userId) => {
    database.collection('users').where( 'userId', '==', userId).get().then(
        querySnapshot => {
            const user = querySnapshot.docs.map(doc => doc.data())[0];
            let resourcesInUser = user.resourcesString;
            if (resourcesInUser !== undefined) {
                resourcesInUser = resourcesInUser.replace(id + ',','');
            } 
            const userRef = database.collection('users').doc(userId);
            userRef.update({
                resourcesString: resourcesInUser
            })

        });
}

export const removeUserInResource = (id, userId) => {

    database.collection('resources').where( 'resourceId', '==', id).get().then(
        querySnapshot => {
            const resource = querySnapshot.docs.map(doc => doc.data())[0];

            let participantsUpdated = resource.participants;
            let assistantsUpdated = Number(resource.assistants)

            participantsUpdated = participantsUpdated.filter(e => e !== userId);

            const resourceRef = database.collection('resources').doc(id);
            assistantsUpdated--
            resourceRef.update({
                participants: participantsUpdated,
                assistants: assistantsUpdated.toString()
            })

        });
}

export const addUserInResource = (id,userId) => {

    database.collection('resources').where( 'resourceId', '==', id).get().then(
        querySnapshot => {
            const resource = querySnapshot.docs.map(doc => doc.data())[0];
            let participantsUpdated
            let assistantsUpdated = Number(resource.assistants)
            if (resource.participants === undefined) {
                participantsUpdated = []
            } else {
                participantsUpdated = resource.participants;
                participantsUpdated.push(userId)
            }
            const resourceRef = database.collection('resources').doc(id);
            assistantsUpdated++
            resourceRef.update({
                participants: participantsUpdated,
                assistants: assistantsUpdated.toString()
            })

        });
}


