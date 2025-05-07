import { useScheduler } from "#scheduler"
import {useCompo} from '~/composables/firstTest'


export default defineNitroPlugin(() => {
  startScheduler()
})

function startScheduler() {
  const scheduler = useScheduler();
  const {logConsole, sendNoti} = useCompo()

  scheduler.run(() => {
    console.log("cool beans! I run once a second! 😀")
    logConsole()
    sendNoti()
  }).everyThirtyMinutes();

}