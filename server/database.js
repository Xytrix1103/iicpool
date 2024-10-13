import {applicationDefault, initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {getAuth} from "firebase-admin/auth";
import dotenv from 'dotenv';

dotenv.config();

initializeApp({
	credential: applicationDefault(),
});

const db = getFirestore();
const auth = getAuth();

export {
	db,
	auth,
}
