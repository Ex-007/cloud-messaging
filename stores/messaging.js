import {defineStore} from 'pinia'
import { getToken, onMessage } from 'firebase/messaging'


export const useFirebasemessagingStore = defineStore('messaging', () => {
    const isLoading = ref(false)
    const error = ref(null)
    const tokenValue = ref(null)
    const {$firebase} = useNuxtApp()
    const messaging = $firebase?.messaging
    const runtimeConfig = useRuntimeConfig()

    // GET THE TOKEN
    const fetchToken = async () => {
        isLoading.value = true
        error.value = null
        const vapidKeyy = runtimeConfig.public.firebase.vapidKey
        try {
            const currentToken = await getToken(messaging, {
                vapidKey: vapidKeyy
            })
            if(currentToken){
                console.log(currentToken)
            }
        } catch (err) {
            error.value = err.message
            console.log(err.message)
        }finally{
            isLoading.value = true
        }
    }

    // SETUP MESSAGE LISTENER
    const setupMessageListener = () => {
        if (process.client && messaging) {
            onMessage(messaging, (payload) => {
                console.log('Foreground message received:', payload)
            })
        }
    }
    
    if (process.client) {
        nextTick(() => {
            setupMessageListener()
        })
    }

    // SEND NOTIFICATION
    const sendNoti = async (details) => {
        isLoading.value = true
        error.value = null
        try {
            const response = await $fetch('/api/sendingNotification', {
                method: 'POST',
                body: {
                    token: details.token,
                    message: details.message,
                    title: details.title
                }
            })
            console.log('The response', response)
        } catch (err) {
            error.value = err.message
            console.log(err.message)
        }finally{
            isLoading.value = false
        }
    }

    return{
        isLoading,
        error,
        fetchToken,
        sendNoti
    }
})
