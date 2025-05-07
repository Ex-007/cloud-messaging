<template>
    <div>
        <h1>This is the test page</h1>
    </div>
</template>

<script setup>
    import {useFirebasemessagingStore} from '@/stores/messaging'
    const messaging = useFirebasemessagingStore()



    onMounted(() => {
        messaging.fetchToken()
        
    })
</script>