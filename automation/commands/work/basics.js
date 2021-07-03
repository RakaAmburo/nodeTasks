let basics = {

    'print.my.information': async (wsConns) => {

        return await execute(wsConns, 'showMyInf')

    },
    'release.my.information': async (wsConns) => {

        let info =  await execute(wsConns, 'showMyInf2')
        let splitData = info[0].split("\n")
        return splitData

    },
    'unlock': async (wsConns) => {

        return await execute(wsConns, 'unlock')
    },
    'web.socket.restart': async (wsConns) => {

        return await execute(wsConns, 'ws-restart')
    },
    'are.you.alive': async (wsConns) => {

        return await execute(wsConns, 'rualive')
    }

}

async function execute(wsConns, doWhat) {
    //do while expet gives forgiven
    let ret = ['not waiting something is wrong']
    if (!wsConns.get("BI_COMPUTER")) {
        ret = ['web socket not connected!']
    } else {
        let { ws, obs } = wsConns.get("BI_COMPUTER")
        ws.send(doWhat)
        let message = ""
        try {
            message = await obs.expect()
        } catch (error) {
            message = error
        }

        ret = [message]
    }

    return ret
}


module.exports = basics;