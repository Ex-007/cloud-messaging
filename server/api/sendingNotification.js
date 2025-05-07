import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'

export default defineEventHandler(async (event) => {
  console.log('start')
  const body = await readBody(event)
  const config = useRuntimeConfig()
  
  // Make sure your runtime config has the Firebase service account
  const firebaseService = config.firebaseService
  if (!firebaseService) {
    console.error('Firebase service account is not defined in runtime config')
    return {
      status: 500,
      error: 'Server configuration error: Firebase service account missing'
    }
  }

  const { token, title, message, data } = body
  console.log('body fetched')
  
  if (!token || !title || !message) {
    return {
      status: 400,
      error: 'Missing required fields: token, title, or message'
    }
  }
  
  console.log('values validated')

  try {
    // Initialize Firebase Admin SDK only once
    if (!getApps().length) {
      // Make sure firebaseService is properly formatted
      let credential = firebaseService
      
      // If it's a string, try to parse it (in case it's a JSON string)
      if (typeof firebaseService === 'string') {
        try {
          credential = JSON.parse(firebaseService)
        } catch (e) {
          console.error('Failed to parse firebaseService JSON string', e)
        }
      }
      
      initializeApp({
        credential: cert(credential)
      })
    }
    
    console.log('app initialized')
    const messaging = getMessaging()
    console.log('messaging initialized')

    const messagePayload = {
      notification: {
        title,
        body: message
      }
    }
    
    // Add data only if it exists and is not empty
    if (data && Object.keys(data).length > 0) {
      messagePayload.data = data
    }
    
    console.log('payload created:', messagePayload)

    let response
    if (Array.isArray(token)) {
      // For multiple tokens, use sendMulticast
      response = await messaging.sendMulticast({
        tokens: token,
        ...messagePayload
      })
      console.log('multicast response', response)
    } else {
      // For a single token
      response = await messaging.send({
        token,
        ...messagePayload
      })
      console.log('single response', response)
    }

    return {
      status: 200,
      message: 'Notification sent successfully',
      response,
    }
  } catch (error) {
    console.error('FCM Send Error:', error)
    return {
      status: 500,
      error: 'Failed to send notification',
      details: error.message,
    }
  }
})