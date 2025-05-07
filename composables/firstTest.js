export const useCompo = () => {
    const logConsole = () => {
        console.log('I am a Composable')
    }

        const sendNoti = async () => {
          try {
            const response = await $fetch("/api/sendingNotification", {
              method: "POST",
              body: {
                token:
                  "eoEplPxASkfNXh7K3yBt3-:APA91bEEaA-WCZHxqyStG3xDoJ_8AEw4DAlIq1KLxZML0sNSISmNGmNkEUoVhlEewTEPHA6tCi7G4sVj8hwgl08BNKPm-hqZHHpf5Gsf2pBq4u6ycw9bpoo",
                message:
                  "In this new month of May, may you never be left behind. Thanks  for being part of us",
                title: "Happy New Month",
              },
            });
          } catch (err) {
            console.log(err.message);
          }
        };

    return{
        logConsole,
        sendNoti
    }
}