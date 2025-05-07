import { initializeApp } from 'firebase/app'
import { getMessaging} from 'firebase/messaging'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

export default defineNuxtPlugin((nuxtApp) => {
    const config = useRuntimeConfig()
    
    if (process.client) {
      const firebaseConfig = config.public.firebase
      const app = initializeApp(firebaseConfig)
      
      const messaging = getMessaging(app)
      const firestore = getFirestore(app)
      const auth = getAuth(app)
      
      nuxtApp.provide('firebase', { app, messaging, firestore, auth })
    }
  })