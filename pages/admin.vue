<template>
    <div>
        <h1>This is the admin page for sending notifications</h1>
        <div>
            <input type="text" placeholder="title" v-model="notiDetails.title"><br><br>
            <input type="text" placeholder="message" v-model="notiDetails.message"><br><br>
            <input type="text" placeholder="token" v-model="notiDetails.token"><br><br>
            <button @click="sendNotification">send</button>
        </div>
        
    </div>
</template>

<script setup>
        import {useFirebasemessagingStore} from '@/stores/messaging'
        const messaging = useFirebasemessagingStore()

        const notiDetails = ref({
            title: '',
            message: '',
            token: ''
        })

        const sendNotification = async() => {
            if(notiDetails.value.message == '' || notiDetails.value.title == '' || notiDetails.value.token == ''){
                console.log('No field should be left empty')
                return
            }
            console.log(notiDetails.value)
            await messaging.sendNoti(notiDetails.value)
            console.log('done')
        }
</script>