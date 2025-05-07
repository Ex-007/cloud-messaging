import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()
  
  const firebaseService = config.firebaseService
  if (!firebaseService) {
    return {
      status: 500,
      error: 'Server configuration error: Firebase service account missing'
    }
  }

  const { token, title, message, data } = body
  
  if (!token || !title || !message) {
    return {
      status: 400,
      error: 'Missing required fields: token, title, or message'
    }
  }
  
  try {
    if (!getApps().length) {
      let credential = firebaseService
      
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
    
    const messaging = getMessaging()

    const messagePayload = {
      notification: {
        title,
        body: message
      }
    }
    
    if (data && Object.keys(data).length > 0) {
      messagePayload.data = data
    }
    

    let response
    if (Array.isArray(token)) {
      response = await messaging.sendMulticast({
        tokens: token,
        ...messagePayload
      })
      console.log('multicast response', response)
    } else {
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