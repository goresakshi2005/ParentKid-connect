import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// These should be set in your frontend .env file as REACT_APP_...
const firebaseConfig = {

  apiKey: "AIzaSyDoo6G4DwXiww6w3rTvGCALP-jTKdlWG9Y",

  authDomain: "screentimetracker-bc0d3.firebaseapp.com",

  projectId: "screentimetracker-bc0d3",

  storageBucket: "screentimetracker-bc0d3.firebasestorage.app",

  messagingSenderId: "89080376112",

  appId: "1:89080376112:web:abdb4c2a047b84225fb6f5",

  measurementId: "G-LKVHV1DKQY"

};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
