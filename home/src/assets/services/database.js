import { getFirestore, doc, setDoc, getDoc, addDoc, updateDoc, writeBatch, collection, getDocs, query, where } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import {store} from '../../store/store';
import router from '../../router/index';
store.getters.config
// => 'config'


var firebaseConfig = {
    apiKey: process.env.VUE_APP_API_KEY,
    authDomain: process.env.VUE_APP_AUTH_DOMAIN,
    projectId: process.env.VUE_APP_PROJECT_ID,
    storageBucket: process.env.VUE_APP_STORAGE_BUCKET,
    messagingSenderId: process.env.VUE_APP_MESSAGING_SENDER_ID,
    appId: process.env.VUE_APP_APP_ID,
    measurementId: process.env.VUE_APP_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);


class FireDataService {

    async syncGoals(userid){
        const userRef = doc(collection(db, "users"), userid);
        const goalRef = collection(userRef, "goals");
        const querySnapshot = await getDocs(goalRef);
        const goals = querySnapshot.docs.map(doc => doc.data());

        try {
            const userDocRef = doc(db, "users", userRef.id); // Construct a DocumentReference to the user's document
            const userDocSnapshot = await getDoc(userDocRef); // Retrieve the user's document
            const additionalData = userDocSnapshot.data(); // Get the additional data from the document
            console.log(additionalData);
            if (additionalData){
                if (additionalData.year && additionalData.year != ""){
                    store.commit('setYear', additionalData.year);
                    console.log("Year set:", additionalData.year);

                }

                if (additionalData.password && additionalData.password != ""){
                    store.commit('setPasswd', additionalData.password);
                }
            }
        } catch (e) {
            console.error("Error retrieving user document: ", e);
        }

        console.log(goals);
        for(let g in goals){
            store.commit('addGoal', {
                userid: goals[g].userid,
                id: goals[g].id,
                text: goals[g].text,
                status: goals[g].status,
                deleted: goals[g].deleted
            });
        }
    }

    async saveGoals(goals,additional=false){
        const batch = writeBatch(db);
        const userRef = doc(collection(db, "users"));

        if(goals.length > 0){
            goals.forEach(goal => {
                const goalRef = doc(collection(userRef, "goals"));
                batch.set(goalRef, {
                    id: goal.id,
                    text: goal.text,
                    status: goal.status,
                    deleted: goal.deleted,
                    date: Date.now()
                });
              });
            await batch.commit();

            if(additional)
              if(additional.year && additional.year != "XX" && additional.year != "")
                try {
                    const userDocRef = doc(db, "users", userRef.id); // Construct a DocumentReference to the user's document
                    const docRef = await setDoc(userDocRef, {
                        year: additional.year,
                        password: additional.password,
                    });
                } catch (e) {
                    console.error("Error adding document: ", e);
                }

            router.push({ path: '/', query: { goal: userRef.id } });
            console.log(additional)
            return userRef.id;
        }
    }



    async setDeleted(payload){
        let userid = payload.userid;
        let gid = payload.gid;
        const userRef = doc(collection(db, "users"), userid);
        const goalRef = collection(userRef, "goals");
        const querySnapshot = await getDocs(goalRef);
        const goals = querySnapshot.docs.map(doc => doc.data());

        // const q1 = query(collection(db, 'goals'), where('userid', '==', userid));
        // const querySnapshot = await getDocs(q1);
        // const goals = querySnapshot.docs.map(doc => ({ docid: doc.id, ...doc.data() }));

        let docID;
        let deletedFB;

        for(let e in goals){
            if (goals[e].id == gid){
                console.log(goals[e]);
                deletedFB = goals[e].deleted;
                docID = goals[e].docid;
            }

        }
        const docRef = doc(db, 'goals', docID);

        await updateDoc(docRef, {
            deleted: !deletedFB
        });

        return !deletedFB

    }

    async setAdditional(payload){
        let passwd = payload.password;
    }
}

export default new FireDataService();