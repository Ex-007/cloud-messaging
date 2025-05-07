import { 
    getToken, 
    onMessage, 
    isSupported, 
    deleteToken 
  } from 'firebase/messaging'

  import { 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    arrayUnion, 
    arrayRemove, 
    collection, 
    getDocs 
  } from 'firebase/firestore'


  export const useFirebase = () => {
    const nuxtApp = useNuxtApp()
    const { $firebase } = nuxtApp
    const runtimeConfig = useRuntimeConfig()
    
    // Check if we're on client side and Firebase is available
    const isClient = process.client
    const messaging = isClient ? $firebase?.messaging : null
    const firestore = isClient ? $firebase?.firestore : null
    const auth = isClient ? $firebase?.auth : null
    
    // Initialize notification state
    const notificationSupported = ref(false)
    const notificationPermission = ref('default')
    const userToken = ref(null)
    
    // Check if notifications are supported
    const checkSupport = async () => {
      if (!isClient) return false
      
      try {
        notificationSupported.value = await isSupported()
        if (notificationSupported.value) {
          notificationPermission.value = Notification.permission
        }
        return notificationSupported.value
      } catch (error) {
        console.error('FCM support check failed:', error)
        return false
      }
    }
    
    // Request permission and get FCM token
    const requestPermission = async () => {
      if (!isClient || !notificationSupported.value) return null
      
      try {
        const permission = await Notification.requestPermission()
        notificationPermission.value = permission
        
        if (permission === 'granted') {
          return await getMessagingToken()
        }
        return null
      } catch (error) {
        console.error('Permission request failed:', error)
        return null
      }
    }
    
    // Get FCM token
    const getMessagingToken = async () => {
      if (!isClient || !messaging) return null
      
      try {
        const currentToken = await getToken(messaging, {
          vapidKey: runtimeConfig.public.firebase.vapidKey
        })
        
        if (currentToken) {
          userToken.value = currentToken
          await saveTokenToUser(currentToken)
          return currentToken
        } else {
          console.log('No registration token available')
          return null
        }
      } catch (error) {
        console.error('Token retrieval failed:', error)
        return null
      }
    }
    
    // Save token to user document in Firestore
    const saveTokenToUser = async (token) => {
      if (!isClient || !firestore || !auth?.currentUser) return
      
      try {
        const userId = auth.currentUser.uid
        const userRef = doc(firestore, 'users', userId)
        
        // Check if user document exists
        const userDoc = await getDoc(userRef)
        
        if (userDoc.exists()) {
          // Update existing user document
          await updateDoc(userRef, {
            fcmTokens: arrayUnion(token),
            updatedAt: new Date()
          })
        } else {
          // Create new user document
          await setDoc(userRef, {
            fcmTokens: [token],
            createdAt: new Date(),
            updatedAt: new Date()
          })
        }
      } catch (error) {
        console.error('Error saving token to Firestore:', error)
      }
    }
    
    // Remove token from user document in Firestore
    const removeTokenFromUser = async (token) => {
      if (!isClient || !firestore || !auth?.currentUser) return
      
      try {
        const userId = auth.currentUser.uid
        const userRef = doc(firestore, 'users', userId)
        
        await updateDoc(userRef, {
          fcmTokens: arrayRemove(token),
          updatedAt: new Date()
        })
        
        await deleteToken(messaging)
        userToken.value = null
      } catch (error) {
        console.error('Error removing token from Firestore:', error)
      }
    }
    
    // Subscribe to topic
    const subscribeToTopic = async (topic) => {
      if (!isClient || !auth?.currentUser) return
      
      try {
        const userId = auth.currentUser.uid
        const topicRef = doc(firestore, 'topics', topic)
        const topicDoc = await getDoc(topicRef)
        
        if (topicDoc.exists()) {
          await updateDoc(topicRef, {
            subscribers: arrayUnion(userId),
            updatedAt: new Date()
          })
        } else {
          await setDoc(topicRef, {
            subscribers: [userId],
            createdAt: new Date(),
            updatedAt: new Date()
          })
        }
        
        // Also update user's subscriptions
        const userRef = doc(firestore, 'users', userId)
        await updateDoc(userRef, {
          subscriptions: arrayUnion(topic),
          updatedAt: new Date()
        })
      } catch (error) {
        console.error('Error subscribing to topic:', error)
      }
    }
    
    // Unsubscribe from topic
    const unsubscribeFromTopic = async (topic) => {
      if (!isClient || !auth?.currentUser) return
      
      try {
        const userId = auth.currentUser.uid
        const topicRef = doc(firestore, 'topics', topic)
        
        await updateDoc(topicRef, {
          subscribers: arrayRemove(userId),
          updatedAt: new Date()
        })
        
        // Also update user's subscriptions
        const userRef = doc(firestore, 'users', userId)
        await updateDoc(userRef, {
          subscriptions: arrayRemove(topic),
          updatedAt: new Date()
        })
      } catch (error) {
        console.error('Error unsubscribing from topic:', error)
      }
    }
    
    // Listen for foreground messages
    const listenToMessages = () => {
      if (!isClient || !messaging) return
      
      // Handle foreground messages
      onMessage(messaging, (payload) => {
        console.log('Message received in foreground:', payload)
        
        // Get notification store
        const notificationStore = useNotificationStore()
        notificationStore.addNotification({
          id: Date.now().toString(),
          title: payload.notification?.title || 'New Notification',
          body: payload.notification?.body || '',
          data: payload.data || {},
          timestamp: new Date(),
          read: false
        })
        
        // Create and show notification
        if (notificationPermission.value === 'granted') {
          const notificationOptions = {
            body: payload.notification?.body,
            icon: '/favicon.ico',
            data: payload.data
          }
          
          const notification = new Notification(
            payload.notification?.title || 'New Notification',
            notificationOptions
          )
          
          notification.onclick = (event) => {
            event.preventDefault()
            // Handle notification click
            window.focus()
            notification.close()
          }
        }
      })
    }
    
    // Get all available topics
    const getAvailableTopics = async () => {
      if (!isClient || !firestore) return []
      
      try {
        const topicsRef = collection(firestore, 'topics')
        const topicsSnap = await getDocs(topicsRef)
        
        const topics = []
        topicsSnap.forEach((doc) => {
          topics.push({
            id: doc.id,
            ...doc.data()
          })
        })
        
        return topics
      } catch (error) {
        console.error('Error getting topics:', error)
        return []
      }
    }
    
    // Get user's subscribed topics
    const getUserSubscriptions = async () => {
      if (!isClient || !firestore || !auth?.currentUser) return []
      
      try {
        const userId = auth.currentUser.uid
        const userRef = doc(firestore, 'users', userId)
        const userDoc = await getDoc(userRef)
        
        if (userDoc.exists() && userDoc.data().subscriptions) {
          return userDoc.data().subscriptions
        }
        return []
      } catch (error) {
        console.error('Error getting user subscriptions:', error)
        return []
      }
    }
    
    // Initialize notifications
    const initializeNotifications = async () => {
      if (!isClient) return false
      
      const isSupported = await checkSupport()
      if (!isSupported) return false
      
      if (notificationPermission.value === 'granted') {
        await getMessagingToken()
        listenToMessages()
        return true
      }
      
      return false
    }
    
    return {
      notificationSupported,
      notificationPermission,
      userToken,
      checkSupport,
      requestPermission,
      getMessagingToken,
      removeTokenFromUser,
      subscribeToTopic,
      unsubscribeFromTopic,
      listenToMessages,
      getAvailableTopics,
      getUserSubscriptions,
      initializeNotifications
    }
  }