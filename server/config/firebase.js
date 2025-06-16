
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCGYjdzVvrXnIw9BipGKskGBhB8hZRKaSE",
  authDomain: "drrajneeshkant-35d60.firebaseapp.com",
  projectId: "drrajneeshkant-35d60",
  storageBucket: "drrajneeshkant-35d60.firebasestorage.app",
  messagingSenderId: "288816992569",
  appId: "1:288816992569:web:24a6a8f39812f5ade1d8e8",
  measurementId: "G-SLXLJ6FX9C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);